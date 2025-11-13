'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Download, Package, Truck, CheckCircle, Clock, Sparkles } from 'lucide-react';

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
  createdAt: { seconds: number };
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
}

const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  printed: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <Clock className="h-4 w-4" />
};

const statusColors = {
  pending: 'bg-yellow-500',
  paid: 'bg-green-500',
  processing: 'bg-blue-500',
  printed: 'bg-purple-500',
  shipped: 'bg-orange-500',
  delivered: 'bg-green-600',
  cancelled: 'bg-red-500'
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
        const response = await fetch(`/api/orders?userId=${user.uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto border border-white/20">
            <Package className="mx-auto h-16 w-16 text-slate-400 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">Sign In Required</h3>
            <p className="text-slate-300">
              Please log in to view your orders.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-strong rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Header />
        <div className="h-16"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-3xl p-12 text-center max-w-md mx-auto border border-white/20">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Header />
      <div className="h-16"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Orders</h1>
          <p className="text-slate-300">View and manage your DTF printing orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="glass-strong rounded-3xl p-12 text-center border border-white/10">
            <Package className="h-16 w-16 mx-auto text-slate-400 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">No orders yet</h3>
            <p className="text-slate-300 mb-6">
              When you place your first order, it will appear here.
            </p>
            <button
              onClick={() => window.location.href = '/nesting-tool'}
              className="inline-flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              Start Your First Order
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="glass-strong rounded-2xl overflow-hidden border border-white/10">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Order #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-slate-400">
                        Placed on {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${statusColors[order.status as keyof typeof statusColors]} text-white border-0 flex items-center gap-2`}
                      >
                        {statusIcons[order.status as keyof typeof statusIcons]}
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Details */}
                    <div className="lg:col-span-2">
                      <h4 className="font-semibold text-white mb-3">Order Details</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between py-3 border-b border-white/10 text-slate-300">
                            <span>
                              {item.sheetSize}" DTF Sheet × {item.quantity}
                            </span>
                            <span className="font-medium text-white">
                              {formatCurrency(item.totalPrice, order.currency)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between py-3 font-semibold text-lg border-t border-white/20 pt-4">
                          <span className="text-white">Total</span>
                          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {formatCurrency(order.total, order.currency)}
                          </span>
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <p className="text-sm font-medium text-blue-300">
                            Tracking Number: {order.trackingNumber}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Print Files */}
                    <div>
                      <h4 className="font-semibold text-white mb-3">Print Files</h4>
                      {order.printFiles.length > 0 ? (
                        <div className="space-y-2">
                          {order.printFiles.map((file, index) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium truncate text-white">
                                  {file.filename}
                                </span>
                                <button
                                  onClick={() => handleDownloadPrintFile(file)}
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all hover:scale-110"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-400">
                                {file.dimensions.width} × {file.dimensions.height}px
                                ({file.dimensions.dpi} DPI)
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Print files will be available once your order is processed.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}