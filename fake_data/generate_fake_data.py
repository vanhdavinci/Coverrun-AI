#!/usr/bin/env python3

import json
import random
import datetime
import os
from datetime import timedelta
from decimal import Decimal

# Constants
USER_ID = 20
USER_EMAIL = "hiep11102@gmail.com"
START_DATE = datetime.datetime(2025, 1, 1)
END_DATE = datetime.datetime(2025, 7, 31)

# Jar categories with IDs
JAR_CATEGORIES = {
    "Necessity": 1,
    "Play": 2,
    "Education": 3,
    "Investment": 4, 
    "Charity": 5,
    "Savings": 6
}

# Default jar allocations (percentages)
DEFAULT_JAR_ALLOCATIONS = {
    "Necessity": 55,
    "Play": 10,
    "Education": 10,
    "Investment": 10,
    "Charity": 5,
    "Savings": 10
}

# Monthly income in VND
MONTHLY_INCOME_VND = 30000000  # 30 million VND

# Transaction sources
TRANSACTION_SOURCES = ["Mobile App", "Web", "ATM", "Branch", "Automatic"]

# Transaction descriptions by category
TRANSACTION_DESCRIPTIONS = {
    "Necessity": [
        "Grocery shopping at VinMart",
        "Electricity bill payment",
        "Water bill payment",
        "Internet bill payment",
        "Phone bill payment",
        "Rent payment",
        "Gas bill payment",
        "Pharmacy purchase",
        "Public transportation",
        "Grab ride",
        "Lunch at local restaurant",
        "Breakfast at bakery",
        "Household supplies",
        "Haircut",
        "Laundry service"
    ],
    "Play": [
        "Movie tickets at CGV",
        "Dinner at fancy restaurant",
        "Coffee at Highlands",
        "Shopping at Uniqlo",
        "Karaoke night",
        "Weekend trip to Da Nang",
        "Concert tickets",
        "Spa treatment",
        "Gaming subscription",
        "Streaming service subscription",
        "Bowling night",
        "Bar tab",
        "New headphones",
        "Sports equipment",
        "Hobby supplies"
    ],
    "Education": [
        "Online course subscription",
        "Books from Fahasa",
        "Language learning app",
        "Professional certification fee",
        "Workshop registration",
        "Tutoring session",
        "Educational software",
        "Conference ticket",
        "Professional membership fee",
        "Skill development course",
        "E-book purchase",
        "Educational webinar",
        "Study materials",
        "Library membership",
        "Research database access"
    ],
    "Investment": [
        "Stock purchase",
        "Mutual fund contribution",
        "Real estate investment",
        "Cryptocurrency purchase",
        "Gold purchase",
        "Bond investment",
        "Retirement fund contribution",
        "Business investment",
        "P2P lending",
        "Investment advisory fee",
        "Dividend reinvestment",
        "ETF purchase",
        "Investment platform subscription",
        "Investment book purchase",
        "Investment seminar fee"
    ],
    "Charity": [
        "Donation to Red Cross",
        "Children's charity contribution",
        "Environmental organization support",
        "Animal shelter donation",
        "Disaster relief fund",
        "Community development project",
        "Educational scholarship fund",
        "Healthcare charity",
        "Food bank donation",
        "Homeless shelter support",
        "Elderly care charity",
        "Cultural preservation donation",
        "Religious organization tithe",
        "Volunteer program support",
        "Humanitarian aid contribution"
    ],
    "Savings": [
        "Emergency fund deposit",
        "Vacation fund contribution",
        "Home purchase savings",
        "Vehicle savings fund",
        "Wedding fund deposit",
        "Education savings",
        "Major purchase savings",
        "Holiday gift fund",
        "Home repair fund",
        "Family event savings",
        "Health emergency fund",
        "Long-term savings deposit",
        "Rainy day fund contribution",
        "Future goals savings",
        "Special occasion fund"
    ]
}

