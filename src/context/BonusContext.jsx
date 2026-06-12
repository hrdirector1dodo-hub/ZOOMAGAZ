// src/context/BonusContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const BonusContext = createContext(null);

export const BonusProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);

  const getUserKey = (currentUser) => {
    if (!currentUser) return 'guest';
    return currentUser.id || currentUser.email || currentUser.phone || 'guest';
  };

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      if (isSupabaseConfigured) {
        // Sync balance with profiles table (using user.bonuses)
        setBalance(user.bonuses || 0);

        const fetchBonusHistory = async () => {
          try {
            const { data, error } = await supabase
              .from('bonus_history')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
            
            if (!error && data) {
              const formatted = data.map(item => ({
                id: item.id,
                type: item.type,
                orderId: item.order_id,
                amount: Math.abs(item.amount),
                createdAt: item.created_at,
                description: item.type === 'Начисление'
                  ? `Кэшбэк за заказ ${item.order_id ? item.order_id.substring(0, 8) : ''}`
                  : `Списание бонусов для оплаты заказа ${item.order_id ? item.order_id.substring(0, 8) : ''}`
              }));
              setHistory(formatted);
            }
          } catch (err) {
            console.error('Failed to fetch bonus history from DB:', err);
          }
        };
        fetchBonusHistory();
      } else {
        const userKey = getUserKey(user);
        const balanceKey = `bonusBalance_${userKey}`;
        const historyKey = `bonusHistory_${userKey}`;

        const savedBalance = localStorage.getItem(balanceKey);
        const savedHistory = localStorage.getItem(historyKey);

        if (savedBalance === null) {
          // Seed for demo user
          if (user.id === 'demo-user-1' || user.email === 'demo@ecopet.ru') {
            const demoBalance = 250;
            const demoHistory = [
              {
                id: 'bonus_seed_001',
                type: 'Начисление',
                orderId: 'EP-9021',
                orderTotal: 3200,
                amount: 250,
                createdAt: '2026-05-15T12:00:00.000Z',
                description: 'Приветственные бонусы при регистрации'
              }
            ];
            localStorage.setItem(balanceKey, String(demoBalance));
            localStorage.setItem(historyKey, JSON.stringify(demoHistory));
            setBalance(demoBalance);
            setHistory(demoHistory);
          } else {
            localStorage.setItem(balanceKey, '0');
            localStorage.setItem(historyKey, JSON.stringify([]));
            setBalance(0);
            setHistory([]);
          }
        } else {
          setBalance(Number(savedBalance));
          try {
            setHistory(JSON.parse(savedHistory || '[]'));
          } catch (e) {
            setHistory([]);
          }
        }
      }
    } else {
      setBalance(0);
      setHistory([]);
    }
  }, [user, user?.bonuses]);

  const calculateCashback = (orderTotal) => {
    const total = parseFloat(orderTotal);
    if (isNaN(total) || total < 0) return 0;
    return Math.floor(total / 10000) * 100;
  };

  const getUserBonusBalance = (userId) => {
    const saved = localStorage.getItem(`bonusBalance_${userId}`);
    return saved !== null ? Number(saved) : 0;
  };

  const getBonusHistory = (userId) => {
    try {
      const saved = localStorage.getItem(`bonusHistory_${userId}`);
      return saved !== null ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const addBonus = async (userId, amount, orderId, orderTotal) => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return;

    if (isSupabaseConfigured) {
      try {
        const { error: histErr } = await supabase
          .from('bonus_history')
          .insert({
            user_id: user.id,
            type: 'Начисление',
            amount: val,
            order_id: orderId
          });
        if (histErr) throw histErr;

        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('bonuses')
          .eq('id', user.id)
          .single();
        if (profErr) throw profErr;

        const newBal = (profile.bonuses || 0) + val;
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ bonuses: newBal })
          .eq('id', user.id);
        if (updateErr) throw updateErr;

        setBalance(newBal);

        const { data: freshHistory } = await supabase
          .from('bonus_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (freshHistory) {
          setHistory(freshHistory.map(item => ({
            id: item.id,
            type: item.type,
            orderId: item.order_id,
            amount: Math.abs(item.amount),
            createdAt: item.created_at,
            description: item.type === 'Начисление'
              ? `Кэшбэк за заказ ${item.order_id ? item.order_id.substring(0, 8) : ''}`
              : `Списание бонусов для оплаты заказа ${item.order_id ? item.order_id.substring(0, 8) : ''}`
          })));
        }
      } catch (err) {
        console.error('Failed to add bonus in Supabase:', err);
      }
    } else {
      const balanceKey = `bonusBalance_${userId}`;
      const historyKey = `bonusHistory_${userId}`;

      const currentBal = getUserBonusBalance(userId);
      const newBal = currentBal + val;
      localStorage.setItem(balanceKey, String(newBal));

      const currentHistory = getBonusHistory(userId);
      const operation = {
        id: 'bonus_' + Math.floor(100000 + Math.random() * 900000),
        type: 'Начисление',
        orderId,
        orderTotal,
        amount: val,
        createdAt: new Date().toISOString(),
        description: `Кэшбэк за заказ ${orderId} на сумму ${orderTotal.toLocaleString()} ₽`
      };

      const newHistory = [operation, ...currentHistory];
      localStorage.setItem(historyKey, JSON.stringify(newHistory));

      if (user && getUserKey(user) === userId) {
        setBalance(newBal);
        setHistory(newHistory);
      }
    }
  };

  const spendBonus = async (userId, amount, orderId) => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return;

    if (isSupabaseConfigured) {
      try {
        const { error: histErr } = await supabase
          .from('bonus_history')
          .insert({
            user_id: user.id,
            type: 'Списание',
            amount: -val, // Store negative amount for spents in DB (or absolute and filter on type)
            order_id: orderId
          });
        if (histErr) throw histErr;

        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('bonuses')
          .eq('id', user.id)
          .single();
        if (profErr) throw profErr;

        const newBal = Math.max(0, (profile.bonuses || 0) - val);
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ bonuses: newBal })
          .eq('id', user.id);
        if (updateErr) throw updateErr;

        setBalance(newBal);

        const { data: freshHistory } = await supabase
          .from('bonus_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (freshHistory) {
          setHistory(freshHistory.map(item => ({
            id: item.id,
            type: item.type,
            orderId: item.order_id,
            amount: Math.abs(item.amount),
            createdAt: item.created_at,
            description: item.type === 'Начисление'
              ? `Кэшбэк за заказ ${item.order_id ? item.order_id.substring(0, 8) : ''}`
              : `Списание бонусов для оплаты заказа ${item.order_id ? item.order_id.substring(0, 8) : ''}`
          })));
        }
      } catch (err) {
        console.error('Failed to spend bonus in Supabase:', err);
      }
    } else {
      const balanceKey = `bonusBalance_${userId}`;
      const historyKey = `bonusHistory_${userId}`;

      const currentBal = getUserBonusBalance(userId);
      const newBal = Math.max(0, currentBal - val);
      localStorage.setItem(balanceKey, String(newBal));

      const currentHistory = getBonusHistory(userId);
      const operation = {
        id: 'bonus_' + Math.floor(100000 + Math.random() * 900000),
        type: 'Списание',
        orderId,
        amount: val,
        createdAt: new Date().toISOString(),
        description: `Списание бонусов для оплаты заказа ${orderId}`
      };

      const newHistory = [operation, ...currentHistory];
      localStorage.setItem(historyKey, JSON.stringify(newHistory));

      if (user && getUserKey(user) === userId) {
        setBalance(newBal);
        setHistory(newHistory);
      }
    }
  };

  return (
    <BonusContext.Provider value={{
      balance,
      history,
      calculateCashback,
      getUserBonusBalance,
      addBonus,
      spendBonus,
      getBonusHistory,
      getUserKey: () => getUserKey(user)
    }}>
      {children}
    </BonusContext.Provider>
  );
};

export const useBonus = () => {
  const context = useContext(BonusContext);
  if (!context) {
    throw new Error('useBonus must be used within a BonusProvider');
  }
  return context;
};

