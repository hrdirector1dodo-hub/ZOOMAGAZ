// src/components/admin/ProductForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getAdminProducts } from '../../services/adminApi';
import styles from './ProductForm.module.css';

// Mapping of category value to human‑readable category_name
const CATEGORY_MAP = {
  dogs: 'Товары для собак',
  cats: 'Товары для кошек',
  parrots: 'Товары для попугаев',
  fish: 'Товары для рыбок',
  ferrets: 'Товары для хорьков',
};

const ProductForm = () => {
  const { id } = useParams(); // undefined for new product
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: '',
    category: '',
    category_name: '',
    brand: '',
    price: '',
    description: '',
    rating: '',
    in_stock: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing product when editing
  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        const { data, error } = await getAdminProducts();
        if (error) {
          setError('Не удалось загрузить товар');
        } else {
          const existing = data.find(p => String(p.id) === id);
          if (existing) setProduct({
            name: existing.name || '',
            category: existing.category || '',
            category_name: existing.category_name || '',
            brand: existing.brand || '',
            price: existing.price || '',
            description: existing.description || '',
            rating: existing.rating || '',
            in_stock: existing.in_stock || '',
          });
        }
        setLoading(false);
      })();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    // Auto‑fill category_name when category changes
    if (name === 'category') {
      setProduct(prev => ({
        ...prev,
        category_name: CATEGORY_MAP[value] || '',
      }));
    }
  };

  const validate = () => {
    if (!product.name.trim()) return 'Введите название';
    if (!product.category) return 'Выберите категорию';
    if (!product.price || isNaN(product.price)) return 'Введите корректную цену';
    if (!product.in_stock || isNaN(product.in_stock)) return 'Введите корректный остаток';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    const payload = {
      name: product.name,
      category: product.category,
      category_name: product.category_name,
      brand: product.brand,
      price: Number(product.price),
      description: product.description,
      rating: product.rating ? Number(product.rating) : null,
      in_stock: Number(product.in_stock),
    };
    const result = id ? await updateProduct(id, payload) : await createProduct(payload);
    if (result.error) {
      setError('Ошибка сохранения');
    } else {
      navigate('/admin/products');
    }
    setLoading(false);
  };

  const imageSrc = id ? `/images/products/${id}.jpg` : '/images/products/placeholder.png';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{id ? 'Редактировать товар' : 'Добавить товар'}</h2>
      {loading && <p className={styles.info}>Загрузка...</p>}
      {error && <p className={styles.error}>{error}</p>}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label>Название *</label>
          <input name="name" value={product.name} onChange={handleChange} required />
        </div>
        <div className={styles.field}>
          <label>Категория *</label>
          <select name="category" value={product.category} onChange={handleChange} required>
            <option value="">Выберите</option>
            {Object.entries(CATEGORY_MAP).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>category_name (заполняется автоматически)</label>
          <input name="category_name" value={product.category_name} readOnly />
        </div>
        <div className={styles.field}>
          <label>Бренд</label>
          <input name="brand" value={product.brand} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>Цена *</label>
          <input name="price" type="number" step="0.01" value={product.price} onChange={handleChange} required />
        </div>
        <div className={styles.field}>
          <label>Описание</label>
          <textarea name="description" value={product.description} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>Рейтинг</label>
          <input name="rating" type="number" step="0.1" value={product.rating} onChange={handleChange} />
        </div>
        <div className={styles.field}>
          <label>Остаток *</label>
          <input name="in_stock" type="number" value={product.in_stock} onChange={handleChange} required />
        </div>
        <div className={styles.preview}>
          <p>Предпросмотр изображения:</p>
          <img
            src={imageSrc}
            alt="preview"
            onError={e => (e.currentTarget.src = '/images/products/placeholder.png')}
          />
          <p className={styles.note}>Изображения хранятся локально в public/images/products/. Файл должен называться по ID товара, например 1.jpg.</p>
        </div>
        <div className={styles.actions}>
          <button type="submit" disabled={loading} className={styles.saveBtn}>Сохранить</button>
          <button type="button" onClick={() => navigate('/admin/products')} className={styles.cancelBtn}>Отмена</button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
