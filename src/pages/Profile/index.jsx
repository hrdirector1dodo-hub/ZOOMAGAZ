// src/pages/Profile/index.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Gift, ShoppingBag, ChevronDown, ChevronUp, Save, LogOut, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useBonus } from '../../context/BonusContext';
import { useReviews } from '../../context/ReviewContext';
import Button from '../../components/ui/Button';
import ReviewModal from '../../components/product/ReviewModal';
import ProductImage from '../../components/product/ProductImage';
import styles from './index.module.css';

const Profile = () => {
  const { user, updateProfile, logout, loading: authLoading } = useAuth();
  const { getUserOrders } = useOrders();
  const { balance: bonusBalance, history: bonusHistory } = useBonus();
  const {
    reviewPoints,
    hasReviewCoupon,
    addReview,
    hasReviewedProduct,
    getProductsWaitingForReview
  } = useReviews();

  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const waitingProducts = getProductsWaitingForReview();

  const handleOpenReviewModal = (product) => {
    setReviewProduct(product);
    setIsReviewModalOpen(true);
  };

  const getReviewDeclension = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 19) {
      return 'отзывов';
    }
    if (mod10 === 1) {
      return 'отзыв';
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return 'отзыва';
    }
    return 'отзывов';
  };

  // Load orders
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders(getUserOrders(user));
    }
  }, [user, getUserOrders]);

  // Redirect to home if not logged in and not loading
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'settings'
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state with user data
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className={styles.loadingContainer}>
        <span className={styles.spinner}></span>
      </div>
    );
  }

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email) {
      setError('Имя и email обязательны для заполнения');
      return;
    }

    if (phone && !/^[78]\d{10}$/.test(phone)) {
      setError('Введите корректный номер телефона Казахстана. Пример: 87071234567');
      return;
    }

    // Password validation if they input a new one
    if (password) {
      if (password.length < 6) {
        setError('Новый пароль должен быть не менее 6 символов');
        return;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = { name, email, phone };
      if (password) {
        updateData.password = password;
      }
      
      const result = await updateProfile(updateData);
      if (result.success) {
        setSuccess('Профиль успешно обновлен!');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error);
      }
    } catch {
      setError('Не удалось обновить профиль. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.profilePage} container animate-fade-in`}>
      {/* Header Banner Section */}
      <div className={styles.banner}>
        <div className={styles.avatarCol}>
          <div className={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.bannerMeta}>
            <h1 className={styles.userName}>{user.name}</h1>
            <p className={styles.userJoined}>
              <Calendar size={14} />
              <span>На сайте с {user.createdAt || '05.06.2026'}</span>
            </p>
          </div>
        </div>

        {/* Eco Wallet Widget */}
        <div className={styles.bonusCard}>
          <div className={styles.bonusHeader}>
            <Gift size={20} className={styles.bonusIcon} />
            <span>Бонусный баланс EcoPet</span>
          </div>
          <div className={styles.bonusCount}>{bonusBalance}</div>
          <p className={styles.bonusSub}>1 бонус = 1 рубль/тенге скидки</p>
          <div className={styles.bonusTip}>
            Начисляется кэшбэк 1% за заказы от 10 000 ₽.
          </div>
        </div>

        {/* Review Progress Widget */}
        <div className={`${styles.bonusCard} ${styles.reviewBonusCard} ${hasReviewCoupon ? styles.couponActive : ''}`}>
          {hasReviewCoupon ? (
            <div className={styles.couponActiveContent}>
              <div className={styles.bonusHeader}>
                <Gift size={20} className={styles.couponIcon} />
                <span>Активный купон</span>
              </div>
              <div className={styles.couponAmount}>1 000 ₽</div>
              <p className={styles.couponSub}>Готов к использованию!</p>
              <div className={styles.couponTip}>
                Скидка применена в корзине.
              </div>
            </div>
          ) : (
            <div className={styles.reviewProgressContent}>
              <div className={styles.bonusHeader}>
                <Star size={20} className={styles.starIcon} />
                <span>Отзывы за бонусы</span>
              </div>
              <div className={styles.progressStatus}>
                <span className={styles.progressCountText}>{reviewPoints} / 10</span>
                <span className={styles.progressLabel}>отзывов</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${(reviewPoints / 10) * 100}%` }}
                ></div>
              </div>
              <p className={styles.progressSub}>
                Еще {10 - reviewPoints} {getReviewDeclension(10 - reviewPoints)} до купона на 1000 ₽
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Nav */}
        <aside className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navBtn} ${activeTab === 'orders' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('orders')}
              type="button"
            >
              <ShoppingBag size={18} />
              <span>Мои заказы</span>
              {orders && orders.length > 0 && (
                <span className={styles.badge}>{orders.length}</span>
              )}
            </button>
            <button 
              className={`${styles.navBtn} ${activeTab === 'bonuses' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('bonuses')}
              type="button"
            >
              <Gift size={18} />
              <span>Мои бонусы</span>
            </button>
            <button 
              className={`${styles.navBtn} ${activeTab === 'settings' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveTab('settings')}
              type="button"
            >
              <User size={18} />
              <span>Настройки профиля</span>
            </button>
            <div className={styles.sidebarSeparator}></div>
            <button 
              className={`${styles.navBtn} ${styles.logoutBtn}`}
              onClick={() => {
                logout();
                navigate('/');
              }}
              type="button"
            >
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className={styles.content}>
          {activeTab === 'orders' ? (
            <div className={styles.tabContent}>
              {/* "Товары, ожидающие отзыва" block */}
              {waitingProducts.length > 0 && (
                <div className={styles.waitingBlock}>
                  <h3 className={styles.waitingTitle}>
                    Товары, ожидающие отзыва
                    <span className={styles.waitingBadge}>{waitingProducts.length}</span>
                  </h3>
                  <div className={styles.waitingGrid}>
                    {waitingProducts.map((product) => (
                      <div key={product.id} className={styles.waitingCard}>
                        <div className={styles.waitingProductInfo}>
                          <div className={styles.waitingImageWrapper}>
                            <ProductImage 
                              src={product.images && product.images[0]} 
                              alt={product.name} 
                              className={styles.waitingImage}
                              iconSize={20}
                              showText={false}
                            />
                          </div>
                          <div className={styles.waitingMeta}>
                            <span className={styles.waitingBrand}>{product.brand || 'EcoPet'}</span>
                            <span className={styles.waitingName} title={product.name}>{product.name}</span>
                          </div>
                        </div>
                        <button 
                          className={styles.reviewBtn}
                          onClick={() => handleOpenReviewModal(product)}
                          type="button"
                        >
                          Оставить отзыв
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h2 className={styles.contentTitle}>История заказов</h2>
              {!orders || orders.length === 0 ? (
                <div className={styles.emptyOrders}>
                  <ShoppingBag size={48} className={styles.emptyIcon} />
                  <h3>У вас пока нет заказов</h3>
                  <p>Перейдите в наш каталог, чтобы выбрать качественные и экологичные товары для своего любимого питомца!</p>
                  <Button variant="secondary" onClick={() => navigate('/catalog')}>
                    Перейти в каталог
                  </Button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {orders.map((order) => {
                    const orderDate = new Date(order.createdAt || order.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    let statusClass = styles.statusNew;
                    if (order.status === 'Завершен' || order.status === 'Доставлен') {
                      statusClass = styles.statusCompleted;
                    } else if (order.status === 'В обработке' || order.status === 'В пути') {
                      statusClass = styles.statusProcessing;
                    } else if (order.status === 'Отменен') {
                      statusClass = styles.statusCancelled;
                    }

                    const totalItems = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || item.count || 0), 0) : 0;
                    const totalVal = order.totalAmount || order.total || 0;

                    return (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHeader} onClick={() => toggleOrder(order.id)}>
                          <div className={styles.orderMeta}>
                            <span className={styles.orderId}>Заказ #{order.id}</span>
                            <span className={styles.orderDate}>{orderDate}</span>
                          </div>
                          <div className={styles.orderInfo}>
                            <span className={styles.orderTotal}>{totalVal.toLocaleString()} ₽</span>
                            <span className={`${styles.orderStatus} ${statusClass}`}>
                              {order.status}
                            </span>
                            <button 
                              className={styles.detailsBtn} 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrder(order.id);
                              }}
                              type="button"
                            >
                              <span>Подробнее</span>
                              {expandedOrders[order.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {expandedOrders[order.id] && (
                          <div className={styles.orderDetail}>
                            <div className={styles.orderDetailHeader}>Информация о доставке и оплате:</div>
                            <div className={styles.orderInfoGrid}>
                              <div className={styles.infoBlock}>
                                <strong>Получатель:</strong> {order.customer?.name || user.name}
                              </div>
                              <div className={styles.infoBlock}>
                                <strong>Телефон:</strong> {order.customer?.phone || user.phone || 'Не указан'}
                              </div>
                              {order.customer?.email && (
                                <div className={styles.infoBlock}>
                                  <strong>Email:</strong> {order.customer.email}
                                </div>
                              )}
                              {order.paymentMethod && (
                                <div className={styles.infoBlock}>
                                  <strong>Способ оплаты:</strong> {order.paymentMethod === 'card' ? 'Картой на сайте' : 'При получении'}
                                </div>
                              )}
                              {order.address && (
                                <div className={styles.infoBlock} style={{ gridColumn: 'span 2' }}>
                                  <strong>Адрес доставки:</strong> {order.address}
                                </div>
                              )}
                            </div>

                            <div className={styles.orderDetailHeader} style={{ marginTop: '20px' }}>Состав заказа ({totalItems} шт):</div>
                            <div className={styles.orderItems}>
                              {order.items && order.items.map((item, idx) => {
                                const qty = item.quantity || item.count || 1;
                                const itemPrice = item.price || 0;
                                const itemTotal = item.total || (itemPrice * qty);
                                return (
                                  <div key={idx} className={styles.orderItem}>
                                    <div className={styles.orderItemLeft}>
                                      <div className={styles.orderItemName}>{item.name}</div>
                                      <div className={styles.orderItemQtyPrice}>
                                        {qty} шт x {itemPrice.toLocaleString()} ₽
                                      </div>
                                    </div>
                                    <div className={styles.orderItemRight}>
                                      <span className={styles.orderItemTotalVal}>{itemTotal.toLocaleString()} ₽</span>
                                      {hasReviewedProduct(item.id) ? (
                                        <span className={styles.reviewCompletedBadge}>Отзыв оставлен</span>
                                      ) : (
                                        <button 
                                          className={styles.itemReviewBtn}
                                          onClick={() => handleOpenReviewModal({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            images: []
                                          })}
                                          type="button"
                                        >
                                          Оставить отзыв
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className={styles.orderDetailTotal}>
                              <span>Итоговая сумма заказа:</span>
                              <span className={styles.orderTotalAmount}>{totalVal.toLocaleString()} ₽</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'bonuses' ? (
            <div className={styles.tabContent}>
              <h2 className={styles.contentTitle}>Мои бонусы</h2>
              
              {/* Bonuses Stats Grid */}
              <div className={styles.bonusesStatsGrid}>
                <div className={styles.bonusStatCard}>
                  <span className={styles.statLabel}>Текущий баланс</span>
                  <span className={styles.statVal} style={{ color: 'var(--color-primary-jade)' }}>
                    {bonusBalance.toLocaleString()} ₽
                  </span>
                </div>
                <div className={styles.bonusStatCard}>
                  <span className={styles.statLabel}>Всего начислено</span>
                  <span className={styles.statVal}>
                    {bonusHistory
                      .filter(op => op.type === 'Начисление')
                      .reduce((sum, op) => sum + op.amount, 0)
                      .toLocaleString()} ₽
                  </span>
                </div>
                <div className={styles.bonusStatCard}>
                  <span className={styles.statLabel}>Всего списано</span>
                  <span className={styles.statVal} style={{ color: 'var(--color-danger)' }}>
                    {bonusHistory
                      .filter(op => op.type === 'Списание')
                      .reduce((sum, op) => sum + op.amount, 0)
                      .toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* History Table */}
              <h3 className={styles.bonusesHistoryTitle}>История операций</h3>
              {bonusHistory.length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>У вас пока нет операций с бонусами.</p>
              ) : (
                <div className={styles.historyTableContainer}>
                  <table className={styles.historyTable}>
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Тип операции</th>
                        <th>Заказ</th>
                        <th>Сумма заказа</th>
                        <th>Бонусы</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonusHistory.map((op) => {
                        const dateStr = new Date(op.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const isEarn = op.type === 'Начисление';
                        return (
                          <tr key={op.id}>
                            <td>{dateStr}</td>
                            <td>
                              <span className={isEarn ? styles.opEarnBadge : styles.opSpendBadge}>
                                {op.type}
                              </span>
                            </td>
                            <td>{op.orderId}</td>
                            <td>{op.orderTotal > 0 ? `${op.orderTotal.toLocaleString()} ₽` : '—'}</td>
                            <td className={isEarn ? styles.amountEarn : styles.amountSpend}>
                              {isEarn ? `+${op.amount}` : `-${op.amount}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.tabContent}>
              <h2 className={styles.contentTitle}>Настройки личного кабинета</h2>
              
              {error && <div className={styles.errorAlert}>{error}</div>}
              {success && <div className={styles.successAlert}>{success}</div>}

              <form onSubmit={handleUpdateProfile} className={styles.settingsForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-name" className={styles.label}>Имя или псевдоним *</label>
                    <div className={styles.inputWrapper}>
                      <User size={16} className={styles.inputIcon} />
                      <input 
                        type="text" 
                        id="profile-name"
                        className={styles.input} 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="profile-email" className={styles.label}>Электронная почта *</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={16} className={styles.inputIcon} />
                      <input 
                        type="email" 
                        id="profile-email"
                        className={styles.input} 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="profile-phone" className={styles.label}>Номер телефона</label>
                    <div className={styles.inputWrapper}>
                      <Phone size={16} className={styles.inputIcon} />
                      <input 
                        type="tel" 
                        inputMode="numeric"
                        autoComplete="tel"
                        id="profile-phone"
                        placeholder="87071234567"
                        className={styles.input} 
                        value={phone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.startsWith('7') && val.length === 11) {
                            val = '8' + val.slice(1);
                          } else if (val.length === 10 && (val.startsWith('70') || val.startsWith('77') || val.startsWith('74') || val.startsWith('78'))) {
                            val = '8' + val;
                          }
                          if (val.length > 11) {
                            val = val.slice(0, 11);
                          }
                          setPhone(val);
                        }}
                        disabled={loading}
                      />
                    </div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Формат: 87071234567
                    </span>
                  </div>
                </div>

                <div className={styles.separator}></div>
                <h3 className={styles.formSectionTitle}>Изменить пароль</h3>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-new-password" className={styles.label}>Новый пароль</label>
                    <input 
                      type="password" 
                      id="profile-new-password"
                      placeholder="Оставьте пустым, если не хотите менять"
                      className={styles.input} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="profile-confirm-password" className={styles.label}>Подтвердите новый пароль</label>
                    <input 
                      type="password" 
                      id="profile-confirm-password"
                      placeholder="Повторите новый пароль"
                      className={styles.input} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button type="submit" disabled={loading}>
                    <Save size={18} />
                    <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewProduct(null);
        }}
        product={reviewProduct}
        onSubmit={addReview}
      />
    </div>
  );
};

export default Profile;
