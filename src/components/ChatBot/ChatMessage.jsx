// src/components/ChatBot/ChatMessage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Award, ExternalLink } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import styles from './ChatBot.module.css';

const ChatMessage = ({ message }) => {
  const { sender, text, type, products, branches, promotions, timestamp } = message;
  const isBot = sender === 'bot';

  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`${styles.messageWrapper} ${isBot ? styles.botWrapper : styles.userWrapper}`}>
      {isBot && <div className={styles.botAvatar}>🐾</div>}
      <div className={`${styles.messageBubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {text && <div className={styles.messageText}>{text}</div>}

        {/* Structured Products Rendering */}
        {type === 'products' && products && products.length > 0 && (
          <div className={styles.productsContainer}>
            {products.map((product) => (
              <div key={product.id} className={styles.productMiniCard}>
                <div className={styles.productMiniImage}>
                  <img src={product.images?.[0]} alt={product.name} />
                </div>
                <div className={styles.productMiniInfo}>
                  <span className={styles.productMiniCategory}>{product.categoryName || 'Товары'}</span>
                  <h4 className={styles.productMiniName} title={product.name}>{product.name}</h4>
                  <p className={styles.productMiniDesc}>{product.description}</p>
                  <div className={styles.productMiniPriceRow}>
                    <span className={styles.productMiniPrice}>{formatPrice(product.price)}</span>
                    <Link to={`/product/${product.id}`} className={styles.productMiniLink}>
                      Открыть <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Structured Branches Rendering */}
        {type === 'branches' && branches && branches.length > 0 && (
          <div className={styles.branchesContainer}>
            {branches.map((branch) => (
              <div key={branch.id} className={styles.branchMiniCard}>
                <div className={styles.branchHeader}>
                  <strong>📍 {branch.city}</strong> — {branch.address}
                </div>
                <div className={styles.branchDetails}>
                  <div><Phone size={12} style={{ marginRight: '6px' }} /> {branch.phone}</div>
                  <div><Clock size={12} style={{ marginRight: '6px' }} /> {branch.hours}</div>
                </div>
                {branch.features && (
                  <div className={styles.branchFeatures}>
                    {branch.features.map((f, i) => (
                      <span key={i} className={styles.featureBadge}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Structured Promotions Rendering */}
        {type === 'promotions' && promotions && promotions.length > 0 && (
          <div className={styles.promotionsContainer}>
            {promotions.map((promo) => (
              <div key={promo.id} className={styles.promoMiniCard} style={{ borderLeftColor: promo.color || '#00A86B' }}>
                <div className={styles.promoBadge} style={{ backgroundColor: promo.color || '#00A86B' }}>
                  {promo.badge}
                </div>
                <h4 className={styles.promoTitle}>{promo.title}</h4>
                <p className={styles.promoDesc}>{promo.description}</p>
                <div className={styles.promoPeriod}>
                  <Award size={12} style={{ marginRight: '4px' }} /> {promo.period}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.messageTime}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
