// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEMO_USER = {
  id: 'demo-user-1',
  name: 'Дмитрий Петров',
  email: 'demo@ecopet.ru',
  password: 'password123',
  phone: '+7 (999) 123-45-67',
  bonuses: 250,
  createdAt: '2026-05-01',
  orders: [
    {
      id: 'EP-9021',
      date: '2026-05-15',
      total: 3200,
      status: 'Доставлен',
      itemsCount: 3,
      items: [
        { name: 'Натуральный корм для собак EcoBalance Premium', price: 1200, count: 2 },
        { name: 'Экологичная деревянная игрушка «Косточка»', price: 800, count: 1 }
      ]
    },
    {
      id: 'EP-9442',
      date: '2026-06-02',
      total: 1450,
      status: 'В пути',
      itemsCount: 1,
      items: [
        { name: 'Био-шампунь для кошек с алоэ вера', price: 1450, count: 1 }
      ]
    }
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize users and check current session
  useEffect(() => {
    // 1. Ensure demo user is seeded
    const existingUsers = localStorage.getItem('ecopet_users');
    if (!existingUsers) {
      localStorage.setItem('ecopet_users', JSON.stringify([DEMO_USER]));
    } else {
      const parsedUsers = JSON.parse(existingUsers);
      const hasDemo = parsedUsers.some(u => u.email === DEMO_USER.email);
      if (!hasDemo) {
        parsedUsers.push(DEMO_USER);
        localStorage.setItem('ecopet_users', JSON.stringify(parsedUsers));
      }
    }

    // 2. Check active session
    const activeSession = localStorage.getItem('ecopet_session_user');
    if (activeSession) {
      try {
        const sessionUser = JSON.parse(activeSession);
        // Sync user state with database in case of updates
        const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
        const freshUser = usersList.find(u => u.id === sessionUser.id);
        if (freshUser) {
          setUser(freshUser);
        } else {
          setUser(sessionUser);
        }
      } catch (e) {
        console.error('Failed to parse active user session', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
    const matchedUser = usersList.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      const { password: _, ...safeUser } = matchedUser; // omit password
      localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
      setUser(matchedUser);
      return { success: true };
    } else {
      return { success: false, error: 'Неверный адрес почты или пароль' };
    }
  };

  const register = async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
    const emailExists = usersList.some(
      u => u.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (emailExists) {
      return { success: false, error: 'Пользователь с таким email уже зарегистрирован' };
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone || '',
      bonuses: 100, // Welcome bonuses!
      createdAt: new Date().toISOString().split('T')[0],
      orders: []
    };

    usersList.push(newUser);
    localStorage.setItem('ecopet_users', JSON.stringify(usersList));

    const { password: _, ...safeUser } = newUser;
    localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
    setUser(newUser);

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('ecopet_session_user');
    setUser(null);
  };

  const updateProfile = async (updatedFields) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (!user) return { success: false, error: 'Пользователь не авторизован' };

    const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
    const userIndex = usersList.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      return { success: false, error: 'Пользователь не найден' };
    }

    // Update email check (if changed, make sure it's unique)
    if (updatedFields.email && updatedFields.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = usersList.some(
        u => u.email.toLowerCase() === updatedFields.email.toLowerCase() && u.id !== user.id
      );
      if (emailExists) {
        return { success: false, error: 'Этот адрес электронной почты уже используется' };
      }
    }

    const updatedUser = {
      ...usersList[userIndex],
      ...updatedFields
    };

    usersList[userIndex] = updatedUser;
    localStorage.setItem('ecopet_users', JSON.stringify(usersList));

    const { password: _, ...safeUser } = updatedUser;
    localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
    setUser(updatedUser);

    return { success: true };
  };

  const verifyEmailExists = async (email) => {
    // Simulate short network delay
    await new Promise(resolve => setTimeout(resolve, 400));
    const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
    return usersList.some(u => u.email.toLowerCase() === email.toLowerCase());
  };

  const resetPassword = async (email, newPassword) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
    const userIndex = usersList.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      return { success: false, error: 'Пользователь не найден' };
    }

    usersList[userIndex].password = newPassword;
    localStorage.setItem('ecopet_users', JSON.stringify(usersList));

    // If the updated user is currently logged in, sync session
    const activeSession = localStorage.getItem('ecopet_session_user');
    if (activeSession) {
      try {
        const sessionUser = JSON.parse(activeSession);
        if (sessionUser.email.toLowerCase() === email.toLowerCase()) {
          const { password: _, ...safeUser } = usersList[userIndex];
          localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
          setUser(usersList[userIndex]);
        }
      } catch (e) {
        console.error('Failed to sync session user password update', e);
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      loading, 
      login, 
      register, 
      logout, 
      updateProfile,
      verifyEmailExists,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
