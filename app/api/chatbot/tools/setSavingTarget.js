import { createClient } from '@supabase/supabase-js';
import { Type } from '@google/genai';

export const declaration = {
    name: "set_saving_target",
    description: "Set or update the user's savings target amount",
    parameters: {
        type: Type.OBJECT,
        properties: {
            target_amount: {
                type: Type.NUMBER,
                description: "The target savings amount in VND (Vietnamese Dong). For example, 1000000 for 1 million VND"
            }
        },
        required: ["target_amount"]
    }
};

export async function handler({ target_amount, userToken }) {
    try {
        if (!userToken) {
            throw new Error('User authentication required');
        }

        // Validate input
        if (!target_amount || target_amount <= 0) {
            return {
                success: false,
                message: "Target amount must be a positive number in VND."
            };
        }

        // Convert VND to cents for storage
        const targetCents = Math.round(target_amount * 100);

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

        // Update the user's saving target
        const { data, error } = await supabase
            .from('users')
            .update({ saving_target_cents: targetCents })
            .eq('id', userData.id)
            .select('saving_target_cents')
            .single();

        if (error) {
            console.error('Error updating saving target:', error);
            return {
                success: false,
                message: "Failed to update saving target. Please try again."
            };
        }

        // Format the target amount for display
        const formattedTarget = target_amount.toLocaleString('vi-VN');

        return {
            success: true,
            message: `✅ Đã cập nhật mục tiêu tiết kiệm thành công!\n\n💰 Mục tiêu mới: ${formattedTarget} VND\n\nBây giờ bạn có thể theo dõi tiến độ tiết kiệm của mình trên biểu đồ. Mục tiêu sẽ được hiển thị dưới dạng đường đỏ đứt nét trên biểu đồ tiết kiệm.`,
            target_amount: target_amount,
            target_cents: data.saving_target_cents
        };

    } catch (error) {
        console.error('Error in setSavingTarget handler:', error);
        return {
            success: false,
            error: error.message || 'Failed to update saving target'
        };
    }
} 