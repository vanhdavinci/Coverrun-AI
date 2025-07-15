import { createClient } from '@supabase/supabase-js';
import { Type } from '@google/genai';

export const declaration = {
    name: "update_transaction",
    description: "Add a specific income or expense transaction to a particular jar. Use this for individual purchases, specific earnings, or transfers - NOT for monthly salary/income allocation (use add_monthly_income for that).",
    parameters: {
        type: Type.OBJECT,
        properties: {
            amount: {
                type: Type.NUMBER,
                description: "The transaction amount in VND, always possitive value"
            },
            jar_category_id: {
                type: Type.INTEGER,
                description: "The ID of the jar category this transaction belongs to (1=Necessity, 2=Play, 3=Education, 4=Investment, 5=Charity, 6=Savings)"
            },
            description: {
                type: Type.STRING,
                description: "The description of the transaction"
            },
            transaction_type: {
                type: Type.STRING,
                enum: ["expense", "income"],
                description: "Type of transaction either 'expense' or 'income'"
            }
        },
        required: ["amount", "jar_category_id", "transaction_type"],
    },
};

export async function handler({ amount, jar_category_id, description = "", transaction_type, userToken }) {
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

        // Get amount and apply sign based on transaction type
        const amountValue = Math.round(parseFloat(amount));
        const finalAmount = transaction_type === 'expense' ? -amountValue : amountValue;

        // Insert transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: userData.id,
                jar_category_id: jar_category_id,
                amount_cents: finalAmount,
                description: description,
                source: 'chatbot'
            });

        if (transactionError) throw transactionError;

        return { 
            success: true,
            message: 'Transaction added successfully'
        };

    } catch (error) {
        console.error('Error in update_transaction:', error);
        return {
            success: false,
            error: error.message || 'Failed to add transaction'
        };
    }
}