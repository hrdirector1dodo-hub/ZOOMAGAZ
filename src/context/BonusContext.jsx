// src/context/BonusContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
    } else {
      setBalance(0);
      setHistory([]);
    }
  }, [user]);

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

  const addBonus = (userId, amount, orderId, orderTotal) => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return;

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

    // Update state if it's the current user
    if (user && getUserKey(user) === userId) {
      setBalance(newBal);
      setHistory(newHistory);
    }
  };

  const spendBonus = (userId, amount, orderId) => {
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return;

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
      orderTotal: 0,
      amount: val,
      createdAt: new Date().toISOString(),
      description: `Списание бонусов для оплаты заказа ${orderId}`
    };

    const newHistory = [operation, ...currentHistory];
    localStorage.setItem(historyKey, JSON.stringify(newHistory));

    // Update state if it's the current user
    if (user && getUserKey(user) === userId) {
      setBalance(newBal);
      setHistory(newHistory);
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
