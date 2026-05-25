import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { X, ShoppingCart, Heart, Star, Eye } from 'lucide-react';

const QuickViewModal = ({ product, onClose }) => {
  const { isInCart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const inCart = isInCart(product.id);
  const inWish = isInWishlist(product.id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-64 md:h-80">
              <img
                src={product.images?.[0] || product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-primary-500 dark:text-primary-400 font-extrabold uppercase tracking-widest">
                  {product.category}
                </span>
                <h2 className="text-xl font-extrabold mt-1 text-slate-900 dark:text-white">{product.title}</h2>
                {product.averageRating > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < Math.round(product.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'} />
                    ))}
                    <span className="text-xs font-bold ml-1">{product.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{product.description}</p>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                product.inventory > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
              }`}>
                {product.inventory > 0 ? `${product.inventory} In Stock` : 'Out of Stock'}
              </span>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    if (inCart) { navigate('/cart'); onClose(); return; }
                    addToCart(product.id, 1);
                  }}
                  disabled={product.inventory <= 0 && !inCart}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                    inCart
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  } disabled:opacity-50`}
                >
                  <ShoppingCart size={16} />
                  <span>{inCart ? 'Go to Cart' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={() => { toggleWishlist(product.id); }}
                  className={`p-3 rounded-xl border transition-all ${
                    inWish
                      ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart size={18} className={inWish ? 'fill-rose-500' : ''} />
                </button>
              </div>

              <button
                onClick={() => { navigate(`/products/${product.id}`); onClose(); }}
                className="w-full text-center text-xs text-primary-500 hover:underline font-bold flex items-center justify-center space-x-1"
              >
                <Eye size={12} />
                <span>View Full Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
