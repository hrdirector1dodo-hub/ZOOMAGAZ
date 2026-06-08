// src/components/auth/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthModal.module.css';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, register, verifyEmailExists, resetPassword } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
      setConfirmPassword('');
      setView('login');
      setShowPassword(false);
      setSimulatedCode('');
      setEnteredCode('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (targetView) => {
    setView(targetView);
    setError('');
    setSuccessMessage('');
    setSimulatedCode('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(simulatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateForm = () => {
    if (view === 'forgot') {
      if (!email) {
        setError('Пожалуйста, введите email');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Введите корректный email адрес');
        return false;
      }
      return true;
    }

    if (view === 'reset') {
      if (!enteredCode || !password || !confirmPassword) {
        setError('Пожалуйста, заполните все поля');
        return false;
      }
      if (enteredCode !== simulatedCode) {
        setError('Неверный код подтверждения');
        return false;
      }
      if (password.length < 6) {
        setError('Пароль должен состоять минимум из 6 символов');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
      return true;
    }

    if (!email || !password) {
      setError('Пожалуйста, заполните обязательные поля');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email адрес');
      return false;
    }

    if (password.length < 6) {
      setError('Пароль должен состоять минимум из 6 символов');
      return false;
    }

    if (view === 'register') {
      if (!name) {
        setError('Имя является обязательным полем');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (view === 'login') {
        const result = await login(email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error);
        }
      } else if (view === 'register') {
        const result = await register({ name, email, password, phone });
        if (result.success) {
          onClose();
        } else {
          setError(result.error);
        }
      } else if (view === 'forgot') {
        const exists = await verifyEmailExists(email);
        if (!exists) {
          setError('Пользователь с таким email не найден');
        } else {
          const code = (100000 + Math.floor(Math.random() * 900000)).toString();
          setSimulatedCode(code);
          setCopied(false);
          setView('reset');
          setSuccessMessage('Код восстановления сгенерирован!');
        }
      } else if (view === 'reset') {
        const result = await resetPassword(email, password);
        if (result.success) {
          setView('login');
          setSuccessMessage('Пароль успешно изменен! Вы можете войти с новым паролем.');
          setPassword('');
          setConfirmPassword('');
          setEnteredCode('');
          setSimulatedCode('');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
          <X size={20} />
        </button>

        <div className={styles.header}>
          {(view === 'login' || view === 'register') ? (
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${view === 'login' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('login')}
                type="button"
              >
                Войти
              </button>
              <button 
                className={`${styles.tab} ${view === 'register' ? styles.tabActive : ''}`}
                onClick={() => handleTabChange('register')}
                type="button"
              >
                Регистрация
              </button>
            </div>
          ) : view === 'forgot' ? (
            <h3 className={styles.modalTitle}>Восстановление пароля</h3>
          ) : (
            <h3 className={styles.modalTitle}>Новый пароль</h3>
          )}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        {view === 'reset' && simulatedCode && (
          <div className={styles.emailSimAlert}>
            <div className={styles.emailSimHeader}>
              <span>📨 [Симуляция почты] Код отправлен</span>
            </div>
            <div className={styles.emailSimBody}>
              Мы отправили код подтверждения на <strong>{email}</strong>:
              <div className={styles.emailSimCodeContainer}>
                <span className={styles.emailSimCode}>{simulatedCode}</span>
                <button 
                  type="button" 
                  className={styles.copyCodeBtn}
                  onClick={handleCopyCode}
                >
                  {copied ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {view === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-name" className={styles.label}>Ваше имя *</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  id="auth-name"
                  placeholder="Иван Иванов" 
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {view !== 'reset' && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-email" className={styles.label}>Электронная почта *</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="email" 
                  id="auth-email"
                  placeholder="example@mail.ru" 
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-phone" className={styles.label}>Номер телефона</label>
              <div className={styles.inputWrapper}>
                <Phone size={18} className={styles.inputIcon} />
                <input 
                  type="tel" 
                  id="auth-phone"
                  placeholder="+7 (999) 123-45-67" 
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {view === 'reset' && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-code" className={styles.label}>Код подтверждения *</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  id="auth-code"
                  placeholder="Введите код" 
                  className={styles.input}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {view !== 'forgot' && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-password" className={styles.label}>
                {view === 'reset' ? 'Новый пароль *' : 'Пароль *'}
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="auth-password"
                  placeholder="Минимум 6 символов" 
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button 
                  type="button" 
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {view === 'login' && (
            <div className={styles.forgotPasswordContainer}>
              <span 
                className={styles.forgotPasswordLink} 
                onClick={() => handleTabChange('forgot')}
              >
                Забыли пароль?
              </span>
            </div>
          )}

          {(view === 'register' || view === 'reset') && (
            <div className={styles.inputGroup}>
              <label htmlFor="auth-confirm-password" className={styles.label}>Подтвердите пароль *</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="auth-confirm-password"
                  placeholder="Повторите пароль" 
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className={styles.submitBtn} 
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : (
              view === 'login' ? 'Войти' : 
              view === 'register' ? 'Создать аккаунт' : 
              view === 'forgot' ? 'Отправить код' : 'Сбросить пароль'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          {view === 'login' ? (
            <p>Еще нет аккаунта? <span className={styles.toggleLink} onClick={() => handleTabChange('register')}>Зарегистрируйтесь</span></p>
          ) : view === 'register' ? (
            <p>Уже зарегистрированы? <span className={styles.toggleLink} onClick={() => handleTabChange('login')}>Войдите в профиль</span></p>
          ) : view === 'forgot' ? (
            <span className={styles.backToLoginLink} onClick={() => handleTabChange('login')}>
              Вернуться к входу
            </span>
          ) : (
            <span className={styles.backToLoginLink} onClick={() => handleTabChange('login')}>
              Отмена
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
