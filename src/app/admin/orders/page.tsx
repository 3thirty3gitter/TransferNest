'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Package, ChevronRight, Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Order {
  id: string;
  orderNumber?: string;
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  // Legacy fields - some older orders have these at top level
  email?: string;
  name?: string;
  customerEmail?: string;
  customerName?: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: any;
  deliveryMethod?: string;
  items?: any[];
}

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders(loadMore = false) {
    setLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      let q = query(ordersRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      
      if (loadMore && lastDoc) {
        q = query(ordersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(q);
      
      const ordersList = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Normalize customer info - handle legacy order structures
        let customerInfo = data.customerInfo;
        if (!customerInfo || (!customerInfo.firstName && !customerInfo.email)) {
          // Try to build from legacy fields
          const legacyName = data.customerName || data.name || '';
          const nameParts = legacyName.split(' ');
          customerInfo = {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: data.customerEmail || data.email || ''
          };
        }
        
        return {
          id: doc.id,
          ...data,
          customerInfo,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date()
        } as Order;
      });

      if (loadMore) {
        setOrders(prev => [...prev, ...ordersList]);
      } else {
        setOrders(ordersList);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'CAD' 
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300 border-green-700';
      case 'shipped': return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'printing': return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'ready_for_pickup': return 'bg-cyan-900/50 text-cyan-300 border-cyan-700';
      case 'pending': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'cancelled': return 'bg-red-900/50 text-red-300 border-red-700';
      default: return 'bg-gray-700/50 text-gray-300 border-gray-600';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/50 text-green-300';
      case 'refunded': return 'bg-orange-900/50 text-orange-300';
      case 'failed': return 'bg-red-900/50 text-red-300';
      default: return 'bg-yellow-900/50 text-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Manage and track all customer orders</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => loadOrders()}
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by order ID, customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-gray-900/50 border-gray-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="dash-glass-card rounded-2xl overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Order ID</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Payment</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Delivery</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-cyan-400">#{order.orderNumber || order.id.slice(-8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">
                          {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{order.customerInfo?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {formatCurrency(order.total || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status?.replace(/_/g, ' ') || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm capitalize">
                      {order.deliveryMethod || 'shipping'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/jobs/${order.id}`}
                        className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load More */}
        {hasMore && !loading && filteredOrders.length > 0 && (
          <div className="p-4 border-t border-gray-800 text-center">
            <Button 
              variant="ghost" 
              onClick={() => loadOrders(true)}
              className="text-gray-400 hover:text-white"
            >
              Load More Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
