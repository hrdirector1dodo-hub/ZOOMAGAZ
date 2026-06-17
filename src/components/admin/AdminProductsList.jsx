// src/components/admin/AdminProductsList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProducts, deleteProduct } from '../../services/adminApi';
import styles from './AdminProductsList.module.css';

const AdminProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await getAdminProducts();
    if (error) {
      setError('Не удалось загрузить товары');
    } else {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить товар?')) return;
    const { error } = await deleteProduct(id);
    if (error) {
      alert('Ошибка при удалении');
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Search & filter logic (client‑side)
  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <p className={styles.info}>Загрузка...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Товары</h2>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Поиск по названию или бренду"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.search}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">Все категории</option>
          <option value="dogs">Товары для собак</option>
          <option value="cats">Товары для кошек</option>
          <option value="parrots">Товары для попугаев</option>
          <option value="fish">Товары для рыбок</option>
          <option value="ferrets">Товары для хорьков</option>
        </select>
        <Link to="/admin/products/new" className={styles.addBtn}>Добавить товар</Link>
      </div>
      {filtered.length === 0 ? (
        <p className={styles.info}>Товары не найдены</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Бренд</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.brand || '-'}</td>
                <td>{p.category_name || p.category}</td>
                <td>{p.price}</td>
                <td>{p.in_stock}</td>
                <td className={styles.actions}>
                  <Link to={`/admin/products/${p.id}/edit`} className={styles.edit}>Редактировать</Link>
                  <button onClick={() => handleDelete(p.id)} className={styles.delete}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminProductsList;
