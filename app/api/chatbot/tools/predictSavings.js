import { createClient } from '@supabase/supabase-js';
import { Type } from '@google/genai';

export const declaration = {
    name: "predict_savings",
    description: "Predict when a user can reach a savings goal or afford a purchase based on their historical savings data. Use this to answer questions about future financial milestones.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            target_amount: {
                type: Type.NUMBER,
                description: "The target amount in VND that the user wants to save or spend (e.g., 100000 for 100k VND, 250000000 for 10k USD car)"
            },
            target_description: {
                type: Type.STRING,
                description: "Description of what the user wants to save for or buy (e.g., 'car', 'house', 'vacation', 'emergency fund')"
            },
            forecast_periods: {
                type: Type.INTEGER,
                description: "Number of periods to forecast (default: 24 for 2 years)"
            },
            forecast_frequency: {
                type: Type.STRING,
                enum: ["D", "W", "M"],
                description: "Forecast frequency: 'D' for daily, 'W' for weekly, 'M' for monthly (default: 'M')"
            }
        },
        required: ["target_amount", "target_description"],
    },
};

export async function handler({ target_amount, target_description, forecast_periods = 24, forecast_frequency = "M", userToken }) {
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

        // Get historical savings data from transactions
        const { data: transactions, error: transactionError } = await supabase
            .from('transactions')
            .select(`
                amount_cents,
                occurred_at,
                jar_category_id,
                jar_categories(name)
            `)
            .eq('user_id', userData.id)
            .eq('jar_category_id', 6) // Savings jar
            .order('occurred_at', { ascending: true });

        if (transactionError) throw transactionError;

        if (!transactions || transactions.length === 0) {
            return {
                success: false,
                error: 'No savings data found. Please start saving money first to get predictions.',
                data: {
                    target_amount: target_amount,
                    target_description: target_description,
                    current_savings: 0,
                    target_date: null,
                    forecast: []
                }
            };
        }

        // Calculate cumulative savings balance over time
        let currentBalance = 0;
        const dailyBalances = [];
        transactions
            .sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
            .forEach((tx) => {
                currentBalance += tx.amount_cents;
                const day = tx.occurred_at.slice(0, 10);
                dailyBalances.push({ date: day, balance: currentBalance });
            });

        // Group by month, keeping only the last date of each month
        const monthlyData = [];
        let lastMonth = null, lastDate = null, lastBalance = null;
        dailyBalances.forEach(({ date, balance }) => {
            const month = date.slice(0, 7);
            if (month !== lastMonth && lastDate) {
                monthlyData.push({ date: lastDate, balance: lastBalance });
                lastMonth = month;
            }
            lastDate = date;
            lastBalance = balance;
        });
        if (lastDate) {
            monthlyData.push({ date: lastDate, balance: lastBalance });
        }

        // Prepare data for ML API
        const mlApiData = monthlyData;

        // Call ML prediction API
        const mlApiUrl = process.env.NEXT_PUBLIC_FORECAST_API_URL;
        const predictionResponse = await fetch(`${mlApiUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: mlApiData,
                periods: forecast_periods,
                freq: forecast_frequency,
                target: target_amount // Convert to VND for ML API
            })
        });

        if (!predictionResponse.ok) {
            throw new Error(`ML API error: ${predictionResponse.statusText}`);
        }

        const predictionResult = await predictionResponse.json();
        let forecastData = predictionResult.forecast;
        let targetDate = predictionResult.target_date;
        // Handle stringified JSON body (AWS Lambda proxy integration)
        if (typeof predictionResult.body === "string") {
            try {
                const parsed = JSON.parse(predictionResult.body);
                forecastData = parsed.forecast;
                targetDate = parsed.target_date;
            } catch (e) {
                console.error("Failed to parse ML API body", e, predictionResult.body);
            }
        }

        // Calculate additional insights
        const currentSavingsVND = currentBalance;
        const targetAmountVND = target_amount;
        const remainingAmount = targetAmountVND - currentSavingsVND;
        const isTargetReached = currentSavingsVND >= targetAmountVND;

        // Calculate monthly savings rate from recent data
        const recentMonths = monthlyData.slice(-3); // Last 3 months
        let monthlySavingsRate = 0;
        if (recentMonths.length >= 2) {
            const totalChange = recentMonths[recentMonths.length - 1].balance - recentMonths[0].balance;
            monthlySavingsRate = totalChange / (recentMonths.length - 1);
        }

        return {
            success: true,
            data: {
                target_amount: targetAmountVND,
                target_description: target_description,
                current_savings: currentSavingsVND,
                remaining_amount: remainingAmount,
                is_target_reached: isTargetReached,
                target_date: targetDate,
                monthly_savings_rate: monthlySavingsRate,
                forecast: forecastData ? forecastData.map(point => ({
                    date: point.date,
                    yhat: point.yhat, // match frontend expectation
                    lower_bound: point.yhat_lower,
                    upper_bound: point.yhat_upper
                })) : [],
                historical_data: mlApiData,
                insights: {
                    total_transactions: transactions.length,
                    average_monthly_savings: monthlySavingsRate,
                    months_to_target: targetDate ? 
                        calculateMonthsToTarget(targetDate) : null,
                    confidence_level: calculateConfidenceLevel(forecastData)
                }
            }
        };

    } catch (error) {
        console.error('Error in predict_savings:', error);
        return {
            success: false,
            error: error.message || 'Failed to predict savings',
            data: {
                target_amount: target_amount,
                target_description: target_description,
                current_savings: 0,
                target_date: null,
                forecast: []
            }
        };
    }
}

// Helper function to calculate months to target
function calculateMonthsToTarget(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    const monthsDiff = (target.getFullYear() - now.getFullYear()) * 12 + 
                      (target.getMonth() - now.getMonth());
    return Math.max(0, monthsDiff);
}

// Helper function to calculate confidence level based on forecast variance
function calculateConfidenceLevel(forecast) {
    if (!forecast || forecast.length === 0) return 'low';
    
    const recentForecasts = forecast.slice(-6); // Last 6 periods
    const variances = recentForecasts.map(point => 
        Math.abs(point.yhat_upper - point.yhat_lower) / point.yhat
    );
    
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    
    if (avgVariance < 0.1) return 'high';
    if (avgVariance < 0.2) return 'medium';
    return 'low';
} 