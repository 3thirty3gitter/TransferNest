'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Download, Search, Filter, ChevronDown, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

type OrderStatus = 'pending' | 'printing' | 'shipped' | 'completed' | 'ready_for_pickup';
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
  customerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

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
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, field: keyof Order, value: any) {
    try {
      // For status changes, use the API to trigger email notifications
      if (field === 'status') {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: value })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update order');
        }
      } else {
        // For other fields, update directly
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { [field]: value });
      }
      
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

    if (!confirm(`Update ${selectedOrders.size} orders?`)) return;

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
    } catch (error) {
      console.error('Error updating orders:', error);
      alert('Failed to update orders');
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const customerName = order.customerInfo?.firstName && order.customerInfo?.lastName
      ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
      : order.shippingAddress?.name || '';
    const customerEmail = order.customerInfo?.email || order.userEmail || '';
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-slate-400 mt-1">Manage and track customer orders</p>
        </div>
        
        <div className="flex gap-3">
          {selectedOrders.size > 0 && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
              <select 
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                onChange={(e) => bulkUpdateStatus('status', e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Set Status...</option>
                <option value="pending">Pending</option>
                <option value="printing">Printing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
                onChange={(e) => bulkUpdateStatus('shippingStatus', e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Set Shipping...</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['all', 'pending', 'printing', 'shipped', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
              `}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/50 border-b border-white/10">
                <th className="p-4 w-12">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length ? (
                      <CheckSquare size={20} />
                    ) : (
                      <Square size={20} />
                    )}
                  </button>
                </th>
                <th className="p-4 text-sm font-medium text-slate-400">Order ID</th>
                <th className="p-4 text-sm font-medium text-slate-400">Customer</th>
                <th className="p-4 text-sm font-medium text-slate-400">Date</th>
                <th className="p-4 text-sm font-medium text-slate-400">Status</th>
                <th className="p-4 text-sm font-medium text-slate-400">Payment</th>
                <th className="p-4 text-sm font-medium text-slate-400">Total</th>
                <th className="p-4 text-sm font-medium text-slate-400">Files</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <button 
                      onClick={() => toggleOrderSelection(order.id)}
                      className={`transition-colors ${selectedOrders.has(order.id) ? 'text-blue-500' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {selectedOrders.has(order.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="p-4">
                    <Link 
                      href={`/admin/jobs/${order.id}`}
                      className="font-mono text-sm text-white hover:text-blue-400 hover:underline"
                    >
                      #{order.id.slice(-6)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">
                        {order.customerInfo?.firstName && order.customerInfo?.lastName 
                          ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
                          : order.shippingAddress?.name || 'Unknown'}
                      </span>
                      <span className="text-sm text-slate-400">{order.customerInfo?.email || order.userEmail || ''}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, 'status', e.target.value)}
                      className={`
                        bg-transparent text-sm font-medium rounded px-2 py-1 border border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-800 outline-none cursor-pointer
                        ${order.status === 'completed' ? 'text-green-400' : 
                          order.status === 'shipped' ? 'text-blue-400' :
                          order.status === 'ready_for_pickup' ? 'text-purple-400' :
                          order.status === 'printing' ? 'text-yellow-400' : 'text-slate-400'}
                      `}
                    >
                      <option value="pending">Pending</option>
                      <option value="printing">Printing</option>
                      <option value="ready_for_pickup">Ready for Pickup</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' : 
                        order.paymentStatus === 'refunded' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'}
                    `}>
                      {order.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-white font-medium">
                    ${(order.total || order.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => downloadPrintFile(order)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Download Print Files"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
