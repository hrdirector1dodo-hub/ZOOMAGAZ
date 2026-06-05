// src/pages/Home/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Star, Heart, CheckCircle2, ShoppingBag, Phone, Mail, Clock, MapPin, Send } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Rating from '../../components/ui/Rating';
import styles from './index.module.css';

const Home = () => {
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const rev = await api.getReviews();
      const promo = await api.getPromotions();
      const art = await api.getArticles();
      const br = await api.getBranches();
      
      setReviews(rev);
      setPromotions(promo);
      setArticles(art);
      setBranches(br);
      if (br.length > 0) {
        setActiveBranch(br[0]);
      }
    };
    fetchData();
  }, []);

  const suppliers = [
    { name: 'Royal Canin' },
    { name: 'Purina' },
    { name: 'Brit' },
    { name: 'Pro Plan' },
    { name: 'Farmina' },
    { name: 'Monge' }
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Heart size={16} className={styles.heroBadgeIcon} />
              <span>С любовью к вашим питомцам</span>
            </div>
            <h1 className={styles.heroTitle}>
              Экологичные товары для счастливых <span className={styles.heroTitleGreen}>питомцев</span>
            </h1>
            <p className={styles.heroSlogan}>
              Натуральные корма супер-премиум класса, экологичные игрушки и стильные аксессуары с заботой о здоровье животных и природе.
            </p>
            <div className={styles.heroButtons}>
              <Button size="lg" variant="secondary" onClick={() => navigate('/catalog')}>
                Перейти в каталог
                <ArrowRight size={20} />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                const el = document.getElementById('about');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                О нас
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us Section */}
      <section id="about" className={styles.section}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutImageCol}>
              <div className={styles.aboutImgWrapper}>
                <img 
                  src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop&q=80" 
                  alt="Животные и люди" 
                  className={styles.aboutImg}
                />
              </div>
              <div className={styles.aboutExperienceBadge}>
                <span className={styles.aboutYears}>8+</span>
                <span className={styles.aboutYearsLabel}>Лет заботы</span>
              </div>
            </div>

            <div className={styles.aboutContent}>
              <div>
                <span className={styles.sectionSubtitle}>Кто мы</span>
                <h2 className={styles.sectionTitle}>Наша миссия — здоровье и экология</h2>
              </div>
              <p className={styles.aboutText}>
                EcoPet — это не просто магазин, это сообщество заботливых хозяев. Мы верим, что наши питомцы заслуживают лучшего: натурального питания без химикатов и аксессуаров, созданных без вреда для экологии.
              </p>
              
              <div className={styles.advantagesList}>
                <div className={styles.advantageCard}>
                  <CheckCircle2 size={24} className={styles.advantageIcon} />
                  <h3 className={styles.advantageTitle}>100% Эко-состав</h3>
                  <p className={styles.advantageText}>Корма без сои, консервантов, искусственных красителей и ароматизаторов.</p>
                </div>
                <div className={styles.advantageCard}>
                  <CheckCircle2 size={24} className={styles.advantageIcon} />
                  <h3 className={styles.advantageTitle}>Био-упаковка</h3>
                  <p className={styles.advantageText}>Большинство наших аксессуаров и лакомств упакованы в разлагаемые материалы.</p>
                </div>
                <div className={styles.advantageCard}>
                  <CheckCircle2 size={24} className={styles.advantageIcon} />
                  <h3 className={styles.advantageTitle}>Ветеринарный отбор</h3>
                  <p className={styles.advantageText}>Все товары проходят жесткий контроль со стороны ветеринарных врачей.</p>
                </div>
                <div className={styles.advantageCard}>
                  <CheckCircle2 size={24} className={styles.advantageIcon} />
                  <h3 className={styles.advantageTitle}>Забота о природе</h3>
                  <p className={styles.advantageText}>Часть средств с каждой покупки направляется в фонды защиты диких животных.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Suppliers Section */}
      <section className={`${styles.section} ${styles.sectionGrey}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Наши бренды</span>
            <h2 className={styles.sectionTitle}>Надежные поставщики</h2>
          </div>
          <div className={styles.suppliersGrid}>
            {suppliers.map((sup, idx) => (
              <div 
                key={idx} 
                className={styles.supplierCard}
                onClick={() => navigate(`/catalog?brand=${encodeURIComponent(sup.name)}`)}
              >
                <span>{sup.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Reviews Section */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Отзывы</span>
            <h2 className={styles.sectionTitle}>Люди любят нас</h2>
          </div>
          <div className={styles.reviewsGrid}>
            {reviews.map((rev) => (
              <div key={rev.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <img src={rev.avatar} alt={rev.name} className={styles.reviewAvatar} />
                  <div className={styles.reviewMeta}>
                    <span className={styles.reviewName}>{rev.name}</span>
                    <span className={styles.reviewPet}>{rev.pet}</span>
                  </div>
                </div>
                <Rating value={rev.rating} showValue={false} />
                <p className={styles.reviewText}>"{rev.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Promotions Section */}
      <section id="promotions" className={`${styles.section} ${styles.sectionGrey}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Выгода</span>
            <h2 className={styles.sectionTitle}>Акции и скидки</h2>
          </div>
          <div className={styles.promoGrid}>
            {promotions.map((promo) => (
              <div key={promo.id} className={styles.promoCard}>
                <div>
                  <span 
                    className={styles.promoBadge} 
                    style={{ backgroundColor: promo.color === '#1E1E1E' ? '#1E1E1E' : 'var(--color-primary-light)', color: promo.color === '#1E1E1E' ? '#FFFFFF' : 'var(--color-primary-jade)' }}
                  >
                    {promo.badge}
                  </span>
                  <h3 className={styles.promoTitle}>{promo.title}</h3>
                  <p className={styles.promoText}>{promo.description}</p>
                </div>
                <div className={styles.promoFooter}>
                  <span className={styles.promoPeriod}>{promo.period}</span>
                  <Button variant="text" onClick={() => navigate('/catalog')}>
                    В каталог <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Useful Information Section */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Блог</span>
            <h2 className={styles.sectionTitle}>Полезная информация</h2>
          </div>
          <div className={styles.articlesGrid}>
            {articles.map((art) => (
              <div key={art.id} className={styles.articleCard}>
                <div className={styles.articleImageWrapper}>
                  <img src={art.image} alt={art.title} className={styles.articleImg} />
                </div>
                <div className={styles.articleContent}>
                  <div className={styles.articleMeta}>
                    <span>{art.date}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 className={styles.articleTitle}>{art.title}</h3>
                  <p className={styles.articleSummary}>{art.summary}</p>
                  <Link to={`/catalog?category=${art.category}`} className={styles.articleLink}>
                    Перейти к товарам <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Contacts & 8. Branches Sections */}
      <section id="contacts" className={`${styles.section} ${styles.sectionGrey}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionSubtitle}>Наши адреса</span>
            <h2 className={styles.sectionTitle}>Контакты и филиалы</h2>
          </div>
          
          <div className={styles.contactsGrid}>
            <div className={styles.branchesCardList}>
              {branches.map((branch) => (
                <div 
                  key={branch.id} 
                  className={`${styles.branchCard} ${activeBranch?.id === branch.id ? styles.branchCardActive : ''}`}
                  onClick={() => setActiveBranch(branch)}
                >
                  <h3 className={styles.branchCardTitle}>
                    <span>{branch.city}</span>
                    {activeBranch?.id === branch.id && <span className={styles.branchCardActiveText}>Выбран</span>}
                  </h3>
                  
                  <div className={styles.branchMetaList}>
                    <div className={styles.branchMetaItem}>
                      <MapPin size={16} className={styles.branchMetaIcon} />
                      <span>{branch.address}</span>
                    </div>
                    <div className={styles.branchMetaItem}>
                      <Phone size={16} className={styles.branchMetaIcon} />
                      <span>{branch.phone}</span>
                    </div>
                    <div className={styles.branchMetaItem}>
                      <Clock size={16} className={styles.branchMetaIcon} />
                      <span>{branch.hours}</span>
                    </div>
                  </div>
                  
                  <div className={styles.branchFeatures}>
                    {branch.features.map((feat, idx) => (
                      <span key={idx} className={styles.branchFeatureTag}>{feat}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.mapCol}>
              {/* Visual SVG Map Schema */}
              <div className={styles.mapWrapper}>
                <svg className={styles.mapSvg} viewBox="0 0 800 450" fill="none">
                  {/* Stylized background grid representing Russia */}
                  <rect width="800" height="450" rx="16" fill="#F8F5EE" />
                  
                  {/* Soft background map outlines */}
                  <path d="M 200,80 Q 220,150 170,250 T 150,400" stroke="#E8E4DA" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 400,100 Q 380,200 420,300 T 360,420" stroke="#E8E4DA" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 100,200 L 700,200" stroke="#E8E4DA" strokeWidth="2" strokeDasharray="6,6" />
                  <path d="M 100,300 L 700,300" stroke="#E8E4DA" strokeWidth="2" strokeDasharray="6,6" />
                  
                  {/* Connection lines */}
                  <line x1="220" y1="180" x2="190" y2="280" stroke="rgba(0, 168, 107, 0.2)" strokeWidth="2" strokeDasharray="4,4" />
                  <line x1="220" y1="180" x2="350" y2="230" stroke="rgba(0, 168, 107, 0.2)" strokeWidth="2" strokeDasharray="4,4" />
                  
                  {/* Branch pins */}
                  {/* Moscow: X=220, Y=180 */}
                  <g className={styles.mapPin} onClick={() => setActiveBranch(branches[0])}>
                    <circle cx="220" cy="180" r="16" fill="rgba(0, 168, 107, 0.15)" />
                    <circle cx="220" cy="180" r="8" fill={activeBranch?.id === 'branch-1' ? '#A4DE02' : '#00A86B'} stroke="#FFFFFF" strokeWidth="2" />
                    <text x="220" y="155" textAnchor="middle" className={styles.mapLabel}>Москва</text>
                  </g>

                  {/* St Petersburg: X=190, Y=280 */}
                  <g className={styles.mapPin} onClick={() => setActiveBranch(branches[1])}>
                    <circle cx="190" cy="280" r="16" fill="rgba(0, 168, 107, 0.15)" />
                    <circle cx="190" cy="280" r="8" fill={activeBranch?.id === 'branch-2' ? '#A4DE02' : '#00A86B'} stroke="#FFFFFF" strokeWidth="2" />
                    <text x="190" y="255" textAnchor="middle" className={styles.mapLabel}>Санкт-Петербург</text>
                  </g>

                  {/* Kazan: X=350, Y=230 */}
                  <g className={styles.mapPin} onClick={() => setActiveBranch(branches[2])}>
                    <circle cx="350" cy="230" r="16" fill="rgba(0, 168, 107, 0.15)" />
                    <circle cx="350" cy="230" r="8" fill={activeBranch?.id === 'branch-3' ? '#A4DE02' : '#00A86B'} stroke="#FFFFFF" strokeWidth="2" />
                    <text x="350" y="205" textAnchor="middle" className={styles.mapLabel}>Казань</text>
                  </g>
                </svg>

                {activeBranch && (
                  <div className={styles.mapInfoBubble}>
                    <div>
                      <div className={styles.mapInfoTitle}>EcoPet — {activeBranch.city}</div>
                      <div className={styles.mapInfoText}>{activeBranch.address}</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => window.open(`https://yandex.ru/maps/?text=${encodeURIComponent(activeBranch.address)}`, '_blank')}>
                      Маршрут
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
