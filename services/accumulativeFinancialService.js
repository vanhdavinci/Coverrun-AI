import { supabase } from './supabaseClient';

// Database Refresh Functions (for table-based approach)
export const refreshJarDashboardData = async () => {
  try {
    const { error } = await supabase.rpc('refresh_jar_dashboard_data');
    if (error) throw error;
  } catch (error) {
    console.error('Error refreshing jar dashboard data:', error);
    throw error;
  }
};

export const refreshCurrentJarBalances = async () => {
  try {
    const { error } = await supabase.rpc('refresh_current_jar_balances');
    if (error) throw error;
  } catch (error) {
    console.error('Error refreshing current jar balances:', error);
    throw error;
  }
};

export const refreshMonthlyIncomeSummary = async () => {
  try {
    const { error } = await supabase.rpc('refresh_monthly_income_summary');
    if (error) throw error;
  } catch (error) {
    console.error('Error refreshing monthly income summary:', error);
    throw error;
  }
};

// User Management Functions
export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Jar Categories Functions
export const getJarCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('jar_categories')
      .select('*')
      .order('id');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching jar categories:', error);
    throw error;
  }
};

// NEW: Monthly Income Management
export const addMonthlyIncome = async (userId, monthlyIncome, jarAllocations, month = null) => {
  try {
    console.log("addMonthlyIncome called with:", { userId, monthlyIncome, jarAllocations, month });
    
    // Validate that allocations sum to 100%
    const totalAllocation = Object.values(jarAllocations).reduce((sum, percent) => sum + percent, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Total allocation must equal 100%');
    }

    // Use current month if not specified
    const targetMonth = month || new Date().toISOString().substring(0, 7) + '-01'; // YYYY-MM-01 format

    // Check if income for this month already exists
    const { data: existingEntry, error: checkError } = await supabase
      .from('monthly_income_entries')
      .select('id')
      .eq('user_id', userId)
      .eq('month_year', targetMonth)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingEntry) {
      throw new Error(`Income for ${targetMonth} already exists. Please update instead of adding new.`);
    }

    // Insert monthly income entry
    const { data: incomeEntry, error: incomeError } = await supabase
      .from('monthly_income_entries')
      .insert({
        user_id: userId,
        month_year: targetMonth,
        total_income_cents: monthlyIncome,
        allocation_percentages: jarAllocations
      })
      .select()
      .single();

    if (incomeError) throw incomeError;

    // Get jar categories
    const categories = await getJarCategories();

    // Create income transactions for each jar based on allocation
    const incomeTransactions = [];
    for (const category of categories) {
      const allocationPercent = jarAllocations[category.name] || 0;
      if (allocationPercent > 0) {
        const allocatedAmount = Math.round((monthlyIncome * allocationPercent) / 100);
        
        incomeTransactions.push({
          user_id: userId,
          jar_category_id: category.id,
          amount_cents: allocatedAmount,
          description: `Monthly income allocation - ${month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          source: 'monthly_income',
          monthly_income_entry_id: incomeEntry.id,
          occurred_at: targetMonth // Add occurred_at field
        });
      }
    }

    // Insert all income transactions
    if (incomeTransactions.length > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(incomeTransactions);

      if (transactionError) throw transactionError;
    }

    console.log("Monthly income added successfully:", incomeEntry);
    return incomeEntry;
  } catch (error) {
    console.error('Error adding monthly income:', error);
    throw error;
  }
};

// Initialize user jars (create empty jars for all categories)
export const initializeUserJars = async (userId) => {
  try {
    // Get jar categories
    const categories = await getJarCategories();

    // Check if user already has jars
    const { data: existingJars, error: checkError } = await supabase
      .from('user_jars')
      .select('id')
      .eq('user_id', userId);

    if (checkError) throw checkError;

    if (existingJars && existingJars.length > 0) {
      console.log("User already has jars initialized");
      return existingJars;
    }

    // Create user jars for all categories
    const userJars = categories.map(category => ({
      user_id: userId,
      category_id: category.id
    }));

    const { data, error } = await supabase
      .from('user_jars')
      .insert(userJars)
      .select();

    if (error) throw error;

    console.log("User jars initialized successfully:", data);
    return data;
  } catch (error) {
    console.error('Error initializing user jars:', error);
    throw error;
  }
};

// Get user's current jar balances (accumulative)
export const getUserJarBalances = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('jar_dashboard_data')
      .select('*')
      .eq('user_id', userId)
      .order('category_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user jar balances:', error);
    throw error;
  }
};

// Get user's monthly income history
export const getUserMonthlyIncomeHistory = async (userId, limit = 12) => {
  try {
    const { data, error } = await supabase
      .from('monthly_income_entries')
      .select('*')
      .eq('user_id', userId)
      .order('month_year', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching monthly income history:', error);
    throw error;
  }
};

// Check if user has set up jars and added income
export const checkUserAccumulativeSetup = async (userId) => {
  try {
    const user = await getUserById(userId);
    
    // Automatically initialize jars for new users
    await initializeUserJars(userId);
    
    // Check if user has added any monthly income
    const { data: incomeEntries, error: incomeError } = await supabase
      .from('monthly_income_entries')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (incomeError) throw incomeError;

    const hasIncomeEntries = incomeEntries && incomeEntries.length > 0;

    // Always return setup as complete since jars are auto-initialized
    // New users just need to add their first income
    return {
      user,
      hasJars: true, // Always true since we auto-initialize
      hasIncomeEntries,
      isSetupComplete: true, // Always true - no setup form needed
      jars: await getUserJarBalances(userId),
      incomeHistory: hasIncomeEntries ? await getUserMonthlyIncomeHistory(userId, 3) : []
    };
  } catch (error) {
    console.error('Error checking user accumulative setup:', error);
    throw error;
  }
};

// Complete setup for new users
export const setupAccumulativeJars = async (userId, initialIncome, jarAllocations) => {
  try {
    console.log("setupAccumulativeJars called with:", { userId, initialIncome, jarAllocations });

    // Initialize jars first
    await initializeUserJars(userId);

    // Add first monthly income
    await addMonthlyIncome(userId, initialIncome, jarAllocations);

    return await getUserJarBalances(userId);
  } catch (error) {
    console.error('Error setting up accumulative jars:', error);
    throw error;
  }
};

// Transaction Management (same as before but simpler)
export const createTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select(`
        *,
        jar_categories (
          id,
          name,
          description
        )
      `)
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

// Get user transactions with filters
export const getUserTransactions = async (userId, limit = 50, offset = 0, filters = {}) => {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        jar_categories (
          id,
          name,
          description
        ),
        monthly_income_entries (
          month_year,
          total_income_cents
        )
      `)
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.jarCategoryId) {
      query = query.eq('jar_category_id', filters.jarCategoryId);
    }

    if (filters.startDate) {
      query = query.gte('occurred_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('occurred_at', filters.endDate);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw error;
  }
};

// Enhanced Dashboard Data for Accumulative System
export const getAccumulativeDashboardData = async (userId) => {
  try {
    const [user, jarBalances, incomeHistory] = await Promise.all([
      getUserById(userId),
      getUserJarBalances(userId),
      getUserMonthlyIncomeHistory(userId, 6),
    ]);

    // Calculate lifetime stats from jarBalances (which are pre-aggregated by the DB view)
    const lifetimeIncome = jarBalances.reduce((sum, jar) => sum + jar.total_income_cents, 0);
    const lifetimeExpenses = jarBalances.reduce((sum, jar) => sum + jar.total_spent_cents, 0);
    const totalBalance = jarBalances.reduce((sum, jar) => sum + jar.current_balance_cents, 0);

    // Calculate this month's activity from jarBalances
    const monthlyIncome = jarBalances.reduce((sum, jar) => sum + jar.income_this_month, 0);
    const monthlyExpenses = jarBalances.reduce((sum, jar) => sum + jar.spent_this_month, 0);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Get the first transaction date for the "since" label
    const { data: firstTransaction } = await supabase
        .from('transactions')
        .select('occurred_at')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    const lifetimeStats = {
      lifetimeIncome,
      lifetimeExpenses, 
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      firstTransactionDate: firstTransaction ? firstTransaction.occurred_at : null
    };

    return {
      user,
      jars: jarBalances,
      incomeHistory,
      lifetimeBalance: lifetimeStats,
    };
  } catch (error) {
    console.error('Error fetching accumulative dashboard data:', error);
    throw error;
  }
};

// Calculate lifetime statistics - THIS FUNCTION IS NO LONGER NEEDED AND CAN BE REMOVED
// The logic is now inside getAccumulativeDashboardData
export const calculateLifetimeStats = async (userId) => {
  try {
    // Get all transactions
    const { data: allTransactions, error } = await supabase
      .from('transactions')
      .select('amount_cents, occurred_at, source')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true });

    if (error) throw error;

    // Calculate lifetime totals
    const lifetimeIncome = allTransactions
      .filter(t => t.amount_cents > 0)
      .reduce((sum, t) => sum + t.amount_cents, 0);

    const lifetimeExpenses = allTransactions
      .filter(t => t.amount_cents < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);

    const lifetimeBalance = lifetimeIncome - lifetimeExpenses;

    // Get current jar balances total
    const jarBalances = await getUserJarBalances(userId);
    const currentAccountBalance = jarBalances.reduce((sum, jar) => sum + jar.current_balance_cents, 0);

    // Calculate monthly income from income entries
    const totalMonthlyIncome = allTransactions
      .filter(t => t.source === 'monthly_income')
      .reduce((sum, t) => sum + t.amount_cents, 0);

    // Calculate this month's activity
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const monthlyTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.occurred_at);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.amount_cents > 0)
      .reduce((sum, t) => sum + t.amount_cents, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.amount_cents < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;

    return {
      lifetimeIncome,
      lifetimeExpenses, 
      lifetimeBalance,
      currentAccountBalance,
      totalMonthlyIncome,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      totalTransactions: allTransactions.length,
      firstTransactionDate: allTransactions.length > 0 ? allTransactions[0].occurred_at : null
    };
  } catch (error) {
    console.error('Error calculating lifetime stats:', error);
    throw error;
  }
};

