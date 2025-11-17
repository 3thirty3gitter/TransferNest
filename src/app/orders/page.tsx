'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Package, Truck, CheckCircle, Clock } from 'lucide-react';

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
  userId?: string;
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
        console.log('Orders data:', data);
        console.log('User UID:', user.uid);
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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Orders</h1>
        <p className="text-muted-foreground">View and manage your DTF printing orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                When you place your first order, it will appear here.
              </p>
              <Button onClick={() => window.location.href = '/nesting-tool'}>
                Start Your First Order
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                    <CardDescription>
                      Placed on {typeof order.createdAt === 'string' 
                        ? new Date(order.createdAt).toLocaleDateString()
                        : new Date(order.createdAt.seconds * 1000).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${statusColors[order.status as keyof typeof statusColors]} text-white`}
                    >
                      {statusIcons[order.status as keyof typeof statusIcons]}
                      <span className="ml-2 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order Details */}
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold mb-3">Order Details</h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between py-2 border-b">
                          <span>
                            {item.sheetSize}" DTF Sheet × {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.totalPrice, order.currency)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-semibold text-lg border-t">
                        <span>Total</span>
                        <span>{formatCurrency(order.total, order.currency)}</span>
                      </div>
                    </div>

                    {order.trackingNumber && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          Tracking Number: {order.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Print Files */}
                  <div>
                    <h4 className="font-semibold mb-3">Print Files</h4>
                    {order.printFiles.length > 0 ? (
                      <div className="space-y-2">
                        {order.printFiles.map((file, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium truncate">
                                {file.filename}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPrintFile(file)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {file.dimensions.width} × {file.dimensions.height}px
                              ({file.dimensions.dpi} DPI)
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Print files will be available once your order is processed.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}