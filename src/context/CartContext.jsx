// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('ecopet_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ecopet_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert("Некорректное количество товара");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const requestedTotal = currentQty + parsedQty;
    const maxStock = product.inStock !== undefined ? product.inStock : 999;

    if (requestedTotal > maxStock) {
      alert("Недостаточно товара на складе");
      const addable = maxStock - currentQty;
      if (addable > 0) {
        setCart(prevCart => {
          if (existing) {
            return prevCart.map(item =>
              item.id === product.id ? { ...item, quantity: maxStock } : item
            );
          }
          return [...prevCart, { ...product, quantity: maxStock }];
        });
      }
      return;
    }

    setCart(prevCart => {
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + parsedQty } : item
        );
      }
      return [...prevCart, { ...product, quantity: parsedQty }];
    });
    alert("Товар добавлен в корзину");
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity === undefined || quantity === null || quantity === '') {
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty)) {
      return;
    }

    if (parsedQty <= 0) {
      const existing = cart.find(item => item.id === productId);
      if (existing) {
        if (window.confirm(`Удалить ${existing.name} из корзины?`)) {
          removeFromCart(productId);
        }
      }
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === productId);
      if (!existing) return prevCart;

      const maxStock = existing.inStock !== undefined ? existing.inStock : 999;
      if (parsedQty > maxStock) {
        alert("Недостаточно товара на складе");
        return prevCart.map(item =>
          item.id === productId ? { ...item, quantity: maxStock } : item
        );
      }

      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: parsedQty } : item
      );
    });
  };

  const increaseQuantity = (productId) => {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      updateQuantity(productId, existing.quantity + 1);
    }
  };

  const decreaseQuantity = (productId) => {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      updateQuantity(productId, existing.quantity - 1);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      getCartTotal,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
