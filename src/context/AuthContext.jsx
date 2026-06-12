// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const AuthContext = createContext();

// Hashed 'password123' using bcryptjs (rounds: 10)
const HASHED_DEMO_PASSWORD = '$2a$10$wYskc4Bf91UePj/K0/57H.fN2R85wX1m7sFzNsw019L84y5qE6ZfK';

const DEMO_USER = {
  id: 'demo-user-1',
  name: 'Дмитрий Петров',
  email: 'demo@ecopet.ru',
  password: HASHED_DEMO_PASSWORD,
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

// Formats a Supabase user object into the structure expected by the frontend
const formatSupabaseUser = (sbUser, profile) => {
  if (!sbUser) return null;
  return {
    id: sbUser.id,
    name: profile?.name || sbUser.user_metadata?.name || sbUser.email.split('@')[0],
    email: sbUser.email,
    phone: profile?.phone || sbUser.user_metadata?.phone || '',
    bonuses: profile?.bonuses !== undefined ? profile.bonuses : (sbUser.user_metadata?.bonuses || 100),
    reviewPoints: profile?.review_points !== undefined ? profile.review_points : 0,
    role: profile?.role || 'user',
    createdAt: sbUser.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    orders: []
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and check current session
  useEffect(() => {
    if (isSupabaseConfigured) {
      const fetchProfile = async (userId) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (error) {
            console.error('Error fetching profile from DB:', error.message);
            return null;
          }
          return data;
        } catch (err) {
          console.error('Error fetching profile:', err);
          return null;
        }
      };

      // 1. Check current Supabase session
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(formatSupabaseUser(session.user, profile));
        }
        setLoading(false);
      });

      // 2. Listen to active session changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(formatSupabaseUser(session.user, profile));
        } else {
          setUser(null);
        }
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    } else {
      // --- Local Storage fallback mode ---
      
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

      // 2. RUN PASSWORD MIGRATION (Convert plain-text localStorage passwords to bcrypt hashes)
      const freshUsers = localStorage.getItem('ecopet_users');
      if (freshUsers) {
        try {
          const parsed = JSON.parse(freshUsers);
          let migrated = false;
          const migratedList = parsed.map(u => {
            // Check if password exists and is not already a bcrypt hash
            if (u.password && !u.password.startsWith('$2a$') && !u.password.startsWith('$2b$')) {
              u.password = bcrypt.hashSync(u.password, 10);
              migrated = true;
            }
            return u;
          });
          if (migrated) {
            localStorage.setItem('ecopet_users', JSON.stringify(migratedList));
          }
        } catch (e) {
          console.error('Failed to run password security migration', e);
        }
      }

      // 3. Restore session
      const activeSession = localStorage.getItem('ecopet_session_user');
      if (activeSession) {
        try {
          const sessionUser = JSON.parse(activeSession);
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
    }
  }, []);

  const login = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let errorMsg = error.message;
        if (errorMsg === 'Invalid login credentials') {
          errorMsg = 'Неверный адрес почты или пароль';
        }
        return { success: false, error: errorMsg };
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      setUser(formatSupabaseUser(data.user, profile));
      return { success: true };
    } else {
      // Local Mode
      await new Promise(resolve => setTimeout(resolve, 600));

      const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
      const matchedUser = usersList.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (matchedUser && bcrypt.compareSync(password, matchedUser.password)) {
        const { password: _, ...safeUser } = matchedUser; // omit password
        localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
        setUser(matchedUser);
        return { success: true };
      } else {
        return { success: false, error: 'Неверный адрес почты или пароль' };
      }
    }
  };

  const register = async (userData) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone || '',
            bonuses: 100,
            orders: []
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      setUser(formatSupabaseUser(data.user, profile));
      return { success: true };
    } else {
      // Local Mode
      await new Promise(resolve => setTimeout(resolve, 800));

      const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
      const emailExists = usersList.some(
        u => u.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (emailExists) {
        return { success: false, error: 'Пользователь с таким email уже зарегистрирован' };
      }

      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      const newUser = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone || '',
        bonuses: 100, // Welcome bonuses
        createdAt: new Date().toISOString().split('T')[0],
        orders: []
      };

      usersList.push(newUser);
      localStorage.setItem('ecopet_users', JSON.stringify(usersList));

      const { password: _, ...safeUser } = newUser;
      localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
      setUser(newUser);

      return { success: true };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      localStorage.removeItem('ecopet_session_user');
      setUser(null);
    }
  };

  const updateProfile = async (updatedFields) => {
    if (!user) return { success: false, error: 'Пользователь не авторизован' };

    if (isSupabaseConfigured) {
      const authUpdates = {};
      if (updatedFields.email) authUpdates.email = updatedFields.email;
      if (updatedFields.password) authUpdates.password = updatedFields.password;
      
      if (Object.keys(authUpdates).length > 0) {
        const { error } = await supabase.auth.updateUser(authUpdates);
        if (error) return { success: false, error: error.message };
      }

      const profileUpdates = {};
      if (updatedFields.name) profileUpdates.name = updatedFields.name;
      if (updatedFields.phone) profileUpdates.phone = updatedFields.phone;

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
        if (error) return { success: false, error: error.message };
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(formatSupabaseUser(authUser, profile));
      return { success: true };
    } else {
      // Local Mode
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
      const userIndex = usersList.findIndex(u => u.id === user.id);

      if (userIndex === -1) {
        return { success: false, error: 'Пользователь не найден' };
      }

      // Check email uniqueness if email has changed
      if (updatedFields.email && updatedFields.email.toLowerCase() !== user.email.toLowerCase()) {
        const emailExists = usersList.some(
          u => u.email.toLowerCase() === updatedFields.email.toLowerCase() && u.id !== user.id
        );
        if (emailExists) {
          return { success: false, error: 'Этот адрес электронной почты уже используется' };
        }
      }

      const updates = { ...updatedFields };
      // Hash password if updated
      if (updates.password) {
        updates.password = bcrypt.hashSync(updates.password, 10);
      }

      const updatedUser = {
        ...usersList[userIndex],
        ...updates
      };

      usersList[userIndex] = updatedUser;
      localStorage.setItem('ecopet_users', JSON.stringify(usersList));

      const { password: _, ...safeUser } = updatedUser;
      localStorage.setItem('ecopet_session_user', JSON.stringify(safeUser));
      setUser(updatedUser);

      return { success: true };
    }
  };

  const verifyEmailExists = async (email) => {
    if (isSupabaseConfigured) {
      // Supabase does not support direct verification queries without admin auth keys,
      // but we return true as a default response, since error will be handled during auth actions.
      return true;
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
      return usersList.some(u => u.email.toLowerCase() === email.toLowerCase());
    }
  };

  const resetPassword = async (email, newPassword) => {
    if (isSupabaseConfigured) {
      // Updates password for currently authenticated user session
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } else {
      // Local Mode
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const usersList = JSON.parse(localStorage.getItem('ecopet_users') || '[]');
      const userIndex = usersList.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
        return { success: false, error: 'Пользователь не найден' };
      }

      usersList[userIndex].password = bcrypt.hashSync(newPassword, 10);
      localStorage.setItem('ecopet_users', JSON.stringify(usersList));

      // Sync active session if necessary
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
    }
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
