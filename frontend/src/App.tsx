import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChefHat, Sparkles, Clock, Flame, Search, Trash2, X, ImageOff, Utensils, Menu, History, User, LogOut, Heart, Plus } from 'lucide-react';
import { Button, Input, Card, Spin, message, Modal, List, Badge, Empty, Tag, Tabs, Drawer, Form, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import axios from 'axios';
import type { Ingredient, IngredientCategory } from './data/ingredients';

// Constants for Category Labels (Used for Tabs)
const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: '🥬 蔬菜',
  meat: '🥩 肉类',
  seafood: '🐟 海鲜',
  dairy: '🥚 蛋奶',
  staple: '🍚 主食',
  fruit: '🍎 水果',
  condiment: '🧂 调味',
};

interface RecipeStep {
  step: number;
  description: string;
  duration: string;
  visual: string;
}

interface Recipe {
  id?: number;
  name: string;
  difficulty: string;
  time: string;
  ingredients: string[];
  utensils: string[];
  steps: RecipeStep[];
  note?: string;
  image?: string;
  is_favorite?: boolean;
}

interface User {
  id: number;
  username: string;
}

// Draggable Ingredient Item
const DraggableIngredient = ({ ingredient, isOverlay = false, onClick }: { ingredient: Ingredient; isOverlay?: boolean, onClick?: () => void }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ingredient.id,
    data: ingredient,
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-gray-100 
        transition-all hover:shadow-md hover:border-orange-200 hover:-translate-y-1 active:scale-95
        ${isOverlay ? 'scale-110 shadow-xl border-orange-400 rotate-3 z-50 cursor-grabbing' : ''}
      `}
    >
      <div className="text-3xl md:text-4xl mb-1">{ingredient.emoji}</div>
      <div className="text-xs font-medium text-gray-600 truncate w-full text-center">{ingredient.name}</div>
    </div>
  );
};

// Droppable Pot Area
const CookingPot = ({ items, onRemove }: { items: Ingredient[]; onRemove: (id: string) => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'cooking-pot',
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative w-full h-48 md:h-64 rounded-3xl border-4 border-dashed transition-all duration-300
        flex flex-col items-center justify-center overflow-hidden
        ${isOver ? 'border-orange-500 bg-orange-50 scale-[1.02]' : 'border-gray-300 bg-gray-50'}
        ${items.length > 0 ? 'bg-white border-solid border-orange-200' : ''}
      `}
    >
      {items.length === 0 ? (
        <div className="text-center pointer-events-none opacity-50 p-4">
          <div className="text-4xl md:text-6xl mb-2 md:mb-4">🥘</div>
          <p className="text-sm md:text-lg font-medium text-gray-400">
            <span className="hidden md:inline">把食材拖到这里</span>
            <span className="md:hidden">点击食材加入锅中</span>
          </p>
        </div>
      ) : (
        <div className="absolute inset-0 p-4 md:p-6 grid grid-cols-4 gap-2 md:gap-4 content-start overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="relative group animate-in zoom-in duration-300">
              <div className="flex flex-col items-center bg-orange-50 p-2 rounded-lg border border-orange-100">
                <div className="text-2xl md:text-3xl">{item.emoji}</div>
                <div className="text-[10px] md:text-xs text-gray-600 mt-1 truncate w-full text-center">{item.name}</div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Visual Indicator for Active Drop */}
      {isOver && (
        <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center pointer-events-none">
          <div className="text-orange-600 font-bold text-xl animate-pulse">松手放入锅中</div>
        </div>
      )}
    </div>
  );
};

// Recipe Image Component with Fallback
const RecipeImage = ({ name, className, prompt }: { name: string, className?: string, prompt?: string }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use useMemo to keep the seed stable across re-renders
  const seed = React.useMemo(() => Math.floor(Math.random() * 1000), []);
  
  const imageUrl = React.useMemo(() => {
    const imagePrompt = prompt || `delicious dish ${name}, professional food photography, 4k, high quality, appetizing`;
    // Ensure prompt is not too long to prevent URL issues
    const safePrompt = imagePrompt.slice(0, 200); 
    const encodedPrompt = encodeURIComponent(safePrompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}&width=800&height=600&model=flux`;
  }, [prompt, name, seed]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <ImageOff size={24} />
        <span className="text-xs mt-1">暂无图片</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden bg-gray-50`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50">
          <Spin />
        </div>
      )}
      <img 
        src={imageUrl} 
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={(e) => {
          console.error('Image Load Error:', e);
          setLoading(false);
          setError(true);
        }}
      />
    </div>
  );
};

