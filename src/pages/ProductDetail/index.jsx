// src/pages/ProductDetail/index.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import Rating from '../../components/ui/Rating';
import Button from '../../components/ui/Button';
import ProductCard from '../../components/product/ProductCard';
import ProductImage from '../../components/product/ProductImage';
import { useReviews } from '../../context/ReviewContext';
import styles from './index.module.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, cart } = useCart();
  const { getReviewsForProduct, getAverageRatingForProduct } = useReviews();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specs'); // 'specs' or 'reviews'

  // Reset states when ID changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantity(1);
    setActiveImageIndex(0);
    
    const fetchProductData = async () => {
      setIsLoading(true);
      const prod = await api.getProductById(id);
      
      if (prod) {
        setProduct(prod);
        
        // Fetch similar products
        const allProducts = await api.getProducts();
        const filtered = allProducts
          .filter(p => p.category === prod.category && p.id !== prod.id)
          .slice(0, 4); // show up to 4 similar items
        setSimilarProducts(filtered);
      } else {
        setProduct(null);
      }
      setIsLoading(false);
    };

    fetchProductData();
  }, [id]);

  const isInCart = useMemo(() => {
    return cart.some(item => item.id === product?.id);
  }, [cart, product]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center', fontSize: '1.2rem', color: 'var(--color-primary-jade)' }}>
        Загрузка товара...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Товар не найден</h2>
        <p style={{ color: 'var(--color-text-light)', marginTop: '8px' }}>К сожалению, запрашиваемый товар не существует или был удален.</p>
        <Link to="/catalog" style={{ marginTop: '24px', display: 'inline-block' }}>
          <Button variant="primary">Вернуться в каталог</Button>
        </Link>
      </div>
    );
  }

  const { name, brand, category, categoryName, price, description, inStock, specs } = product;
  const imageSrc = `/images/products/${product.id}.jpg`;
  const productReviews = getReviewsForProduct(product.id);
  const avgRating = getAverageRatingForProduct(product.id);
  const isOutOfStock = inStock === 0;
  const isLowStock = inStock > 0 && inStock <= 5;

  const handleIncrement = () => {
    if (quantity < inStock) setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCartClick = () => {
    addToCart(product, quantity);
  };

  return (
    <div className={`${styles.productDetail} container animate-fade-in`}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link to="/catalog" className={styles.breadcrumbLink}>Каталог</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link to={`/catalog?category=${category}`} className={styles.breadcrumbLink}>{categoryName}</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span style={{ color: 'var(--color-text-dark)', fontWeight: '600' }}>{name}</span>
      </div>

      <div className={styles.productGrid}>
        {/* Gallery */}
        <div className={styles.galleryCol}>
          <div className={styles.mainImageWrapper}>
            <ProductImage src={imageSrc} alt={name} className={styles.mainImage} iconSize={64} />
          </div>
          
          <div className={styles.thumbnails}>
            {
              <div className={`${styles.thumbnailWrapper} ${styles.thumbnailWrapperActive}`} onClick={() => setActiveImageIndex(0)}>
                <ProductImage src={imageSrc} alt={`${name} thumbnail`} className={styles.thumbnailImg} showText={false} iconSize={24} />
              </div>
            }
          </div>
        </div>

        {/* Info Column */}
        <div className={styles.infoCol}>
          <div className={styles.brandCategory}>
            <span className={styles.brand}>{brand}</span>
            <span className={styles.category}>{categoryName}</span>
          </div>

          <h1 className={styles.title}>{name}</h1>

          <div className={styles.ratingRow}>
            <Rating value={avgRating} />
            <span className={styles.reviewsCount}>({productReviews.length} отзывов покупателей)</span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(price)}</span>
            
            {/* Stock Level Indicator */}
            {isOutOfStock ? (
              <span className={`${styles.stockIndicator} ${styles.outOfStock}`}>● Нет в наличии</span>
            ) : isLowStock ? (
              <span className={`${styles.stockIndicator} ${styles.lowStock}`}>● Мало (осталось {inStock} шт)</span>
            ) : (
              <span className={`${styles.stockIndicator} ${styles.inStock}`}>● В наличии на складе</span>
            )}
          </div>

          <p className={styles.description}>{description}</p>

          {/* Add to Cart Actions */}
          <div className={styles.purchaseSection}>
            <div className={styles.quantitySelector}>
              <button 
                className={styles.quantityBtn} 
                onClick={handleDecrement} 
                disabled={quantity <= 1 || isOutOfStock}
                aria-label="Уменьшить"
              >
                <Minus size={16} />
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button 
                className={styles.quantityBtn} 
                onClick={handleIncrement} 
                disabled={quantity >= inStock || isOutOfStock}
                aria-label="Увеличить"
              >
                <Plus size={16} />
              </button>
            </div>

            <Button 
              size="lg" 
              variant="primary" 
              onClick={handleAddToCartClick}
              disabled={isOutOfStock}
              style={{ flexGrow: 1 }}
            >
              {isInCart ? (
                <>
                  <Check size={20} />
                  Добавлено ({cart.find(i => i.id === product.id)?.quantity} шт)
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Добавить в корзину
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Section: Characteristics / Reviews */}
      <div className={styles.detailsSection}>
        <div className={styles.tabsHeader}>
          <div 
            className={`${styles.tabTitle} ${activeTab === 'specs' ? styles.tabTitleActive : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Характеристики
          </div>
          <div 
            className={`${styles.tabTitle} ${activeTab === 'reviews' ? styles.tabTitleActive : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Отзывы ({productReviews.length})
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'specs' ? (
            <table className={styles.specsTable}>
              <tbody>
                {Object.entries(specs).map(([key, value]) => (
                  <tr key={key} className={styles.specsRow}>
                    <td className={styles.specsKey}>{key}</td>
                    <td className={styles.specsValue}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.reviewsList}>
              {productReviews.map((rev, idx) => (
                <div key={idx} className={styles.reviewItem}>
                  <div className={styles.reviewMeta}>
                    <div>
                      <h4 className={styles.reviewAuthor}>{rev.author}</h4>
                      <Rating value={rev.rating} showValue={false} />
                    </div>
                    <span className={styles.reviewDate}>{rev.date}</span>
                  </div>
                  <p className={styles.reviewText}>{rev.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className={styles.similarSection}>
          <h2 className={styles.similarTitle}>Похожие товары</h2>
          <div className={styles.similarGrid}>
            {similarProducts.map(prod => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
