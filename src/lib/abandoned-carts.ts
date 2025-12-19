import { getFirestore } from '@/lib/firebase-admin';
import type { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';

/**
 * Abandoned Cart/Order Engine
 * 
 * Tracks user sessions where gang sheets were created but orders weren't completed.
 * Enables recovery through follow-up emails and admin visibility.
 */

// Stages in the customer journey - where they dropped off
export type AbandonmentStage = 
  | 'nesting'        // Created gang sheet but didn't add to cart
  | 'cart'           // Added to cart but didn't start checkout
  | 'checkout'       // Started checkout but didn't complete payment
  | 'payment_failed'; // Payment was attempted but failed

export interface AbandonedCartItem {
  name: string;
  sheetSize: string;
  sheetWidth: number;
  sheetLength: number;
  imageCount: number;
  estimatedPrice: number;
  thumbnailUrl?: string;
  placedItemsCount: number;
  utilization?: number;
}

export interface AbandonedCart {
  id: string;
  
  // Customer identification
  userId?: string;           // Firebase user ID if logged in
  sessionId: string;         // Browser session ID for anonymous users
  email?: string;            // Email if captured (from account or checkout)
  customerName?: string;     // Name if known
  phone?: string;            // Phone if known
  
  // Cart contents
  items: AbandonedCartItem[];
  estimatedTotal: number;
  currency: string;
  
  // Abandonment details
  stage: AbandonmentStage;
  stageDetails?: string;     // Additional context (e.g., "payment declined - insufficient funds")
  
  // Timing
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastActivityAt: Date | Timestamp;
  abandonedAt?: Date | Timestamp;  // When we determined it was abandoned
  
  // Recovery tracking
  recoveryEmailsSent: number;
  lastRecoveryEmailAt?: Date | Timestamp;
  recoveryEmailHistory?: Array<{
    sentAt: Date | Timestamp;
    templateType: 'first' | 'second' | 'final';
    discountCode?: string;
  }>;
  
  // Outcome
  recovered: boolean;        // Did they eventually complete an order?
  recoveredOrderId?: string; // The order ID if recovered
  recoveredAt?: Date | Timestamp;
  
  // Source tracking
  referrer?: string;         // Where they came from
  userAgent?: string;        // Browser info
  
  // Admin notes
  notes?: string;
}

export interface AbandonedCartStats {
  total: number;
  byStage: Record<AbandonmentStage, number>;
  totalValue: number;
  recoveredCount: number;
  recoveredValue: number;
  recoveryRate: number;
  averageValue: number;
  last24Hours: number;
  last7Days: number;
}

// ============ CRUD Operations ============

/**
 * Create or update an abandoned cart record
 */
export async function upsertAbandonedCart(
  sessionId: string,
  data: Partial<Omit<AbandonedCart, 'id' | 'createdAt'>>
): Promise<string> {
  console.log('[ABANDONED_CART_LIB] upsertAbandonedCart called with sessionId:', sessionId);
  
  const db = getFirestore();
  console.log('[ABANDONED_CART_LIB] Got Firestore instance');
  
  const cartsRef = db.collection('abandonedCarts');
  
  // Check if cart already exists for this session
  console.log('[ABANDONED_CART_LIB] Querying for existing cart...');
  const existingQuery = await cartsRef
    .where('sessionId', '==', sessionId)
    .where('recovered', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  console.log('[ABANDONED_CART_LIB] Query complete, found:', existingQuery.size, 'docs');
  
  const now = new Date();
  
  if (!existingQuery.empty) {
    // Update existing cart
    const doc = existingQuery.docs[0];
    console.log('[ABANDONED_CART_LIB] Updating existing cart:', doc.id);
    await doc.ref.update({
      ...data,
      updatedAt: now,
      lastActivityAt: now,
    });
    console.log('[ABANDONED_CART_LIB] Update complete');
    return doc.id;
  } else {
    // Create new cart
    console.log('[ABANDONED_CART_LIB] Creating new cart...');
    const newCart: Omit<AbandonedCart, 'id'> = {
      sessionId,
      items: [],
      estimatedTotal: 0,
      currency: 'CAD',
      stage: 'nesting',
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      recoveryEmailsSent: 0,
      recovered: false,
      ...data,
    };
    
    const docRef = await cartsRef.add(newCart);
    console.log('[ABANDONED_CART_LIB] Created new cart:', docRef.id);
    return docRef.id;
  }
}

/**
 * Update cart stage (progression through funnel)
 */
export async function updateCartStage(
  sessionId: string,
  stage: AbandonmentStage,
  details?: string
): Promise<void> {
  const db = getFirestore();
  const cartsRef = db.collection('abandonedCarts');
  
  const query = await cartsRef
    .where('sessionId', '==', sessionId)
    .where('recovered', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  if (!query.empty) {
    await query.docs[0].ref.update({
      stage,
      stageDetails: details || null,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    });
  }
}

/**
 * Mark cart as recovered (order completed)
 */
export async function markCartAsRecovered(
  sessionId: string,
  orderId: string
): Promise<void> {
  const db = getFirestore();
  const cartsRef = db.collection('abandonedCarts');
  
  const query = await cartsRef
    .where('sessionId', '==', sessionId)
    .where('recovered', '==', false)
    .get();
  
  const batch = db.batch();
  const now = new Date();
  
  query.docs.forEach((doc: QueryDocumentSnapshot) => {
    batch.update(doc.ref, {
      recovered: true,
      recoveredOrderId: orderId,
      recoveredAt: now,
      updatedAt: now,
    });
  });
  
  await batch.commit();
}

/**
 * Mark cart as recovered by userId
 */
export async function markCartAsRecoveredByUser(
  userId: string,
  orderId: string
): Promise<void> {
  const db = getFirestore();
  const cartsRef = db.collection('abandonedCarts');
  
  const query = await cartsRef
    .where('userId', '==', userId)
    .where('recovered', '==', false)
    .get();
  
  const batch = db.batch();
  const now = new Date();
  
  query.docs.forEach((doc: QueryDocumentSnapshot) => {
    batch.update(doc.ref, {
      recovered: true,
      recoveredOrderId: orderId,
      recoveredAt: now,
      updatedAt: now,
    });
  });
  
  await batch.commit();
}

/**
 * Get abandoned cart by ID
 */
export async function getAbandonedCart(cartId: string): Promise<AbandonedCart | null> {
  const db = getFirestore();
  const doc = await db.collection('abandonedCarts').doc(cartId).get();
  
  if (!doc.exists) return null;
  
  return { id: doc.id, ...doc.data() } as AbandonedCart;
}

/**
 * Get all abandoned carts (for admin)
 */
export async function getAbandonedCarts(options: {
  stage?: AbandonmentStage;
  recovered?: boolean;
  limit?: number;
  minValue?: number;
  daysBack?: number;
}): Promise<AbandonedCart[]> {
  const db = getFirestore();
  let query: FirebaseFirestore.Query = db.collection('abandonedCarts');
  
  if (options.recovered !== undefined) {
    query = query.where('recovered', '==', options.recovered);
  }
  
  if (options.stage) {
    query = query.where('stage', '==', options.stage);
  }
  
  if (options.daysBack) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - options.daysBack);
    query = query.where('createdAt', '>=', cutoff);
  }
  
  query = query.orderBy('createdAt', 'desc');
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  
  let carts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AbandonedCart));
  
  // Filter by min value (can't do in Firestore query with other conditions)
  if (options.minValue) {
    carts = carts.filter(cart => cart.estimatedTotal >= options.minValue!);
  }
  
  return carts;
}

