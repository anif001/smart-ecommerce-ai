import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, X, Trash2, Plus, Minus } from 'lucide-react';

const FloatingCart = () => {
  const { cartItemsDetails, getCartCount, getCartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const count = getCartCount();
  const total = getCartTotal();

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 scale-90' : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-110'
        }`}
      >
        <ShoppingCart size={22} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm">Cart ({count})</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto p-3 space-y-2">
            {cartItemsDetails.length > 0 ? (
              cartItemsDetails.map(item => (
                <div key={item.productId} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <img
                    src={item.product.images?.[0] || item.product.imageUrl}
                    alt={item.product.title}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{item.product.title}</p>
                    <p className="text-[10px] text-slate-400">${item.product.price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Your cart is empty</p>
            )}
          </div>

          {cartItemsDetails.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-500">Total</span>
                <span className="font-extrabold text-primary-600 dark:text-primary-400">${total.toFixed(2)}</span>
              </div>
              <button
                onClick={() => { setIsOpen(false); navigate('/checkout'); }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Checkout
              </button>
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="block text-center text-[10px] text-primary-500 hover:underline font-bold"
              >
                View Full Cart
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingCart;
