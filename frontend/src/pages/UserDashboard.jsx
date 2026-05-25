import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { User, ShoppingBag, Eye, Sparkles, ChevronRight, Award, Key, Mail, Clock, Calendar } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  // States
  const [orders, setOrders] = useState([]);
  const [recentViewed, setRecentViewed] = useState([]);
  const [personalRecs, setPersonalRecs] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingViewed, setLoadingViewed] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const res = await API.get('/api/orders');
        setOrders(res.data);
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    const fetchViewed = async () => {
      try {
        // Fetch fresh profile to get the latest recentlyViewed IDs
        const profileRes = await API.get('/api/auth/profile');
        const viewedIds = profileRes.data.recentlyViewed || [];
        
        const detailsPromises = viewedIds.map(async (id) => {
          try {
            const prodRes = await API.get(`/api/products/${id}`);
            return prodRes.data;
          } catch (err) {
            return null;
          }
        });
        const products = await Promise.all(detailsPromises);
        setRecentViewed(products.filter(p => p !== null));
      } catch (err) {
        console.error("Failed to load user viewed items:", err);
      } finally {
        setLoadingViewed(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const res = await API.get(`/api/recommend/user/${user.id}?limit=4`);
        const detailsPromises = res.data.map(async (item) => {
          try {
            const prodRes = await API.get(`/api/products/${item.productId}`);
            return {
              ...prodRes.data,
              explanation: item.explanation
            };
          } catch (err) {
            return null;
          }
        });
        const products = await Promise.all(detailsPromises);
        setPersonalRecs(products.filter(p => p !== null));
      } catch (err) {
        console.error("Failed to load personal recs:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchOrders();
    fetchViewed();
    fetchRecommendations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-12">
      {/* Header Profile Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30 p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center border-4 border-primary-50">
            <User size={36} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="text-sm text-slate-400 font-semibold flex items-center mt-1 justify-center sm:justify-start">
              <Mail size={14} className="mr-1" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>
        <div className="bg-primary-50 dark:bg-primary-950/20 px-4 py-2 border border-primary-100 dark:border-primary-900/30 rounded-xl text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center space-x-1.5 shadow-sm">
          <Award size={16} />
          <span>Loyal Shopper (ROLE_USER)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Left Columns: Orders and recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order history */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <ShoppingBag size={20} className="text-primary-500" />
              <span>Recent Transactions</span>
            </h2>

            {loadingOrders ? (
              <div className="space-y-3 shimmer-wrapper">
                <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-full"></div>
                <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-full"></div>
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3">Order Ref</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 font-bold">#{order.id.substring(0, 8)}...</td>
                        <td className="py-3.5 text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'DELIVERED' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link 
                            to={`/orders/track/${order.id}`}
                            className="text-primary-500 hover:text-primary-600 inline-flex items-center space-x-0.5"
                          >
                            <span>Track</span>
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                You haven't placed any orders yet.
              </div>
            )}
          </div>

          {/* User Custom recommendations */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Sparkles size={20} className="text-purple-500 animate-pulse" />
              <span>Recommended For You</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {loadingRecs ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="bg-slate-200 dark:bg-slate-800 h-48 rounded-2xl w-full shimmer-wrapper"></div>
                ))
              ) : personalRecs.length > 0 ? (
                personalRecs.map((prod) => (
                  <div key={prod.id} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden hover:shadow-lg transition-all p-4 flex space-x-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img src={prod.images?.[0] || prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <span className="text-[10px] text-primary-500 font-bold uppercase">{prod.category}</span>
                        <Link to={`/products/${prod.id}`} className="block font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1 hover:text-primary-500 transition-colors">
                          {prod.title}
                        </Link>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1 leading-tight">{prod.explanation}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-850">
                        <span className="font-extrabold text-xs">${prod.price.toFixed(2)}</span>
                        <button 
                          onClick={() => addToCart(prod.id, 1)}
                          className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all hover:bg-primary-600"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-400 text-xs">
                  No customized suggestions. Browse around some items first!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Panel Right: Recently viewed items */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-bold flex items-center space-x-2 border-b border-slate-100 dark:border-slate-855 pb-3">
              <Eye size={18} className="text-slate-400" />
              <span>Browse History</span>
            </h2>

            {loadingViewed ? (
              <div className="space-y-3 shimmer-wrapper">
                <div className="bg-slate-200 dark:bg-slate-800 h-14 rounded w-full"></div>
                <div className="bg-slate-200 dark:bg-slate-800 h-14 rounded w-full"></div>
              </div>
            ) : recentViewed.length > 0 ? (
              <div className="space-y-4">
                {recentViewed.map((prod) => (
                  <div key={prod.id} className="flex items-center space-x-3 text-xs">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <img src={prod.images?.[0] || prod.imageUrl} alt={prod.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <Link to={`/products/${prod.id}`} className="font-bold block hover:text-primary-500 transition-colors line-clamp-1">
                        {prod.title}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">${prod.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                History is empty.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
