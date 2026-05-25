import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { Heart, HeartOff, ArrowRight, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const Wishlist = () => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const detailsPromises = wishlistIds.map(async (id) => {
        try {
          const prodRes = await API.get(`/api/products/${id}`);
          return prodRes.data;
        } catch { return null; }
      });
      const detailedProducts = await Promise.all(detailsPromises);
      setProducts(detailedProducts.filter(p => p !== null));
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistIds.length > 0) {
      fetchWishlist();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [wishlistIds]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-1/4 mb-4 shimmer-wrapper"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Wishlist</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {products.length > 0
              ? `${products.length} item${products.length !== 1 ? 's' : ''} saved`
              : 'Your wishlist is empty'}
          </p>
        </div>
        {products.length > 0 && (
          <Link to="/shop" className="text-sm text-primary-500 hover:text-primary-600 font-bold flex items-center space-x-1">
            <ShoppingBag size={16} />
            <span>Shop More</span>
          </Link>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} showRating />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-8 max-w-sm mx-auto space-y-4">
          <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-slate-400">
            <HeartOff size={36} />
          </div>
          <h2 className="text-xl font-bold">Your Wishlist is Empty</h2>
          <p className="text-sm text-slate-400">Save products to keep track of items you like.</p>
          <Link to="/shop" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl text-sm inline-flex items-center space-x-2 shadow-md shadow-primary-500/10 transition-all hover:-translate-y-0.5">
            <ShoppingBag size={16} />
            <span>Shop Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
