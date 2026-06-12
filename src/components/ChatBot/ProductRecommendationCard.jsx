// src/components/ChatBot/ProductRecommendationCard.jsx
import React from 'react';
import { ShoppingCart, Star, TrendingDown } from 'lucide-react';
import styles from './ProductRecommendationCard.module.css';

const ProductRecommendationCard = ({ product, onAddToCart }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.title}>{product.name}</h4>
        {product.discount > 0 && (
          <span className={styles.discount}>-{product.discount}%</span>
        )}
      </div>

      <p className={styles.description}>{product.description}</p>

      <div className={styles.benefits}>
        {product.benefits && product.benefits.slice(0, 2).map((benefit, idx) => (
          <span key={idx} className={styles.benefit}>
            ✓ {benefit}
          </span>
        ))}
      </div>

      <div className={styles.reasons}>
        {product.explanations && product.explanations.slice(0, 2).map((reason, idx) => (
          <small key={idx} className={styles.reason}>
            • {reason}
          </small>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.priceSection}>
          <div className={styles.price}>
            <strong>{product.price}₽</strong>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>{product.originalPrice}₽</span>
            )}
          </div>
          <div className={styles.rating}>
            <Star size={14} fill="gold" color="gold" />
            {product.rating}
          </div>
        </div>

        <div className={styles.actions}>
          {product.inStock > 0 ? (
            <button
              className={styles.addButton}
              onClick={() => onAddToCart?.(product)}
              title="Добавить в корзину"
            >
              <ShoppingCart size={16} />
              <span>В корзину</span>
            </button>
          ) : (
            <span className={styles.outOfStock}>Нет в наличии</span>
          )}
        </div>
      </div>

      {product.inStock > 0 && (
        <div className={styles.stock}>
          В наличии: {product.inStock} шт.
        </div>
      )}
    </div>
  );
};

export default ProductRecommendationCard;
