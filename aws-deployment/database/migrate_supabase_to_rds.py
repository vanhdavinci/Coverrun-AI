#!/usr/bin/env python3
"""
Database migration script to migrate data from Supabase to AWS RDS PostgreSQL
"""

import os
import sys
import psycopg2
import boto3
import json
from datetime import datetime
import logging
from typing import Dict, List, Any
import argparse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupabaseToRDSMigrator:
    def __init__(self, supabase_url: str, supabase_key: str, rds_config: Dict[str, str]):
        """
        Initialize the migrator
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
            rds_config: RDS connection configuration
        """
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.rds_config = rds_config
        
        # Initialize connections
        self.supabase_conn = None
        self.rds_conn = None
        
    def connect_supabase(self):
        """Connect to Supabase using psycopg2"""
        try:
            # Parse Supabase URL to get connection details
            # Format: postgresql://postgres:[password]@[host]:[port]/postgres
            import urllib.parse
            parsed = urllib.parse.urlparse(self.supabase_url)
            
            supabase_config = {
                'host': parsed.hostname,
                'port': parsed.port or 5432,
                'database': parsed.path[1:] if parsed.path else 'postgres',
                'user': parsed.username,
                'password': parsed.password
            }
            
            self.supabase_conn = psycopg2.connect(**supabase_config)
            logger.info("Connected to Supabase successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            raise
    
    def connect_rds(self):
        """Connect to RDS PostgreSQL"""
        try:
            self.rds_conn = psycopg2.connect(**self.rds_config)
            logger.info("Connected to RDS successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to RDS: {e}")
            raise
    
    def create_tables(self):
        """Create tables in RDS based on Supabase schema"""
        try:
            cursor = self.rds_conn.cursor()
            
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    full_name VARCHAR(255),
                    avatar_url TEXT,
                    metadata JSONB
                );
            """)
            
            # Create profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    full_name VARCHAR(255),
                    avatar_url TEXT,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
            # Create jars table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS jars (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    jar_type VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    target_amount DECIMAL(15,2),
                    current_amount DECIMAL(15,2) DEFAULT 0,
                    percentage DECIMAL(5,2) DEFAULT 0,
                    color VARCHAR(7),
                    icon VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_id, jar_type)
                );
            """)
            
            # Create transactions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    jar_id UUID REFERENCES jars(id) ON DELETE CASCADE,
                    amount DECIMAL(15,2) NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
                    category VARCHAR(100),
                    description TEXT,
                    date DATE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
            # Create savings_goals table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS savings_goals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    target_amount DECIMAL(15,2) NOT NULL,
                    current_amount DECIMAL(15,2) DEFAULT 0,
                    target_date DATE,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            
            # Create indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_jars_user_id ON jars(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);")
            
            self.rds_conn.commit()
            logger.info("Tables created successfully in RDS")
            
        except Exception as e:
            self.rds_conn.rollback()
            logger.error(f"Failed to create tables: {e}")
            raise
        finally:
            cursor.close()
    
    def migrate_users(self):
        """Migrate users from Supabase to RDS"""
        try:
            supabase_cursor = self.supabase_conn.cursor()
            rds_cursor = self.rds_conn.cursor()
            
            # Get users from Supabase
            supabase_cursor.execute("""
                SELECT id, email, created_at, updated_at, raw_user_meta_data
                FROM auth.users
                WHERE email IS NOT NULL
            """)
            
            users = supabase_cursor.fetchall()
            logger.info(f"Found {len(users)} users to migrate")
            
            for user in users:
                user_id, email, created_at, updated_at, metadata = user
                
                # Insert into RDS
                rds_cursor.execute("""
                    INSERT INTO users (id, email, created_at, updated_at, metadata)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        email = EXCLUDED.email,
                        updated_at = EXCLUDED.updated_at,
                        metadata = EXCLUDED.metadata
                """, (user_id, email, created_at, updated_at, json.dumps(metadata) if metadata else None))
                
                # Insert profile if exists
                supabase_cursor.execute("""
                    SELECT full_name, avatar_url, updated_at
                    FROM public.profiles
                    WHERE id = %s
                """, (user_id,))
                
                profile = supabase_cursor.fetchone()
                if profile:
                    full_name, avatar_url, profile_updated_at = profile
                    rds_cursor.execute("""
                        INSERT INTO profiles (id, full_name, avatar_url, updated_at)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            full_name = EXCLUDED.full_name,
                            avatar_url = EXCLUDED.avatar_url,
                            updated_at = EXCLUDED.updated_at
                    """, (user_id, full_name, avatar_url, profile_updated_at))
            
            self.rds_conn.commit()
            logger.info(f"Successfully migrated {len(users)} users")
            
        except Exception as e:
            self.rds_conn.rollback()
            logger.error(f"Failed to migrate users: {e}")
            raise
        finally:
            supabase_cursor.close()
            rds_cursor.close()
    
    def migrate_jars(self):
        """Migrate jars from Supabase to RDS"""
        try:
            supabase_cursor = self.supabase_conn.cursor()
            rds_cursor = self.rds_conn.cursor()
            
            # Get jars from Supabase
            supabase_cursor.execute("""
                SELECT id, user_id, jar_type, name, description, target_amount, 
                       current_amount, percentage, color, icon, is_active, created_at, updated_at
                FROM public.jars
            """)
            
            jars = supabase_cursor.fetchall()
            logger.info(f"Found {len(jars)} jars to migrate")
            
            for jar in jars:
                rds_cursor.execute("""
                    INSERT INTO jars (id, user_id, jar_type, name, description, target_amount,
                                    current_amount, percentage, color, icon, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        jar_type = EXCLUDED.jar_type,
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        target_amount = EXCLUDED.target_amount,
                        current_amount = EXCLUDED.current_amount,
                        percentage = EXCLUDED.percentage,
                        color = EXCLUDED.color,
                        icon = EXCLUDED.icon,
                        is_active = EXCLUDED.is_active,
                        updated_at = EXCLUDED.updated_at
                """, jar)
            
            self.rds_conn.commit()
            logger.info(f"Successfully migrated {len(jars)} jars")
            
        except Exception as e:
            self.rds_conn.rollback()
            logger.error(f"Failed to migrate jars: {e}")
            raise
        finally:
            supabase_cursor.close()
            rds_cursor.close()
    
    def migrate_transactions(self):
        """Migrate transactions from Supabase to RDS"""
        try:
            supabase_cursor = self.supabase_conn.cursor()
            rds_cursor = self.rds_conn.cursor()
            
            # Get transactions from Supabase
            supabase_cursor.execute("""
                SELECT id, user_id, jar_id, amount, type, category, description, date, created_at, updated_at
                FROM public.transactions
            """)
            
            transactions = supabase_cursor.fetchall()
            logger.info(f"Found {len(transactions)} transactions to migrate")
            
            for transaction in transactions:
                rds_cursor.execute("""
                    INSERT INTO transactions (id, user_id, jar_id, amount, type, category, description, date, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        jar_id = EXCLUDED.jar_id,
                        amount = EXCLUDED.amount,
                        type = EXCLUDED.type,
                        category = EXCLUDED.category,
                        description = EXCLUDED.description,
                        date = EXCLUDED.date,
                        updated_at = EXCLUDED.updated_at
                """, transaction)
            
            self.rds_conn.commit()
            logger.info(f"Successfully migrated {len(transactions)} transactions")
            
        except Exception as e:
            self.rds_conn.rollback()
            logger.error(f"Failed to migrate transactions: {e}")
            raise
        finally:
            supabase_cursor.close()
            rds_cursor.close()
    
    def migrate_savings_goals(self):
        """Migrate savings goals from Supabase to RDS"""
        try:
            supabase_cursor = self.supabase_conn.cursor()
            rds_cursor = self.rds_conn.cursor()
            
            # Get savings goals from Supabase
            supabase_cursor.execute("""
                SELECT id, user_id, name, target_amount, current_amount, target_date, description, is_active, created_at, updated_at
                FROM public.savings_goals
            """)
            
            goals = supabase_cursor.fetchall()
            logger.info(f"Found {len(goals)} savings goals to migrate")
            
            for goal in goals:
                rds_cursor.execute("""
                    INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, description, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        name = EXCLUDED.name,
                        target_amount = EXCLUDED.target_amount,
                        current_amount = EXCLUDED.current_amount,
                        target_date = EXCLUDED.target_date,
                        description = EXCLUDED.description,
                        is_active = EXCLUDED.is_active,
                        updated_at = EXCLUDED.updated_at
                """, goal)
            
            self.rds_conn.commit()
            logger.info(f"Successfully migrated {len(goals)} savings goals")
            
        except Exception as e:
            self.rds_conn.rollback()
            logger.error(f"Failed to migrate savings goals: {e}")
            raise
        finally:
            supabase_cursor.close()
            rds_cursor.close()
    
    def run_migration(self):
        """Run the complete migration process"""
        try:
            logger.info("Starting migration from Supabase to RDS...")
            
            # Connect to both databases
            self.connect_supabase()
            self.connect_rds()
            
            # Create tables
            self.create_tables()
            
            # Migrate data
            self.migrate_users()
            self.migrate_jars()
            self.migrate_transactions()
            self.migrate_savings_goals()
            
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise
        finally:
            # Close connections
            if self.supabase_conn:
                self.supabase_conn.close()
            if self.rds_conn:
                self.rds_conn.close()

