import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, ShoppingBag, ArrowRight, Bookmark, Tag, Percent, Truck, ShieldCheck, ArrowLeft, Heart, Clock } from 'lucide-react';
import API from '../services/api';

const Cart = () => {
  const { cartItemsDetails, savedItemsDetails, loading, updateQuantity, removeFromCart, moveToSavedForLater, moveToCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 40;
  const taxAmount = subtotal * 0.18;
  const discountAmount = couponResult?.discountedAmount || 0;
  const total = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount);
  const savings = subtotal - total;
  const itemCount = cartItemsDetails.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponResult(null);
    try {
      const res = await API.post('/api/coupons/apply', { code: couponCode, orderAmount: subtotal + shippingCost + taxAmount });
      setCouponResult(res.data);
      setAppliedCoupon(couponCode);
    } catch (err) {
      setCouponError(err.response?.data || 'Invalid coupon');
      setCouponResult(null);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponResult(null);
    setAppliedCoupon(null);
    setCouponError('');
  };

  if (loading && cartItemsDetails.length === 0 && savedItemsDetails.length === 0) {
    return (
      <div className="text-center py-20 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-1/4 mx-auto mb-4"></div>
        <div className="bg-slate-200 dark:bg-slate-800 h-48 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Shopping Cart</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {itemCount > 0
              ? `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`
              : 'Your cart is empty'}
          </p>
        </div>
        <Link to="/shop" className="text-sm text-primary-500 hover:text-primary-600 font-bold flex items-center space-x-1 transition-colors">
          <ArrowLeft size={16} />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {cartItemsDetails.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Items Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {cartItemsDetails.map((item) => (
              <div key={item.productId} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-4 rounded-2xl hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6 flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img
                        src={item.product.images?.[0] || item.product.imageUrl}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.productId}`}
                        className="font-bold text-sm hover:text-primary-500 transition-colors line-clamp-1"
                      >
                        {item.product.title}
                      </Link>
                      <span className="text-[10px] text-primary-500 dark:text-primary-400 font-extrabold uppercase block mt-0.5">
                        {item.product.category}
                      </span>
                      {item.product.brand && (
                        <span className="text-[10px] text-slate-400 block">{item.product.brand}</span>
                      )}
                      {item.variant && (
                        <span className="text-[10px] text-primary-500 font-semibold block mt-0.5">
                          Variant: {item.variant}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex sm:justify-center">
                    <div className="flex items-center space-x-0.5 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950">
                      <button
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-8 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2 text-center">
                    <span className="font-semibold text-sm text-slate-500 dark:text-slate-400">
                      ${item.product.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end space-x-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveToSavedForLater(item.productId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Save for later"
                      >
                        <Bookmark size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Free shipping progress */}
            {shippingCost > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl">
                <div className="flex items-center space-x-2 text-xs text-amber-700 dark:text-amber-400 font-semibold mb-2">
                  <Truck size={14} />
                  <span>Add ${(freeShippingThreshold - subtotal).toFixed(2)} more for FREE shipping!</span>
                </div>
                <div className="w-full bg-amber-200/50 dark:bg-amber-900/30 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Saved For Later */}
            {savedItemsDetails.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-base mb-4 flex items-center space-x-2">
                  <Bookmark size={16} className="text-primary-500" />
                  <span>Saved for Later ({savedItemsDetails.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedItemsDetails.map((item) => (
                    <div key={item.productId} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/40 p-3 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          <img
                            src={item.product.images?.[0] || item.product.imageUrl}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">{item.product.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            ${item.product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => moveToCart(item.productId)}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 hover:underline shrink-0"
                      >
                        Move to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-5 sticky top-24">
              <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
                <ShoppingBag size={18} className="text-primary-500" />
                <span>Order Summary</span>
              </h3>

              {/* Coupon */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl mb-3">
                    <div>
                      <p className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                        <Tag size={12} />
                        <span>{appliedCoupon}</span>
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                        -${discountAmount.toFixed(2)} discount applied
                      </p>
                    </div>
                    <button onClick={handleRemoveCoupon} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-1 mb-3">
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-primary-500 font-medium"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center space-x-1 mb-2">
                    <span>&bull;</span>
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                    <Truck size={12} className="mr-1" />Shipping
                  </span>
                  <span className={shippingCost === 0 ? 'text-emerald-500 font-bold' : 'font-bold'}>
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                    <Percent size={12} className="mr-1" />Tax (18%)
                  </span>
                  <span className="font-bold">${taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-500 font-medium">Discount</span>
                    <span className="text-emerald-500 font-bold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
                  <span className="font-extrabold text-base">Total</span>
                  <span className="font-extrabold text-base text-primary-600 dark:text-primary-400">
                    ${total.toFixed(2)}
                  </span>
                </div>
                {savings > 0 && (
                  <p className="text-[10px] text-emerald-500 font-semibold text-center">
                    You save ${savings.toFixed(2)} on this order!
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35 hover:-translate-y-0.5"
              >
                <CreditCard size={18} />
                <span>Proceed to Checkout</span>
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400">
                <ShieldCheck size={12} />
                <span>Secure checkout with Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-8 max-w-lg mx-auto space-y-6">
          <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingCart size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your Cart is Empty</h2>
            <p className="text-sm text-slate-400 mt-2">
              Looks like you haven't added anything to your cart yet.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl text-sm inline-flex items-center space-x-2 shadow-md shadow-primary-500/10 transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag size={16} />
              <span>Explore Products</span>
            </Link>
            {savedItemsDetails.length > 0 && (
              <button
                onClick={() => moveToCart(savedItemsDetails[0]?.productId)}
                className="border border-slate-200 dark:border-slate-800 font-bold py-3 px-8 rounded-xl text-sm inline-flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Heart size={16} />
                <span>View Saved Items</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
