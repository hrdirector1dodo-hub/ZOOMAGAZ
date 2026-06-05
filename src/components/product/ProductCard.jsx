// src/components/product/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import Rating from '../ui/Rating';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();
  const { id, name, brand, price, rating, inStock, images } = product;
  
  const isInCart = cart.some(item => item.id === id);
  const isOutOfStock = inStock === 0;
  const isLowStock = inStock > 0 && inStock <= 5;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Determine stock badge text
  let stockBadge = null;
  if (isOutOfStock) {
    stockBadge = <span className={`${styles.stockStatus} ${styles.outOfStock}`}>Нет в наличии</span>;
  } else if (isLowStock) {
    stockBadge = <span className={`${styles.stockStatus} ${styles.lowStock}`}>Мало ({inStock} шт)</span>;
  }

  return (
    <Link to={`/product/${id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {stockBadge}
        <img src={images[0]} alt={name} className={styles.image} loading="lazy" />
      </div>
      
      <div className={styles.info}>
        <span className={styles.brand}>{brand}</span>
        <h3 className={styles.title} title={name}>{name}</h3>
        
        <div className={styles.ratingRow}>
          <Rating value={rating} />
        </div>
        
        <div className={styles.bottomRow}>
          <div className={styles.priceCol}>
            <span className={styles.priceLabel}>Цена</span>
            <span className={styles.price}>{formatPrice(price)}</span>
          </div>
          
          <button 
            className={styles.addButton}
            onClick={handleAdd}
            disabled={isOutOfStock}
            aria-label="Добавить в корзину"
          >
            {isInCart ? <Check size={20} /> : <ShoppingCart size={20} />}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
