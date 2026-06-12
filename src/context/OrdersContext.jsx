// src/context/OrdersContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const OrdersContext = createContext(null);

const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  let tem;
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M.join(' ');
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) {
    return 'Mobile Device';
  }
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'iOS Device';
  }
  if (/Android/.test(ua)) {
    return 'Android Device';
  }
  return 'Desktop';
};

const getSourceChannel = () => {
  const ua = navigator.userAgent;
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua) || window.innerWidth <= 768;
  return isMobile ? 'mobile' : 'site';
};

export const OrdersProvider = ({ children }) => {
  const { user } = useAuth();
  const [ordersState, setOrdersState] = useState([]);

  const getUserKey = (currentUser) => {
    if (!currentUser) return 'orders_guest';
    return `orders_${currentUser.id || currentUser.email || currentUser.phone || 'guest'}`;
  };

  useEffect(() => {
    if (user) {
      if (isSupabaseConfigured) {
        const fetchOrders = async () => {
          try {
            const { data: orders, error } = await supabase
              .from('orders')
              .select('*, order_items(*, products(*))')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });
              
            if (!error && orders) {
              const formatted = orders.map(order => ({
                id: order.id,
                createdAt: order.created_at,
                status: order.status,
                totalAmount: Number(order.total_amount),
                paymentMethod: order.payment_method,
                address: order.address,
                customer: {
                  name: order.customer_name,
                  phone: order.customer_phone,
                  email: order.customer_email
                },
                items: order.order_items.map(item => ({
                  id: item.product_id,
                  name: item.products?.name || 'Товар',
                  price: Number(item.price),
                  quantity: item.quantity,
                  total: Number(item.total)
                }))
              }));
              setOrdersState(formatted);
            }
          } catch (err) {
            console.error('Failed to fetch orders from database:', err);
          }
        };
        fetchOrders();
      } else {
        const key = getUserKey(user);
        const saved = localStorage.getItem(key);
        if (!saved) {
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
            setOrdersState(seedOrders);
          } else {
            setOrdersState([]);
          }
        } else {
          try {
            setOrdersState(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse user orders', e);
            setOrdersState([]);
          }
        }
      }
    } else {
      setOrdersState([]);
    }
  }, [user]);

  const getUserOrders = (currentUser) => {
    return ordersState;
  };

  const createOrder = async (currentUser, cartItems, totalAmount, customerDetails) => {
    if (!currentUser) return null;
    const orderId = 'EP-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder = {
      id: orderId,
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
        name: customerDetails.name || currentUser.name,
        phone: customerDetails.phone || currentUser.phone || '',
        email: customerDetails.email || currentUser.email || ''
      },
      address: customerDetails.address || '',
      paymentMethod: customerDetails.paymentMethod || 'card'
    };

    if (isSupabaseConfigured) {
      try {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            user_id: currentUser.id,
            status: 'Новый',
            total_amount: totalAmount,
            address: customerDetails.address || '',
            payment_method: customerDetails.paymentMethod || 'card',
            customer_name: customerDetails.name || currentUser.name,
            customer_phone: customerDetails.phone || currentUser.phone || '',
            customer_email: customerDetails.email || currentUser.email || '',
            coupon_applied: customerDetails.couponApplied || false
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        const itemsToInsert = cartItems.map(item => ({
          order_id: orderData.id,
          product_id: Number(item.id),
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(itemsToInsert);

        if (itemsErr) throw itemsErr;

        const transactionId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        
        let paymentData = {
          order_id: orderData.id,
          user_id: currentUser.id,
          amount: totalAmount,
          currency: 'RUB',
          payment_method: customerDetails.paymentMethod || 'card',
          transaction_id: transactionId,
          ip_address: '127.0.0.1',
          device_info: getDeviceInfo(),
          browser_info: `${getBrowserInfo()} (${screenRes})`,
          channel: getSourceChannel()
        };

        if (customerDetails.paymentMethod === 'card') {
          paymentData.status = 'Succeeded';
          paymentData.card_last4 = '4242';
          paymentData.card_brand = 'Visa';
          paymentData.gateway_token = 'tok_' + Math.random().toString(36).substring(2, 12);
        } else {
          paymentData.status = 'Pending';
        }

        const { error: paymentErr } = await supabase
          .from('payments')
          .insert(paymentData);

        if (paymentErr) throw paymentErr;

        // Fetch IP asynchronously
        fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(async (ipData) => {
            if (ipData && ipData.ip) {
              await supabase
                .from('payments')
                .update({ ip_address: ipData.ip })
                .eq('transaction_id', transactionId);
            }
          })
          .catch(err => console.warn('Could not fetch external client IP:', err));

        const dbOrderFormatted = {
          ...newOrder,
          id: orderData.id,
          createdAt: orderData.created_at
        };
        setOrdersState(prev => [dbOrderFormatted, ...prev]);
        return dbOrderFormatted;

      } catch (err) {
        console.error('Failed to create order in database:', err);
        return null;
      }
    } else {
      const key = getUserKey(currentUser);
      const orders = [...ordersState];
      orders.unshift(newOrder);
      localStorage.setItem(key, JSON.stringify(orders));
      setOrdersState(orders);
      return newOrder;
    }
  };

  const getOrderById = (currentUser, orderId) => {
    return ordersState.find(order => order.id === orderId) || null;
  };

  const clearUserOrders = (userIdOrUser) => {
    let key;
    if (typeof userIdOrUser === 'string') {
      key = `orders_${userIdOrUser}`;
    } else {
      key = getUserKey(userIdOrUser);
    }
    localStorage.removeItem(key);
    setOrdersState([]);
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
