'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Package, Truck, CheckCircle, Clock, ShoppingBag, ArrowRight, Printer, MapPin } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';

// Simple utility to format currency
const formatCurrency = (amount: number, currency: string = 'CAD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

interface Order {
  id: string;
  paymentId: string;
  status: string;
  total: number;
  currency: string;
  createdAt: { seconds: number } | string;
  items: Array<{
    sheetSize: string;
    quantity: number;
    totalPrice: number;
  }>;
  printFiles: Array<{
    filename: string;
    url: string;
    dimensions: {
      width: number;
      height: number;
      dpi: number;
    };
  }>;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryMethod?: 'shipping' | 'pickup';
  userId?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
  paid: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Paid' },
  printing: { icon: Printer, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Printing' },
  processing: { icon: Package, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Processing' },
  printed: { icon: Package, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Printed' },
  ready_for_pickup: { icon: MapPin, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Ready for Pickup' },
  shipped: { icon: Truck, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'bg-green-600/20 text-green-400 border-green-600/30', label: 'Delivered' },
  completed: { icon: CheckCircle, color: 'bg-green-600/20 text-green-400 border-green-600/30', label: 'Completed' },
  cancelled: { icon: Clock, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled' }
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/orders?userId=${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        console.log('Orders data:', data);
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleDownloadPrintFile = async (printFile: Order['printFiles'][0]) => {
    try {
      const response = await fetch(printFile.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = printFile.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const formatDate = (createdAt: { seconds: number } | string) => {
    if (typeof createdAt === 'string') {
      return new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(createdAt.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <div className="h-40"></div>
        <div className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="max-w-md w-full glass-strong p-8 rounded-2xl border border-white/10 text-center">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Please Sign In</h1>
            <p className="text-slate-300 mb-8">
              You need to be signed in to view your order history.
            </p>
            <Link 
              href="/login"
              className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Sign In
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <div className="h-40"></div>
        <div className="flex-1 container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-blue-400" />
              Order History
            </h1>
            <p className="text-slate-400 mt-2">View and track your DTF printing orders</p>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-strong rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="h-6 bg-slate-700 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="h-px bg-white/10 my-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
        <Header />
        <div className="h-40"></div>
        <div className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="max-w-md w-full glass-strong p-8 rounded-2xl border border-red-500/20 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Error Loading Orders</h1>
            <p className="text-red-400 mb-8">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500"
            >
              Try Again
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex flex-col">
      <Header />
      <div className="h-40"></div>
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-blue-400" />
              Order History
            </h1>
            <p className="text-slate-400 mt-2">View and track your DTF printing orders</p>
          </div>
          <Link 
            href="/nesting-tool-17"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium flex items-center gap-2 glass px-4 py-2 rounded-lg border border-white/10"
          >
            Create New Order
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-24 h-24 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No orders yet</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              When you place your first order, it will appear here. Start creating your custom DTF gang sheets today!
            </p>
            <Link 
              href="/nesting-tool-17"
              className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Start Your First Order
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={order.id} 
                  className="glass-strong rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {order.deliveryMethod && (
                          <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                            {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}
                          </span>
                        )}
                        <Badge className={`${status.color} border flex items-center gap-1.5 px-3 py-1`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Content */}
                  <div className="p-6">
                    {/* Items */}
                    <div className="space-y-3 mb-6">
                      {order.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className="text-white">
                              {item.sheetSize}" DTF Gang Sheet
                              <span className="text-slate-400 ml-2">× {item.quantity}</span>
                            </span>
                          </div>
                          <span className="font-semibold text-white">
                            {formatCurrency(item.totalPrice, order.currency)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center py-4 border-t border-white/10">
                      <span className="text-lg font-semibold text-white">Total</span>
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(order.total, order.currency)}
                      </span>
                    </div>

                    {/* Tracking Info */}
                    {order.trackingNumber && (
                      <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-blue-400" />
                            <div>
                              <p className="text-sm text-slate-400">Tracking Number</p>
                              <p className="text-white font-mono">{order.trackingNumber}</p>
                            </div>
                          </div>
                          {order.trackingUrl && (
                            <a 
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                            >
                              Track Package
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ready for Pickup Info */}
                    {order.status === 'ready_for_pickup' && order.deliveryMethod === 'pickup' && (
                      <div className="mt-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-cyan-400" />
                          <div>
                            <p className="text-white font-medium">Your order is ready for pickup!</p>
                            <p className="text-sm text-slate-400">
                              Please bring your order confirmation when you arrive.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}