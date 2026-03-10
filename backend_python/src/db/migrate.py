"""Database migration script"""
import sqlite3
import re
from pathlib import Path


def migrate_add_path_prefix(db_path: str):
    """Add path_prefix column and populate existing data"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(mcp_servers)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'path_prefix' in columns:
            print("Migration already applied: path_prefix column exists")
            return

        print("Starting migration: adding path_prefix column...")

        # Add column (without UNIQUE constraint - SQLite limitation)
        cursor.execute("ALTER TABLE mcp_servers ADD COLUMN path_prefix TEXT")
        print("✓ Added path_prefix column")

        # Generate path_prefix for existing records
        cursor.execute("SELECT id, name FROM mcp_servers")
        servers = cursor.fetchall()

        if servers:
            print(f"Generating path_prefix for {len(servers)} existing servers...")

            for server_id, name in servers:
                # Generate: lowercase, replace spaces/underscores with hyphens
                prefix = re.sub(r'[^a-z0-9-]', '-', name.lower())
                prefix = re.sub(r'-+', '-', prefix).strip('-')

                # Ensure minimum length
                if len(prefix) < 3:
                    prefix = f"server-{server_id}"

                # Handle duplicates
                base_prefix = prefix
                counter = 1
                while True:
                    try:
                        cursor.execute(
                            "UPDATE mcp_servers SET path_prefix = ? WHERE id = ?",
                            (prefix, server_id)
                        )
                        print(f"  ✓ Server '{name}' -> path_prefix: '{prefix}'")
                        break
                    except sqlite3.IntegrityError:
                        prefix = f"{base_prefix}-{counter}"
                        counter += 1

        # Create unique index (enforces uniqueness)
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_servers_path_prefix ON mcp_servers(path_prefix)")
        print("✓ Created unique index on path_prefix")

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    import sys

    db_path = sys.argv[1] if len(sys.argv) > 1 else "mcp_market.db"

    if not Path(db_path).exists():
        print(f"Database file not found: {db_path}")
        sys.exit(1)

    migrate_add_path_prefix(db_path)
