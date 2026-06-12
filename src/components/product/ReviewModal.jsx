// src/components/product/ReviewModal.jsx
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import Button from '../ui/Button';
import styles from './ReviewModal.module.css';

const ReviewModal = ({ isOpen, onClose, product, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Пожалуйста, выберите оценку от 1 до 5 звезд.');
      return;
    }

    if (!text.trim()) {
      setError('Пожалуйста, введите текст отзыва.');
      return;
    }

    const result = onSubmit(product.id, product.name, rating, text);
    if (result.success) {
      // Clear form and close
      setRating(0);
      setHoveredRating(0);
      setText('');
      onClose();
    } else {
      setError(result.error || 'Не удалось отправить отзыв.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Оставить отзыв о товаре</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.productInfo}>
            <strong>Товар:</strong> {product.name}
          </div>

          {error && <div className={styles.errorAlert}>{error}</div>}

          {/* Stars Rating Row */}
          <div className={styles.ratingGroup}>
            <label className={styles.label}>Ваша оценка *</label>
            <div className={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isHighlighted = hoveredRating >= starValue || (!hoveredRating && rating >= starValue);
                return (
                  <button
                    key={starValue}
                    type="button"
                    className={styles.starBtn}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`Оценить на ${starValue} звезд`}
                  >
                    <Star
                      size={32}
                      className={isHighlighted ? styles.starFilled : styles.starEmpty}
                      fill={isHighlighted ? 'var(--color-warning)' : 'none'}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Field */}
          <div className={styles.formGroup}>
            <label htmlFor="review-text" className={styles.label}>Текст отзыва *</label>
            <textarea
              id="review-text"
              required
              rows="4"
              placeholder="Поделитесь вашим впечатлением от товара..."
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="secondary">
              Отправить отзыв
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
