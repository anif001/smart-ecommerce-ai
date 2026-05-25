import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { Truck, Package, Clock, CheckCircle2, AlertCircle, ShoppingBag, XCircle, RotateCcw, MapPin } from 'lucide-react';

const statusIcons = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  RETURN_REQUESTED: RotateCcw,
  RETURN_APPROVED: RotateCcw,
  RETURN_REJECTED: XCircle,
};

const statusColors = {
  PENDING: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
  CONFIRMED: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30',
  PROCESSING: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30',
  SHIPPED: 'text-primary-500 bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/30',
  DELIVERED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30',
  CANCELLED: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30',
  RETURN_REQUESTED: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30',
};

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await API.get(`/api/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError(err.response?.data || 'Failed to retrieve order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 h-10 rounded w-1/4 mb-4"></div>
        <div className="bg-slate-200 dark:bg-slate-800 h-40 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md mx-auto p-8 space-y-4">
        <AlertCircle size={40} className="mx-auto text-red-500" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-sm text-slate-400">{error || 'Order details not found.'}</p>
        <Link to="/" className="bg-slate-900 text-white font-bold py-2 px-5 rounded-xl text-xs inline-block">Go Home</Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const isReturned = order.status === 'RETURN_REQUESTED' || order.returnStatus === 'APPROVED';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Track Order</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Order #<span className="font-bold text-primary-500">{order.orderNumber}</span></p>
        </div>
        <Link to="/dashboard" className="text-xs font-bold text-primary-500 hover:underline">&larr; Back to Dashboard</Link>
      </div>

      {/* Status Banner */}
      <div className={`p-6 rounded-2xl border ${statusColors[order.status] || 'text-slate-500 bg-slate-50 dark:bg-slate-900'}`}>
        <div className="flex items-center space-x-3">
          {React.createElement(statusIcons[order.status] || Clock, { size: 28 })}
          <div>
            <h2 className="text-xl font-extrabold">{order.status === 'CANCELLED' ? 'Order Cancelled' : order.status === 'RETURN_REQUESTED' ? 'Return Requested' : order.status}</h2>
            <p className="text-sm opacity-75">
              {isCancelled ? `Cancelled on: ${new Date(order.cancelledAt).toLocaleDateString()}` : isReturned ? `Return requested on: ${new Date(order.returnRequestedAt).toLocaleDateString()}` : `Last updated: ${new Date(order.updatedAt || order.createdAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        {order.cancellationReason && <p className="mt-3 text-sm font-medium">Reason: {order.cancellationReason}</p>}
        {order.returnReason && <p className="mt-3 text-sm font-medium">Return Reason: {order.returnReason}</p>}
      </div>

      {/* Tracking Timeline */}
      {order.tracking && order.tracking.length > 0 && (
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-6">Tracking Timeline</h3>
          <div className="relative">
            {order.tracking.map((event, idx) => {
              const Icon = statusIcons[event.status] || Clock;
              const isLast = idx === order.tracking.length - 1;
              return (
                <div key={idx} className={`flex space-x-4 pb-6 ${!isLast ? '' : ''}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center z-10 relative">
                      <Icon size={14} />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mt-1"></div>}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-bold text-sm capitalize">{event.status.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                    {event.location && <p className="text-[10px] text-slate-400 flex items-center mt-0.5"><MapPin size={10} className="mr-1" />{event.location}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">Package Items</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg text-primary-500">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <span className="font-bold block">{item.title}</span>
                      {item.variant && <span className="text-[10px] text-slate-400">{item.variant}</span>}
                      <span className="text-[10px] text-slate-400 font-semibold block">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-300">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel/Return buttons */}
          {!['CANCELLED', 'RETURN_REQUESTED', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
            <div className="flex space-x-3">
              <Link to={`/orders/cancel/${order.id}`} className="text-xs font-bold text-red-500 border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors">Cancel Order</Link>
            </div>
          )}
          {order.status === 'DELIVERED' && !order.returnRequestedAt && (
            <div className="flex space-x-3">
              <Link to={`/orders/return/${order.id}`} className="text-xs font-bold text-orange-500 border border-orange-200 dark:border-orange-900/30 px-4 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-colors">Request Return</Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">Delivery Information</h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase block mb-1">Shipping Address</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">{order.shippingAddress}</p>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-slate-400 font-semibold uppercase">Payment</span>
                <span className={`font-extrabold px-2.5 py-1 rounded-full text-[10px] ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20'}`}>{order.paymentStatus}</span>
              </div>
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Shipping</span><span>{order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost.toFixed(2)}`}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tax</span><span>${order.taxAmount?.toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between"><span className="text-emerald-500">Discount</span><span className="text-emerald-500">-${order.discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-extrabold text-sm">
                  <span>Total</span>
                  <span className="text-primary-600 dark:text-primary-400">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              {order.couponCode && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg font-bold">Coupon: {order.couponCode}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
