#!/usr/bin/env python3

import json
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase environment variables not found.")
    print("Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

# Tables to clear before importing (in order of dependency)
tables_to_clear = [
    "transactions",
    "monthly_income_entries",
    "user_jars",
    "users",
    "jar_categories"
]

def ensure_jar_categories_exist(jar_categories):
    """Ensure jar categories exist in the database"""
    print("Ensuring jar categories exist...")
    
    for category in jar_categories:
        # Check if category exists
        response = supabase.table("jar_categories").select("*").eq("id", category["id"]).execute()
        
        if not response.data:
            # Insert category if it doesn't exist
            print(f"Creating jar category: {category['name']}")
            supabase.table("jar_categories").insert(category).execute()
        else:
            print(f"Jar category already exists: {category['name']}")

def ensure_user_exists(user):
    """Ensure user exists in the database"""
    print(f"Ensuring user exists: {user['email']}")
    
    # Check if user exists
    response = supabase.table("users").select("*").eq("id", user["id"]).execute()
    
    if not response.data:
        # Insert user if it doesn't exist
        print(f"Creating user: {user['email']}")
        supabase.table("users").insert(user).execute()
    else:
        print(f"User already exists: {user['email']}")

def clear_existing_data():
    """Clear existing data from tables"""
    print("Clearing existing data...")
    
    # Clear transactions first
    try:
        print("Clearing table: transactions")
        supabase.table("transactions").delete().eq("user_id", 20).execute()
    except Exception as e:
        print(f"Warning: Could not clear transactions: {e}")
    
    # Skip clearing monthly income entries since we're not importing them
    # try:
    #     print("Clearing table: monthly_income_entries")
    #     supabase.table("monthly_income_entries").delete().eq("user_id", 20).execute()
    # except Exception as e:
    #     print(f"Warning: Could not clear monthly_income_entries: {e}")
    
    # Clear user jars
    try:
        print("Clearing table: user_jars")
        supabase.table("user_jars").delete().eq("user_id", 20).execute()
    except Exception as e:
        print(f"Warning: Could not clear user_jars: {e}")
    
    # Clear user
    try:
        print("Clearing table: users")
        supabase.table("users").delete().eq("id", 20).execute()
    except Exception as e:
        print(f"Warning: Could not clear users: {e}")
    
    # We don't clear jar_categories as they are shared across users
    print("Note: Not clearing jar_categories as they are shared across users")
    
    print("Finished clearing existing data")

def initialize_user_jars(user_jars):
    """Initialize user jars"""
    print("Initializing user jars...")
    
    for jar in user_jars:
        print(f"Creating user jar: User ID {jar['user_id']}, Category ID {jar['category_id']}")
        supabase.table("user_jars").insert(jar).execute()

def insert_monthly_income_entries(monthly_income_entries):
    """Insert monthly income entries"""
    print("Inserting monthly income entries...")
    
    for entry in monthly_income_entries:
        print(f"Adding monthly income entry for {entry['month_year']}: {entry['total_income_cents']/100:,.2f} VND")
        supabase.table("monthly_income_entries").insert(entry).execute()

def insert_transactions(transactions):
    """Insert transactions in batches"""
    print("Inserting transactions...")
    
    # Insert in batches of 100 to avoid request size limits
    batch_size = 100
    total_transactions = len(transactions)
    
    for i in range(0, total_transactions, batch_size):
        batch = transactions[i:i+batch_size]
        print(f"Inserting batch {i//batch_size + 1}/{(total_transactions-1)//batch_size + 1} ({len(batch)} transactions)")
        supabase.table("transactions").insert(batch).execute()

def refresh_dashboard_data():
    """Refresh Supabase RPC data"""
    print("Refreshing dashboard data...")
    
    try:
        # Call the RPC functions to refresh the data
        supabase.rpc("refresh_jar_dashboard_data").execute()
        print("Dashboard data refreshed successfully")
    except Exception as e:
        print(f"Warning: Could not refresh dashboard data: {e}")
        print("Continuing with import process...")
        print("Note: You may need to manually refresh the dashboard data or create the necessary functions.")
        print("Check the database schema to ensure the refresh_jar_dashboard_data function exists.")
        print("This is not critical for the import process and can be addressed later.")
        

def generate_statistics(data):
    """Generate and display statistics about the imported data"""
    print("\n=== Import Statistics ===")
    print(f"User: {data['user']['email']} (ID: {data['user']['id']})")
    print(f"Jar Categories: {len(data['jar_categories'])}")
    print(f"User Jars: {len(data['user_jars'])}")
    print(f"Transactions: {len(data['transactions'])}")
    
    # Calculate total spending only (no income)
    total_spending = sum(abs(t["amount_cents"]) for t in data["transactions"] if t["amount_cents"] < 0) / 100
    
    print(f"\nTotal Spending: {total_spending:,.2f} VND")
    
    # Calculate spending by category
    spending_by_category = {}
    for transaction in data["transactions"]:
        if transaction["amount_cents"] < 0:
            jar_id = transaction["jar_category_id"]
            jar_name = next(cat["name"] for cat in data["jar_categories"] if cat["id"] == jar_id)
            
            if jar_name not in spending_by_category:
                spending_by_category[jar_name] = 0
            
            spending_by_category[jar_name] += abs(transaction["amount_cents"])
    
    print("\nSpending by Category:")
    for category, amount in spending_by_category.items():
        print(f"  {category}: {amount/100:,.2f} VND ({amount/100/total_spending*100:.1f}%)")

def run_import(data_file):
    """Run the import process"""
    print(f"Reading data from {data_file}...")
    
    with open(data_file, "r") as f:
        data = json.load(f)
    
    print(f"Loaded data with {len(data['transactions'])} transactions (income entries will be skipped)")
    
    # Clear existing data first
    clear_existing_data()
    
    # Create jar categories first
    ensure_jar_categories_exist(data["jar_categories"])
    
    # Then create the user
    ensure_user_exists(data["user"])
    
    # Initialize user jars after user exists
    initialize_user_jars(data["user_jars"])
    
    # Skip monthly income entries
    # insert_monthly_income_entries(data["monthly_income_entries"])
    
    # Insert transactions
    insert_transactions(data["transactions"])
    
    # Refresh dashboard data
    refresh_dashboard_data()
    
    # Generate statistics
    generate_statistics(data)
    
    print("\nImport completed successfully!")

def main():
    """Main function"""
    data_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fake_financial_data.json")
    
    if not os.path.exists(data_file):
        print(f"Error: Data file not found: {data_file}")
        print("Please run generate_fake_data.py first to create the data file.")
        sys.exit(1)
    
    run_import(data_file)

if __name__ == "__main__":
    main()