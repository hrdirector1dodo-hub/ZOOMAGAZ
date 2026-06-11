// src/pages/NotFound/index.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import styles from './index.module.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <div className={styles.illustrationWrapper}>
          <svg 
            viewBox="0 0 100 100" 
            width="120" 
            height="120" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            className={styles.pawSvg}
          >
            {/* A cute paw print SVG schema */}
            <circle cx="50" cy="55" r="15" fill="var(--color-primary-jade)" stroke="none" />
            <circle cx="28" cy="32" r="7" fill="var(--color-primary-jade)" stroke="none" />
            <circle cx="43" cy="20" r="7" fill="var(--color-primary-jade)" stroke="none" />
            <circle cx="57" cy="20" r="7" fill="var(--color-primary-jade)" stroke="none" />
            <circle cx="72" cy="32" r="7" fill="var(--color-primary-jade)" stroke="none" />
          </svg>
        </div>

        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Страница не найдена</h2>
        <p className={styles.description}>
          К сожалению, такой страницы не существует или она была перемещена.
        </p>

        <div className={styles.actions}>
          <Button variant="primary" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
          <Button variant="outline" onClick={() => navigate('/catalog')}>
            Перейти в каталог товаров
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
