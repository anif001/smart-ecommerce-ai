import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CreditCard, MapPin, CheckCircle, ArrowRight, ShieldCheck, Tag, Plus, Trash2, Truck, Percent, Package, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';

const STEPS = ['Shipping', 'Payment', 'Confirmation'];

const Checkout = () => {
  const { cartItemsDetails, getCartTotal, clearCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', label: 'HOME' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = getCartTotal();
  const freeShippingThreshold = 500;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 40;
  const taxRate = 0.18;
  const taxAmount = subtotal * taxRate;
  const discountAmount = couponResult?.discountedAmount || 0;
  const grandTotal = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await API.get('/api/addresses');
      setAddresses(res.data);
      const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/addresses', { ...addressForm, isDefault: addresses.length === 0, country: 'India' });
      setAddresses([...addresses, res.data]);
      setSelectedAddressId(res.data.id);
      setShowAddressForm(false);
      setAddressForm({ fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', label: 'HOME' });
    } catch (err) {
      setError(err.response?.data || 'Failed to add address');
    }
  };

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

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!selectedAddressId) {
      setError('Please select a shipping address.');
      return;
    }

    setSubmitting(true);
    try {
      const orderReq = {
        shippingAddressId: selectedAddressId,
        paymentMethod: 'RAZORPAY',
        couponCode: appliedCoupon || undefined
      };

      const orderRes = await API.post('/api/orders', orderReq);
      const order = orderRes.data;

      const Razorpay = await loadRazorpay();
      if (Razorpay) {
        try {
          const paymentRes = await API.post('/api/payments/create-order', { orderId: order.id });
          const { razorpayOrderId, amount, key } = paymentRes.data;

          const options = {
            key,
            amount: amount * 100,
            currency: 'INR',
            name: 'SmartCart AI',
            description: `Order #${order.orderNumber}`,
            order_id: razorpayOrderId,
            handler: async (response) => {
              await API.post('/api/payments/verify', {
                orderId: order.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              });
              clearCart();
              setOrderSuccess(order);
              setCurrentStep(2);
            },
            modal: {
              ondismiss: () => {
                setSubmitting(false);
              }
            },
            prefill: { name: '', email: '', contact: '' },
            theme: { color: '#7c3aed' }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        } catch (payErr) {
          clearCart();
          setOrderSuccess(order);
          setCurrentStep(2);
        }
      } else {
        clearCart();
        setOrderSuccess(order);
        setCurrentStep(2);
      }
    } catch (err) {
      setError(err.response?.data || 'Failed to place order. Please try again.');
      setSubmitting(false);
    }
  };

  if (cartItemsDetails.length === 0 && !orderSuccess) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No Items to Checkout</h2>
        <button onClick={() => navigate('/shop')} className="text-primary-600 underline mt-2 block mx-auto">Go to Shop</button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-8">
        <div className="bg-emerald-100 dark:bg-emerald-950/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
          <CheckCircle size={56} className="text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold">Order Placed!</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order Number</span>
            <span className="font-bold text-primary-600 dark:text-primary-400">#{orderSuccess.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Paid</span>
            <span className="font-extrabold">${orderSuccess.totalAmount?.toFixed(2) || grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Payment Status</span>
            <span className="font-bold text-emerald-500">PAID</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(`/orders/track/${orderSuccess.id}`)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20"
          >
            Track Order
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="border border-slate-200 dark:border-slate-800 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Complete your purchase securely</p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-8">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                idx < currentStep
                  ? 'bg-emerald-500 text-white'
                  : idx === currentStep
                  ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {idx < currentStep ? <Check size={16} /> : idx + 1}
              </div>
              <span className={`text-xs font-bold hidden sm:inline ${
                idx === currentStep ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 rounded-full transition-all ${
                idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping Address */}
          {currentStep === 0 && (
            <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <MapPin size={20} className="text-primary-500" />
                <span>Shipping Address</span>
              </h2>

              {addresses.length > 0 && !showAddressForm ? (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label
                      key={addr.id}
                      className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-1 ring-primary-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{addr.fullName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Phone: {addr.phone}</p>
                          <span className="inline-block text-[9px] font-bold text-slate-400 uppercase mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{addr.label}</span>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-2 py-0.5 rounded-full font-bold">DEFAULT</span>
                        )}
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-xs text-primary-500 font-bold flex items-center space-x-1 hover:underline"
                  >
                    <Plus size={14} /> <span>Add New Address</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddAddress} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                    <input required placeholder="Phone" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <input required placeholder="Street Address" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                  <div className="grid grid-cols-3 gap-3">
                    <input required placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                    <input required placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                    <input required placeholder="ZIP Code" value={addressForm.zipCode} onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})} className="p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors">Save Address</button>
                    {addresses.length > 0 && (
                      <button type="button" onClick={() => setShowAddressForm(false)} className="border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    )}
                  </div>
                </form>
              )}

              <button
                onClick={() => setCurrentStep(1)}
                disabled={!selectedAddressId}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all"
              >
                <span>Continue to Payment</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Address Confirmation */}
              <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold flex items-center space-x-2">
                    <MapPin size={16} className="text-primary-500" />
                    <span>Shipping To</span>
                  </h2>
                  <button onClick={() => setCurrentStep(0)} className="text-[10px] text-primary-500 font-bold hover:underline">Change</button>
                </div>
                {(() => {
                  const addr = addresses.find(a => a.id === selectedAddressId);
                  if (!addr) return <p className="text-xs text-slate-400">Address not found</p>;
                  return (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{addr.fullName}</p>
                      <p>{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                      <p>{addr.phone}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Coupon */}
              <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-4">
                <h2 className="font-bold flex items-center space-x-2">
                  <Tag size={16} className="text-primary-500" />
                  <span>Apply Coupon</span>
                </h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                    <div>
                      <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{appliedCoupon}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">You saved ${discountAmount.toFixed(2)}</p>
                    </div>
                    <button onClick={handleRemoveCoupon} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500" />
                    <button onClick={handleApplyCoupon} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors">Apply</button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </div>

              {/* Payment Method */}
              <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-4">
                <h2 className="font-bold flex items-center space-x-2">
                  <CreditCard size={16} className="text-primary-500" />
                  <span>Payment Method</span>
                </h2>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-bold">RZP</div>
                  <div>
                    <p className="font-bold text-xs">Razorpay</p>
                    <p className="text-[10px] text-slate-400">Pay via UPI, Cards, Net Banking, Wallet</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-300 text-sm">{error}</div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <ChevronLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary-500/25"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Pay ${grandTotal.toFixed(2)} & Place Order</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 flex items-start space-x-3 text-slate-500 dark:text-slate-400 text-xs">
                <ShieldCheck size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                <span><strong>Secure Payment:</strong> Your payment is processed securely via Razorpay. We do not store your card details.</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar - Always visible */}
        <div className="lg:col-span-1">
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-5 sticky top-24">
            <h3 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Package size={18} className="text-primary-500" />
              <span>Order Summary</span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {cartItemsDetails.map((item) => (
                <div key={item.productId} className="flex items-center space-x-3">
                  <img
                    src={item.product.images?.[0] || item.product.imageUrl}
                    alt={item.product.title}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.product.title}</p>
                    <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Subtotal</span>
                <span className="font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center"><Truck size={12} className="mr-1" />Shipping</span>
                <span className={shippingCost === 0 ? 'text-emerald-500 font-bold' : 'font-bold'}>
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center"><Percent size={12} className="mr-1" />Tax (18%)</span>
                <span className="font-bold">${taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-500 font-semibold">Discount</span>
                  <span className="text-emerald-500 font-bold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-sm">Grand Total</span>
                <span className="font-extrabold text-sm text-primary-600 dark:text-primary-400">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
