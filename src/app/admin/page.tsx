'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { checkAdminAccess } from '@/middleware/adminAuth';

type OrderStatus = 'pending' | 'paid' | 'printing' | 'shipped' | 'completed';
type PaymentStatus = 'pending' | 'paid' | 'refunded';
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

type Order = {
  id: string;
  userId: string;
  userEmail: string;
  createdAt: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  totalAmount: number;
  printFiles: PrintFile[];
  sheetWidth: number;
  sheetLength: number;
  itemCount: number;
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
      
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Order[];
      
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
      window.open(order.printFiles[0].url, '_blank');
      return;
    }
    
    // If multiple files, show selection
    const fileNames = order.printFiles.map((f, i) => `${i + 1}. ${f.filename}`).join('\n');
    const selection = prompt(`Select file to download:\n\n${fileNames}\n\nEnter file number (1-${order.printFiles.length}):`);
    
    if (!selection) return;
    
    const index = parseInt(selection) - 1;
    if (index >= 0 && index < order.printFiles.length) {
      window.open(order.printFiles[index].url, '_blank');
    } else {
      alert('Invalid file number');
    }
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Pending" 
            count={orders.filter(o => o.status === 'pending').length}
            color="yellow"
          />
          <StatCard 
            title="Paid" 
            count={orders.filter(o => o.paymentStatus === 'paid').length}
            color="green"
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
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {(['all', 'pending', 'paid', 'printing', 'shipped', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 font-medium ${
                  filter === status
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="font-medium text-blue-900">
              {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus('status', 'printing')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Mark as Printing
              </button>
              <button
                onClick={() => bulkUpdateStatus('status', 'shipped')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => bulkUpdateStatus('paymentStatus', 'paid')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Mark as Paid
              </button>
              <button
                onClick={downloadAllPrintFiles}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
              >
                Download Files
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipping</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.itemCount} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updateOrderStatus(order.id, 'paymentStatus', e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'refunded' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, 'status', e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'printing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
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
                      className="border rounded px-2 py-1 text-sm w-32"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => downloadPrintFile(order)}
                      disabled={!order.printFiles || order.printFiles.length === 0}
                      className={`px-3 py-1 rounded ${
                        order.printFiles && order.printFiles.length > 0
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={order.printFiles && order.printFiles.length > 0 
                        ? `Download ${order.printFiles.length} file(s)` 
                        : 'No files available'}
                    >
                      {order.printFiles && order.printFiles.length > 0 
                        ? `Download (${order.printFiles.length})` 
                        : 'No Files'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
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
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
  }[color];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm font-medium text-gray-500 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${colorClasses}`}>{count}</div>
    </div>
  );
}
