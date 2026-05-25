import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'smartcart_cart_ids';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [cart, setCart] = useState({ items: [], savedForLater: [] });
  const [cartItemsDetails, setCartItemsDetails] = useState([]);
  const [savedItemsDetails, setSavedItemsDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState({});

  const fetchProductDetail = useCallback(async (productId) => {
    try {
      const res = await API.get(`/api/products/${productId}`);
      return res.data;
    } catch {
      return { title: "Unknown Product", price: 0.0, images: [], imageUrl: "" };
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], savedForLater: [] });
      setCartItemsDetails([]);
      setSavedItemsDetails([]);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get('/api/cart');
      setCart(res.data);

      const itemDetails = await Promise.all(
        (res.data.items || []).map(async (item) => {
          const product = await fetchProductDetail(item.productId);
          return { ...item, product };
        })
      );
      setCartItemsDetails(itemDetails);

      const savedDetails = await Promise.all(
        (res.data.savedForLater || []).map(async (item) => {
          const product = await fetchProductDetail(item.productId);
          return { ...item, product };
        })
      );
      setSavedItemsDetails(savedDetails);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchProductDetail]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartItemIds = useMemo(() =>
    new Set(cart.items?.map(item => item.productId) || []),
    [cart.items]
  );

  const isInCart = useCallback((productId) => cartItemIds.has(productId), [cartItemIds]);

  const addToCart = async (productId, quantity = 1, variant = null) => {
    if (!user) {
      addToast('Please login to add items to cart!', 'info');
      return Promise.resolve();
    }
    setLoadingItems(prev => ({ ...prev, [productId]: true }));
    const wasInCart = isInCart(productId);

    if (wasInCart) {
      setLoadingItems(prev => ({ ...prev, [productId]: false }));
      addToast('Item already in cart', 'info');
      return Promise.resolve();
    }

    setCart(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId, quantity, variant, isOptimistic: true }]
    }));

    try {
      await API.post('/api/cart', { productId, quantity, variant });
      await fetchCart();
      addToast('Added to cart', 'success');
    } catch (err) {
      setCart(prev => ({
        ...prev,
        items: (prev.items || []).filter(item => !(item.productId === productId && item.isOptimistic))
      }));
      addToast('Failed to add item to cart', 'error');
    } finally {
      setLoadingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setCartItemsDetails(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
    setCart(prev => ({
      ...prev,
      items: (prev.items || []).map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    }));
    try {
      await API.put('/api/cart/update', { productId, quantity });
      await fetchCart();
    } catch (err) {
      addToast('Failed to update quantity', 'error');
      await fetchCart();
    }
  };

  const removeFromCart = async (productId) => {
    setCart(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.productId !== productId)
    }));
    setCartItemsDetails(prev => prev.filter(item => item.productId !== productId));
    try {
      await API.delete(`/api/cart/${productId}`);
      await fetchCart();
      addToast('Removed from cart', 'info');
    } catch (err) {
      addToast('Failed to remove item', 'error');
      await fetchCart();
    }
  };

  const moveToSavedForLater = async (productId) => {
    try {
      await API.post(`/api/cart/save-for-later/${productId}`);
      await fetchCart();
    } catch (err) {
      addToast('Failed to move item', 'error');
    }
  };

  const moveToCart = async (productId) => {
    try {
      await API.post(`/api/cart/move-to-cart/${productId}`);
      await fetchCart();
    } catch (err) {
      addToast('Failed to move item', 'error');
    }
  };

  const clearCart = useCallback(async () => {
    setCart({ items: [], savedForLater: [] });
    setCartItemsDetails([]);
    setSavedItemsDetails([]);
  }, []);

  const getCartCount = useCallback(() => {
    return cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart.items]);

  const getCartTotal = useCallback(() => {
    return cartItemsDetails.reduce(
      (total, item) => total + (item.product.price * item.quantity), 0
    ) || 0;
  }, [cartItemsDetails]);

  return (
    <CartContext.Provider value={{
      cart, cartItemsDetails, savedItemsDetails, loading, loadingItems,
      cartItemIds, isInCart,
      addToCart, updateQuantity, removeFromCart,
      moveToSavedForLater, moveToCart,
      clearCart, getCartCount, getCartTotal, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
