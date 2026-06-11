// src/pages/Cart/index.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import Button from '../../components/ui/Button';
import styles from './index.module.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  // Checkout Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'card'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Delivery Calculations
  const deliveryThreshold = 2000;
  const deliveryCost = cartTotal >= deliveryThreshold ? 0 : 250;
  const finalTotal = cartTotal + deliveryCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, name: value }));
  };

  const handleFieldChange = (field, value) => {
    let finalValue = value;
    if (field === 'phone') {
      let val = value.replace(/\D/g, '');
      if (val.startsWith('7') && val.length === 11) {
        val = '8' + val.slice(1);
      } else if (val.length === 10 && (val.startsWith('70') || val.startsWith('77') || val.startsWith('74') || val.startsWith('78'))) {
        val = '8' + val;
      }
      if (val.length > 11) {
        val = val.slice(0, 11);
      }
      finalValue = val;
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Пожалуйста, заполните обязательные поля: ФИО, Телефон и Адрес доставки.');
      return;
    }
    if (!/^[78]\d{10}$/.test(formData.phone)) {
      alert('Введите корректный номер телефона Казахстана. Пример: 87071234567');
      return;
    }

    setIsSubmitting(true);

    // Simulate API request to save order
    setTimeout(() => {
      const generatedId = 'EP-' + Math.floor(100000 + Math.random() * 900000);
      setOrderId(generatedId);
      clearCart();
      setIsSubmitting(false);
    }, 1000);
  };

  // If order was successfully placed
  if (orderId) {
    return (
      <div className="container animate-fade-in">
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} />
          </div>
          <h2 className={styles.successTitle}>Заказ успешно оформлен!</h2>
          <p className={styles.successText}>
            Спасибо за покупку в EcoPet! Наш менеджер свяжется с вами в течение 15 минут для подтверждения заказа и согласования времени доставки.
          </p>
          <div>
            <span>Номер вашего заказа:</span>
            <div className={styles.orderId}>{orderId}</div>
          </div>
          <Link to="/catalog" style={{ marginTop: '12px' }}>
            <Button variant="primary" size="lg">
              Продолжить покупки
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cart.length === 0) {
    return (
      <div className="container animate-fade-in">
        <div className={styles.emptyCart}>
          <div style={{ fontSize: '4rem' }}>🛒</div>
          <h2 className={styles.emptyTitle}>Ваша корзина пуста</h2>
          <p className={styles.emptyText}>
            Похоже, вы еще не добавили ни одного товара в корзину. Перейдите в каталог, чтобы выбрать качественные и экологичные товары для своего любимого питомца!
          </p>
          <Link to="/catalog">
            <Button variant="primary" size="lg">
              Перейти в каталог
              <ArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.cartPage} container animate-fade-in`}>
      <h1 className={styles.cartTitle}>Корзина</h1>

      <div className={styles.cartLayout}>
        {/* Left: Cart Items List */}
        <div className={styles.itemsList}>
          {cart.map((item) => {
            const isLowStock = item.inStock > 0 && item.inStock <= 5;
            return (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImageWrapper}>
                  <img src={item.images[0]} alt={item.name} className={styles.itemImg} />
                </div>
                
                <div className={styles.itemDetails}>
                  <span className={styles.itemBrand}>{item.brand}</span>
                  <Link to={`/product/${item.id}`} className={styles.itemName}>{item.name}</Link>
                  <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                </div>

                <div className={styles.itemActions}>
                  {/* Quantity selector */}
                  <div className={styles.quantitySelector}>
                    <button 
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Уменьшить количество"
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.quantityValue}>{item.quantity}</span>
                    <button 
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.inStock}
                      aria-label="Увеличить количество"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span style={{ fontWeight: '800', fontSize: '1.2rem', minWidth: '90px', textAlign: 'right' }}>
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button 
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Удалить товар"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary & Checkout Form */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Сумма заказа</h2>
            
            <div className={styles.summaryRow}>
              <span>Товары ({cart.reduce((sum, i) => sum + i.quantity, 0)} шт)</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span>Доставка</span>
              <span>{deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost)}</span>
            </div>
            
            {deliveryCost > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-primary-jade)', marginTop: '-8px', marginBottom: '16px' }}>
                Добавьте товаров еще на {formatPrice(deliveryThreshold - cartTotal)} для бесплатной доставки!
              </p>
            )}

            <div className={styles.summaryTotalRow}>
              <span>Итого</span>
              <span className={styles.summaryTotalVal}>{formatPrice(finalTotal)}</span>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className={styles.checkoutForm}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '12px' }}>Данные покупателя</h3>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>ФИО *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Иванов Иван Иванович"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Телефон *</label>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  placeholder="87071234567"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={styles.input}
                />
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Формат: 87071234567
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email (необязательно)</label>
                <input 
                  type="email" 
                  placeholder="example@mail.ru"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Адрес доставки *</label>
                <input 
                  type="text" 
                  required
                  placeholder="г. Москва, ул. Ленина, д. 5, кв. 10"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Способ оплаты</label>
                <select 
                  value={formData.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                  className={styles.select}
                >
                  <option value="card">Картой на сайте</option>
                  <option value="cash">При получении (наличные/карта)</option>
                </select>
              </div>

              <Button 
                type="submit" 
                variant="secondary" 
                size="lg" 
                fullWidth 
                style={{ marginTop: '12px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
