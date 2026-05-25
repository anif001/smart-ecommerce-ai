import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Plus, Edit, Trash2, DollarSign, ShoppingCart, Users, Package, AlertTriangle, Sparkles, CheckCircle, BarChart3, CheckSquare, Settings, RefreshCw, Layers, Tag, XCircle, RotateCcw } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics');

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'Electronics', price: '', imageUrl: '', inventory: '', description: '', tags: '', brand: '' });
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', minimumOrderAmount: '', maxDiscountAmount: '', usageLimit: '', validFrom: '', validUntil: '', isActive: true, category: 'ALL' });
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const fetchDashboardData = async () => {
    setLoadingMetrics(true);
    try {
      const [metricsRes, prodRes, ordRes, coupRes, usrRes] = await Promise.all([
        API.get('/api/admin/analytics'),
        API.get('/api/products?size=50'),
        API.get('/api/admin/orders'),
        API.get('/api/admin/coupons'),
        API.get('/api/admin/users')
      ]);
      setMetrics(metricsRes.data);
      setProducts(prodRes.data.content);
      setOrders(ordRes.data.content || ordRes.data);
      setCoupons(coupRes.data);
      setUsersList(usrRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => { if (user) fetchDashboardData(); }, [user]);

  const handleTriggerRetrain = async () => {
    setIsRetraining(true);
    try {
      await API.post('/api/admin/products/retrain');
      alert("ML recommendation engine retrained successfully!");
    } catch {
      alert("Retrain triggered (ML service may be offline, using DB fallback)");
    } finally {
      setIsRetraining(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      fetchDashboardData();
    } catch (err) { console.error("Failed to update status:", err); }
  };

  const handleApproveReturn = async (orderId) => {
    try {
      await API.post(`/api/admin/orders/${orderId}/approve-return`);
      fetchDashboardData();
    } catch (err) { console.error("Failed to approve return:", err); }
  };

  const handleRejectReturn = async (orderId) => {
    try {
      await API.post(`/api/admin/orders/${orderId}/reject-return`);
      fetchDashboardData();
    } catch (err) { console.error("Failed to reject return:", err); }
  };

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormData({ title: '', category: 'Electronics', price: '', imageUrl: '', inventory: '', description: '', tags: '', brand: '' });
    setShowProductForm(true);
  };

  const handleOpenEditForm = (prod) => {
    setEditingProduct(prod);
    setFormData({ title: prod.title, category: prod.category, price: prod.price.toString(), imageUrl: prod.images?.[0] || '', inventory: prod.inventory.toString(), description: prod.description, tags: (prod.tags || []).join(', '), brand: prod.brand || '' });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm("Delete this product?")) return;
    try { await API.delete(`/api/admin/products/${prodId}`); fetchDashboardData(); }
    catch (err) { console.error("Failed to delete product:", err); }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProduct(true);
    const payload = { title: formData.title, category: formData.category, price: parseFloat(formData.price), images: formData.imageUrl ? [formData.imageUrl] : [], inventory: parseInt(formData.inventory), description: formData.description, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean), brand: formData.brand };
    try {
      if (editingProduct) await API.put(`/api/admin/products/${editingProduct.id}`, payload);
      else await API.post('/api/admin/products', payload);
      setShowProductForm(false);
      fetchDashboardData();
    } catch (err) { console.error("Product submit failed:", err); }
    finally { setSubmittingProduct(false); }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCoupon(true);
    try {
      await API.post('/api/coupons', {
        code: couponForm.code, description: couponForm.description, discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue), minimumOrderAmount: parseFloat(couponForm.minimumOrderAmount) || 0,
        maxDiscountAmount: parseFloat(couponForm.maxDiscountAmount) || null, usageLimit: parseInt(couponForm.usageLimit) || null,
        validFrom: couponForm.validFrom ? new Date(couponForm.validFrom).toISOString() : new Date().toISOString(),
        validUntil: couponForm.validUntil ? new Date(couponForm.validUntil).toISOString() : new Date(Date.now() + 365*86400000).toISOString(),
        isActive: true, category: couponForm.category
      });
      setShowCouponForm(false);
      setCouponForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', minimumOrderAmount: '', maxDiscountAmount: '', usageLimit: '', validFrom: '', validUntil: '', isActive: true, category: 'ALL' });
      fetchDashboardData();
    } catch (err) { alert(err.response?.data || 'Failed to create coupon'); }
    finally { setSubmittingCoupon(false); }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try { await API.delete(`/api/coupons/${id}`); fetchDashboardData(); }
    catch (err) { console.error(err); }
  };

  const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
  const getCategoryChartData = () => metrics?.salesByCategory ? Object.entries(metrics.salesByCategory).map(([k, v]) => ({ name: k, value: Math.round(v * 100) / 100 })) : [];
  const getSentimentChartData = () => metrics?.reviewSentimentDistribution ? Object.entries(metrics.reviewSentimentDistribution).map(([k, v]) => ({ name: k, reviews: v })) : [];
  const getMonthlySalesData = () => metrics?.monthlySales ? Object.entries(metrics.monthlySales).map(([k, v]) => ({ name: k.split(' ')[0], sales: v })) : [];
  const getOrdersByStatusData = () => metrics?.ordersByStatus ? Object.entries(metrics.ordersByStatus).map(([k, v]) => ({ name: k, value: v })) : [];

  if (!user) return null;

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Full e-commerce management control panel</p>
        </div>
        <button onClick={handleTriggerRetrain} disabled={isRetraining} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/10">
          <RefreshCw size={14} className={isRetraining ? 'animate-spin' : ''} /><span>Retrain ML Engine</span>
        </button>
      </div>

      {!loadingMetrics && metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-4 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl"><DollarSign size={24} /></div>
            <div><span className="text-xs text-slate-400 font-bold block uppercase">Revenue</span><span className="text-xl font-extrabold">${metrics.totalRevenue?.toFixed(2)}</span></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl"><ShoppingCart size={24} /></div>
            <div><span className="text-xs text-slate-400 font-bold block uppercase">Orders</span><span className="text-xl font-extrabold">{metrics.totalOrders}</span></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-4 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl"><Users size={24} /></div>
            <div><span className="text-xs text-slate-400 font-bold block uppercase">Users</span><span className="text-xl font-extrabold">{metrics.totalUsers}</span></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-4 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl"><Package size={24} /></div>
            <div><span className="text-xs text-slate-400 font-bold block uppercase">Products</span><span className="text-xl font-extrabold">{metrics.totalProducts}</span></div>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
          { key: 'products', label: 'Products', icon: Package },
          { key: 'orders', label: 'Orders', icon: CheckSquare },
          { key: 'coupons', label: 'Coupons', icon: Tag },
          { key: 'users', label: 'Users', icon: Users },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-6 font-bold text-sm border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === tab.key ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}>
            <tab.icon size={16} /><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loadingMetrics ? (
        <div className="py-20 text-center animate-pulse"><div className="bg-slate-200 dark:bg-slate-800 h-24 rounded-2xl w-full"></div></div>
      ) : (
        <>
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-1.5"><Layers size={16} /><span>Sales by Category</span></h3>
                <div className="h-64">
                  {getCategoryChartData().length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={getCategoryChartData()} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">{getCategoryChartData().map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => `$${v}`} /><Legend verticalAlign="bottom" height={36} /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-1.5"><Sparkles size={16} /><span>Review Sentiment</span></h3>
                <div className="h-64">
                  {getSentimentChartData().length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={getSentimentChartData()}><CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} /><XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} /><YAxis stroke="#64748b" fontSize={10} tickLine={false} /><Tooltip /><Bar dataKey="reviews" radius={[8, 8, 0, 0]}>{getSentimentChartData().map((e) => { let c = '#64748b'; if (e.name === 'POSITIVE') c = '#10b981'; if (e.name === 'NEGATIVE') c = '#f43f5e'; return <Cell fill={c} />; })}</Bar></BarChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-1.5"><BarChart3 size={16} /><span>Monthly Sales (6 Months)</span></h3>
                <div className="h-64">
                  {getMonthlySalesData().length > 0 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={getMonthlySalesData()}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="name" stroke="#64748b" fontSize={10} /><YAxis stroke="#64748b" fontSize={10} /><Tooltip /><Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} /></LineChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center space-x-1.5"><ShoppingCart size={16} /><span>Orders by Status</span></h3>
                <div className="h-64">
                  {getOrdersByStatusData().length > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={getOrdersByStatusData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>{getOrdersByStatusData().map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>}
                </div>
              </div>
              {metrics?.lowStockProducts?.length > 0 && (
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-rose-500 flex items-center space-x-1.5"><AlertTriangle size={16} /><span>Low Stock Alarms (&lt; 10 units)</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {metrics.lowStockProducts.map(prod => (
                      <div key={prod.id} className="p-4 border border-rose-100 dark:border-rose-950/20 bg-rose-50/30 dark:bg-rose-950/5 rounded-xl flex items-center justify-between text-xs font-bold">
                        <span className="line-clamp-1 max-w-[70%]">{prod.title}</span>
                        <span className="text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{prod.inventory} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Products ({products.length})</h3>
                <button onClick={handleOpenAddForm} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-md"><Plus size={16} /><span>Add Product</span></button>
              </div>
              {showProductForm && (
                <form onSubmit={handleProductSubmit} className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 animate-slide-up">
                  <h4 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-2">{editingProduct ? 'Edit Product' : 'Add Product'}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Title</label><input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Category</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none"><option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option></select></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Brand</label><input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Price ($)</label><input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Inventory</label><input type="number" required value={formData.inventory} onChange={e => setFormData({...formData, inventory: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Image URL</label><input type="url" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  </div>
                  <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tags (comma-separated)</label><input type="text" placeholder="gaming, mouse, pc" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Description</label><textarea rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  <div className="flex space-x-3 justify-end text-xs">
                    <button type="button" onClick={() => setShowProductForm(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold">Cancel</button>
                    <button type="submit" disabled={submittingProduct} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold flex items-center space-x-1">
                      {submittingProduct && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              )}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase">
                        <th className="p-4">Image</th><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Rating</th><th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold">
                      {products.map(prod => (
                        <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-4"><img src={prod.images?.[0] || prod.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" /></td>
                          <td className="p-4 font-bold max-w-[200px] truncate">{prod.title}</td>
                          <td className="p-4 text-slate-400">{prod.category}</td>
                          <td className="p-4">${prod.price.toFixed(2)}</td>
                          <td className="p-4"><span className={prod.inventory < 10 ? 'text-red-500 font-bold' : ''}>{prod.inventory}</span></td>
                          <td className="p-4">{prod.averageRating > 0 ? `${prod.averageRating} ⭐` : '—'}</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleOpenEditForm(prod)} className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary-500 rounded-lg"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="p-1.5 border border-red-100 text-red-500 dark:border-red-950/10 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase">
                      <th className="p-4">Order #</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Payment</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="p-4 font-bold">{order.orderNumber || order.id.substring(0, 10)}</td>
                        <td className="p-4 text-slate-400">{order.items?.reduce((s, i) => s + i.quantity, 0)} items</td>
                        <td className="p-4">${order.totalAmount?.toFixed(2)}</td>
                        <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{order.paymentStatus}</span></td>
                        <td className="p-4">
                          {order.status === 'RETURN_REQUESTED' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">RETURN REQ</span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                              order.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                              order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>{order.status}</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {order.status === 'RETURN_REQUESTED' ? (
                            <div className="flex space-x-1 justify-end">
                              <button onClick={() => handleApproveReturn(order.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold"><RotateCcw size={14} /></button>
                              <button onClick={() => handleRejectReturn(order.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><XCircle size={14} /></button>
                            </div>
                          ) : (
                            <select value={order.status} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="p-1.5 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded outline-none font-bold cursor-pointer text-[10px]">
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COUPONS TAB */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Coupons ({coupons.length})</h3>
                <button onClick={() => setShowCouponForm(!showCouponForm)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-md"><Plus size={16} /><span>Add Coupon</span></button>
              </div>
              {showCouponForm && (
                <form onSubmit={handleCouponSubmit} className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 animate-slide-up">
                  <h4 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-2">Create Coupon</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Code</label><input type="text" required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Discount Type</label><select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none"><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed ($)</option></select></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Discount Value</label><input type="number" step="0.01" required value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Min Order ($)</label><input type="number" step="0.01" value={couponForm.minimumOrderAmount} onChange={e => setCouponForm({...couponForm, minimumOrderAmount: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Max Discount ($)</label><input type="number" step="0.01" value={couponForm.maxDiscountAmount} onChange={e => setCouponForm({...couponForm, maxDiscountAmount: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Usage Limit</label><input type="number" value={couponForm.usageLimit} onChange={e => setCouponForm({...couponForm, usageLimit: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valid From</label><input type="date" value={couponForm.validFrom} onChange={e => setCouponForm({...couponForm, validFrom: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                    <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valid Until</label><input type="date" value={couponForm.validUntil} onChange={e => setCouponForm({...couponForm, validUntil: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  </div>
                  <div><label className="block text-xs font-bold uppercase text-slate-400 mb-1">Description</label><textarea rows={2} value={couponForm.description} onChange={e => setCouponForm({...couponForm, description: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs outline-none" /></div>
                  <div className="flex space-x-3 justify-end text-xs">
                    <button type="button" onClick={() => setShowCouponForm(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold">Cancel</button>
                    <button type="submit" disabled={submittingCoupon} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">{submittingCoupon ? 'Creating...' : 'Create Coupon'}</button>
                  </div>
                </form>
              )}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase">
                      <th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Min Order</th><th className="p-4">Used</th><th className="p-4">Valid Until</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold">
                    {coupons.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-primary-500">{c.code}</td>
                        <td className="p-4">{c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                        <td className="p-4">${c.minimumOrderAmount || 0}</td>
                        <td className="p-4">{c.usedCount || 0}/{c.usageLimit || '∞'}</td>
                        <td className="p-4">{new Date(c.validUntil).toLocaleDateString()}</td>
                        <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{c.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                        <td className="p-4 text-right"><button onClick={() => handleDeleteCoupon(c.id)} className="p-1.5 border border-red-100 text-red-500 rounded-lg"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-semibold uppercase">
                    <th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30 font-semibold">
                  {usersList.content?.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">{u.name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ROLE_ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}</span></td>
                      <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )) || <tr><td className="p-4 text-slate-400" colSpan={4}>Loading...</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