# Seasonal spending patterns (multipliers for each month)
SEASONAL_PATTERNS = {
    # Month number (1-12): {category: multiplier}
    1: {  # January - Tet holiday preparation
        "Necessity": 1.5,
        "Play": 1.8,
        "Education": 0.7,
        "Investment": 0.8,
        "Charity": 1.5,
        "Savings": 0.7
    },
    2: {  # February - Tet holiday
        "Necessity": 1.2,
        "Play": 2.0,
        "Education": 0.5,
        "Investment": 0.7,
        "Charity": 1.7,
        "Savings": 0.6
    },
    3: {  # March - Post-holiday, back to normal
        "Necessity": 1.0,
        "Play": 0.9,
        "Education": 1.1,
        "Investment": 1.0,
        "Charity": 0.9,
        "Savings": 1.1
    },
    4: {  # April - Spring activities
        "Necessity": 1.0,
        "Play": 1.1,
        "Education": 1.2,
        "Investment": 1.0,
        "Charity": 1.0,
        "Savings": 1.0
    },
    5: {  # May - Summer preparation
        "Necessity": 1.1,
        "Play": 1.2,
        "Education": 1.0,
        "Investment": 1.1,
        "Charity": 1.0,
        "Savings": 0.9
    },
    6: {  # June - Summer vacation
        "Necessity": 1.2,
        "Play": 1.5,
        "Education": 0.8,
        "Investment": 0.9,
        "Charity": 1.0,
        "Savings": 0.8
    },
    7: {  # July - Mid-summer
        "Necessity": 1.3,
        "Play": 1.4,
        "Education": 0.9,
        "Investment": 0.9,
        "Charity": 1.1,
        "Savings": 0.8
    }
}

# Base transaction frequency per month (number of transactions)
BASE_TRANSACTION_FREQUENCY = {
    "Necessity": 20,  # Almost daily
    "Play": 5,       # Twice a week
    "Education": 4,  # Once a week
    "Investment": 2, # Bi-weekly
    "Charity": 2,    # Bi-weekly
    "Savings": 1     # Monthly
}

# Base transaction amounts in VND
BASE_TRANSACTION_AMOUNTS = {
    "Necessity": {
        "min": 500,    # 50k VND
        "max": 7000    # 500k VND
    },
    "Play": {
        "min": 1000,   # 100k VND
        "max": 5000   # 1M VND
    },
    "Education": {
        "min": 1000,   # 200k VND
        "max": 10000   # 2M VND
    },
    "Investment": {
        "min": 1000,  # 1M VND
        "max": 10000  # 10M VND
    },
    "Charity": {
        "min": 100,   # 100k VND
        "max": 1000   # 1M VND
    },
    "Savings": {
        "min": 100,  # 1M VND
        "max": 5000   # 5M VND
    }
}

def generate_monthly_income_entries():
    """Generate monthly income entries from January 2025 to July 2025"""
    monthly_income_entries = []
    current_date = START_DATE.replace(day=1)
    
    while current_date <= END_DATE:
        # Add small random variation to income (±5%)
        income_variation = random.uniform(0.95, 1.05)
        monthly_income = int(MONTHLY_INCOME_VND * income_variation)
        
        entry = {
            "user_id": USER_ID,
            "month_year": current_date.strftime("%Y-%m-%d"),
            "total_income_cents": monthly_income * 100,  # Convert to cents
            "allocation_percentages": DEFAULT_JAR_ALLOCATIONS
        }
        monthly_income_entries.append(entry)
        
        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)
    
    return monthly_income_entries

