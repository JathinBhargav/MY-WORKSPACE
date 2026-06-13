import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // Maintain a maximum of 20 persistent connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections automatically after 30 seconds
  connectionTimeoutMillis: 2000, // Return a timeout error if a connection cannot be leased within 2 seconds
};

export const dbPool = new Pool(poolConfig);

// Infrastructure-level error capturing to prevent thread crashing
dbPool.on('error', (err) => {
  console.error('Unexpected bottleneck on idle database connection pool node:', err);
});

export const query = (text: string, params?: any[]) => {
  // Shortcut method automatically leases, executes, and releases the connection back to the pool
  return dbPool.query(text, params);
};

export const runDatabaseMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚡ PostgreSQL Indexing Migration: No DATABASE_URL declared. Skipping real migration loop.');
    return;
  }
  try {
    console.log('🚀 Checking status of task synchronization schemas in PostgreSQL...');
    
    // Ensure table exists safely before putting indices on it
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sync_tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        due_date TIMESTAMP,
        urgency VARCHAR(50) DEFAULT 'MEDIUM'
      );
    `);

    console.log('📦 Core sync_tasks structure validated. Spawning optimization indices...');

    // 1. Optimize Dashboard Fetching & Tab Routing per User
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_tasks_user_id 
      ON sync_tasks (user_id);
    `);

    // 2. Optimize Real-Time Filter Chips Toggling (URGENT, HIGH, MEDIUM, LOW)
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_tasks_urgency 
      ON sync_tasks (urgency);
    `);

    // 3. Composite Index: Perfect optimization for rendering the filtered CalendarTasks view
    await dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_tasks_user_urgency_due
      ON sync_tasks (user_id, urgency, due_date DESC);
    `);

    console.log('🏆 Database indexes created and optimized successfully.');
  } catch (error: any) {
    console.error('❌ Indexing migration encountered database issue:', error.message);
  }
};

