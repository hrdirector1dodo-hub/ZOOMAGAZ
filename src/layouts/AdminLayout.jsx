// src/layouts/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <h2 className={styles.title}>Админ‑панель</h2>
        <nav className={styles.nav}>
          <NavLink to="/admin" end className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Дашборд</NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Товары</NavLink>
          <NavLink to="/admin/promotions" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Промо</NavLink>
          <NavLink to="/admin/articles" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Статьи</NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Заказы/Запросы</NavLink>
          <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? styles.activeLink : styles.link}>Отзывы</NavLink>
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>{/* optional dynamic header */}Админ‑панель</h1>
        </header>
        <section className={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