def generate_transactions():
    """Generate transactions from January 2025 to July 2025 with seasonal patterns"""
    transactions = []
    current_date = START_DATE
    
    while current_date <= END_DATE:
        month = current_date.month
        seasonal_pattern = SEASONAL_PATTERNS.get(month, {
            "Necessity": 1.0,
            "Play": 1.0,
            "Education": 1.0,
            "Investment": 1.0,
            "Charity": 1.0,
            "Savings": 1.0
        })
        
        # Generate transactions for each category for this day
        for category, jar_id in JAR_CATEGORIES.items():
            # Determine if we should generate a transaction for this category today
            # based on the frequency and seasonal pattern
            seasonal_multiplier = seasonal_pattern.get(category, 1.0)
            monthly_frequency = int(BASE_TRANSACTION_FREQUENCY[category] * seasonal_multiplier)
            
            # Calculate daily probability
            daily_probability = monthly_frequency / 30.0
            
            # Decide if we generate a transaction today
            if random.random() < daily_probability:
                # Generate transaction amount with seasonal adjustment
                min_amount = BASE_TRANSACTION_AMOUNTS[category]["min"]
                max_amount = BASE_TRANSACTION_AMOUNTS[category]["max"]
                
                # Adjust amount based on seasonal pattern
                adjusted_min = int(min_amount * seasonal_multiplier)
                adjusted_max = int(max_amount * seasonal_multiplier)
                
                # Generate a random amount
                amount = random.randint(adjusted_min, adjusted_max)
                
                # Convert to negative cents (expense)
                amount_cents = -1 * amount * 100
                
                # Random time during the day
                transaction_time = current_date.replace(
                    hour=random.randint(8, 21),
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59)
                )
                
                # Select a random description for this category
                description = random.choice(TRANSACTION_DESCRIPTIONS[category])
                
                # Select a random source
                source = random.choice(TRANSACTION_SOURCES)
                
                transaction = {
                    "jar_category_id": jar_id,
                    "amount_cents": amount_cents,
                    "occurred_at": transaction_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "description": description,
                    "source": source,
                    "user_id": USER_ID
                }
                
                transactions.append(transaction)
        
        # Move to next day
        current_date += timedelta(days=1)
    
    return transactions

def generate_user_jars():
    """Generate user jars for all categories"""
    user_jars = []
    
    for category, jar_id in JAR_CATEGORIES.items():
        jar = {
            "user_id": USER_ID,
            "category_id": jar_id
        }
        user_jars.append(jar)
    
    return user_jars

def generate_fake_data():
    """Generate all fake data for the accumulative jar system"""
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
    
    # Generate data
    monthly_income_entries = generate_monthly_income_entries()
    transactions = generate_transactions()
    user_jars = generate_user_jars()
    
    # Create user data
    user = {
        "id": USER_ID,
        "email": USER_EMAIL,
        "full_name": "Hiep Do"
    }
    
    # Combine all data
    data = {
        "user": user,
        "jar_categories": [{
            "id": jar_id,
            "name": category,
            "description": f"{category} jar for 6-jars financial system"
        } for category, jar_id in JAR_CATEGORIES.items()],
        "monthly_income_entries": monthly_income_entries,
        "user_jars": user_jars,
        "transactions": transactions
    }
    
    # Save to JSON file
    output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fake_financial_data.json")
    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)
    
    # Print statistics
    print(f"Generated fake financial data for user {USER_EMAIL} (ID: {USER_ID})")
    print(f"Time period: {START_DATE.strftime('%Y-%m-%d')} to {END_DATE.strftime('%Y-%m-%d')}")
    print(f"Number of monthly income entries: {len(monthly_income_entries)}")
    print(f"Number of transactions: {len(transactions)}")
    print(f"Number of jar categories: {len(JAR_CATEGORIES)}")
    print(f"Data saved to: {output_file}")
    
    # Print transaction statistics by category
    print("\nTransaction statistics by category:")
    category_stats = {}
    for transaction in transactions:
        jar_id = transaction["jar_category_id"]
        category = next(cat for cat, id in JAR_CATEGORIES.items() if id == jar_id)
        
        if category not in category_stats:
            category_stats[category] = {
                "count": 0,
                "total_amount": 0
            }
        
        category_stats[category]["count"] += 1
        category_stats[category]["total_amount"] += abs(transaction["amount_cents"])
    
    for category, stats in category_stats.items():
        print(f"  {category}:")
        print(f"    Number of transactions: {stats['count']}")
        print(f"    Total amount: {stats['total_amount'] / 100:,.2f} VND")

if __name__ == "__main__":
    generate_fake_data()