import sqlite3

def run():
    conn = sqlite3.connect('aura.db')
    cursor = conn.cursor()
    # Update agents for the default documents so they show up under our banking agents
    cursor.execute("UPDATE documents SET agent_id = 'compliance' WHERE id = 'doc-1'")
    cursor.execute("UPDATE documents SET agent_id = 'kyc' WHERE id = 'doc-2'")
    cursor.execute("UPDATE documents SET agent_id = 'aml' WHERE id = 'doc-3'")
    cursor.execute("UPDATE documents SET agent_id = 'wealth' WHERE id = 'doc-4'")
    
    # Also update their names to sound more banking specific
    cursor.execute("UPDATE documents SET name = 'Global Compliance Manual.pdf' WHERE id = 'doc-1'")
    cursor.execute("UPDATE documents SET name = 'KYC Policy v4.1.pdf' WHERE id = 'doc-2'")
    cursor.execute("UPDATE documents SET name = 'AML Transaction Monitoring.pdf' WHERE id = 'doc-3'")
    cursor.execute("UPDATE documents SET name = 'Investment Suitability Matrix.pdf' WHERE id = 'doc-4'")

    conn.commit()
    conn.close()
    print('Documents updated successfully')

if __name__ == '__main__':
    run()
