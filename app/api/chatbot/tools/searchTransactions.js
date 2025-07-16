import { createClient } from '@supabase/supabase-js';
import { Type } from '@google/genai';

export const declaration = {
    name: "search_transactions",
    description: "Search for transactions in the database based on keywords, categories, or time periods. Use this to answer questions about spending patterns, specific purchases, or financial analysis.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            keywords: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING
                },
                description: "Array of keywords to search for in transaction descriptions. Can include both English and Vietnamese terms (e.g., ['coffee', 'cà phê', 'drink', 'nước'])"
            },
            jar_category_id: {
                type: Type.INTEGER,
                description: "Optional: Specific jar category ID to filter by (1=Necessity, 2=Play, 3=Education, 4=Investment, 5=Charity, 6=Savings)"
            },
            transaction_type: {
                type: Type.STRING,
                enum: ["expense", "income", "all"],
                description: "Type of transactions to search for: 'expense', 'income', or 'all'"
            },
            days_back: {
                type: Type.INTEGER,
                description: "Optional: Number of days back to search (e.g., 7 for last week, 30 for last month)"
            },
            start_date: {
                type: Type.STRING,
                description: "Optional: Start date in YYYY-MM-DD format"
            },
            end_date: {
                type: Type.STRING,
                description: "Optional: End date in YYYY-MM-DD format"
            }
        },
        required: ["keywords"],
    },
};

// Keyword mapping for common terms (English to Vietnamese and vice versa)
const KEYWORD_MAPPING = {
    // Food & Drinks
    'coffee': ['cà phê', 'coffee', 'cafe'],
    'cà phê': ['cà phê', 'coffee', 'cafe'],
    'drink': ['nước', 'đồ uống', 'drink', 'beverage'],
    'nước': ['nước', 'đồ uống', 'drink', 'beverage'],
    'food': ['đồ ăn', 'thức ăn', 'food', 'meal'],
    'đồ ăn': ['đồ ăn', 'thức ăn', 'food', 'meal'],
    'lunch': ['bữa trưa', 'lunch', 'ăn trưa'],
    'dinner': ['bữa tối', 'dinner', 'ăn tối'],
    'breakfast': ['bữa sáng', 'breakfast', 'ăn sáng'],
    
    // Transportation
    'transport': ['giao thông', 'transport', 'xe', 'taxi'],
    'taxi': ['taxi', 'xe taxi', 'grab'],
    'grab': ['grab', 'xe grab', 'taxi'],
    'bus': ['xe buýt', 'bus'],
    'xe buýt': ['xe buýt', 'bus'],
    
    // Shopping
    'shopping': ['mua sắm', 'shopping', 'mua'],
    'mua sắm': ['mua sắm', 'shopping', 'mua'],
    'clothes': ['quần áo', 'clothes', 'áo', 'quần'],
    'quần áo': ['quần áo', 'clothes', 'áo', 'quần'],
    
    // Entertainment
    'movie': ['phim', 'movie', 'cinema'],
    'phim': ['phim', 'movie', 'cinema'],
    'game': ['game', 'trò chơi', 'gaming'],
    'trò chơi': ['game', 'trò chơi', 'gaming'],
    
    // Utilities
    'electricity': ['điện', 'electricity', 'tiền điện'],
    'điện': ['điện', 'electricity', 'tiền điện'],
    'water': ['nước', 'water', 'tiền nước'],
    'internet': ['internet', 'wifi', 'mạng'],
    'wifi': ['internet', 'wifi', 'mạng'],
    
    // Income
    'salary': ['lương', 'salary', 'tiền lương'],
    'lương': ['lương', 'salary', 'tiền lương'],
    'bonus': ['thưởng', 'bonus', 'tiền thưởng'],
    'thưởng': ['thưởng', 'bonus', 'tiền thưởng']
};

