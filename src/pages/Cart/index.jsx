// src/pages/Cart/index.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useBonus } from '../../context/BonusContext';
import { formatPrice } from '../../utils/format';
import Button from '../../components/ui/Button';
import ProductImage from '../../components/product/ProductImage';
import { useReviews } from '../../context/ReviewContext';
import styles from './index.module.css';

const Cart = () => {
  const { cart, removeFromCart, clearCart, cartTotal, increaseQuantity, decreaseQuantity } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { balance, spendBonus, addBonus, calculateCashback, getUserKey } = useBonus();
  const { hasReviewCoupon, consumeReviewCoupon } = useReviews();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'card'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bonusesInput, setBonusesInput] = useState('');
  const [appliedBonuses, setAppliedBonuses] = useState(0);
  const [applyCoupon, setApplyCoupon] = useState(false);

  const deliveryThreshold = 2000;
  const deliveryCost = cartTotal >= deliveryThreshold ? 0 : 250;
  const finalTotal = cartTotal + deliveryCost;
  const couponDiscount = applyCoupon && hasReviewCoupon ? 1000 : 0;
  const payableTotal = Math.max(0, finalTotal - appliedBonuses - couponDiscount);

  const handleApplyBonuses = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Для использования бонусов необходимо войти в систему");
      return;
    }
    const val = parseInt(bonusesInput, 10);
    if (isNaN(val) || val < 0) {
      alert("Введите корректное количество бонусов");
      return;
    }
    if (val > balance) {
      alert(`Недостаточно бонусов. Ваш баланс: ${balance}`);
      return;
    }
    if (val > cartTotal) {
      alert(`Нельзя списать больше суммы товаров: ${cartTotal}`);
      return;
    }
    setAppliedBonuses(val);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Для оформления заказа необходимо войти или зарегистрироваться.");
      return;
    }

    if (!formData.name || !formData.phone || !formData.address) {
      alert('Пожалуйста, заполните обязательные поля: ФИО, Телефон и Адрес доставки.');
      return;
    }
    if (!/^[78]\d{10}$/.test(formData.phone)) {
      alert('Введите корректный номер телефона Казахстана. Пример: 87071234567');
      return;
    }

    setIsSubmitting(true);

    const userKey = getUserKey();
    
    const order = await createOrder(user, cart, payableTotal, {
      ...formData,
      couponApplied: applyCoupon && hasReviewCoupon
    });
    const orderId = order ? order.id : 'EP-' + Math.floor(100000 + Math.random() * 900000);

    if (appliedBonuses > 0) {
      await spendBonus(userKey, appliedBonuses, orderId);
    }

    const payableProductsTotal = cartTotal - appliedBonuses;
    const cashback = calculateCashback(payableProductsTotal);
    
    if (cashback > 0) {
      await addBonus(userKey, cashback, orderId, payableProductsTotal);
    }

    if (applyCoupon && hasReviewCoupon) {
      await consumeReviewCoupon();
    }
    
    clearCart();
    setIsSubmitting(false);
    
    let msg = "Заказ успешно оформлен. ";
    if (cashback > 0) {
      msg += `Вам начислено ${cashback} бонусов. `;
    }
    msg += "\nОставьте отзыв о купленном товаре и получите бонусы!";
    alert(msg);
    
    navigate('/profile');
  };

  if (cart.length === 0) {
    return (
      <div className={`${styles.emptyCart} container animate-fade-in`}>
        <ShoppingBag size={64} className={styles.emptyIcon} />
        <h2>Ваша корзина пуста</h2>
        <p>Посмотрите каталог товаров, чтобы найти что-нибудь интересное для вашего питомца.</p>
        <Link to="/catalog">
          <Button variant="primary" size="lg">
            Перейти в каталог <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`${styles.cartPage} container animate-fade-in`}>
      <h1 className={styles.cartTitle}>Корзина</h1>

      <div className={styles.cartLayout}>
        <div className={styles.itemsList}>
          {cart.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemImageWrapper}>
                <ProductImage src={item.images && item.images[0]} alt={item.name} className={styles.itemImg} showText={false} iconSize={24} />
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
                    onClick={() => decreaseQuantity(item.id)}
                    disabled={item.quantity <= 1}
                    aria-label="Уменьшить количество"
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button 
                    className={styles.quantityBtn}
                    onClick={() => increaseQuantity(item.id)}
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
          ))}
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

            {/* Bonuses Section */}
            {!user ? (
              <div className={styles.bonusesSection}>
                <p className={styles.bonusesPrompt}>
                  Войдите, чтобы использовать бонусы для скидки.
                </p>
              </div>
            ) : (
              <div className={styles.bonusesSection}>
                <div className={styles.bonusesRow}>
                  <span>Доступно бонусов:</span>
                  <strong>{balance}</strong>
                </div>
                <div className={styles.bonusesInputGroup}>
                  <input
                    type="number"
                    min="0"
                    max={Math.min(balance, cartTotal)}
                    placeholder="Количество бонусов"
                    value={bonusesInput}
                    onChange={(e) => setBonusesInput(e.target.value)}
                    className={styles.bonusesInput}
                    disabled={appliedBonuses > 0}
                  />
                  {appliedBonuses > 0 ? (
                    <button 
                      type="button"
                      className={styles.bonusesBtnReset}
                      onClick={() => {
                        setAppliedBonuses(0);
                        setBonusesInput('');
                      }}
                    >
                      Сбросить
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className={styles.bonusesBtnApply}
                      onClick={handleApplyBonuses}
                    >
                      Применить
                    </button>
                  )}
                </div>
                {appliedBonuses > 0 && (
                  <div className={styles.bonusesDiscountRow}>
                    <span>Скидка бонусами:</span>
                    <span>-{formatPrice(appliedBonuses)}</span>
                  </div>
                )}
                
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.95rem', color: 'var(--color-primary-jade)', fontWeight: '600' }}>
                    <span>Скидка по купону:</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
              </div>
            )}

            {hasReviewCoupon && (
              <div style={{ margin: '16px 0', padding: '16px', border: '1px dashed var(--color-primary-jade)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: 'var(--color-text-dark)' }}>
                  <input
                    type="checkbox"
                    checked={applyCoupon}
                    onChange={(e) => setApplyCoupon(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-jade)' }}
                  />
                  <span>Применить купон на 1000 ₽</span>
                </label>
              </div>
            )}

            <div className={styles.summaryTotalRow}>
              <span>Итого</span>
              <span className={styles.summaryTotalVal}>{formatPrice(payableTotal)}</span>
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
