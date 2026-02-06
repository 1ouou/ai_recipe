export type IngredientCategory = 'vegetable' | 'meat' | 'seafood' | 'staple' | 'dairy' | 'fruit' | 'condiment';

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category: IngredientCategory;
}

export const INGREDIENTS: Ingredient[] = [
  // 🥬 蔬菜类
  { id: 'tomato', name: '番茄', emoji: '🍅', category: 'vegetable' },
  { id: 'potato', name: '土豆', emoji: '🥔', category: 'vegetable' },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', category: 'vegetable' },
  { id: 'onion', name: '洋葱', emoji: '🧅', category: 'vegetable' },
  { id: 'garlic', name: '大蒜', emoji: '🧄', category: 'vegetable' },
  { id: 'broccoli', name: '西兰花', emoji: '🥦', category: 'vegetable' },
  { id: 'cabbage', name: '卷心菜', emoji: '🥬', category: 'vegetable' },
  { id: 'mushroom', name: '蘑菇', emoji: '🍄', category: 'vegetable' },
  { id: 'eggplant', name: '茄子', emoji: '🍆', category: 'vegetable' },
  { id: 'cucumber', name: '黄瓜', emoji: '🥒', category: 'vegetable' },
  { id: 'pepper', name: '青椒', emoji: '🫑', category: 'vegetable' },
  { id: 'chili', name: '辣椒', emoji: '🌶️', category: 'vegetable' },
  { id: 'spinach', name: '菠菜', emoji: '🌿', category: 'vegetable' },
  { id: 'lettuce', name: '生菜', emoji: '🥬', category: 'vegetable' },
  { id: 'pumpkin', name: '南瓜', emoji: '🎃', category: 'vegetable' },
  { id: 'corn', name: '玉米', emoji: '🌽', category: 'vegetable' },
  { id: 'sweet_potato', name: '红薯', emoji: '🍠', category: 'vegetable' },
  { id: 'ginger', name: '生姜', emoji: '🫚', category: 'vegetable' },

  // 🥩 肉类
  { id: 'pork', name: '猪肉', emoji: '🥓', category: 'meat' },
  { id: 'beef', name: '牛肉', emoji: '🥩', category: 'meat' },
  { id: 'chicken', name: '鸡肉', emoji: '🍗', category: 'meat' },
  { id: 'lamb', name: '羊肉', emoji: '🍖', category: 'meat' },
  { id: 'sausage', name: '香肠', emoji: '🌭', category: 'meat' },
  { id: 'bacon', name: '培根', emoji: '🥓', category: 'meat' },
  { id: 'ham', name: '火腿', emoji: '🍖', category: 'meat' },

  // 🐟 海鲜水产
  { id: 'fish', name: '鱼', emoji: '🐟', category: 'seafood' },
  { id: 'shrimp', name: '虾', emoji: '🍤', category: 'seafood' },
  { id: 'crab', name: '螃蟹', emoji: '🦀', category: 'seafood' },
  { id: 'squid', name: '鱿鱼', emoji: '🦑', category: 'seafood' },
  { id: 'oyster', name: '生蚝', emoji: '🦪', category: 'seafood' },
  { id: 'lobster', name: '龙虾', emoji: '🦞', category: 'seafood' },

  // 🥚 蛋奶豆制品
  { id: 'egg', name: '鸡蛋', emoji: '🥚', category: 'dairy' },
  { id: 'milk', name: '牛奶', emoji: '🥛', category: 'dairy' },
  { id: 'cheese', name: '芝士', emoji: '🧀', category: 'dairy' },
  { id: 'butter', name: '黄油', emoji: '🧈', category: 'dairy' },
  { id: 'tofu', name: '豆腐', emoji: '🧊', category: 'dairy' },

  // 🍚 主食类
  { id: 'rice', name: '米饭', emoji: '🍚', category: 'staple' },
  { id: 'noodles', name: '面条', emoji: '🍜', category: 'staple' },
  { id: 'bread', name: '面包', emoji: '🍞', category: 'staple' },
  { id: 'dumpling', name: '饺子', emoji: '🥟', category: 'staple' },
  { id: 'pasta', name: '意面', emoji: '🍝', category: 'staple' },

  // 🍎 水果类
  { id: 'apple', name: '苹果', emoji: '🍎', category: 'fruit' },
  { id: 'banana', name: '香蕉', emoji: '🍌', category: 'fruit' },
  { id: 'lemon', name: '柠檬', emoji: '🍋', category: 'fruit' },
  { id: 'pineapple', name: '菠萝', emoji: '🍍', category: 'fruit' },
  { id: 'strawberry', name: '草莓', emoji: '🍓', category: 'fruit' },

  // 🧂 调味品
  { id: 'salt', name: '盐', emoji: '🧂', category: 'condiment' },
  { id: 'sugar', name: '糖', emoji: '🍬', category: 'condiment' },
  { id: 'oil', name: '油', emoji: '🫗', category: 'condiment' },
  { id: 'soy_sauce', name: '酱油', emoji: '🍾', category: 'condiment' },
  { id: 'vinegar', name: '醋', emoji: '🍶', category: 'condiment' },
  { id: 'honey', name: '蜂蜜', emoji: '🍯', category: 'condiment' },
];

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: '🥬 蔬菜',
  meat: '🥩 肉类',
  seafood: '🐟 海鲜',
  dairy: '🥚 蛋奶',
  staple: '🍚 主食',
  fruit: '🍎 水果',
  condiment: '🧂 调味',
};
