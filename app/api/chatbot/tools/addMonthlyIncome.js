import { createClient } from '@supabase/supabase-js';
import { Type } from '@google/genai';

export const declaration = {
    name: "add_monthly_income",
    description: "Add monthly income to user's jars with proper allocation percentages. This is the correct tool to use when user mentions receiving monthly income/salary.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            monthly_income_amount: {
                type: Type.NUMBER,
                description: "The total monthly income amount in VND"
            },
            month_year: {
                type: Type.STRING,
                description: "The month and year for this income in YYYY-MM format (e.g., '2024-01')"
            },
            necessity_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Necessity jar (essential expenses like food, housing, utilities)",
                default: 55
            },
            play_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Play jar (entertainment and leisure activities)",
                default: 10
            },
            education_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Education jar (learning and skill development)",
                default: 10
            },
            investment_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Investment jar (long-term wealth building)",
                default: 10
            },
            charity_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Charity jar (giving back to the community)",
                default: 5
            },
            savings_percentage: {
                type: Type.NUMBER,
                description: "Percentage for Savings jar (emergency fund and future goals)",
                default: 10
            }
        },
        required: ["monthly_income_amount"],
    },
};

export async function handler({ 
    monthly_income_amount, 
    month_year,
    necessity_percentage = 55,
    play_percentage = 10,
    education_percentage = 10,
    investment_percentage = 10,
    charity_percentage = 5,
    savings_percentage = 10,
    userToken 
}) {
    try {
        if (!userToken) {
            throw new Error('User authentication required');
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

        // Validate allocation percentages total to 100%
        const totalPercentage = necessity_percentage + play_percentage + education_percentage + 
                               investment_percentage + charity_percentage + savings_percentage;
        
        if (Math.abs(totalPercentage - 100) > 0.01) {
            return {
                success: false,
                error: `Allocation percentages must total 100%. Current total: ${totalPercentage}%`
            };
        }

        // Set default month_year to current month if not provided
        if (!month_year) {
            const now = new Date();
            month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        // Validate month_year format
        if (!/^\d{4}-\d{2}$/.test(month_year)) {
            return {
                success: false,
                error: 'Month year must be in YYYY-MM format (e.g., "2024-01")'
            };
        }

        const monthYearDate = month_year + '-01'; // Convert to full date
        const incomeAmountCents = Math.round(parseFloat(monthly_income_amount));

        if (!incomeAmountCents || incomeAmountCents <= 0) {
            return {
                success: false,
                error: 'Invalid monthly income amount'
            };
        }

        // Create allocation percentages object
        const allocationPercentages = {
            'Necessity': necessity_percentage,
            'Play': play_percentage,
            'Education': education_percentage,
            'Investment': investment_percentage,
            'Charity': charity_percentage,
            'Savings': savings_percentage
        };

        // Check if income entry already exists for this month
        const { data: existingEntry } = await supabase
            .from('monthly_income_entries')
            .select('id')
            .eq('user_id', userData.id)
            .eq('month_year', monthYearDate)
            .single();

        if (existingEntry) {
            return {
                success: false,
                error: `Income for ${month_year} already exists. Please choose a different month.`
            };
        }

        // Insert monthly income entry
        const { data: incomeEntry, error: incomeError } = await supabase
            .from('monthly_income_entries')
            .insert({
                user_id: userData.id,
                month_year: monthYearDate,
                total_income_cents: incomeAmountCents,
                allocation_percentages: allocationPercentages
            })
            .select('id')
            .single();

        if (incomeError) throw incomeError;

        // Get jar categories
        const { data: jarCategories, error: categoriesError } = await supabase
            .from('jar_categories')
            .select('id, name');

        if (categoriesError) throw categoriesError;

        // Create income transactions for each jar
        const transactions = jarCategories.map(category => {
            const percentage = allocationPercentages[category.name] || 0;
            const amount = Math.round((incomeAmountCents * percentage) / 100);
            
            return {
                user_id: userData.id,
                jar_category_id: category.id,
                amount_cents: amount,
                description: `Monthly income allocation for ${month_year}`,
                source: 'chatbot',
                monthly_income_entry_id: incomeEntry.id
            };
        }).filter(t => t.amount_cents > 0);

        // Insert all transactions
        const { error: transactionsError } = await supabase
            .from('transactions')
            .insert(transactions);

        if (transactionsError) throw transactionsError;

        // Format success message
        const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(incomeAmountCents);

        const allocationDetails = Object.entries(allocationPercentages)
            .map(([jar, percentage]) => `${jar}: ${percentage}%`)
            .join(', ');

        return { 
            success: true,
            message: `Monthly income of ${formattedAmount} for ${month_year} added successfully! Allocated to jars: ${allocationDetails}`
        };

    } catch (error) {
        console.error('Error in add_monthly_income:', error);
        return {
            success: false,
            error: error.message || 'Failed to add monthly income'
        };
    }
} 