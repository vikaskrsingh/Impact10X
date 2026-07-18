import sqlite3

def run():
    conn = sqlite3.connect('omnimind.db')
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('kyc', 'KYC Expert', 'Compliance Team', 98, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('aml', 'AML Expert', 'Risk & Compliance', 97, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('compliance', 'Compliance Expert', 'Regulatory Board', 99, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('payments', 'Payments Expert', 'Payments Processing', 95, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('risk', 'Risk Expert', 'Enterprise Risk', 96, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('esg', 'ESG Expert', 'Sustainability', 94, 'Active')")
    cursor.execute("INSERT OR IGNORE INTO agents (id, name, owner, health, status) VALUES ('wealth', 'Wealth Expert', 'Wealth Management', 98, 'Active')")
    conn.commit()
    conn.close()
    print('Agents inserted successfully')

if __name__ == '__main__':
    run()
