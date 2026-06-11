// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider } from './context/OrdersContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrdersProvider>
          <CartProvider>
            <MainLayout>
              <AppRoutes />
            </MainLayout>
          </CartProvider>
        </OrdersProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
