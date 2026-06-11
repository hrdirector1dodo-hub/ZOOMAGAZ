// src/pages/Profile/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Gift, ShoppingBag, ChevronDown, ChevronUp, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import styles from './index.module.css';

const Profile = () => {
  const { user, updateProfile, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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
    } catch (err) {
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
            <span>Эко-бонусы EcoPet</span>
          </div>
          <div className={styles.bonusCount}>{user.bonuses || 0}</div>
          <p className={styles.bonusSub}>1 бонус = 1 рубль скидки</p>
          <div className={styles.bonusTip}>
            Начисляются за сдачу упаковки в ресайклинг и покупку товаров категории "Эко"
          </div>
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
              {user.orders && user.orders.length > 0 && (
                <span className={styles.badge}>{user.orders.length}</span>
              )}
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
              <h2 className={styles.contentTitle}>История заказов</h2>
              {!user.orders || user.orders.length === 0 ? (
                <div className={styles.emptyOrders}>
                  <ShoppingBag size={48} className={styles.emptyIcon} />
                  <h3>У вас еще нет заказов</h3>
                  <p>Перейдите в наш каталог, чтобы порадовать своего любимца!</p>
                  <Button variant="secondary" onClick={() => navigate('/catalog')}>
                    В каталог
                  </Button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {user.orders.map((order) => (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader} onClick={() => toggleOrder(order.id)}>
                        <div className={styles.orderMeta}>
                          <span className={styles.orderId}>Заказ #{order.id}</span>
                          <span className={styles.orderDate}>{order.date}</span>
                        </div>
                        <div className={styles.orderInfo}>
                          <span className={styles.orderTotal}>{order.total.toLocaleString()} ₽</span>
                          <span className={`${styles.orderStatus} ${
                            order.status === 'Доставлен' ? styles.statusDelivered : styles.statusShipped
                          }`}>
                            {order.status}
                          </span>
                          <button className={styles.expandBtn} type="button">
                            {expandedOrders[order.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {expandedOrders[order.id] && (
                        <div className={styles.orderDetail}>
                          <div className={styles.orderDetailHeader}>Состав заказа:</div>
                          <div className={styles.orderItems}>
                            {order.items && order.items.map((item, idx) => (
                              <div key={idx} className={styles.orderItem}>
                                <div className={styles.orderItemName}>{item.name}</div>
                                <div className={styles.orderItemMeta}>
                                  <span>{item.count} шт.</span>
                                  <span>{item.price.toLocaleString()} ₽</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
    </div>
  );
};

export default Profile;
