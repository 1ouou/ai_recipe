import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

const dbName = process.env.DB_NAME || 'ai_recipe_db';

export const pool = mysql.createPool({
  ...dbConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDB = async () => {
  try {
    // 1. Connect without database to check/create it
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    console.log(`Database ${dbName} checked/created.`);

    // 2. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        oauth_provider VARCHAR(50),
        oauth_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add oauth columns if they don't exist
    try {
      const [uColumns]: any = await pool.query(`SHOW COLUMNS FROM users LIKE 'oauth_provider'`);
      if (uColumns.length === 0) {
        console.log('Migrating users table: adding oauth columns...');
        await pool.query('ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50)');
        await pool.query('ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255)');
        // Add index for faster lookup
        await pool.query('ALTER TABLE users ADD INDEX idx_oauth (oauth_provider, oauth_id)');
      }
    } catch (err) {
      console.error('Error migrating users table:', err);
    }
    
    console.log('Table users checked/created.');

    // 3. Create Recipes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        ingredients TEXT NOT NULL,
        recipe_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_favorite BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add user_id column if it doesn't exist (for migration)
    try {
      const [columns]: any = await pool.query(`SHOW COLUMNS FROM recipes LIKE 'user_id'`);
      if (columns.length === 0) {
        console.log('Migrating recipes table: adding user_id column...');
        await pool.query('ALTER TABLE recipes ADD COLUMN user_id INT');
        await pool.query('ALTER TABLE recipes ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      }

      // Add is_favorite column if it doesn't exist
      const [favColumns]: any = await pool.query(`SHOW COLUMNS FROM recipes LIKE 'is_favorite'`);
      if (favColumns.length === 0) {
        console.log('Migrating recipes table: adding is_favorite column...');
        await pool.query('ALTER TABLE recipes ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE');
      }
    } catch (err) {
      console.error('Error migrating recipes table:', err);
    }

    console.log('Table recipes checked/created.');

    // 4. Create Ingredients Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        emoji VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table ingredients checked/created.');

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};