// IngredientsPanel Component - Moved OUTSIDE App to prevent re-creation on render
const IngredientsPanel = React.memo(({ 
  searchTerm, 
  setSearchTerm, 
  handleSearch, 
  searchLoading, 
  ingredientsLoading, 
  tabItems 
}: {
  searchTerm: string,
  setSearchTerm: (val: string) => void,
  handleSearch: (val: string) => void,
  searchLoading: boolean,
  ingredientsLoading: boolean,
  tabItems: any
}) => (
  <div className="flex flex-col h-full">
    <div className="p-4 border-b border-gray-100 bg-white z-10 sticky top-0">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Search className="w-5 h-5 text-orange-500" /> 食材库
      </h2>
      <Input.Search 
        placeholder="搜索食材" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearch={handleSearch}
        loading={searchLoading}
        enterButton
        className="rounded-lg bg-gray-50 border-gray-200"
        allowClear
      />
    </div>
    
    <div className="flex-1 overflow-hidden flex flex-col">
      {ingredientsLoading ? (
        <div className="flex justify-center items-center h-full">
          <Spin tip="加载食材中..." />
        </div>
      ) : (
        <Tabs 
          defaultActiveKey="vegetable" 
          items={tabItems} 
          tabPosition="left"
          className="h-full custom-tabs"
          tabBarStyle={{ width: '80px', backgroundColor: '#fafafa' }}
          destroyInactiveTabPane={false} 
        />
      )}
    </div>
  </div>
));

