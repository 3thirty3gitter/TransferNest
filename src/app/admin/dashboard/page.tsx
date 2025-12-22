'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Printer,
  FileImage
} from 'lucide-react';

type Order = {
  id: string;
  orderNumber?: string;
  userId: string;
  userEmail?: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  items?: any[];
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  deliveryMethod?: string;
};

type DashboardMetrics = {
  // Revenue
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  
  // Orders
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  
  // Order Status Counts
  pendingOrders: number;
  printingOrders: number;
  readyForPickup: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  
  // Customers
  totalCustomers: number;
  newCustomersThisMonth: number;
  
  // Products
  totalSheets: number;
  avgOrderValue: number;
  
  // Trends
  revenueChange: number; // percentage change from last period
  ordersChange: number;
};

type RecentOrder = {
  id: string;
  orderNumber?: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  createdAt: Date;
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Load all orders
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders: Order[] = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
      });

      // Calculate date boundaries
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter orders by time periods
      const todayOrders = orders.filter(o => o.createdAt >= todayStart);
      const weekOrders = orders.filter(o => o.createdAt >= weekStart);
      const monthOrders = orders.filter(o => o.createdAt >= monthStart);
      const lastMonthOrders = orders.filter(o => o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd);

      // Calculate revenues
      const calcRevenue = (orderList: Order[]) => 
        orderList.reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0);

      const totalRevenue = calcRevenue(orders);
      const todayRevenue = calcRevenue(todayOrders);
      const weekRevenue = calcRevenue(weekOrders);
      const monthRevenue = calcRevenue(monthOrders);
      const lastMonthRevenue = calcRevenue(lastMonthOrders);

      // Revenue change percentage
      const revenueChange = lastMonthRevenue > 0 
        ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Orders change percentage
      const ordersChange = lastMonthOrders.length > 0
        ? ((monthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
        : 0;

      // Count orders by status
      const countByStatus = (status: string) => 
        orders.filter(o => o.status === status).length;

      // Get unique customers
      const uniqueCustomers = new Set(orders.map(o => o.userId));
      const newCustomersThisMonth = new Set(
        monthOrders.map(o => o.userId)
      ).size;

      // Count total sheets/items
      const totalSheets = orders.reduce((sum, o) => {
        return sum + (o.items?.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) || 1);
      }, 0);

      // Average order value
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      setMetrics({
        totalRevenue,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        weekOrders: weekOrders.length,
        monthOrders: monthOrders.length,
        pendingOrders: countByStatus('pending') + countByStatus('paid'),
        printingOrders: countByStatus('printing'),
        readyForPickup: countByStatus('ready_for_pickup'),
        shippedOrders: countByStatus('shipped'),
        completedOrders: countByStatus('completed') + countByStatus('delivered'),
        cancelledOrders: countByStatus('cancelled'),
        totalCustomers: uniqueCustomers.size,
        newCustomersThisMonth,
        totalSheets,
        avgOrderValue,
        revenueChange,
        ordersChange,
      });

      // Recent orders for the table
      setRecentOrders(orders.slice(0, 10).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customerInfo 
          ? `${o.customerInfo.firstName || ''} ${o.customerInfo.lastName || ''}`.trim() 
          : 'Unknown',
        email: o.customerInfo?.email || o.userEmail || 'N/A',
        total: o.total || o.subtotal || 0,
        status: o.status,
        createdAt: o.createdAt,
      })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      printing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      ready_for_pickup: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      paid: 'Paid',
      printing: 'Printing',
      ready_for_pickup: 'Ready for Pickup',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-red-400">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-CA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Main Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-500/20">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
            {metrics.revenueChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${metrics.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.revenueChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(metrics.revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            This month: {formatCurrency(metrics.monthRevenue)}
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <ShoppingCart className="h-6 w-6 text-blue-400" />
            </div>
            {metrics.ordersChange !== 0 && (
              <div className={`flex items-center gap-1 text-sm ${metrics.ordersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.ordersChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(metrics.ordersChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-400">Total Orders</p>
            <p className="text-2xl font-bold text-white">{metrics.totalOrders}</p>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            This month: {metrics.monthOrders} | Today: {metrics.todayOrders}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-400">Avg Order Value</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.avgOrderValue)}</p>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Total sheets printed: {metrics.totalSheets}
          </div>
        </div>

        {/* Total Customers */}
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-400">Total Customers</p>
            <p className="text-2xl font-bold text-white">{metrics.totalCustomers}</p>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            New this month: {metrics.newCustomersThisMonth}
          </div>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Pending/Paid */}
        <Link href="/admin/orders?status=pending" className="glass rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.pendingOrders}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </Link>

        {/* Printing */}
        <Link href="/admin/orders?status=printing" className="glass rounded-xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Printer className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.printingOrders}</p>
              <p className="text-xs text-slate-400">Printing</p>
            </div>
          </div>
        </Link>

        {/* Ready for Pickup */}
        <Link href="/admin/orders?status=ready_for_pickup" className="glass rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Package className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.readyForPickup}</p>
              <p className="text-xs text-slate-400">Pickup</p>
            </div>
          </div>
        </Link>

        {/* Shipped */}
        <Link href="/admin/orders?status=shipped" className="glass rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Truck className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.shippedOrders}</p>
              <p className="text-xs text-slate-400">Shipped</p>
            </div>
          </div>
        </Link>

        {/* Completed */}
        <Link href="/admin/orders?status=completed" className="glass rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.completedOrders}</p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
          </div>
        </Link>

        {/* Cancelled */}
        <Link href="/admin/orders?status=cancelled" className="glass rounded-xl p-4 border border-red-500/20 hover:border-red-500/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.cancelledOrders}</p>
              <p className="text-xs text-slate-400">Cancelled</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Revenue Breakdown & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-400" />
            Revenue Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">Today</span>
              <span className="font-semibold text-white">{formatCurrency(metrics.todayRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">This Week</span>
              <span className="font-semibold text-white">{formatCurrency(metrics.weekRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-slate-400">This Month</span>
              <span className="font-semibold text-white">{formatCurrency(metrics.monthRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <span className="text-green-400 font-medium">All Time</span>
              <span className="font-bold text-green-400">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <Link href={`/admin/jobs/${order.id}`} className="text-blue-400 hover:text-blue-300 font-mono">
                        #{order.orderNumber || order.id?.slice(-6) || 'Unknown'}
                      </Link>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-white">{order.customer}</p>
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </div>
                    </td>
                    <td className="py-3 text-white font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-strong rounded-xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/admin/orders" 
            className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            <span className="text-white">View Orders</span>
          </Link>
          <Link 
            href="/admin/products" 
            className="flex items-center gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
          >
            <Package className="h-5 w-5 text-purple-400" />
            <span className="text-white">Products</span>
          </Link>
          <Link 
            href="/admin/customers" 
            className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
          >
            <Users className="h-5 w-5 text-orange-400" />
            <span className="text-white">Customers</span>
          </Link>
          <Link 
            href="/admin/settings" 
            className="flex items-center gap-3 p-4 rounded-lg bg-slate-500/10 border border-slate-500/20 hover:border-slate-500/40 transition-colors"
          >
            <FileImage className="h-5 w-5 text-slate-400" />
            <span className="text-white">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
