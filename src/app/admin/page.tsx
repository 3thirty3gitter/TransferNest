'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { checkAdminAccess } from '@/middleware/adminAuth';
import { Download } from 'lucide-react';

type OrderStatus = 'pending' | 'printing' | 'shipped' | 'completed';
type PaymentStatus = 'paid' | 'refunded';
type ShippingStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

type PrintFile = {
  filename: string;
  url: string;
  path: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
};

type OrderItem = {
  id: string;
  images: any[];
  sheetSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  utilization: number;
  layout?: any;
  placedItems?: any[];
  sheetWidth?: number;
  sheetLength?: number;
  pricing?: any;
};

type Order = {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  totalAmount?: number; // Legacy field
  total?: number; // Current field
  subtotal?: number;
  tax?: number;
  shipping?: number;
  printFiles: PrintFile[];
  items?: OrderItem[];
  sheetWidth: number;
  sheetLength: number;
  itemCount?: number;
  trackingNumber?: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        alert('Access denied. Admin privileges required.');
        router.push('/admin/login');
        return;
      }
      
      setIsAdmin(true);
      loadOrders();
    });

    return () => unsubscribe();
  }, [router]);

  async function loadOrders() {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as Order[];
      
      // Debug: Log first order's printFiles structure
      if (ordersData.length > 0) {
        console.log('[ADMIN] First order printFiles:', {
          orderId: ordersData[0].id,
          hasPrintFiles: !!ordersData[0].printFiles,
          printFilesCount: ordersData[0].printFiles?.length || 0,
          printFiles: ordersData[0].printFiles
        });
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, field: keyof Order, value: any) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { [field]: value });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, [field]: value } : order
      ));
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
  }

  async function downloadPrintFile(order: Order) {
    if (!order.printFiles || order.printFiles.length === 0) {
      alert('No print files available');
      return;
    }
    
    // If single file, download directly
    if (order.printFiles.length === 1) {
      triggerDownload(order.printFiles[0].url, order.printFiles[0].filename);
      return;
    }
    
    // If multiple files, download all with a short delay between each
    if (confirm(`Download all ${order.printFiles.length} files?\n\nNote: Your browser may ask for permission to download multiple files.`)) {
      for (let i = 0; i < order.printFiles.length; i++) {
        const file = order.printFiles[i];
        setTimeout(() => {
          triggerDownload(file.url, file.filename);
        }, i * 300); // 300ms delay between each download
      }
    }
  }

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function toggleOrderSelection(orderId: string) {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  }

  function toggleSelectAll() {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  }

  async function bulkUpdateStatus(field: keyof Order, value: any) {
    if (selectedOrders.size === 0) {
      alert('No orders selected');
      return;
    }

    if (!confirm(`Update ${selectedOrders.size} orders?`)) {
      return;
    }

    try {
      const batch = writeBatch(db);
      selectedOrders.forEach(orderId => {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { [field]: value });
      });
      
      await batch.commit();
      
      // Update local state
      setOrders(prev => prev.map(order => 
        selectedOrders.has(order.id) ? { ...order, [field]: value } : order
      ));
      
      setSelectedOrders(new Set());
      alert('Orders updated successfully');
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Failed to update orders');
    }
  }

  async function downloadAllPrintFiles() {
    const ordersWithFiles = Array.from(selectedOrders)
      .map(id => orders.find(o => o.id === id))
      .filter(o => o?.printFiles && o.printFiles.length > 0);

    if (ordersWithFiles.length === 0) {
      alert('No print files available for selected orders');
      return;
    }

    // Count total files
    const totalFiles = ordersWithFiles.reduce((sum, order) => 
      sum + (order?.printFiles?.length || 0), 0
    );

    if (!confirm(`Download ${totalFiles} file(s) from ${ordersWithFiles.length} order(s)?\n\nNote: Your browser may block multiple downloads. Please allow pop-ups if prompted.`)) {
      return;
    }

    // Download all files from all selected orders
    ordersWithFiles.forEach(order => {
      if (order?.printFiles) {
        order.printFiles.forEach((file, index) => {
          // Add small delay between downloads to avoid browser blocking
          setTimeout(() => {
            window.open(file.url, '_blank');
          }, index * 200);
        });
      }
    });
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">
          {!isAdmin ? 'Checking permissions...' : 'Loading orders...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Storefront
            </a>
            <a
              href="/admin/customers"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Customers
            </a>
            <a
              href="/admin/products"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Products
            </a>
            <a
              href="/admin/settings"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
            <a
              href="/admin/nesting-tool"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Internal Nesting Tool
            </a>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Pending" 
            count={orders.filter(o => o.status === 'pending').length}
            color="yellow"
          />
          <StatCard 
            title="Printing" 
            count={orders.filter(o => o.status === 'printing').length}
            color="blue"
          />
          <StatCard 
            title="Shipped" 
            count={orders.filter(o => o.status === 'shipped').length}
            color="purple"
          />
          <StatCard 
            title="Completed" 
            count={orders.filter(o => o.status === 'completed').length}
            color="green"
          />
        </div>

        {/* Filter Tabs */}
        <div className="glass-strong rounded-lg border border-white/10 mb-6">
          <div className="flex border-b border-white/10">
            {(['all', 'pending', 'printing', 'shipped', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 font-medium transition-colors ${
                  filter === status
                    ? 'border-b-2 border-blue-400 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="glass-strong rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 mb-6 flex items-center justify-between">
            <div className="font-medium text-blue-300">
              {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus('status', 'printing')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Mark as Printing
              </button>
              <button
                onClick={() => bulkUpdateStatus('status', 'shipped')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => bulkUpdateStatus('status', 'completed')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Mark as Completed
              </button>
              <button
                onClick={downloadAllPrintFiles}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Download Files
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="px-4 py-2 glass border border-white/20 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="glass-strong rounded-lg border border-white/10 overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-white/10 border-white/20 text-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Shipping</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="rounded bg-white/10 border-white/20 text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {order.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {order.itemCount || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    ${(order.totalAmount || order.total || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updateOrderStatus(order.id, 'paymentStatus', e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 ${
                        order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300' :
                        order.paymentStatus === 'refunded' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, 'status', e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium border-0 ${
                        order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        order.status === 'shipped' ? 'bg-purple-500/20 text-purple-300' :
                        order.status === 'printing' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="printing">Printing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <input
                      type="text"
                      placeholder="Tracking #"
                      value={order.trackingNumber || ''}
                      onChange={(e) => updateOrderStatus(order.id, 'trackingNumber', e.target.value)}
                      className="glass border border-white/20 rounded px-2 py-1 text-sm w-32 text-white placeholder-slate-400"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/jobs/${order.id}`)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        title="View job details"
                      >
                        View Job
                      </button>
                      <button
                        onClick={() => downloadPrintFile(order)}
                        disabled={!order.printFiles || order.printFiles.length === 0}
                        className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                          order.printFiles && order.printFiles.length > 0
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'glass border border-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                        title={order.printFiles && order.printFiles.length > 0 
                          ? `Download ${order.printFiles.length} file(s)` 
                          : 'No files available'}
                      >
                        <Download className="h-4 w-4" />
                        {order.printFiles && order.printFiles.length > 0 
                          ? `${order.printFiles.length}` 
                          : 'No Files'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, color }: { title: string; count: number; color: string }) {
  const colorClasses = {
    yellow: 'from-yellow-500/20 to-orange-500/20 text-yellow-300',
    green: 'from-green-500/20 to-emerald-500/20 text-green-300',
    blue: 'from-blue-500/20 to-cyan-500/20 text-blue-300',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-300',
  }[color];

  return (
    <div className="glass-strong rounded-lg border border-white/10 p-6 hover:scale-105 transition-transform">
      <div className="text-sm font-medium text-slate-400 mb-2">{title}</div>
      <div className={`text-4xl font-bold bg-gradient-to-r ${colorClasses} bg-clip-text text-transparent`}>
        {count}
      </div>
    </div>
  );
}