/**
 * Get abandoned cart statistics
 */
export async function getAbandonedCartStats(): Promise<AbandonedCartStats> {
  const db = getFirestore();
  const cartsRef = db.collection('abandonedCarts');
  
  // Get all carts from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const snapshot = await cartsRef
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();
  
  const carts = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as AbandonedCart);
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const stats: AbandonedCartStats = {
    total: carts.length,
    byStage: {
      nesting: 0,
      cart: 0,
      checkout: 0,
      payment_failed: 0,
    },
    totalValue: 0,
    recoveredCount: 0,
    recoveredValue: 0,
    recoveryRate: 0,
    averageValue: 0,
    last24Hours: 0,
    last7Days: 0,
  };
  
  carts.forEach((cart: AbandonedCart) => {
    stats.byStage[cart.stage]++;
    stats.totalValue += cart.estimatedTotal || 0;
    
    if (cart.recovered) {
      stats.recoveredCount++;
      stats.recoveredValue += cart.estimatedTotal || 0;
    }
    
    const createdAt = cart.createdAt instanceof Date 
      ? cart.createdAt 
      : (cart.createdAt as any)?.toDate?.() || new Date();
    
    if (createdAt >= oneDayAgo) stats.last24Hours++;
    if (createdAt >= sevenDaysAgo) stats.last7Days++;
  });
  
  stats.recoveryRate = stats.total > 0 ? (stats.recoveredCount / stats.total) * 100 : 0;
  stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
  
  return stats;
}

