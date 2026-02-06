import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if user exists
    const [existing]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result]: any = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );

    const userId = result.insertId;
    
    // Create token
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: { id: userId, username }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [users]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, username: user.username }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const oauthLogin = async (req: Request, res: Response) => {
  const { provider, code } = req.body;

  if (!provider || !code) {
    return res.status(400).json({ error: 'Provider and code are required' });
  }

  try {
    // 1. Mock OAuth Verification
    // -----------------------------------------------------------------------
    // [SECURITY WARNING]
    // In a REAL production app, you MUST verify the code with the provider.
    // The backend should NEVER trust the 'code' directly from the client.
    //
    // Real flow:
    // 1. Backend sends (client_id + client_secret + code) to Provider (e.g. GitHub).
    // 2. Provider validates code and returns an access_token.
    // 3. Backend uses access_token to fetch user profile (id, email) from Provider.
    // 4. Only then do we trust the user identity.
    // -----------------------------------------------------------------------

    // --- 模拟验票逻辑 Start ---
    // 为了演示安全性，我们规定：只有以 "valid_" 开头的 code 才是真 code，否则视为伪造。
    if (!code.startsWith('valid_')) {
      return res.status(401).json({ error: 'Invalid OAuth code. Verification failed with provider.' });
    }
    
    console.log(`Verifying code '${code}' with ${provider}... [Mock Success]`);
    // --- 模拟验票逻辑 End ---

    // In a real app, this ID comes from the provider's API response, not generated from code.
    const mockOAuthId = `${provider}_user_${code}`; 
    
    // 2. Check if user exists
    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      [provider, mockOAuthId]
    );

    let user;
    let isNewUser = false;

    if (users.length > 0) {
      // User exists - Login
      user = users[0];
    } else {
      // User doesn't exist - Register (Auto-create)
      isNewUser = true;
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const newUsername = `${provider}_${randomSuffix}`; // e.g., github_kx9d2a
      
      // Generate a random unusable password
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36) + Date.now().toString();
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const [result]: any = await pool.query(
        'INSERT INTO users (username, password_hash, oauth_provider, oauth_id) VALUES (?, ?, ?, ?)',
        [newUsername, passwordHash, provider, mockOAuthId]
      );
      
      user = {
        id: result.insertId,
        username: newUsername
      };
    }

    // 3. Generate Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: isNewUser ? 'OAuth Registration successful' : 'OAuth Login successful',
      token,
      user: { id: user.id, username: user.username },
      isNewUser
    });

  } catch (error) {
    console.error('OAuth Login error:', error);
    res.status(500).json({ error: 'OAuth Login failed' });
  }
};