def get_rds_config_from_secrets():
    """Get RDS configuration from AWS Secrets Manager"""
    try:
        secrets_client = boto3.client('secretsmanager')
        secret_name = os.getenv('RDS_SECRET_NAME', 'Jargon AI/database/dev')
        
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret = json.loads(response['SecretString'])
        
        return {
            'host': secret['host'],
            'port': secret['port'],
            'database': secret['database'],
            'user': secret['username'],
            'password': secret['password']
        }
    except Exception as e:
        logger.error(f"Failed to get RDS config from Secrets Manager: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='Migrate data from Supabase to AWS RDS')
    parser.add_argument('--supabase-url', required=True, help='Supabase project URL')
    parser.add_argument('--supabase-key', required=True, help='Supabase service role key')
    parser.add_argument('--rds-secret-name', default='Jargon AI/database/dev', help='RDS secret name in AWS Secrets Manager')
    parser.add_argument('--dry-run', action='store_true', help='Run migration in dry-run mode')
    
    args = parser.parse_args()
    
    try:
        # Get RDS configuration
        rds_config = get_rds_config_from_secrets()
        
        # Create migrator
        migrator = SupabaseToRDSMigrator(
            supabase_url=args.supabase_url,
            supabase_key=args.supabase_key,
            rds_config=rds_config
        )
        
        if args.dry_run:
            logger.info("Dry run mode - connecting to databases only")
            migrator.connect_supabase()
            migrator.connect_rds()
            logger.info("Dry run completed successfully")
        else:
            # Run migration
            migrator.run_migration()
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 