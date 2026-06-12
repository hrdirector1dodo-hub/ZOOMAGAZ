import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useOrders } from './OrdersContext';
import productsData from '../data/products.json';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const ReviewContext = createContext(null);

export const ReviewProvider = ({ children }) => {
  const { user } = useAuth();
  const { getUserOrders } = useOrders();

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('ecopet_product_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [points, setPoints] = useState(0);
  const [hasCoupon, setHasCoupon] = useState(false);

  const getUserKey = (currentUser) => {
    if (!currentUser) return 'guest';
    return currentUser.id || currentUser.email || currentUser.phone || 'guest';
  };

  // Fetch Supabase reviews if active
  useEffect(() => {
    if (isSupabaseConfigured) {
      const fetchDbReviews = async () => {
        try {
          const { data, error } = await supabase
            .from('reviews')
            .select('*, profiles(name)')
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            const formatted = data.map(rev => ({
              id: rev.id,
              productId: rev.product_id,
              userId: rev.user_id,
              author: rev.profiles?.name || 'Покупатель',
              rating: rev.rating,
              text: rev.comment,
              date: rev.created_at?.split('T')[0]
            }));
            setReviews(formatted);
          }
        } catch (err) {
          console.error('Failed to sync reviews from database:', err);
        }
      };
      fetchDbReviews();
    }
  }, [user]);

  // Sync user-specific points and coupons from database or localStorage
  useEffect(() => {
    if (user) {
      if (isSupabaseConfigured) {
        const fetchCouponAndPoints = async () => {
          try {
            const { data: coupons } = await supabase
              .from('coupons')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', 'active');
            
            setHasCoupon(coupons && coupons.length > 0);
            
            // Sync current user points from AuthContext profile metadata
            if (user.reviewPoints !== undefined) {
              setPoints(user.reviewPoints);
            }
          } catch (err) {
            console.error('Failed to sync user reward points:', err);
          }
        };
        fetchCouponAndPoints();
      } else {
        const uKey = getUserKey(user);
        const savedPoints = localStorage.getItem(`ecopet_review_points_${uKey}`);
        const savedCoupon = localStorage.getItem(`ecopet_review_coupon_${uKey}`);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPoints(savedPoints ? Number(savedPoints) : 0);
        setHasCoupon(savedCoupon === 'true');
      }
    } else {
      setPoints(0);
      setHasCoupon(false);
    }
  }, [user, user?.reviewPoints]);

  // Persist reviews list (only for Local mode fallback)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('ecopet_product_reviews', JSON.stringify(reviews));
    }
  }, [reviews]);

  const hasPurchasedProduct = (productId) => {
    if (!user) return false;
    const orders = getUserOrders(user);
    
    return orders.some(order => 
      order.items && order.items.some(item => 
        String(item.id) === String(productId) || 
        (!isNaN(Number(item.id)) && !isNaN(Number(productId)) && Number(item.id) === Number(productId))
      )
    );
  };

  const hasReviewedProduct = (productId) => {
    if (!user) return false;
    const uKey = getUserKey(user);
    
    return reviews.some(rev => 
      (String(rev.productId) === String(productId) || 
       (!isNaN(Number(rev.productId)) && !isNaN(Number(productId)) && Number(rev.productId) === Number(productId))) && 
      rev.userId === uKey
    );
  };

  const getReviewsForProduct = (productId) => {
    const stringId = String(productId);
    const numericProductId = Number(productId);
    
    // 1. Get static reviews from products.json
    const staticProduct = productsData.find(p => 
      String(p.id) === stringId || 
      (!isNaN(Number(p.id)) && !isNaN(numericProductId) && Number(p.id) === numericProductId)
    );
    const staticRevs = staticProduct && staticProduct.reviews ? staticProduct.reviews : [];
    
    // 2. Get user reviews from state
    const userRevs = reviews.filter(rev => 
      String(rev.productId) === stringId || 
      (!isNaN(Number(rev.productId)) && !isNaN(numericProductId) && Number(rev.productId) === numericProductId)
    );
    
    // Merge user reviews (most recent first) and static reviews
    return [...userRevs, ...staticRevs];
  };

  const getAverageRatingForProduct = (productId) => {
    const revs = getReviewsForProduct(productId);
    if (revs.length === 0) {
      // Fallback to static product rating if no reviews (though products usually have seed reviews)
      const staticProduct = productsData.find(p => 
        String(p.id) === String(productId) || 
        (!isNaN(Number(p.id)) && !isNaN(Number(productId)) && Number(p.id) === Number(productId))
      );
      return staticProduct ? staticProduct.rating : 5.0;
    }
    const sum = revs.reduce((s, r) => s + Number(r.rating), 0);
    return roundRating(sum / revs.length);
  };

  const roundRating = (num) => {
    return Math.round(num * 10) / 10;
  };

  const getProductsWaitingForReview = () => {
    if (!user) return [];
    const orders = getUserOrders(user);
    
    // Collect unique purchased items from orders
    const purchased = [];
    const seenIds = new Set();
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = String(item.id);
          if (!seenIds.has(key)) {
            seenIds.add(key);
            purchased.push(item);
          }
        });
      }
    });

    const waiting = [];
    purchased.forEach(item => {
      if (!hasReviewedProduct(item.id)) {
        // Find product details
        const product = productsData.find(p => 
          String(p.id) === String(item.id) || 
          (!isNaN(Number(p.id)) && !isNaN(Number(item.id)) && Number(p.id) === Number(item.id))
        );
        if (product) {
          waiting.push(product);
        } else {
          // Fallback for seed products (e.g. prod-1)
          waiting.push({
            id: item.id,
            name: item.name,
            price: item.price,
            images: []
          });
        }
      }
    });

    return waiting;
  };

  const addReview = async (productId, productName, rating, text) => {
    if (!user) {
      return { success: false, error: 'Пожалуйста, авторизуйтесь для отправки отзыва' };
    }
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: 'Пожалуйста, выберите оценку' };
    }
    if (!text || text.trim() === '') {
      return { success: false, error: 'Пожалуйста, напишите текст отзыва' };
    }

    const numericProductId = Number(productId);

    if (isSupabaseConfigured) {
      try {
        if (!hasPurchasedProduct(numericProductId)) {
          return { success: false, error: 'Вы можете оставить отзыв только на купленный товар' };
        }
        if (hasReviewedProduct(numericProductId)) {
          return { success: false, error: 'Вы уже оставили отзыв на этот товар' };
        }

        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: numericProductId,
            user_id: user.id,
            rating: Number(rating),
            comment: text.trim()
          });

        if (error) {
          if (error.code === '23505') {
            return { success: false, error: 'Вы уже оставили отзыв на этот товар' };
          }
          return { success: false, error: error.message };
        }

        // Fetch refreshed reviews
        const { data: freshReviews } = await supabase
          .from('reviews')
          .select('*, profiles(name)')
          .order('created_at', { ascending: false });
        
        if (freshReviews) {
          const formatted = freshReviews.map(rev => ({
            id: rev.id,
            productId: rev.product_id,
            userId: rev.user_id,
            author: rev.profiles?.name || 'Покупатель',
            rating: rev.rating,
            text: rev.comment,
            date: rev.created_at?.split('T')[0]
          }));
          setReviews(formatted);
        }

        // Sync updated points & coupons from DB
        const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: coupons } = await supabase.from('coupons').select('*').eq('user_id', user.id).eq('status', 'active');
        
        const hasNowActiveCoupon = coupons && coupons.length > 0;
        const earnedCoupon = !hasCoupon && hasNowActiveCoupon;

        if (updatedProfile) {
          setPoints(updatedProfile.review_points);
        }
        setHasCoupon(hasNowActiveCoupon);

        return { success: true, earnedCoupon };
      } catch (err) {
        console.error('Failed to submit review to Supabase:', err);
        return { success: false, error: 'Не удалось отправить отзыв. Попробуйте позже.' };
      }
    } else {
      // Local Mode
      const uKey = getUserKey(user);

      if (!hasPurchasedProduct(numericProductId)) {
        return { success: false, error: 'Вы можете оставить отзыв только на купленный товар' };
      }

      if (hasReviewedProduct(numericProductId)) {
        return { success: false, error: 'Вы уже оставили отзыв на этот товар' };
      }

      const newReview = {
        id: 'rev_' + Math.floor(100000 + Math.random() * 900000),
        productId: numericProductId,
        productName,
        userId: uKey,
        author: user.name || 'Покупатель',
        rating: Number(rating),
        text: text.trim(),
        date: new Date().toISOString().split('T')[0]
      };

      setReviews(prev => [newReview, ...prev]);

      let earnedCoupon = false;

      if (!hasCoupon) {
        const updatedPoints = points + 1;
        if (updatedPoints >= 10) {
          setHasCoupon(true);
          localStorage.setItem(`ecopet_review_coupon_${uKey}`, 'true');
          earnedCoupon = true;
          setPoints(0);
          localStorage.setItem(`ecopet_review_points_${uKey}`, '0');
        } else {
          setPoints(updatedPoints);
          localStorage.setItem(`ecopet_review_points_${uKey}`, String(updatedPoints));
        }
      }

      return { success: true, earnedCoupon };
    }
  };

  const consumeReviewCoupon = async () => {
    if (!user) return;

    if (isSupabaseConfigured) {
      try {
        const { data: coupons } = await supabase
          .from('coupons')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);
          
        if (coupons && coupons.length > 0) {
          await supabase
            .from('coupons')
            .update({ status: 'used', used_at: new Date().toISOString() })
            .eq('id', coupons[0].id);
        }
        setHasCoupon(false);
        setPoints(0);
      } catch (err) {
        console.error('Failed to consume coupon:', err);
      }
    } else {
      const uKey = getUserKey(user);
      setHasCoupon(false);
      localStorage.setItem(`ecopet_review_coupon_${uKey}`, 'false');
      setPoints(0);
      localStorage.setItem(`ecopet_review_points_${uKey}`, '0');
    }
  };

  return (
    <ReviewContext.Provider value={{
      reviewPoints: points,
      hasReviewCoupon: hasCoupon,
      addReview,
      consumeReviewCoupon,
      hasPurchasedProduct,
      hasReviewedProduct,
      getReviewsForProduct,
      getAverageRatingForProduct,
      getProductsWaitingForReview
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};
