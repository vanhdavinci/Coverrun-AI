import { createClient } from '@supabase/supabase-js';

export const declaration = {
  name: 'swap_jar',
  description: 'Transfer money from one jar to another for the authenticated user',
  parameters: {
    type: 'object',
    properties: {
      fromJarName: { type: 'string', description: 'Source jar name' },
      toJarName: { type: 'string', description: 'Target jar name' },
      amountCents: { type: 'number', description: 'Amount to transfer in VND' },
      description: { type: 'string', description: 'Description for the transfer', default: 'Jar swap' }
    },
    required: ['fromJarName', 'toJarName', 'amountCents']
  }
};

export const handler = async ({ fromJarName, toJarName, amountCents, description = 'Jar swap', userToken }) => {
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
    // Get jar categories
    const { data: categories, error: catError } = await supabase
      .from('jar_categories')
      .select('*');
    if (catError) throw new Error('Failed to fetch jar categories');
    const fromCategory = categories.find(j => j.name === fromJarName);
    const toCategory = categories.find(j => j.name === toJarName);
    if (!fromCategory || !toCategory) throw new Error('Invalid jar name(s)');
    // Create two transactions: one negative (from), one positive (to)
    const transactions = [
      {
        user_id: userData.id,
        jar_category_id: fromCategory.id,
        amount_cents: -Math.abs(amountCents),
        description: description + ` (from ${fromJarName})`,
        source: 'jar_swap',
        occurred_at: new Date().toISOString(),
      },
      {
        user_id: userData.id,
        jar_category_id: toCategory.id,
        amount_cents: Math.abs(amountCents),
        description: description + ` (to ${toJarName})`,
        source: 'jar_swap',
        occurred_at: new Date().toISOString(),
      }
    ];
    const { error: txError } = await supabase
      .from('transactions')
      .insert(transactions);
    if (txError) throw new Error('Failed to create swap transactions');
    return { success: true };
  } catch (error) {
    console.error('Error in swap_jar:', error);
    return {
      success: false,
      error: error.message || 'Failed to swap jars'
    };
  }
}; 