import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Heart, Star, ShoppingCart, MessageSquare, ShieldAlert, Send, ThumbsUp, AlertCircle, Smile, Frown, Meh, Eye, Loader2, CheckCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { isInCart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const inCart = product ? isInCart(product.id) : false;
  const inWish = product ? isInWishlist(product.id) : false;

  const fetchProductData = useCallback(async () => {
    setLoading(true);
    try {
      const prodRes = await API.get(`/api/products/${id}`);
      setProduct(prodRes.data);

      const revRes = await API.get(`/api/products/${id}/reviews`);
      setReviews(revRes.data);

      const recRes = await API.get(`/api/recommend/product/${id}?limit=4`);
      const detailsPromises = recRes.data.map(async (item) => {
        try {
          const detailedRes = await API.get(`/api/products/${item.productId}`);
          return { ...detailedRes.data, similarityScore: item.similarityScore, explanation: item.explanation };
        } catch { return null; }
      });
      const detailedRecs = await Promise.all(detailsPromises);
      setSimilar(detailedRecs.filter(item => item !== null));
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProductData(); }, [fetchProductData]);

  const handleCartClick = () => {
    if (inCart) {
      navigate('/cart');
      return;
    }
    if (product.inventory <= 0) {
      addToast('Product is out of stock', 'error');
      return;
    }
    setAddingToCart(true);
    addToCart(product.id, 1).finally(() => setAddingToCart(false));
  };

  const handleToggleWishlist = () => {
    if (!user) {
      addToast('Please sign in to modify wishlist', 'info');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!comment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }
    setSubmittingReview(true);
    try {
      await API.post(`/api/products/${id}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      await fetchProductData();
    } catch (err) {
      setReviewError('Failed to submit review. Try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getSentimentBadge = (sentiment, score) => {
    const scorePct = Math.round(score * 100);
    if (sentiment === 'POSITIVE') {
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">
          <Smile size={12} className="text-emerald-500" />
          <span>Positive ({scorePct}%)</span>
        </span>
      );
    } else if (sentiment === 'NEGATIVE') {
      return (
        <span className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 text-xs px-2.5 py-1 rounded-full font-bold">
          <Frown size={12} className="text-rose-500" />
          <span>Negative ({scorePct}%)</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full font-bold">
          <Meh size={12} className="text-slate-400" />
          <span>Neutral ({scorePct}%)</span>
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse shimmer-wrapper">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-200 dark:bg-slate-800 h-96 rounded-3xl w-full"></div>
          <div className="space-y-6">
            <div className="bg-slate-200 dark:bg-slate-800 h-8 rounded w-2/3"></div>
            <div className="bg-slate-200 dark:bg-slate-800 h-6 rounded w-1/4"></div>
            <div className="bg-slate-200 dark:bg-slate-800 h-24 rounded w-full"></div>
            <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-2" />
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/shop" className="text-primary-600 underline mt-2 block">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-96 shadow-lg group">
          <img
            src={product.images?.[0] || product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.compareAtPrice && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
            </span>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-primary-500 dark:text-primary-400 font-extrabold uppercase tracking-widest">
                  {product.category}
                </span>
                {product.brand && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{product.brand}</span>
                  </>
                )}
              </div>
              <button
                onClick={handleToggleWishlist}
                className={`p-2.5 rounded-xl border transition-all ${
                  inWish
                    ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30'
                    : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-200'
                }`}
                title={inWish ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} className={inWish ? 'fill-rose-500' : ''} />
              </button>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              {product.averageRating > 0 ? (
                <div className="flex items-center space-x-1">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < Math.round(product.averageRating) ? 'fill-yellow-400' : 'text-slate-300 dark:text-slate-700'} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{product.averageRating.toFixed(1)} / 5.0</span>
                  <span className="text-xs text-slate-400 font-medium">({product.reviewCount || reviews.length})</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-semibold">No reviews yet</span>
              )}
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                product.inventory > 0
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
              }`}>
                {product.inventory > 0 ? `${product.inventory} In Stock` : 'Out of Stock'}
              </span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed pt-2">
              {product.description}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-900">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-slate-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCartClick}
                disabled={addingToCart || (product.inventory <= 0 && !inCart)}
                className={`flex-grow py-3 px-6 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  inCart
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 hover:shadow-emerald-500/35'
                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20 hover:shadow-primary-500/30'
                } disabled:opacity-50 hover:-translate-y-0.5`}
              >
                {addingToCart ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                <span>{inCart ? 'Go to Cart' : product.inventory <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="bg-purple-100 dark:bg-purple-950/40 p-2 rounded-xl text-purple-600 dark:text-purple-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Similar Products You May Like</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Recommended using TF-IDF text features & Cosine Similarity matching</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similar.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                showMatch
                matchScore={prod.similarityScore}
                explanation={prod.explanation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-slate-200 dark:border-slate-900 pt-12">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Customer Reviews</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Submit your rating and feedback below</p>
          </div>

          {user ? (
            <form onSubmit={handleReviewSubmit} className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-sm">Write a Review</h3>

              {reviewError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle size={14} />
                  <span>{reviewError}</span>
                </div>
              )}
              {reviewSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle size={14} />
                  <span>Review submitted successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Rating</label>
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="text-yellow-400 hover:scale-110 transition-transform">
                      <Star size={24} className={star <= rating ? 'fill-yellow-400' : 'text-slate-300 dark:text-slate-700'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1" htmlFor="comment">Your Feedback</label>
                <textarea
                  id="comment"
                  rows={4}
                  required
                  placeholder="Share your experience (our AI will analyze the sentiment!)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all text-sm font-medium"
                />
              </div>

              <button type="submit" disabled={submittingReview} className="w-full bg-slate-900 hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all">
                {submittingReview ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <><Send size={14} /><span>Submit Review</span></>
                )}
              </button>
            </form>
          ) : (
            <div className="p-6 bg-slate-100/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <MessageSquare className="mx-auto text-slate-400" />
              <p className="text-xs text-slate-500 font-bold">Please sign in to leave a review</p>
              <Link to="/login" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs inline-block transition-colors">Sign In</Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-900 pb-3">Reviews ({reviews.length})</h3>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 p-5 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm block">{rev.userName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < rev.rating ? 'fill-yellow-400' : 'text-slate-200 dark:text-slate-800'} />
                        ))}
                      </div>
                      {getSentimentBadge(rev.sentiment, rev.confidenceScore)}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">No feedback yet for this product. Be the first to review!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