/**
 * Record recovery email sent
 */
export async function recordRecoveryEmail(
  cartId: string,
  templateType: 'first' | 'second' | 'final',
  discountCode?: string
): Promise<void> {
  const db = getFirestore();
  const cartRef = db.collection('abandonedCarts').doc(cartId);
  const cart = await cartRef.get();
  
  if (!cart.exists) return;
  
  const data = cart.data() as AbandonedCart;
  const now = new Date();
  
  const emailRecord = {
    sentAt: now,
    templateType,
    discountCode,
  };
  
  await cartRef.update({
    recoveryEmailsSent: (data.recoveryEmailsSent || 0) + 1,
    lastRecoveryEmailAt: now,
    recoveryEmailHistory: [...(data.recoveryEmailHistory || []), emailRecord],
    updatedAt: now,
  });
}

/**
 * Get carts that need recovery emails
 * Returns carts that haven't received emails yet or are due for follow-up
 */
export async function getCartsNeedingRecovery(): Promise<AbandonedCart[]> {
  const db = getFirestore();
  const cartsRef = db.collection('abandonedCarts');
  
  // Get unrecovered carts from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Carts abandoned at least 1 hour ago (give them time to come back)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  
  const snapshot = await cartsRef
    .where('recovered', '==', false)
    .where('createdAt', '>=', sevenDaysAgo)
    .where('lastActivityAt', '<=', oneHourAgo)
    .orderBy('lastActivityAt', 'asc')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs
    .map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as AbandonedCart))
    .filter((cart: AbandonedCart) => {
      // Must have email to send recovery
      if (!cart.email) return false;
      
      // Must have items
      if (!cart.items || cart.items.length === 0) return false;
      
      // Check if due for next email
      if (cart.recoveryEmailsSent === 0) return true; // Never sent
      if (cart.recoveryEmailsSent === 1) {
        // Send second email after 24 hours
        const lastSent = cart.lastRecoveryEmailAt instanceof Date
          ? cart.lastRecoveryEmailAt
          : (cart.lastRecoveryEmailAt as any)?.toDate?.();
        if (lastSent) {
          const hoursSinceLast = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          return hoursSinceLast >= 24;
        }
      }
      if (cart.recoveryEmailsSent === 2) {
        // Send final email after 48 hours
        const lastSent = cart.lastRecoveryEmailAt instanceof Date
          ? cart.lastRecoveryEmailAt
          : (cart.lastRecoveryEmailAt as any)?.toDate?.();
        if (lastSent) {
          const hoursSinceLast = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          return hoursSinceLast >= 48;
        }
      }
      
      // Max 3 emails
      return false;
    });
}

/**
 * Add admin note to abandoned cart
 */
export async function addCartNote(cartId: string, note: string): Promise<void> {
  const db = getFirestore();
  await db.collection('abandonedCarts').doc(cartId).update({
    notes: note,
    updatedAt: new Date(),
  });
}
