"""
Database Migration & Management CLI for Zaika QR Dine Platform
Supports running versioned migrations, status checking, seeding, verification, and resetting.
"""

import os
import sys
import sqlite3
import argparse
import uuid
from datetime import datetime, timezone

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection, DB_PATH

# ----------------- MIGRATION DEFINITIONS -----------------

MIGRATIONS = [
    (
        "001_initial_schema",
        """
        CREATE TABLE IF NOT EXISTS admin_users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            is_veg INTEGER NOT NULL DEFAULT 1,
            image_url TEXT,
            available INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL,
            table_id TEXT NOT NULL,
            phone TEXT DEFAULT '',
            payment_mode TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            total REAL NOT NULL,
            items_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            token TEXT,
            table_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS otp_sessions (
            phone TEXT PRIMARY KEY,
            otp TEXT NOT NULL,
            otp_token TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        """
    ),
    (
        "002_add_order_and_menu_fields",
        """
        -- Safely extend tables with extra attributes
        -- Handled via python helper for column existence check
        """
    ),
    (
        "003_add_performance_indexes",
        """
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
        CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders (table_id);
        CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category, available);
        CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews (order_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
        """
    ),
    (
        "004_wal_mode_and_optimizations",
        """
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        PRAGMA foreign_keys=ON;
        """
    )
]

def init_migration_tracker(conn: sqlite3.Connection):
    """Ensure the schema_migrations table exists."""
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL,
        description TEXT
    );
    """)
    conn.commit()

def get_applied_migrations(conn: sqlite3.Connection):
    """Retrieve list of applied migration versions."""
    init_migration_tracker(conn)
    cursor = conn.cursor()
    cursor.execute("SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC")
    return {row["version"]: row["applied_at"] for row in cursor.fetchall()}

def _column_exists(cursor: sqlite3.Cursor, table_name: str, column_name: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def apply_custom_migration_002(conn: sqlite3.Connection):
    """Handles ALTER TABLE column additions idempotently."""
    cursor = conn.cursor()
    
    # Check and add orders columns
    if not _column_exists(cursor, "orders", "customer_name"):
        cursor.execute("ALTER TABLE orders ADD COLUMN customer_name TEXT NOT NULL DEFAULT 'Guest'")
        print("  -> Added column 'customer_name' to orders")
        
    if not _column_exists(cursor, "orders", "status"):
        cursor.execute("ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'")
        print("  -> Added column 'status' to orders")
        
    if not _column_exists(cursor, "orders", "instructions"):
        cursor.execute("ALTER TABLE orders ADD COLUMN instructions TEXT DEFAULT ''")
        print("  -> Added column 'instructions' to orders")
        
    # Check and add menu_items columns
    if not _column_exists(cursor, "menu_items", "is_bestseller"):
        cursor.execute("ALTER TABLE menu_items ADD COLUMN is_bestseller INTEGER NOT NULL DEFAULT 0")
        print("  -> Added column 'is_bestseller' to menu_items")
        
    if not _column_exists(cursor, "menu_items", "spice_level"):
        cursor.execute("ALTER TABLE menu_items ADD COLUMN spice_level INTEGER NOT NULL DEFAULT 1")
        print("  -> Added column 'spice_level' to menu_items")
        
    conn.commit()

def run_migrations():
    """Apply all pending migrations in order."""
    print(f"Connecting to database: {DB_PATH}")
    conn = get_db_connection()
    init_migration_tracker(conn)
    applied = get_applied_migrations(conn)
    
    pending_count = 0
    for version, script in MIGRATIONS:
        if version in applied:
            continue
        
        pending_count += 1
        print(f"Applying migration [{version}]...")
        cursor = conn.cursor()
        
        try:
            if version == "002_add_order_and_menu_fields":
                apply_custom_migration_002(conn)
            else:
                cursor.executescript(script)
                
            cursor.execute(
                "INSERT INTO schema_migrations (version, applied_at, description) VALUES (?, ?, ?)",
                (version, datetime.now(timezone.utc).isoformat(), f"Migration {version}")
            )
            conn.commit()
            print(f"  ✓ [{version}] applied successfully.")
        except Exception as e:
            conn.rollback()
            print(f"  ✗ Failed to apply [{version}]: {e}")
            conn.close()
            raise e
            
    if pending_count == 0:
        print("Database schema is up-to-date. No pending migrations.")
    else:
        print(f"Successfully applied {pending_count} migration(s).")
        
    conn.close()

def migration_status():
    """Display status of all migrations."""
    conn = get_db_connection()
    applied = get_applied_migrations(conn)
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"{'Migration Version':<35} | {'Status':<10} | {'Applied At'}")
    print("-" * 60)
    
    for version, _ in MIGRATIONS:
        if version in applied:
            applied_at = applied[version]
            print(f"{version:<35} | APPLIED    | {applied_at}")
        else:
            print(f"{version:<35} | PENDING    | -")
    print("=" * 60 + "\n")

def verify_database():
    """Verifies schema integrity, table counts, and indexes."""
    print("\n--- Verifying Database Integrity ---")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # PRAGMA integrity check
    cursor.execute("PRAGMA integrity_check;")
    integrity = cursor.fetchone()[0]
    print(f"SQLite Integrity Check: {integrity}")
    
    # List tables & row counts
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]
    
    print("\nTables & Row Counts:")
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        print(f"  - {t:<20}: {cnt:>6} rows")
        
    # List indexes
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY tbl_name;")
    indexes = cursor.fetchall()
    print("\nCustom Indexes:")
    for name, tbl in indexes:
        print(f"  - {name} ON {tbl}")
        
    conn.close()
    print("\nVerification completed successfully!\n")

def seed_database():
    """Run database seed from database.py."""
    from database import seed_db
    print("Running database seeding...")
    seed_db()
    print("Database seeding completed.")

def reset_database(force: bool = False):
    """Drop and re-create database from scratch."""
    if not force:
        confirm = input(f"Are you sure you want to delete and reset '{DB_PATH}'? (y/N): ")
        if confirm.lower() != 'y':
            print("Reset aborted.")
            return
            
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
            print(f"Removed database file: {DB_PATH}")
        except Exception as e:
            print(f"Could not delete database file: {e}")
            
    run_migrations()
    seed_database()
    verify_database()
    print("Database has been cleanly reset and initialized!")

def main():
    parser = argparse.ArgumentParser(description="Zaika QR Dine Database Migration Tool")
    parser.add_argument(
        "action",
        choices=["up", "migrate", "status", "seed", "verify", "reset"],
        help="Action to perform: migrate/up (apply migrations), status, seed, verify, reset"
    )
    parser.add_argument("--force", action="store_true", help="Force reset without confirmation")
    
    args = parser.parse_args()
    
    if args.action in ["up", "migrate"]:
        run_migrations()
    elif args.action == "status":
        migration_status()
    elif args.action == "seed":
        seed_database()
    elif args.action == "verify":
        verify_database()
    elif args.action == "reset":
        reset_database(force=args.force)

if __name__ == "__main__":
    main()
