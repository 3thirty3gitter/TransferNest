'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag,
  Package,
  DollarSign,
  Clock,
  Percent
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  discountPercentage?: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  currency: string;
  createdAt: any;
  items: any[];
  paymentId: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingDiscount, setUpdatingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  useEffect(() => {
    if (customerId) {
      loadCustomer();
      loadOrders();
    }
  }, [customerId]);

  async function loadCustomer() {
    try {
      const customerDoc = await getDoc(doc(db, 'users', customerId));
      if (customerDoc.exists()) {
        const data = customerDoc.data();
        setCustomer({
          id: customerDoc.id,
          ...data,
        } as Customer);
        if (data.discountPercentage) {
          setDiscountInput(data.discountPercentage.toString());
        }
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateDiscount() {
    if (!customer) return;
    setUpdatingDiscount(true);
    try {
      const discount = parseFloat(discountInput);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        alert('Please enter a valid discount percentage (0-100)');
        return;
      }
      
      await updateDoc(doc(db, 'users', customer.id), {
        discountPercentage: discount
      });
      
      setCustomer(prev => prev ? { ...prev, discountPercentage: discount } : null);
      alert('Discount updated successfully');
    } catch (error) {
      console.error('Error updating discount:', error);
      alert('Failed to update discount');
    } finally {
      setUpdatingDiscount(false);
    }
  }

  async function loadOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('userId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'delivered').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center">
          <p className="text-slate-400 mb-4">Customer not found</p>
          <Button asChild variant="outline" className="border-white/20">
            <Link href="/admin/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/customers')}
            className="mb-4 border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-slate-400">Customer Details & Order History</p>
            </div>
            <Button
              onClick={() => window.location.href = `mailto:${customer.email}`}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Customer
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-white">{orders.length}</p>
                </div>
                <ShoppingBag className="h-10 w-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Completed</p>
                  <p className="text-3xl font-bold text-white">{completedOrders}</p>
                </div>
                <Package className="h-10 w-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-white">
                    ${totalSpent.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Customer Since</p>
                  <p className="text-lg font-bold text-white">
                    {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-cyan-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Full Name</p>
                  <p className="text-white font-semibold">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="text-white break-all">{customer.email}</p>
                </div>

                {customer.phone && (
                  <div>
                    <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="text-white">{customer.phone}</p>
                  </div>
                )}

                <div>
                  <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </p>
                  {customer.address ? (
                    <div className="text-white space-y-1">
                      <p>{customer.address}</p>
                      <p>
                        {customer.city && `${customer.city}, `}
                        {customer.state} {customer.zipCode}
                      </p>
                      <p className="text-slate-400">{customer.country || 'Canada'}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No address provided</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </p>
                  <p className="text-white">
                    {new Date(customer.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Customer Discount
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="0"
                        className="bg-white/10 border-white/20 text-white pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                    </div>
                    <Button 
                      onClick={handleUpdateDiscount}
                      disabled={updatingDiscount}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updatingDiscount ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    This discount will be automatically applied to all future orders.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-purple-400" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Link
                        href={`/admin/jobs/${order.id}`}
                        key={order.id}
                        className="block bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold mb-1">
                              Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {order.createdAt?.toDate 
                                ? new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Date unavailable'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">
                              ${order.total.toFixed(2)} {order.currency}
                            </p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-slate-400 text-sm mb-2">Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-white">
                                  {item.sheetSize}" Sheet × {item.quantity || 1}
                                </span>
                                <span className="text-slate-400">
                                  {item.images?.length || 0} images
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
