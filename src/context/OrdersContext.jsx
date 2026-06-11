// src/context/OrdersContext.jsx
import React, { createContext, useContext } from 'react';

const OrdersContext = createContext(null);

export const OrdersProvider = ({ children }) => {
  const getUserKey = (user) => {
    if (!user) return 'orders_guest';
    return `orders_${user.id || user.email || user.phone || 'guest'}`;
  };

  const getUserOrders = (user) => {
    if (!user) return [];
    const key = getUserKey(user);
    const saved = localStorage.getItem(key);

    if (!saved) {
      // Seed orders for the demo user
      if (user.id === 'demo-user-1' || user.email === 'demo@ecopet.ru') {
        const seedOrders = [
          {
            id: 'EP-9021',
            createdAt: '2026-05-15T12:00:00.000Z',
            items: [
              { id: 'prod-1', name: 'Натуральный корм для собак EcoBalance Premium', price: 1200, quantity: 2, total: 2400 },
              { id: 'prod-2', name: 'Экологичная деревянная игрушка «Косточка»', price: 800, quantity: 1, total: 800 }
            ],
            totalAmount: 3200,
            status: 'Завершен',
            customer: {
              name: 'Дмитрий Петров',
              phone: '+7 (999) 123-45-67',
              email: 'demo@ecopet.ru'
            },
            address: 'г. Москва, ул. Ленина, д. 5',
            paymentMethod: 'card'
          },
          {
            id: 'EP-9442',
            createdAt: '2026-06-02T12:00:00.000Z',
            items: [
              { id: 'prod-3', name: 'Био-шампунь для кошек с алоэ вера', price: 1450, quantity: 1, total: 1450 }
            ],
            totalAmount: 1450,
            status: 'В обработке',
            customer: {
              name: 'Дмитрий Петров',
              phone: '+7 (999) 123-45-67',
              email: 'demo@ecopet.ru'
            },
            address: 'г. Москва, ул. Ленина, д. 5',
            paymentMethod: 'card'
          }
        ];
        localStorage.setItem(key, JSON.stringify(seedOrders));
        return seedOrders;
      }
      return [];
    }

    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse user orders', e);
      return [];
    }
  };

  const createOrder = (user, cartItems, totalAmount, customerDetails) => {
    if (!user) return null;
    const key = getUserKey(user);
    const orders = getUserOrders(user);

    const newOrder = {
      id: 'EP-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      })),
      totalAmount,
      status: 'Новый',
      customer: {
        name: customerDetails.name || user.name,
        phone: customerDetails.phone || user.phone || '',
        email: customerDetails.email || user.email || ''
      },
      address: customerDetails.address || '',
      paymentMethod: customerDetails.paymentMethod || 'card'
    };

    orders.unshift(newOrder);
    localStorage.setItem(key, JSON.stringify(orders));
    return newOrder;
  };

  const getOrderById = (user, orderId) => {
    const orders = getUserOrders(user);
    return orders.find(order => order.id === orderId) || null;
  };

  const clearUserOrders = (userIdOrUser) => {
    let key;
    if (typeof userIdOrUser === 'string') {
      key = `orders_${userIdOrUser}`;
    } else {
      key = getUserKey(userIdOrUser);
    }
    localStorage.removeItem(key);
  };

  return (
    <OrdersContext.Provider value={{
      getUserOrders,
      createOrder,
      getOrderById,
      clearUserOrders
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
