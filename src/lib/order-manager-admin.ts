/**
 * Server-side Order Manager using Firebase Admin SDK
 * This version works in API routes and server-side contexts
 */

import { getFirestore } from '@/lib/firebase-admin';
import { OrderItem, PrintFile, Order } from '@/lib/order-manager';

export class OrderManagerAdmin {
  private db;
  private ordersCollection;
  
  constructor() {
    this.db = getFirestore();
    this.ordersCollection = this.db.collection('orders');
  }
  
  /**
   * Check if an order with this paymentId already exists
   */
  async getOrderByPaymentId(paymentId: string): Promise<Order | null> {
    try {
      const snapshot = await this.ordersCollection
        .where('paymentId', '==', paymentId)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      return null;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error checking for existing order:', error);
      return null;
    }
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('[OrderManagerAdmin] Creating order for userId:', orderData.userId);
      
      // Check for duplicate order by paymentId
      const existingOrder = await this.getOrderByPaymentId(orderData.paymentId);
      if (existingOrder) {
        console.log('[OrderManagerAdmin] Order already exists for paymentId:', orderData.paymentId);
        return existingOrder.id!;
      }
      
      const now = new Date();
      const order = {
        ...orderData,
        createdAt: now,
        updatedAt: now,
        paidAt: orderData.status === 'paid' ? now : null
      };

      console.log('[OrderManagerAdmin] Order data prepared, adding to Firestore...');
      const docRef = await this.ordersCollection.add(order);
      
      console.log('[OrderManagerAdmin] Order created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error creating order:', error);
      if (error instanceof Error) {
        console.error('[OrderManagerAdmin] Error message:', error.message);
        console.error('[OrderManagerAdmin] Error stack:', error.stack);
      }
      throw new Error('Failed to create order in Firestore');
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = this.ordersCollection.doc(orderId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Order;
      } else {
        return null;
      }
    } catch (error) {
      console.error('[OrderManagerAdmin] Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: string, limitCount?: number): Promise<Order[]> {
    try {
      console.log('[OrderManagerAdmin] Fetching orders for userId:', userId);
      
      let query = this.ordersCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      if (limitCount) {
        query = query.limit(limitCount);
      }

      const snapshot = await query.get();
      const orders: Order[] = [];
      
      snapshot.forEach((doc: any) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      console.log('[OrderManagerAdmin] Found', orders.length, 'orders for user');
      return orders;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error getting user orders:', error);
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
      const docRef = this.ordersCollection.doc(orderId);
      const updateData: any = {
        status,
        updatedAt: new Date(),
        ...additionalData
      };

      // Set specific timestamps based on status
      if (status === 'paid' && !additionalData?.paidAt) {
        updateData.paidAt = new Date();
      } else if (status === 'shipped' && !additionalData?.shippedAt) {
        updateData.shippedAt = new Date();
      } else if (status === 'delivered' && !additionalData?.deliveredAt) {
        updateData.deliveredAt = new Date();
      }

      await docRef.update(updateData);
      console.log('[OrderManagerAdmin] Order status updated:', orderId, status);
    } catch (error) {
      console.error('[OrderManagerAdmin] Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Add print files to an order
   */
  async addPrintFiles(orderId: string, printFiles: PrintFile[]): Promise<void> {
    try {
      const docRef = this.ordersCollection.doc(orderId);
      await docRef.update({
        printFiles,
        updatedAt: new Date()
      });
      console.log('[OrderManagerAdmin] Print files added to order:', orderId);
    } catch (error) {
      console.error('[OrderManagerAdmin] Error adding print files:', error);
      throw new Error('Failed to add print files to order');
    }
  }

  /**
   * Search orders by payment ID
   */
  async getOrderByPaymentId(paymentId: string): Promise<Order | null> {
    try {
      const snapshot = await this.ordersCollection
        .where('paymentId', '==', paymentId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error getting order by payment ID:', error);
      throw new Error('Failed to get order by payment ID');
    }
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(limitCount?: number): Promise<Order[]> {
    try {
      let query = this.ordersCollection.orderBy('createdAt', 'desc');

      if (limitCount) {
        query = query.limit(limitCount);
      }

      const snapshot = await query.get();
      const orders: Order[] = [];
      
      snapshot.forEach((doc: any) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      console.log(`[OrderManagerAdmin] Retrieved ${orders.length} orders`);
      return orders;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error getting all orders:', error);
      throw new Error('Failed to get all orders');
    }
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(status: Order['status'], limitCount?: number): Promise<Order[]> {
    try {
      let query = this.ordersCollection
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');

      if (limitCount) {
        query = query.limit(limitCount);
      }

      const snapshot = await query.get();
      const orders: Order[] = [];
      
      snapshot.forEach((doc: any) => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });

      return orders;
    } catch (error) {
      console.error('[OrderManagerAdmin] Error getting orders by status:', error);
      throw new Error('Failed to get orders by status');
    }
  }
}
