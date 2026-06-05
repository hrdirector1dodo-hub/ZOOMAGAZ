// src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes';
import './styles/global.css';

function App() {
  return (
    <Router>
      <CartProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </CartProvider>
    </Router>
  );
}

export default App;
