import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingCart, Heart, Star, Sparkles, Loader2 } from 'lucide-react';

const ProductCard = memo(({ product, showMatch, matchScore, explanation, showRating = true }) => {
  const { isInCart, addToCart, loadingItems } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const inCart = isInCart(product.id);
  const inWish = isInWishlist(product.id);
  const isLoading = loadingItems[product.id];

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      navigate('/cart');
      return;
    }
    addToCart(product.id, 1);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-500/30 transition-all flex flex-col group relative">
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden h-48 bg-slate-100 dark:bg-slate-950">
        <img
          src={product.images?.[0] || product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {showRating && product.averageRating > 0 && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 backdrop-blur-sm">
            <Star size={8} className="fill-yellow-400 text-yellow-400" />
            <span>{product.averageRating.toFixed(1)}</span>
          </span>
        )}
        {showMatch && matchScore !== undefined && (
          <span className="absolute top-2 right-2 bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 backdrop-blur-sm">
            <Sparkles size={8} />
            <span>{Math.round(matchScore * 100)}% Match</span>
          </span>
        )}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2 right-2 p-1.5 rounded-xl transition-all backdrop-blur-sm ${
            inWish
              ? 'bg-rose-500/90 text-white'
              : 'bg-black/40 text-white/80 hover:text-rose-400 opacity-0 group-hover:opacity-100'
          } ${showMatch ? 'top-8' : ''}`}
        >
          <Heart size={14} className={inWish ? 'fill-white' : ''} />
        </button>
      </Link>
      <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] text-primary-500 dark:text-primary-400 font-extrabold uppercase tracking-wider">
            {product.category}
          </span>
          <Link
            to={`/products/${product.id}`}
            className="block font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1 hover:text-primary-500 transition-colors"
          >
            {product.title}
          </Link>
        </div>

        {explanation && (
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/30 p-2 rounded-xl text-[10px] text-purple-700 dark:text-purple-300 flex items-start space-x-1">
            <Sparkles size={10} className="mt-0.5 shrink-0 text-purple-500" />
            <span className="leading-tight">{explanation}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-[10px] text-slate-400 line-through ml-1">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleCartClick}
            disabled={isLoading || (product.inventory <= 0 && !inCart)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              inCart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-primary-600 text-white shadow-md hover:shadow-primary-500/20'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShoppingCart size={14} />
            )}
            <span>{inCart ? 'Go to Cart' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
