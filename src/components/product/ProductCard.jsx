// src/components/product/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import Rating from '../ui/Rating';
import ProductImage from './ProductImage';
import { useCart } from '../../context/CartContext';
import { useReviews } from '../../context/ReviewContext';
import { formatPrice } from '../../utils/format';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();
  const { getAverageRatingForProduct } = useReviews();
  const { id, name, brand, price, rating, inStock } = product;
  const imageSrc = `/images/products/${id}.jpg`;
  const avgRating = getAverageRatingForProduct(id) || rating;
  
  const isInCart = cart.some(item => item.id === id);
  const isOutOfStock = inStock === 0;
  const isLowStock = inStock > 0 && inStock <= 5;

  const [quantity, setQuantity] = useState(1);

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < inStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, quantity);
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
        <ProductImage src={imageSrc} alt={name} className={styles.image} />
      </div>
      
      <div className={styles.info}>
        <span className={styles.brand}>{brand}</span>
        <h3 className={styles.title} title={name}>{name}</h3>
        
        <div className={styles.ratingRow}>
          <Rating value={avgRating} />
        </div>
        
        <div className={styles.bottomRow}>
          <div className={styles.priceCol}>
            <span className={styles.priceLabel}>Цена</span>
            <span className={styles.price}>{formatPrice(price)}</span>
          </div>
          <div className={styles.actionsCol}>
            <div className={styles.quantitySelector}>
              <button 
                className={styles.quantityBtn}
                onClick={handleDecrement}
                disabled={quantity <= 1 || isOutOfStock}
                aria-label="Уменьшить количество"
              >
                <Minus size={14} />
              </button>
              <span className={styles.quantityValue}>{isOutOfStock ? 1 : quantity}</span>
              <button 
                className={styles.quantityBtn}
                onClick={handleIncrement}
                disabled={quantity >= inStock || isOutOfStock}
                aria-label="Увеличить количество"
              >
                <Plus size={14} />
              </button>
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
      </div>
    </Link>
  );
};

export default ProductCard;
