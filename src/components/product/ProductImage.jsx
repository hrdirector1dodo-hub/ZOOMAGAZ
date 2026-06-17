// src/components/product/ProductImage.jsx
import React, { useState, useEffect } from 'react';
import { Image } from 'lucide-react';
import { logImageError } from '../../utils/imageLogger';
import styles from './ProductImage.module.css';

const ProductImage = ({ src, alt, className, containerClassName, iconSize = 40, showText = true, productId = null, productName = '' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    // If the source image is missing or failed to load, try the product placeholder.
    const placeholderPath = '/images/products/placeholder.png';
    // If we are already trying the placeholder and it also fails, fall back to the SVG.
    if (src && src.includes('placeholder.png')) {
      // SVG placeholder (original implementation)
      return (
        <div className={`${styles.placeholderContainer} ${containerClassName || ''}`}>
          <Image size={iconSize} className={styles.placeholderIcon} />
          {showText && <span className={styles.placeholderText}>Изображение скоро появится</span>}
        </div>
      );
    }
    return (
      <img
        src={placeholderPath}
        alt={alt || 'Placeholder'}
        className={className}
        loading="lazy"
        onError={() => {
          // If placeholder image fails, trigger re‑render which will hit the SVG fallback above.
          setHasError(true);
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Изображение товара"}
      className={className}
      onError={() => {
        logImageError(src, productId, productName || alt);
        setHasError(true);
      }}
      loading="lazy"
    />
  );
};

export default ProductImage;
