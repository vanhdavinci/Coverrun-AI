# Accumulative Jars System

## Overview
The accumulative jar system allows users to build up savings over time instead of resetting monthly budgets. Money accumulates in jars across months, providing a true savings experience.

## User Flow

### 1. New User Registration
- User creates account
- System automatically creates empty jars for all categories (Necessity, Play, Education, Investment, Charity, Savings)
- No setup form required - user goes directly to dashboard

### 2. Adding Monthly Income
- User clicks "Add Monthly Income" button
- Selects month and enters income amount
- Chooses allocation percentages (must total 100%)
- System adds allocated amounts to respective jars
- Previous allocation percentages are remembered for convenience

### 3. Ongoing Usage
- Jars accumulate money over time
- Users can spend from jars (creates negative transactions)
- Dashboard shows current balances, lifetime totals, and monthly activity
- Users can add income for different months with different allocations

## Key Features

### Accumulative Balances
- Jars never reset - they only grow when income is added
- Current Balance = All Income Added - All Expenses
- No "budget" or "capacity" concept

### Flexible Monthly Income
- Different income amounts each month
- Different allocation percentages each month
- Prevents duplicate entries for same month
- Tracks income history

### Dashboard Views
- **Current Balances**: Most important - shows total money in each jar
- **Lifetime Summary**: Total income added, total spent, net savings
- **Monthly Activity**: Current month's income and expenses
- **Income History**: Timeline of when income was added

## Database Schema

### Core Tables
- `users` - User profiles (no monthly_income field needed)
- `jar_categories` - Jar types (Necessity, Play, etc.)
- `user_jars` - Simple user-jar relationships
- `monthly_income_entries` - Tracks each month's income and allocations
- `transactions` - All financial transactions

### Key Relationships
- Income entries create positive transactions for each jar
- Expenses create negative transactions
- Balances calculated in real-time from transaction sums

## Benefits

1. **True Savings Growth**: Money accumulates over time
2. **Flexible Allocations**: Different priorities each month
3. **Historical Tracking**: See when and how much was added
4. **Simple Onboarding**: No complex setup required
5. **Real Balances**: Shows actual available money

## Migration from Old System

The old system used:
- Monthly "capacity" budgets that reset
- `user_jars_with_balance` table with capacity_cents
- Monthly income stored on user profile

The new system uses:
- Accumulative balances that grow over time
- `monthly_income_entries` to track income history
- Simple `user_jars` relationships
- Real-time balance calculation from transactions

## Technical Implementation

### Services
- `accumulativeFinancialService.js` - All financial operations
- Auto-initialization of jars for new users
- Validation of allocation percentages
- Real-time balance calculations

### Components
- `AccumulativeDashboard.jsx` - Main dashboard view
- `AddIncomeForm.jsx` - Modal for adding monthly income
- Welcome message for new users

### Database Views
- `current_jar_balances` - Real-time jar balances
- `jar_dashboard_data` - Complete dashboard data
- Performance indexes for fast queries

This system provides a more intuitive and realistic approach to personal finance management, focusing on building wealth over time rather than monthly spending limits. 