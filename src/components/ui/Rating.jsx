// src/components/ui/Rating.jsx
import React from 'react';
import { Star } from 'lucide-react';
import styles from './Rating.module.css';

const Rating = ({ value = 5, showValue = true }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className={styles.ratingContainer}>
      {stars.map((star) => {
        const isFilled = value >= star;
        return (
          <Star
            key={star}
            className={`${styles.star} ${isFilled ? styles.filled : styles.empty}`}
          />
        );
      })}
      {showValue && <span className={styles.value}>{value.toFixed(1)}</span>}
    </div>
  );
};

export default Rating;