// Utility Functions
export const formatCurrency = (amount, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const parseCurrencyToAmount = (currencyString) => {
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
}; 

// Delete All User Data Function
export const deleteAllUserData = async (userId) => {
  try {
    console.log("deleteAllUserData called for userId:", userId);
    
    // Delete in the correct order to respect foreign key constraints
    // 1. Delete all transactions first (they reference monthly_income_entries and jar_categories)
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (transactionsError) {
      console.error("Error deleting transactions:", transactionsError);
      throw new Error(`Failed to delete transactions: ${transactionsError.message}`);
    }

    // 2. Delete monthly income entries
    const { error: incomeError } = await supabase
      .from('monthly_income_entries')
      .delete()
      .eq('user_id', userId);

    if (incomeError) {
      console.error("Error deleting monthly income entries:", incomeError);
      throw new Error(`Failed to delete monthly income entries: ${incomeError.message}`);
    }

    // 3. Delete user jars
    const { error: jarsError } = await supabase
      .from('user_jars')
      .delete()
      .eq('user_id', userId);

    if (jarsError) {
      console.error("Error deleting user jars:", jarsError);
      throw new Error(`Failed to delete user jars: ${jarsError.message}`);
    }

    // 4. Reset user's monthly income to 0 (optional, keep user account but reset financial data)
    const { error: userError } = await supabase
      .from('users')
      .update({ monthly_income: 0 })
      .eq('id', userId);

    if (userError) {
      console.error("Error resetting user monthly income:", userError);
      throw new Error(`Failed to reset user monthly income: ${userError.message}`);
    }

    console.log("All user financial data deleted successfully");
    return true;
  } catch (error) {
    console.error('Error deleting all user data:', error);
    throw error;
  }
}; 