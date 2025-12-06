import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';

export interface OrderItem {
  id: string;
  images: any[]; // NestedImage[]
  sheetSize: '17';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  utilization: number;
}

export interface PrintFile {
  filename: string;
  url: string;
  path: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
}

export interface Order {
  id?: string;
  userId: string;
  paymentId: string;
  status: 'pending' | 'paid' | 'processing' | 'printing' | 'printed' | 'ready_for_pickup' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  
  // Customer Information
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    billingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    shippingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  
  // Order Details
  items: OrderItem[];
  subtotal: number;
  discountPercentage?: number;
  discountAmount?: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  
  // Print Files
  printFiles: PrintFile[];
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  paidAt?: Timestamp;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  
  // Additional metadata
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Timestamp;
  shippingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    labelUrl?: string;
  };
}

export class OrderManager {
  private readonly ordersCollection = collection(db, 'orders');
  
  /**
   * Create a new order
   */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const order: Omit<Order, 'id'> = {
        ...orderData,
        createdAt: now,
        updatedAt: now,
        paidAt: orderData.status === 'paid' ? now : undefined
      };

      const docRef = await addDoc(this.ordersCollection, order);
      console.log('Order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(this.ordersCollection, orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: string, limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        this.ordersCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new Error('Failed to get user orders');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string, 
    status: Order['status'], 
    additionalData?: Partial<Order>
  ): Promise<void> {
    try {
      const docRef = doc(this.ordersCollection, orderId);
      const updateData: Partial<Order> = {
        status,
        updatedAt: Timestamp.now(),
        ...additionalData
      };

      // Set specific timestamps based on status
      if (status === 'paid' && !additionalData?.paidAt) {
        updateData.paidAt = Timestamp.now();
      } else if (status === 'shipped' && !additionalData?.shippedAt) {
        updateData.shippedAt = Timestamp.now();
      } else if (status === 'delivered' && !additionalData?.deliveredAt) {
        updateData.deliveredAt = Timestamp.now();
      }

      await updateDoc(docRef, updateData);
      console.log('Order status updated:', orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Add print files to an order
   */
  async addPrintFiles(orderId: string, printFiles: PrintFile[]): Promise<void> {
    try {
      const docRef = doc(this.ordersCollection, orderId);
      await updateDoc(docRef, {
        printFiles,
        updatedAt: Timestamp.now()
      });
      console.log('Print files added to order:', orderId);
    } catch (error) {
      console.error('Error adding print files to order:', error);
      throw new Error('Failed to add print files to order');
    }
  }

  /**
   * Add tracking number to an order
   */
  async addTrackingNumber(orderId: string, trackingNumber: string): Promise<void> {
    try {
      await this.updateOrderStatus(orderId, 'shipped', {
        trackingNumber,
        shippedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding tracking number:', error);
      throw new Error('Failed to add tracking number');
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: Order['status'], limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        this.ordersCollection,
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw new Error('Failed to get orders by status');
    }
  }

  /**
   * Search orders by payment ID
   */
  async getOrderByPaymentId(paymentId: string): Promise<Order | null> {
    try {
      const q = query(
        this.ordersCollection,
        where('paymentId', '==', paymentId)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting order by payment ID:', error);
      throw new Error('Failed to get order by payment ID');
    }
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(limitCount?: number): Promise<Order[]> {
    try {
      let q = query(
        this.ordersCollection,
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      console.log(`Retrieved ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw new Error('Failed to get all orders');
    }
  }
}