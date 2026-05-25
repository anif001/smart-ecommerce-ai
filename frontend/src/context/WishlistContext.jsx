import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get('/api/wishlist');
      setWishlistIds(res.data.productIds || []);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!user) {
      addToast('Please login to use wishlist', 'info');
      return;
    }
    const wasInWishlist = wishlistIds.includes(productId);
    setWishlistIds(prev =>
      wasInWishlist ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    try {
      const res = await API.post(`/api/wishlist/${productId}`);
      setWishlistIds(res.data.productIds || []);
      if (wasInWishlist) {
        addToast('Removed from wishlist', 'info');
      } else {
        addToast('Added to wishlist', 'success');
      }
    } catch (err) {
      setWishlistIds(prev =>
        wasInWishlist ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      addToast('Failed to update wishlist', 'error');
    }
  };

  const isInWishlist = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{
      wishlistIds, loading, fetchWishlist, toggleWishlist, isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
