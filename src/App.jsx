// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BonusProvider } from './context/BonusContext';
import { OrdersProvider } from './context/OrdersContext';
import { ReviewProvider } from './context/ReviewContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <BonusProvider>
          <OrdersProvider>
            <ReviewProvider>
              <CartProvider>
                <MainLayout>
                  <AppRoutes />
                </MainLayout>
              </CartProvider>
            </ReviewProvider>
          </OrdersProvider>
        </BonusProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
