import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]
print('Tables:', tables)

# Check services table
cursor.execute("PRAGMA table_info(services)")
services_columns = cursor.fetchall()
print('Services table columns:', [col[1] for col in services_columns])

# Check service_members table
cursor.execute("PRAGMA table_info(service_members)")
members_columns = cursor.fetchall()
print('Service members table columns:', [col[1] for col in members_columns])

# Check announcements table
cursor.execute("PRAGMA table_info(announcements)")
announcements_columns = cursor.fetchall()
print('Announcements table columns:', [col[1] for col in announcements_columns])

conn.close()