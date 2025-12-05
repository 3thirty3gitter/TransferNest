'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Image as ImageIcon, Truck, Package, Printer, Mail } from 'lucide-react';
import Link from 'next/link';

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
  userEmail?: string;
  createdAt: any;
  status: string;
  paymentStatus: string;
  total?: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discountPercentage?: number;
  discountAmount?: number;
  currency?: string;
  printFiles: Array<{
    filename: string;
    url: string;
    path: string;
    size: number;
    dimensions: { width: number; height: number; dpi: number };
  }>;
  items: OrderItem[];
  customerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress?: {
    address?: string;
    line1?: string;
    address1?: string;
    line2?: string;
    address2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip?: string;
    zipCode?: string;
    country?: string;
  };
  deliveryMethod?: string;
  shippingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    labelUrl?: string;
  };
  taxBreakdown?: any;
  shippingRate?: any;
};

export default function JobDetailsPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  // Shipping State
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [currentShipmentId, setCurrentShipmentId] = useState<string | null>(null);
  const [parcelDetails, setParcelDetails] = useState({
    length: '12',
    width: '9',
    height: '1',
    weight: '16' // 1 lb
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isBuyingLabel, setIsBuyingLabel] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    if (!orderId) return;
    
    try {
      // Use API endpoint for consistent data access
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch order');
      
      const data = await response.json();
      
      // Convert createdAt if it's a timestamp object or string
      if (data.createdAt) {
        if (typeof data.createdAt === 'string') {
          data.createdAt = new Date(data.createdAt);
        } else if (data.createdAt._seconds) {
          data.createdAt = new Date(data.createdAt._seconds * 1000);
        } else if (data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate();
        }
      } else {
        data.createdAt = new Date();
      }
      
      setOrder(data as Order);
      
      // Auto-select first item if available
      if (data.items && data.items.length > 0) {
        setSelectedItem(data.items[0]);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Failed to load order');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRates() {
    if (!order?.shippingAddress) {
      alert('No shipping address found for this order');
      return;
    }

    setIsFetchingRates(true);
    setShippingRates([]);
    setSelectedRate(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'rates',
          orderId: order.id,
          toAddress: {
            name: `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`,
            street1: order.shippingAddress.line1 || order.shippingAddress.address1 || order.shippingAddress.address,
            street2: order.shippingAddress.line2 || order.shippingAddress.address2 || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.postal_code || order.shippingAddress.zip || order.shippingAddress.zipCode,
            country: order.shippingAddress.country || 'CA',
            phone: order.customerInfo?.phone,
            email: order.customerInfo?.email
          },
          parcel: parcelDetails
        })
      });

      const data = await response.json();
      if (data.success) {
        setShippingRates(data.shipment.rates);
        setCurrentShipmentId(data.shipment.id);
      } else {
        console.error('Failed to fetch rates:', data);
        alert('Failed to fetch rates: ' + (data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error fetching rates:', error);
      alert('Error fetching rates: ' + (error.message || 'Unknown error'));
    } finally {
      setIsFetchingRates(false);
    }
  }

  async function buyLabel() {
    if (!selectedRate || !currentShipmentId || !order) return;

    setIsBuyingLabel(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'buy',
          orderId: order.id,
          shipmentId: currentShipmentId,
          rateId: selectedRate
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Label purchased successfully!');
        loadOrder(); // Reload to show new status
      } else {
        alert('Failed to buy label: ' + data.message);
      }
    } catch (error) {
      console.error('Error buying label:', error);
      alert('Error buying label');
    } finally {
      setIsBuyingLabel(false);
    }
  }

  async function composeEmail() {
    if (!order) return;
    
    setIsResendingEmail(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/orders/${order.id}/email-content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Store draft in sessionStorage
        sessionStorage.setItem('emailDraft', JSON.stringify({
          to: data.to,
          subject: data.subject,
          body: data.html
        }));
        
        // Redirect to email page
        router.push('/admin/email?compose=true');
      } else {
        alert('Failed to generate email content: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Error generating email');
    } finally {
      setIsResendingEmail(false);
    }
  }

  const openInEditor = (item: OrderItem) => {
    if (!item.placedItems || !item.images) {
      alert('No layout data available for this item');
      return;
    }
    
    // Store the job data in sessionStorage for the editor to load
    const editorData = {
      images: item.images,
      sheetWidth: item.sheetWidth,
      sheetLength: item.sheetLength,
      placedItems: item.placedItems,
      layout: item.layout,
      orderId: order?.id,
      isReadOnly: false // Admin can edit
    };
    
    sessionStorage.setItem('adminEditorJob', JSON.stringify(editorData));
    
    // Open editor in new tab
    window.open('/admin/nesting-tool?job=' + order?.id, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/orders" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Job Details: {order.id.slice(0, 8)}
            </h1>
            <p className="text-slate-400 mt-1">
              Order placed on {order.createdAt.toLocaleString()}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={composeEmail}
              disabled={isResendingEmail}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isResendingEmail ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Compose Email
            </button>

            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
              order.status === 'shipped' ? 'bg-purple-500/20 text-purple-300' :
              order.status === 'printing' ? 'bg-blue-500/20 text-blue-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {order.status}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              (order.paymentStatus === 'paid' || (!order.paymentStatus && order.status !== 'pending')) ? 'bg-green-500/20 text-green-300' :
              order.paymentStatus === 'refunded' ? 'bg-red-500/20 text-red-300' :
              'bg-yellow-500/20 text-yellow-300'
            }`}>
              {order.paymentStatus || (order.status !== 'pending' ? 'paid' : 'unpaid')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Order Summary & Customer Info */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="glass-strong rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-medium">${(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({order.discountPercentage || 0}%):</span>
                    <span className="font-medium">-${(order.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax:</span>
                  <span className="font-medium">${(order.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping:</span>
                  <span className="font-medium">${(order.shipping || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2 text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-green-400">${(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {order.customerInfo && (
              <div className="glass-strong rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Customer Info</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Name:</span>
                    <p className="font-medium">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <p className="font-medium">{order.customerInfo.email}</p>
                  </div>
                  {order.customerInfo.phone && (
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <p className="font-medium">{order.customerInfo.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Method & Shipping Address */}
            <div className="glass-strong rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400">Method:</span>
                  <p className="font-medium capitalize">{order.deliveryMethod || 'Not specified'}</p>
                </div>
                
                {order.deliveryMethod === 'shipping' && order.shippingAddress && (
                  <div>
                    <span className="text-slate-400">Shipping Address:</span>
                    <div className="font-medium mt-1 p-3 bg-white/5 rounded-lg">
                      <p>{order.shippingAddress.address || order.shippingAddress.line1 || order.shippingAddress.address1}</p>
                      {(order.shippingAddress.line2 || order.shippingAddress.address2) && (
                        <p>{order.shippingAddress.line2 || order.shippingAddress.address2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code || order.shippingAddress.zip || order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country || 'Canada'}</p>
                    </div>
                  </div>
                )}
                
                {order.deliveryMethod === 'pickup' && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-cyan-300 font-medium">🏪 Local Pickup</p>
                    <p className="text-slate-400 text-xs mt-1">Customer will pick up at your location</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Management */}
            <div className="glass-strong rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Management
              </h2>

              {order.deliveryMethod === 'shipping' && order.status !== 'shipped' && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-300">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="font-medium">Customer paid for shipping - Label purchase required</span>
                </div>
              )}
              
              {((order as any).shippingInfo?.labelUrl || order.status === 'shipped') ? (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <Package className="h-5 w-5" />
                      <span className="font-semibold">Order Shipped</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-1">
                      Tracking Number: <span className="text-white font-mono">{(order as any).shippingInfo?.trackingNumber || 'N/A'}</span>
                    </p>
                  </div>
                  {(order as any).shippingInfo?.labelUrl && (
                    <a 
                      href={(order as any).shippingInfo.labelUrl} 
                      target="_blank"
                      className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Shipping Label
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Length (in)</label>
                      <input 
                        type="number" 
                        value={parcelDetails.length}
                        onChange={e => setParcelDetails({...parcelDetails, length: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Width (in)</label>
                      <input 
                        type="number" 
                        value={parcelDetails.width}
                        onChange={e => setParcelDetails({...parcelDetails, width: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Height (in)</label>
                      <input 
                        type="number" 
                        value={parcelDetails.height}
                        onChange={e => setParcelDetails({...parcelDetails, height: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Weight (oz)</label>
                      <input 
                        type="number" 
                        value={parcelDetails.weight}
                        onChange={e => setParcelDetails({...parcelDetails, weight: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={fetchRates}
                    disabled={isFetchingRates}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {isFetchingRates ? 'Fetching Rates...' : 'Get Shipping Rates'}
                  </button>

                  {shippingRates.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h3 className="text-sm font-medium text-slate-300">Select Rate:</h3>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {shippingRates.map((rate: any) => (
                          <div 
                            key={rate.id}
                            onClick={() => setSelectedRate(rate.id)}
                            className={`p-3 rounded border cursor-pointer transition-all ${
                              selectedRate === rate.id 
                                ? 'bg-blue-500/20 border-blue-500' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-sm">{rate.carrier} - {rate.service}</p>
                                <p className="text-xs text-slate-400">{rate.delivery_days ? `${rate.delivery_days} days` : 'Standard'}</p>
                              </div>
                              <p className="font-bold text-green-400">${parseFloat(rate.rate).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={buyLabel}
                        disabled={!selectedRate || isBuyingLabel}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors font-medium mt-2"
                      >
                        {isBuyingLabel ? 'Purchasing...' : 'Buy Shipping Label'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Print Files */}
            {order.printFiles && order.printFiles.length > 0 && (
              <div className="glass-strong rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Print Files</h2>
                <div className="space-y-3">
                  {order.printFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 glass rounded border border-white/10">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{file.filename}</p>
                        <p className="text-xs text-slate-400">
                          {file.dimensions.width}x{file.dimensions.height}" @ {file.dimensions.dpi}dpi
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Order Items List */}
          <div className="glass-strong rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items ({order.items?.length || 0})</h2>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 glass hover:border-white/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.sheetSize}" Sheet</h3>
                      <p className="text-sm text-slate-400">
                        {item.images?.length || 0} images • {item.utilization?.toFixed(1) || 0}% utilization
                      </p>
                      {item.sheetLength && (
                        <p className="text-xs text-slate-500">
                          {item.sheetWidth}x{item.sheetLength.toFixed(2)}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">${item.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  
                  {item.placedItems && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInEditor(item);
                      }}
                      className="w-full mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Editor
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Selected Item Details */}
          <div className="glass-strong rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedItem ? 'Item Details' : 'Select an Item'}
            </h2>
            
            {selectedItem ? (
              <div className="space-y-4">
                {/* Source Images */}
                <div>
                  <h3 className="font-medium mb-3 text-slate-300">Source Images ({selectedItem.images?.length || 0})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItem.images?.map((img, idx) => (
                      <div key={idx} className="glass rounded border border-white/10 overflow-hidden">
                        <img 
                          src={img.url} 
                          alt={`Image ${idx + 1}`}
                          className="w-full h-32 object-contain bg-white/5"
                        />
                        <div className="p-2 text-xs">
                          <p className="text-slate-400 truncate">{img.id || 'Unknown'}</p>
                          <p className="text-slate-500">{img.width}x{img.height}" • {img.copies}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout Info */}
                {selectedItem.layout && (
                  <div className="p-4 glass rounded border border-white/10">
                    <h3 className="font-medium mb-2 text-slate-300">Layout Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sheet Size:</span>
                        <span>{selectedItem.sheetWidth}x{selectedItem.sheetLength?.toFixed(2)}"</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Utilization:</span>
                        <span>{selectedItem.layout.utilization?.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Copies:</span>
                        <span>{selectedItem.layout.totalCopies}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Positions:</span>
                        <span>{selectedItem.layout.positions?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                {selectedItem.pricing && (
                  <div className="p-4 glass rounded border border-white/10">
                    <h3 className="font-medium mb-2 text-slate-300">Pricing</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Price:</span>
                        <span>${selectedItem.pricing.basePrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-1 mt-1 font-medium">
                        <span>Total:</span>
                        <span className="text-green-400">${selectedItem.pricing.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedItem.placedItems && (
                    <button
                      onClick={() => openInEditor(selectedItem)}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Edit in Nesting Tool
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                <p>Select an item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
