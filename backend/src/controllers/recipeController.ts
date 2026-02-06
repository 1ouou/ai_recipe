import { Request, Response } from 'express';
import { pool } from '../config/db';
import OpenAI from 'openai';

// Define Ingredient Interface
interface Ingredient {
  id?: string | number;
  name: string;
  emoji: string;
  category: 'vegetable' | 'meat' | 'seafood' | 'staple' | 'dairy' | 'fruit' | 'condiment';
}

// Initial Seed Data
const INGREDIENTS_SEED: Ingredient[] = [
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
  { name: '胡椒粉', emoji: '🧂', category: 'condiment' },
];

export const seedIngredients = async () => {
  try {
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM ingredients');
    const count = rows[0].count;

    if (count === 0) {
      console.log('Seeding ingredients table...');
      const values = INGREDIENTS_SEED.map(i => [i.name, i.emoji, i.category]);
      await pool.query(
        'INSERT INTO ingredients (name, emoji, category) VALUES ?',
        [values]
      );
      console.log(`Seeded ${values.length} ingredients.`);
    }
  } catch (error) {
    console.error('Error seeding ingredients:', error);
  }
};

export const getIngredients = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ingredients ORDER BY category, id');
    // Convert id to string to match frontend expectations
    const ingredients = (rows as any[]).map(row => ({
      ...row,
      id: row.id.toString()
    }));
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
};

export const searchIngredient = async (req: Request, res: Response) => {
  const { query } = req.query;
  const ingredientName = query as string;

  if (!ingredientName) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // 1. Check Database first
    const [rows]: any = await pool.query(
      'SELECT * FROM ingredients WHERE name LIKE ?',
      [`%${ingredientName}%`]
    );

    if (rows.length > 0) {
      const ingredients = rows.map((row: any) => ({ ...row, id: row.id.toString() }));
      return res.json({ source: 'db', data: ingredients });
    }

    // 2. If not found, use AI to identify
    console.log(`Ingredient '${ingredientName}' not found in DB. Asking AI...`);
    
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      // Mock AI Logic: Return a mock ingredient so the feature is usable without a key
      console.log('Using Mock AI Search');
      const mockIngredient = {
        id: `mock-${Date.now()}`,
        name: ingredientName,
        emoji: '🥘', // Default emoji
        category: 'vegetable' as const 
      };
      return res.json({ source: 'mock', data: [mockIngredient] });
    }

    const openai = new OpenAI({ apiKey, baseURL });
    
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an ingredient classifier. 
          Identify the ingredient provided by the user.
          Return a JSON object with:
          - name: The standard Chinese name of the ingredient (e.g. "番茄").
          - emoji: A single representative emoji (e.g. "🍅").
          - category: One of ['vegetable', 'meat', 'seafood', 'staple', 'dairy', 'fruit', 'condiment'].
          
          If the input is not a valid food ingredient, return null.
          IMPORTANT: The name MUST NOT contain the emoji. The name should be purely text.`
        },
        { role: 'user', content: ingredientName },
      ],
      model: model,
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content || 'null';
    console.log('AI Ingredient Analysis:', content);
    
    const cleanContent = content.replace(/```json\n?|```/g, '').trim();
    const aiResult = JSON.parse(cleanContent);

    if (aiResult && aiResult.name) {
      // Clean up the name just in case (remove emojis and extra spaces)
      const cleanName = aiResult.name.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '').trim();
      
      // Double check if this ingredient already exists (exact match)
      const [existingRows]: any = await pool.query(
        'SELECT * FROM ingredients WHERE name = ?',
        [cleanName]
      );

      if (existingRows.length > 0) {
        const existing = existingRows[0];
        return res.json({ 
          source: 'ai_existing', 
          data: [{ ...existing, id: existing.id.toString() }] 
        });
      }

      // 3. Save to Database
      const [insertResult]: any = await pool.query(
        'INSERT INTO ingredients (name, emoji, category) VALUES (?, ?, ?)',
        [cleanName, aiResult.emoji, aiResult.category]
      );

      const newIngredient = {
        id: insertResult.insertId.toString(),
        name: cleanName,
        emoji: aiResult.emoji,
        category: aiResult.category
      };

      return res.json({ source: 'ai', data: [newIngredient] });
    } else {
      return res.json({ source: 'ai', data: [] }); // AI couldn't identify
    }

  } catch (error) {
    console.error('Error searching ingredient:', error);
    res.status(500).json({ error: 'Failed to search ingredient' });
  }
};

import { AuthRequest } from '../middleware/authMiddleware';

export const generateStory = async (req: Request, res: Response) => {
  const { ingredients } = req.body;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return res.json({ story: '厨神正在闭关修炼，暂时无法讲述江湖传说...' });
    }

    const openai = new OpenAI({ apiKey, baseURL });
    
    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个美食小说家。请根据用户提供的食材，即兴创作一段**长篇**美食爽文。
          
          风格要求：
          1. 极度夸张，热血，或者充满玄幻色彩。
          2. 将普通食材描写成绝世天材地宝。
          3. 剧情要有反转或装逼打脸的情节。
          4. **请持续输出，篇幅要长，至少 500 字以上**，细节要丰富，心理描写要足。
          
          例如：
          "只见那普通的番茄在烈火中竟隐隐透出凤凰虚影，众人皆惊：'这...这莫非是传说中的九转赤凤果？！' 主角冷笑一声，手中锅铲翻飞，刹那间香气冲天..."`
        },
        { role: 'user', content: `食材：${ingredients}` },
      ],
      model: model,
      stream: true, // Enable streaming
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error generating story:', error);
    // Don't fail the main request if story fails, just send end
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

