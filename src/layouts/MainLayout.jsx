// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Phone, Mail, MapPin, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import styles from './MainLayout.module.css';

const MainLayout = ({ children }) => {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const closeDropdown = (e) => {
      if (isDropdownOpen && !e.target.closest(`.${styles.userDropdownContainer}`)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, [isDropdownOpen]);

  const handleLogoutClick = () => {
    logout();
    setIsDropdownOpen(false);
    if (location.pathname === '/profile') {
      navigate('/');
    }
  };

  // Handle header background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Scroll to anchor on home page
  const handleNavClick = (sectionId, e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation and mount to complete before scrolling
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.layout}>
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={`${styles.navContainer} container`}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
              </svg>
            </span>
            <span className={styles.logoText}>Eco<span className={styles.logoGreen}>Pet</span></span>
          </Link>

          <nav className={styles.navMenu}>
            <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}>
              Главная
            </NavLink>
            <NavLink to="/catalog" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}>
              Каталог
            </NavLink>
            <a href="#about" onClick={(e) => handleNavClick('about', e)} className={styles.navLink}>
              О компании
            </a>
            <a href="#promotions" onClick={(e) => handleNavClick('promotions', e)} className={styles.navLink}>
              Акции
            </a>
            <a href="#contacts" onClick={(e) => handleNavClick('contacts', e)} className={styles.navLink}>
              Контакты
            </a>
          </nav>

          <div className={styles.actions}>
            <Link to="/cart" className={styles.cartButton} aria-label="Корзина">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>

            {/* Profile Action */}
            {isAuthenticated ? (
              <div className={styles.userDropdownContainer}>
                <button 
                  className={styles.userButton} 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Профиль пользователя"
                  type="button"
                >
                  <User size={20} />
                  <span className={styles.userNameDesktop}>{user.name.split(' ')[0]}</span>
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownUserName}>{user.name}</div>
                      <div className={styles.dropdownUserEmail}>{user.email}</div>
                    </div>
                    <Link 
                      to="/profile" 
                      className={styles.dropdownItem}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Личный кабинет
                    </Link>
                    <button 
                      className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                      onClick={handleLogoutClick}
                      type="button"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className={styles.userButton} 
                onClick={() => setIsAuthModalOpen(true)}
                aria-label="Войти"
                type="button"
              >
                <User size={20} />
              </button>
            )}

            <button 
              className={styles.menuButton} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Меню"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <nav className={styles.mobileNav}>
            <Link to="/" className={styles.mobileNavLink}>Главная</Link>
            <Link to="/catalog" className={styles.mobileNavLink}>Каталог</Link>
            <a href="#about" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick('about', e); }} className={styles.mobileNavLink}>О компании</a>
            <a href="#promotions" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick('promotions', e); }} className={styles.mobileNavLink}>Акции</a>
            <a href="#contacts" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick('contacts', e); }} className={styles.mobileNavLink}>Контакты</a>
            
            <div className={styles.mobileSeparator}></div>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className={styles.mobileNavLink}
                >
                  Личный кабинет ({user.name.split(' ')[0]})
                </Link>
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogoutClick();
                  }} 
                  className={`${styles.mobileNavLink} ${styles.mobileLogoutBtn}`}
                  type="button"
                >
                  Выйти
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }} 
                className={styles.mobileNavLink}
                type="button"
              >
                Войти / Регистрация
              </button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <main className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.footerGrid} container`}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoText}>Eco<span className={styles.logoGreen}>Pet</span></span>
            </Link>
            <p className={styles.footerText}>
              Современный экологичный зоомагазин. Мы предлагаем только проверенные и натуральные корма, полезные лакомства и аксессуары для ваших любимых питомцев.
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialIcon} aria-label="VK"><span style={{ fontWeight: 'bold' }}>VK</span></a>
              <a href="#" className={styles.socialIcon} aria-label="Telegram"><span style={{ fontWeight: 'bold' }}>TG</span></a>
              <a href="#" className={styles.socialIcon} aria-label="WhatsApp"><span style={{ fontWeight: 'bold' }}>WA</span></a>
            </div>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Разделы</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/" className={styles.footerLink}>Главная</Link></li>
              <li><Link to="/catalog" className={styles.footerLink}>Каталог</Link></li>
              <li><a href="#about" onClick={(e) => handleNavClick('about', e)} className={styles.footerLink}>О компании</a></li>
              <li><a href="#promotions" onClick={(e) => handleNavClick('promotions', e)} className={styles.footerLink}>Акции и скидки</a></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Категории</h3>
            <ul className={styles.footerLinks}>
              <li><Link to="/catalog?category=dogs" className={styles.footerLink}>Товары для собак</Link></li>
              <li><Link to="/catalog?category=cats" className={styles.footerLink}>Товары для кошек</Link></li>
              <li><Link to="/catalog?category=parrots" className={styles.footerLink}>Товары для попугаев</Link></li>
              <li><Link to="/catalog?category=fish" className={styles.footerLink}>Товары для рыбок</Link></li>
              <li><Link to="/catalog?category=ferrets" className={styles.footerLink}>Товары для хорьков</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={styles.footerTitle}>Контакты</h3>
            <div className={styles.footerContacts}>
              <div className={styles.contactItem}>
                <Phone size={18} className={styles.contactIcon} />
                <span>+7 (800) 555-35-35 (Бесплатно по РФ)</span>
              </div>
              <div className={styles.contactItem}>
                <Mail size={18} className={styles.contactIcon} />
                <span>support@ecopet.ru</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={18} className={styles.contactIcon} />
                <span>г. Москва, ул. Лесная, д. 20, стр. 1</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.footerBottom} container`}>
          <p>&copy; {new Date().getFullYear()} EcoPet. Все права защищены.</p>
          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerLegalLink}>Политика конфиденциальности</a>
            <a href="#" className={styles.footerLegalLink}>Пользовательское соглашение</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