export async function handler({ keywords, jar_category_id, transaction_type = "all", days_back, start_date, end_date, userToken }) {
    try {
        if (!userToken) {
            throw new Error('User authentication required');
        }

        // Ensure keywords is always an array
        if (!Array.isArray(keywords)) {
            if (typeof keywords === 'string' && keywords.length > 0) {
                keywords = [keywords];
            } else {
                keywords = [];
            }
        }

        // Create Supabase client with user token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            }
        );

        // Get current user from token
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not authenticated');

        // Get user ID from users table
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();
        
        if (userDataError) throw userDataError;
        if (!userData) throw new Error('User not found in database');

        // Expand keywords using mapping
        let expandedKeywords = [];
        keywords.forEach(keyword => {
            const lowerKeyword = keyword.toLowerCase();
            if (KEYWORD_MAPPING[lowerKeyword]) {
                expandedKeywords.push(...KEYWORD_MAPPING[lowerKeyword]);
            } else {
                expandedKeywords.push(keyword);
            }
        });

        // Remove duplicates
        expandedKeywords = [...new Set(expandedKeywords)];

        // Build query
        let query = supabase
            .from('transactions')
            .select(`
                id,
                amount_cents,
                description,
                occurred_at,
                jar_category_id,
                jar_categories(name)
            `)
            .eq('user_id', userData.id);

        // Add keyword search using OR conditions
        if (expandedKeywords.length > 0) {
            const keywordConditions = expandedKeywords.map(keyword => 
                `description.ilike.%${keyword}%`
            );
            query = query.or(keywordConditions.join(','));
        }

        // Add jar category filter
        if (jar_category_id) {
            query = query.eq('jar_category_id', jar_category_id);
        }

        // Add transaction type filter
        if (transaction_type !== "all") {
            if (transaction_type === "expense") {
                query = query.lt('amount_cents', 0);
            } else if (transaction_type === "income") {
                query = query.gt('amount_cents', 0);
            }
        }

        // Add date filters
        if (days_back) {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days_back);
            query = query.gte('occurred_at', dateLimit.toISOString());
        } else if (start_date && end_date) {
            query = query.gte('occurred_at', start_date)
                        .lte('occurred_at', end_date);
        } else if (start_date) {
            query = query.gte('occurred_at', start_date);
        } else if (end_date) {
            query = query.lte('occurred_at', end_date);
        }

        // Order by most recent first
        query = query.order('occurred_at', { ascending: false });

        const { data: transactions, error } = await query;

        if (error) throw error;

        // Calculate summary statistics
        const totalExpenses = transactions
            .filter(t => t.amount_cents < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);

        const totalIncome = transactions
            .filter(t => t.amount_cents > 0)
            .reduce((sum, t) => sum + t.amount_cents, 0);

        const transactionCount = transactions.length;
        const expenseCount = transactions.filter(t => t.amount_cents < 0).length;
        const incomeCount = transactions.filter(t => t.amount_cents > 0).length;

        // Group by jar category
        const byCategory = {};
        transactions.forEach(t => {
            const categoryName = t.jar_categories?.name || 'Unknown';
            if (!byCategory[categoryName]) {
                byCategory[categoryName] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }
            byCategory[categoryName].total += t.amount_cents;
            byCategory[categoryName].count += 1;
            byCategory[categoryName].transactions.push({
                id: t.id,
                amount_cents: t.amount_cents,
                description: t.description,
                occurred_at: t.occurred_at
            });
        });

        return {
            success: true,
            data: {
                transactions: transactions.map(t => ({
                    id: t.id,
                    amount_cents: t.amount_cents,
                    amount_vnd: Math.abs(t.amount_cents),
                    description: t.description,
                    occurred_at: t.occurred_at,
                    jar_category: t.jar_categories?.name || 'Unknown',
                    type: t.amount_cents > 0 ? 'income' : 'expense'
                })),
                summary: {
                    total_transactions: transactionCount,
                    total_expenses_vnd: totalExpenses,
                    total_income_vnd: totalIncome,
                    expense_count: expenseCount,
                    income_count: incomeCount,
                    net_amount_vnd: totalIncome - totalExpenses
                },
                by_category: byCategory,
                search_keywords: expandedKeywords
            }
        };

    } catch (error) {
        console.error('Error in search_transactions:', error);
        return {
            success: false,
            error: error.message || 'Failed to search transactions'
        };
    }
} 