export const generateRecipe = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  
  // if (!userId) {
  //    return res.status(401).json({ error: 'User not authenticated' });
  // }

  const { ingredients, preferences } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  try {
    let recipes: any[] = [];
    
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    console.log('--- Generate Recipe Request ---');
    console.log('Ingredients:', ingredients);
    console.log('Preferences:', preferences);
    console.log('API Key configured:', !!apiKey && apiKey !== 'your_openai_api_key_here');
    console.log('Base URL:', baseURL);
    console.log('Model:', model);

    // Check if real AI should be used
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      const openai = new OpenAI({ apiKey, baseURL });
      
      console.log(`Calling AI Model...`);
      
      const preferencesList = Array.isArray(preferences) 
        ? preferences 
        : (typeof preferences === 'string' && preferences.trim().length > 0)
          ? preferences.split(',')
          : [];

      const preferenceInstruction = preferencesList.length > 0 
        ? `6. 用户偏好：${preferencesList.join('、')}。请务必优先考虑这些口味或烹饪方式。`
        : '';

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `你是一个创意大厨。请根据用户提供的食材，推荐 3 道不同的美味菜谱。
              
              严格限制：
              1. **只能使用用户提供的食材**。
              2. 严禁自动添加任何未提及的主料（如：肉类、蔬菜、蛋奶、水果、主食等）。
              3. 如果未提供葱姜蒜，绝不能在步骤或配料中添加。
              4. 允许默认使用基础调料（仅限：水、油、盐、糖），除此之外的调料如果用户没提供也不能用。
              5. 如果食材太少无法做成常规菜肴，请就地取材做成简单的创意小食，不要为了凑菜谱而虚构食材。
              ${preferenceInstruction}
              
              要求：
              1. 必须返回合法的 JSON 格式。
              2. JSON 结构必须是一个包含 3 个菜谱对象的数组：
              [
                {
                  "name": "创意菜名1",
                  "image": "这道菜成品的英文画面描述，用于生成封面图，例如: 'Plate of tomato scrambled eggs, soft lighting'",
                  "difficulty": "难度(简单/中等/困难)",
                  "time": "预计总时间(如: 20分钟)",
                  "ingredients": ["食材1", "食材2", ...],
                  "utensils": ["平底锅", "锅铲", "盘子", ...],
                  "steps": [
                    {
                      "step": 1,
                      "description": "详细步骤描述，请尽量具体",
                      "duration": "预估耗时(精确到秒，如: 30秒)",
                      "visual": "该步骤的英文画面描述(用于AI生图)，要求：只描述核心动作或食材状态，不要包含人物，不超过15个单词。例如: 'Sliced tomatoes on cutting board'"
                    }
                  ],
                  "note": "大厨贴士"
                },
                ...
              ]
              3. 步骤描述要详细，包含火候、动作等细节。
              4. visual 字段必须是英文，描述要非常简练，包含画面主体、动作和环境。
              5. 不要包含 Markdown 代码块标记（如 \`\`\`json），直接返回纯文本 JSON。`
            },
            { role: 'user', content: `现有食材：${ingredients}` },
          ],
          model: model,
          temperature: 0.7,
        });

        console.log('AI Response received.');
        const content = completion.choices[0].message.content || '[]';
        console.log('Raw AI Content:', content);
        
        // Clean up potential markdown code blocks
        const cleanContent = content.replace(/```json\n?|```/g, '').trim();

        try {
          const parsedContent = JSON.parse(cleanContent);
          // Ensure it's an array
          recipes = Array.isArray(parsedContent) ? parsedContent : [parsedContent];
        } catch (e) {
          console.error('JSON Parse Error:', e);
          // Fallback or partial error
          recipes = [{ 
            name: '解析失败', 
            difficulty: '未知', 
            time: '未知', 
            ingredients: [], 
            utensils: [],
            steps: [{ step: 1, description: 'AI 返回的数据格式有误，请重试。', duration: '0秒', visual: 'error' }], 
            note: content 
          }];
        }
      } catch (aiError: any) {
        console.error('AI API Error:', aiError);
        console.error('AI API Error Message:', aiError.message);
        if (aiError.response) {
            console.error('AI API Response Data:', aiError.response.data);
        }
        throw aiError; // Re-throw to be caught by outer catch
      }

    } else {
      // Mock AI Response
      console.log('Using Mock AI Response (Key not configured)');
      
      const ingredientsList = Array.isArray(ingredients) ? ingredients : (ingredients as string).split(',');
      const firstIngredient = ingredientsList[0] || '未知食材';
      
      recipes = [
        {
          name: `AI 特制：${firstIngredient} 炒蛋 (模拟)`,
          image: 'Plate of scrambled eggs with tomatoes, professional food photography',
          difficulty: '简单',
          time: '10分钟',
          ingredients: [...ingredientsList, '油', '盐'],
          utensils: ['平底锅', '锅铲', '盘子'],
          steps: [
            { step: 1, description: '将所有食材洗净切好', duration: '60秒', visual: 'Chopping vegetables on a board' },
            { step: 2, description: '这是一个模拟生成的步骤，因为未配置 API Key', duration: '30秒', visual: 'Cooking pot on stove' }
          ],
          note: '当前使用的是模拟数据。'
        },
        {
          name: `清蒸 ${firstIngredient} (模拟)`,
          image: 'Steamed food in a bamboo steamer, steam rising, delicious',
          difficulty: '中等',
          time: '15分钟',
          ingredients: [...ingredientsList, '水', '盐'],
          utensils: ['蒸锅', '盘子'],
          steps: [
            { step: 1, description: '准备好食材', duration: '30秒', visual: 'Fresh ingredients on plate' },
            { step: 2, description: '上锅蒸煮', duration: '600秒', visual: 'Steaming pot with steam' }
          ],
          note: '记得配置 API Key 体验真实功能。'
        }
      ];
    }

    // Save to Database only if user is logged in
    let insertId = null;
    if (userId) {
      try {
        const ingredientsStr = Array.isArray(ingredients) ? ingredients.join(',') : ingredients;
        const [result] = await pool.query(
          'INSERT INTO recipes (user_id, ingredients, recipe_data) VALUES (?, ?, ?)',
          [userId, ingredientsStr, JSON.stringify(recipes)] 
        );
        insertId = (result as any).insertId;
      } catch (dbError) {
        console.error('Failed to save history:', dbError);
        // Continue even if save fails
      }
    }

    res.json({
      success: true,
      data: recipes, 
      id: insertId 
    });

  } catch (error) {
    console.error('Error generating recipe:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  const { id } = req.params;

  if (!userId) {
     return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Check if recipe exists and belongs to user
    const [rows]: any = await pool.query('SELECT * FROM recipes WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipe = rows[0];
    const newStatus = !recipe.is_favorite; // Toggle status

    await pool.query('UPDATE recipes SET is_favorite = ? WHERE id = ?', [newStatus, id]);

    res.json({ success: true, is_favorite: newStatus });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  if (!userId) {
     return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};
