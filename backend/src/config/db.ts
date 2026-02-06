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

    // 5. Seed Initial Ingredients if empty
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM ingredients');
    const count = rows[0].count;

    if (count === 0) {
      console.log('Seeding ingredients table...');
      // Initial Seed Data
      const INGREDIENTS_SEED = [
        // 🥬 蔬菜类
        { name: '番茄', emoji: '🍅', category: 'vegetable' },
        { name: '土豆', emoji: '🥔', category: 'vegetable' },
        { name: '胡萝卜', emoji: '🥕', category: 'vegetable' },
        { name: '洋葱', emoji: '🧅', category: 'vegetable' },
        { name: '大蒜', emoji: '🧄', category: 'vegetable' },
        { name: '西兰花', emoji: '🥦', category: 'vegetable' },
        { name: '卷心菜', emoji: '🥬', category: 'vegetable' },
        { name: '蘑菇', emoji: '🍄', category: 'vegetable' },
        { name: '茄子', emoji: '🍆', category: 'vegetable' },
        { name: '黄瓜', emoji: '🥒', category: 'vegetable' },
        { name: '青椒', emoji: '🫑', category: 'vegetable' },
        { name: '辣椒', emoji: '🌶️', category: 'vegetable' },
        { name: '菠菜', emoji: '🌿', category: 'vegetable' },
        { name: '生菜', emoji: '🥬', category: 'vegetable' },
        { name: '南瓜', emoji: '🎃', category: 'vegetable' },
        { name: '玉米', emoji: '🌽', category: 'vegetable' },
        { name: '红薯', emoji: '🍠', category: 'vegetable' },
        { name: '生姜', emoji: '🫚', category: 'vegetable' },
        { name: '莲藕', emoji: '🪷', category: 'vegetable' },
        { name: '竹笋', emoji: '🎋', category: 'vegetable' },
        { name: '冬瓜', emoji: '🍈', category: 'vegetable' },

        // 🥩 肉类
        { name: '猪肉', emoji: '🥓', category: 'meat' },
        { name: '牛肉', emoji: '🥩', category: 'meat' },
        { name: '鸡肉', emoji: '🍗', category: 'meat' },
        { name: '羊肉', emoji: '🍖', category: 'meat' },
        { name: '香肠', emoji: '🌭', category: 'meat' },
        { name: '培根', emoji: '🥓', category: 'meat' },
        { name: '火腿', emoji: '🍖', category: 'meat' },
        { name: '鸭肉', emoji: '🦆', category: 'meat' },
        { name: '排骨', emoji: '🍖', category: 'meat' },

        // 🐟 海鲜水产
        { name: '鱼', emoji: '🐟', category: 'seafood' },
        { name: '虾', emoji: '🍤', category: 'seafood' },
        { name: '螃蟹', emoji: '🦀', category: 'seafood' },
        { name: '鱿鱼', emoji: '🦑', category: 'seafood' },
        { name: '生蚝', emoji: '🦪', category: 'seafood' },
        { name: '龙虾', emoji: '🦞', category: 'seafood' },
        { name: '蛤蜊', emoji: '🐚', category: 'seafood' },
        { name: '扇贝', emoji: '🦪', category: 'seafood' },

        // 🥚 蛋奶豆制品
        { name: '鸡蛋', emoji: '🥚', category: 'dairy' },
        { name: '牛奶', emoji: '🥛', category: 'dairy' },
        { name: '芝士', emoji: '🧀', category: 'dairy' },
        { name: '黄油', emoji: '🧈', category: 'dairy' },
        { name: '豆腐', emoji: '🧊', category: 'dairy' },
        { name: '酸奶', emoji: '🍦', category: 'dairy' },

        // 🍚 主食类
        { name: '米饭', emoji: '🍚', category: 'staple' },
        { name: '面条', emoji: '🍜', category: 'staple' },
        { name: '面包', emoji: '🍞', category: 'staple' },
        { name: '饺子', emoji: '🥟', category: 'staple' },
        { name: '意面', emoji: '🍝', category: 'staple' },
        { name: '馒头', emoji: '🥯', category: 'staple' },
        { name: '年糕', emoji: '🍘', category: 'staple' },

        // 🍎 水果类
        { name: '苹果', emoji: '🍎', category: 'fruit' },
        { name: '香蕉', emoji: '🍌', category: 'fruit' },
        { name: '柠檬', emoji: '🍋', category: 'fruit' },
        { name: '菠萝', emoji: '🍍', category: 'fruit' },
        { name: '草莓', emoji: '🍓', category: 'fruit' },
        { name: '西瓜', emoji: '🍉', category: 'fruit' },
        { name: '橙子', emoji: '🍊', category: 'fruit' },

        // 🧂 调味品
        { name: '盐', emoji: '🧂', category: 'condiment' },
        { name: '糖', emoji: '🍬', category: 'condiment' },
        { name: '油', emoji: '🫗', category: 'condiment' },
        { name: '酱油', emoji: '🍾', category: 'condiment' },
        { name: '醋', emoji: '🍶', category: 'condiment' },
        { name: '蜂蜜', emoji: '🍯', category: 'condiment' },
        { name: '料酒', emoji: '🍶', category: 'condiment' },
        { name: '胡椒粉', emoji: '🧂', category: 'condiment' }
      ];

      const values = INGREDIENTS_SEED.map(i => [i.name, i.emoji, i.category]);
      await pool.query(
        'INSERT INTO ingredients (name, emoji, category) VALUES ?',
        [values]
      );
      console.log(`Seeded ${values.length} ingredients.`);
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};