function App() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [potIngredients, setPotIngredients] = useState<Ingredient[]>([]);
  // Use ref to track pot ingredients for event handlers without triggering re-renders
  const potIngredientsRef = useRef<Ingredient[]>([]);
  useEffect(() => {
    potIngredientsRef.current = potIngredients;
  }, [potIngredients]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Mobile UI States
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  // Use ref to track allIngredients for handleSearch callback to avoid double messages in StrictMode
  const allIngredientsRef = useRef<Ingredient[]>([]);
  useEffect(() => {
    allIngredientsRef.current = allIngredients;
  }, [allIngredients]);

  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Manual Input State
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
  const [manualIngredientName, setManualIngredientName] = useState('');

  // Refs for Story Streaming
  const storyBufferRef = useRef<string>('');
  const isStreamingRef = useRef(false);

  const handleManualAdd = () => {
    if (manualIngredientName.trim()) {
      const tempId = `manual-${Date.now()}`;
      const newIng: Ingredient = {
        id: tempId,
        name: manualIngredientName.trim(),
        emoji: '🥘', 
        category: 'vegetable'
      };
      setPotIngredients([...potIngredients, newIng]);
      setManualIngredientName('');
      setIsAddIngredientModalOpen(false);
      message.success('添加成功');
    }
  };

  // Preferences
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const PREFERENCE_TAGS = [
    { label: '🌶️ 香辣', value: '香辣开胃' },
    { label: '🥬 清淡', value: '清淡养生' },
    { label: '🥣 汤羹', value: '汤羹' },
    { label: '⏱️ 快手', value: '简单快手' },
    { label: '💪 低脂', value: '低脂减肥' },
    { label: '👶 辅食', value: '儿童辅食' },
    { label: '🥘 硬菜', value: '宴客硬菜' },
    { label: '🍬 甜口', value: '酸甜口味' },
  ];

  const [loadingText, setLoadingText] = useState('AI 大厨正在构思食谱...');
  
  const LOADING_TEXTS = [
    'AI 大厨正在挑选最佳食材...',
    '正在翻阅米其林秘籍...',
    '正在计算最佳火候...',
    '正在构思精美摆盘...',
    '香气马上就溢出屏幕了...',
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingText(LOADING_TEXTS[i % LOADING_TEXTS.length]);
        i++;
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Check if user is logged in
    if (token) {
       const storedUser = localStorage.getItem('user');
       if (storedUser) {
         setUser(JSON.parse(storedUser));
       }
    }
  }, [token]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ingredients`);
        setAllIngredients(response.data);
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
        message.error('无法加载食材库');
      } finally {
        setIngredientsLoading(false);
      }
    };

    fetchIngredients();
  }, []);

  const fetchHistory = async () => {
    if (!token) {
      setIsLoginModalOpen(true);
      return;
    }
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryList(response.data);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      if (error.response && error.response.status === 401) {
        handleLogout();
        setIsLoginModalOpen(true);
        message.warning('请先登录');
      } else {
        message.error('无法加载历史记录');
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAuth = async (values: any) => {
    setAuthLoading(true);
    const endpoint = isRegistering ? 'register' : 'login';
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/${endpoint}`, values);
      const { token, user, message: msg } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      setIsLoginModalOpen(false);
      message.success(msg);
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setHistoryList([]);
    message.success('已退出登录');
  };

  const handleHistoryClick = (historyItem: any) => {
    try {
      let recipesData = historyItem.recipe_data;
      if (typeof recipesData === 'string') {
        recipesData = JSON.parse(recipesData);
      }
      const recipesArray = Array.isArray(recipesData) ? recipesData : [recipesData];
      
      setRecipes(recipesArray.map((r: any) => ({ ...r, id: historyItem.id, is_favorite: historyItem.is_favorite })));
      setIsHistoryDrawerOpen(false);
      
      message.success(`已加载 ${historyItem.ingredients} 的生成记录`);
    } catch (e) {
      console.error('Parse history error', e);
      message.error('历史记录解析失败');
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    if (!token || !recipe.id) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/recipe/${recipe.id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newStatus = response.data.is_favorite;
      
      setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, is_favorite: newStatus } : r));
      if (selectedRecipe && selectedRecipe.id === recipe.id) {
        setSelectedRecipe({ ...selectedRecipe, is_favorite: newStatus });
      }
      
      setHistoryList(prev => prev.map(h => h.id === recipe.id ? { ...h, is_favorite: newStatus } : h));

      message.success(newStatus ? '已收藏到美味书签' : '已取消收藏');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      message.error('操作失败');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Callback to add ingredient - Defined BEFORE usages
  const addIngredientToPotCallback = useCallback((id: string) => {
    const ingredient = allIngredients.find(i => i.id === id);
    if (!ingredient) return;
    
    // Check against Ref to determine which message to show (avoids double message in StrictMode)
    if (potIngredientsRef.current.find(i => i.id === id)) {
      message.info(`${ingredient.name} 已经在锅里了`);
      return;
    }

    message.success(`已添加 ${ingredient.name}`);
    setPotIngredients(prev => {
       if (prev.find(i => i.id === ingredient.id)) return prev;
       return [...prev, ingredient];
    });
  }, [allIngredients]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    setActiveId(null);

    if (over && over.id === 'cooking-pot') {
      addIngredientToPotCallback(active.id as string);
    }
  };

  const removeFromPot = (id: string) => {
    setPotIngredients(potIngredients.filter(i => i.id !== id));
  };

  const toggleTag = (value: string) => {
    if (selectedTags.includes(value)) {
      setSelectedTags(selectedTags.filter(t => t !== value));
    } else {
      if (selectedTags.length >= 2) {
        message.info('最多选择 2 个偏好哦');
        return;
      }
      setSelectedTags([...selectedTags, value]);
    }
  };

  // Story Streaming Logic
  const consumeBuffer = useCallback(() => {
    if (storyBufferRef.current.length > 0) {
      const char = storyBufferRef.current.slice(0, 1);
      storyBufferRef.current = storyBufferRef.current.slice(1);
      setStory(prev => prev + char);
      setTimeout(consumeBuffer, 50); 
    } else if (isStreamingRef.current) {
      setTimeout(consumeBuffer, 100);
    }
  }, []);

  const fetchStory = async (ingredients: string[]) => {
    setStory('');
    storyBufferRef.current = '';
    isStreamingRef.current = true;
    consumeBuffer();

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipe/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last incomplete part in buffer

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            const dataStr = line.trim().slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                storyBufferRef.current += data.content;
              }
            } catch (e) {
              console.error('Parse SSE error', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Story error:', error);
    } finally {
      isStreamingRef.current = false;
    }
  };

  const handleGenerate = async () => {
    if (potIngredients.length === 0) return;
    
    setLoading(true);
    setRecipes([]);
    setSelectedRecipe(null);
    
    // Start story streaming
    const ingredientNames = potIngredients.map(i => i.name);
    fetchStory(ingredientNames);

    try {
      const preferences = selectedTags.join(',');
      
      const response = await axios.post(`${API_BASE_URL}/api/recipe/generate`, {
        ingredients: ingredientNames,
        preferences: preferences
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setRecipes(response.data.data.map((r: any) => ({ ...r, id: response.data.id })));
      if (token) fetchHistory();
      
    } catch (error) {
      console.error(error);
      message.error('生成食谱失败，请稍后重试');
    } finally {
      setLoading(false);
      isStreamingRef.current = false;
    }
  };

  const handleSearch = useCallback(async (value: string) => {
    if (!value.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/ingredients/search?query=${encodeURIComponent(value)}`);
      const { data } = response.data;
      
      if (data && data.length > 0) {
        // Correct approach: Calculate diff based on current state (ref) OUTSIDE of setState
        const currentAll = allIngredientsRef.current;
        const newIngredients = data.filter((newIng: Ingredient) => 
            !currentAll.some(existing => existing.name === newIng.name)
        );
        const existingIngredients = data.filter((newIng: Ingredient) => 
            currentAll.some(existing => existing.name === newIng.name)
        );

        if (newIngredients.length > 0) {
             message.success(`已发现新食材: ${newIngredients.map((i: any) => i.name).join(', ')}`);
             setAllIngredients(prev => [...prev, ...newIngredients]);
        } else if (existingIngredients.length > 0) {
             message.info(`食材 "${existingIngredients[0].name}" 已经在列表中了`);
        }
      } else {
        message.warning('AI 也没找到这个食材 🤔');
      }
    } catch (error) {
      console.error(error);
      message.error('搜索失败');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const filteredIngredients = useMemo(() => allIngredients.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allIngredients, searchTerm]);

  const tabItems = useMemo(() => (Object.keys(CATEGORY_LABELS) as IngredientCategory[]).map(category => {
    const categoryIngredients = filteredIngredients.filter(
      (item) => item.category === category
    );

    return {
      key: category,
      label: CATEGORY_LABELS[category],
      children: (
        <div className="h-full overflow-y-auto p-1">
          {categoryIngredients.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
              {categoryIngredients.map((item) => (
                <DraggableIngredient 
                  key={item.id} 
                  ingredient={item} 
                  onClick={isMobile ? () => addIngredientToPotCallback(item.id) : undefined}
                />
              ))}
            </div>
          ) : (
            <Empty 
              description={searchTerm ? "未找到相关食材" : "该分类下暂无食材"} 
              image={Empty.PRESENTED_IMAGE_SIMPLE} 
            />
          )}
        </div>
      ),
    };
  }), [filteredIngredients, searchTerm, isMobile, addIngredientToPotCallback]);

  const HistoryPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-white z-10 sticky top-0 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" /> 历史记录
        </h2>
        <Button 
          type="text" 
          icon={<X size={20} />} 
          onClick={() => setIsHistoryDrawerOpen(false)}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {historyLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : historyList.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <div className="space-y-3">
            {historyList.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleHistoryClick(item)}
                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer active:scale-98"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.is_favorite && <Heart size={14} className="text-red-500 fill-red-500" />}
                </div>
                <div className="text-gray-800 font-medium line-clamp-2 text-sm">
                  {item.ingredients}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isMobile && user && (
        <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
           <Button 
            danger 
            block 
            size="large" 
            icon={<LogOut size={18} />}
            onClick={() => {
              handleLogout();
              setIsHistoryDrawerOpen(false);
            }}
          >
            退出登录 ({user.username})
          </Button>
        </div>
      )}
    </div>
  );

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogOut size={16} />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-[#f8f9fa] font-sans flex flex-col md:flex-row">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-96 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
          <IngredientsPanel 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            searchLoading={searchLoading}
            ingredientsLoading={ingredientsLoading}
            tabItems={tabItems}
          />
        </div>

        {/* Mobile Header & Drawer Trigger */}
        <div className="md:hidden bg-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <ChefHat className="text-orange-500 w-6 h-6" />
            <h1 className="text-lg font-bold text-gray-800">AI 食材魔法师</h1>
          </div>
          <div className="flex gap-2">
            {user ? (
               <Button 
                icon={<History size={20} />} 
                onClick={() => {
                  setIsHistoryDrawerOpen(true);
                  fetchHistory();
                }}
              />
            ) : (
               <Button type="primary" size="small" onClick={() => setIsLoginModalOpen(true)}>
                 登录
               </Button>
            )}
           
            <Button 
              icon={<Menu size={20} />} 
              onClick={() => setIsMobileDrawerOpen(true)}
            >
              食材库
            </Button>
          </div>
        </div>

        {/* Mobile Ingredients Drawer */}
        <Drawer
          title="挑选食材"
          placement="left"
          onClose={() => setIsMobileDrawerOpen(false)}
          open={isMobileDrawerOpen}
          width="85%"
          bodyStyle={{ padding: 0 }}
        >
          <IngredientsPanel 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            searchLoading={searchLoading}
            ingredientsLoading={ingredientsLoading}
            tabItems={tabItems}
          />
        </Drawer>

        {/* History Drawer */}
        <Drawer
          title={null}
          placement="right"
          onClose={() => setIsHistoryDrawerOpen(false)}
          open={isHistoryDrawerOpen}
          width={isMobile ? "85%" : 400}
          bodyStyle={{ padding: 0 }}
          closeIcon={null}
        >
          <HistoryPanel />
        </Drawer>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-y-auto">
          <header className="hidden md:flex bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 border-b border-gray-100 justify-between items-center">
             <div className="flex items-center gap-2">
              <ChefHat className="text-orange-500 w-8 h-8" />
              <h1 className="text-xl font-bold text-gray-800">AI 食材魔法师</h1>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Button 
                    type="text"
                    icon={<History size={18} />} 
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
                    onClick={() => {
                      setIsHistoryDrawerOpen(true);
                      fetchHistory();
                    }}
                  >
                    历史记录
                  </Button>
                  <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                    <Button type="text" className="flex items-center gap-2 font-medium text-gray-700">
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                        <User size={16} />
                      </div>
                      {user.username}
                    </Button>
                  </Dropdown>
                </>
              ) : (
                <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>
                  登录 / 注册
                </Button>
              )}
              
              <div className="text-sm text-gray-500 border-l pl-4 border-gray-200">
                已选 <Badge count={potIngredients.length} color="#f97316" /> 种食材
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 md:space-y-8 pb-20">
            {/* Cooking Zone */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Flame className="text-orange-500" /> 烹饪锅
                </h2>
                <div className="flex gap-2">
                  <Button 
                    type="dashed" 
                    icon={<Plus size={16} />} 
                    onClick={() => setIsAddIngredientModalOpen(true)}
                  >
                    手动添加
                  </Button>
                  {potIngredients.length > 0 && (
                    <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => setPotIngredients([])}>
                      清空
                    </Button>
                  )}
                </div>
              </div>

              <CookingPot items={potIngredients} onRemove={removeFromPot} />

              {/* Preferences Selection */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium px-1">
                  <Sparkles size={14} className="text-orange-400"/> 
                  <span>想怎么吃？(可选)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREFERENCE_TAGS.map(tag => (
                    <div
                      key={tag.value}
                      onClick={() => toggleTag(tag.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs md:text-sm font-medium cursor-pointer transition-all border
                        ${selectedTags.includes(tag.value) 
                          ? 'bg-orange-100 border-orange-200 text-orange-700 shadow-sm' 
                          : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-white hover:border-orange-100'}
                      `}
                    >
                      {tag.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center sticky bottom-4 z-10 md:static">
                 <Button 
                  type="primary" 
                  size="large" 
                  onClick={handleGenerate} 
                  loading={loading}
                  disabled={potIngredients.length === 0}
                  className="h-10 md:h-12 px-6 md:px-8 text-base md:text-lg rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none shadow-lg shadow-orange-200 flex items-center gap-2 w-full md:w-auto justify-center"
                >
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  开始烹饪
                </Button>
              </div>
            </div>

            {/* Results Section */}
            {loading ? (
               <div className="text-center py-8 md:py-12 bg-white rounded-2xl md:rounded-3xl flex flex-col items-center justify-center min-h-[300px] px-4">
                {!story ? (
                  <>
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-20"></div>
                      <div className="bg-orange-50 p-6 rounded-full relative">
                         <ChefHat size={48} className="text-orange-500 animate-bounce" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{loadingText}</h3>
                    <p className="text-gray-400 text-sm">请耐心等待，美味即将出炉</p>
                  </>
                ) : (
                  <div className="max-w-2xl w-full text-left bg-orange-50/50 p-6 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold border-b border-orange-100 pb-2">
                      <Sparkles size={18} />
                      <span>AI 厨神剧场</span>
                    </div>
                    <div className="prose prose-orange max-w-none">
                      <p className="text-gray-700 leading-relaxed font-serif text-lg whitespace-pre-wrap">
                        {story}
                        <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-pulse"></span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : recipes.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">为你推荐</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {recipes.map((recipe, index) => (
                    <Card 
                      key={index}
                      hoverable
                      className="rounded-xl md:rounded-2xl overflow-hidden border-none shadow-md group relative"
                      bodyStyle={{ padding: 0 }}
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                       <div className="absolute top-3 right-3 z-10">
                        <Button 
                          shape="circle" 
                          icon={<Heart size={18} className={recipe.is_favorite ? "fill-red-500 text-red-500" : "text-white"} />}
                          className={`border-none shadow-md ${recipe.is_favorite ? 'bg-white' : 'bg-black/30 hover:bg-black/50'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(recipe);
                          }}
                        />
                      </div>
                      <div className="h-40 md:h-48 overflow-hidden">
                        <RecipeImage 
                          name={recipe.name} 
                          prompt={recipe.image}
                          className="w-full h-full transition-transform duration-700 group-hover:scale-110" 
                        />
                      </div>
                      <div className="p-4 relative">
                        <h4 className="text-lg md:text-xl font-bold truncate mb-2">{recipe.name}</h4>
                        <div className="flex gap-4 text-gray-500 text-sm mb-3">
                          <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-red-400" /> {recipe.difficulty}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-blue-400" /> {recipe.time}</span>
                        </div>
                        <p className="text-gray-600 line-clamp-2 text-sm">
                          {recipe.ingredients.join('、')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Login Modal */}
      <Modal
        open={isLoginModalOpen}
        onCancel={() => setIsLoginModalOpen(false)}
        footer={null}
        title={
          <div className="text-center text-xl font-bold mb-6">
            {isRegistering ? '注册新账号' : '欢迎回来'}
          </div>
        }
        width={400}
        centered
        closeIcon={
          <div className="bg-gray-100 rounded-full p-1 text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </div>
        }
      >
        <Form
          layout="vertical"
          onFinish={handleAuth}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input size="large" prefix={<User className="text-gray-400" size={18} />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password size="large" placeholder="请输入密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={authLoading} className="bg-orange-500 hover:bg-orange-600 border-none">
              {isRegistering ? '立即注册' : '登录'}
            </Button>
          </Form.Item>

          <div className="text-center text-gray-500">
            {isRegistering ? '已有账号？' : '还没有账号？'}
            <Button type="link" onClick={() => setIsRegistering(!isRegistering)} className="text-orange-500 hover:text-orange-600 px-1">
              {isRegistering ? '去登录' : '去注册'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Manual Ingredient Modal */}
      <Modal
        title="手动添加食材"
        open={isAddIngredientModalOpen}
        onOk={handleManualAdd}
        onCancel={() => setIsAddIngredientModalOpen(false)}
        okText="添加到锅里"
        cancelText="取消"
        centered
      >
        <Input 
          placeholder="请输入食材名称，例如：老干妈" 
          value={manualIngredientName}
          onChange={(e) => setManualIngredientName(e.target.value)}
          onPressEnter={handleManualAdd}
          autoFocus
        />
      </Modal>

      {/* Drag Overlay (Only on Desktop) */}
      {!isMobile && (
        <DragOverlay>
          {activeId ? (
            <DraggableIngredient 
              ingredient={allIngredients.find(i => i.id === activeId)!} 
              isOverlay 
            />
          ) : null}
        </DragOverlay>
      )}

      {/* Recipe Detail Modal (Responsive) */}
      <Modal
        title={null}
        open={!!selectedRecipe}
        onCancel={() => setSelectedRecipe(null)}
        footer={null}
        width={800}
        centered
        className="md:top-8 overflow-hidden md:!m-auto"
        styles={{ 
          body: {
            flex: 1,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.6)' }
        }}
        closeIcon={
          <div className="bg-black/50 backdrop-blur rounded-full p-1.5 text-white hover:bg-black/70 transition-colors z-50 relative shadow-sm">
            <X size={20} />
          </div>
        }
      >
        {selectedRecipe && (
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="h-48 md:h-64 w-full relative flex-shrink-0">
              <RecipeImage 
                name={selectedRecipe.name} 
                className="w-full h-full"
                prompt={selectedRecipe.image}
              />
              <div className="absolute top-4 right-4 z-10">
                 <Button 
                    shape="circle" 
                    size="large"
                    icon={<Heart size={20} className={selectedRecipe.is_favorite ? "fill-red-500 text-red-500" : "text-gray-600"} />}
                    className="bg-white/80 backdrop-blur border-none shadow-lg"
                    onClick={() => toggleFavorite(selectedRecipe)}
                  />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4 md:p-6 pointer-events-none">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedRecipe.name}</h2>
                  <div className="flex gap-3 md:gap-4 text-white/90">
                    <span className="bg-white/20 backdrop-blur px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">{selectedRecipe.difficulty}</span>
                    <span className="bg-white/20 backdrop-blur px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">{selectedRecipe.time}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-6 md:space-y-8 pb-20">
              
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 text-gray-800">
                    <div className="w-1 h-5 md:h-6 bg-orange-500 rounded-full"></div> 食材清单
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-orange-50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base text-gray-700 font-medium border border-orange-100">
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 text-gray-800">
                    <div className="w-1 h-5 md:h-6 bg-blue-500 rounded-full"></div> 所需餐具
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.utensils?.map((tool, idx) => (
                      <Tag key={idx} color="blue" className="px-2 md:px-3 py-1 text-xs md:text-sm rounded-lg flex items-center gap-1">
                        <Utensils size={12} /> {tool}
                      </Tag>
                    ))}
                    {(!selectedRecipe.utensils || selectedRecipe.utensils.length === 0) && (
                      <span className="text-gray-400 text-sm">常规厨具即可</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2 text-gray-800">
                  <div className="w-1 h-5 md:h-6 bg-orange-500 rounded-full"></div> 烹饪步骤
                </h3>
                <List
                  itemLayout="horizontal"
                  dataSource={selectedRecipe.steps}
                  renderItem={(item, index) => (
                    <List.Item className="border-b-0 px-0 py-4 block md:flex">
                      <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md mb-2">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2 md:space-y-3">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                             <p className="text-gray-800 text-base md:text-lg leading-relaxed font-medium w-full md:w-auto">{item.description}</p>
                             <Tag color="orange" icon={<Clock size={12} />} className="flex-shrink-0 text-xs md:text-sm">
                               {item.duration}
                             </Tag>
                          </div>
                          
                          {/* Step Image */}
                          <div className="h-40 md:h-48 w-full md:w-2/3 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                            <RecipeImage 
                              name={`step-${index}`} 
                              prompt={item.visual}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              {selectedRecipe.note && (
                <div className="bg-yellow-50 p-3 md:p-4 rounded-xl text-yellow-800 text-sm border border-yellow-100 flex gap-3">
                  <Sparkles className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                  <div>
                    <strong className="block mb-1 text-yellow-900">大厨贴士</strong>
                    {selectedRecipe.note}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DndContext>
  );
}

export default App;
