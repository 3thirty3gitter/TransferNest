import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Discount Types
export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface DiscountCode {
  id: string;
  code: string;                          // The actual discount code (e.g., "SAVE10")
  description: string;                   // Internal description
  type: DiscountType;                    // percentage, fixed, or free_shipping
  value: number;                         // Percentage (0-100) or fixed amount in dollars
  
  // Conditions
  minimumOrderAmount?: number;           // Minimum cart total to apply
  minimumQuantity?: number;              // Minimum number of items
  applicableProducts?: string[];         // Specific product IDs (empty = all products)
  applicableSheetSizes?: string[];       // Specific sheet sizes (empty = all sizes)
  
  // Limits
  maxUses?: number;                      // Total times this code can be used
  maxUsesPerCustomer?: number;           // Times per customer
  currentUses: number;                   // Current usage count
  
  // Validity
  isActive: boolean;
  startDate?: Timestamp;                 // When discount becomes active
  endDate?: Timestamp;                   // When discount expires
  
  // Restrictions
  firstOrderOnly: boolean;               // Only for customers with no previous orders
  combinable: boolean;                   // Can be combined with other discounts
  excludeSaleItems: boolean;             // Don't apply to already-discounted items
  
  // Tracking
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                     // Admin user ID who created it
  
  // Statistics
  totalSavingsGiven: number;             // Total $ amount saved by customers
  usageHistory?: DiscountUsage[];        // Recent usage records (optional, for display)
}

export interface DiscountUsage {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  amountSaved: number;
  usedAt: Timestamp;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: DiscountCode;
  discountAmount?: number;              // Calculated discount amount
  discountPercentage?: number;          // If percentage type
  message: string;
  freeShipping?: boolean;
}

// Firestore collection name
const DISCOUNTS_COLLECTION = 'discounts';
const DISCOUNT_USAGE_COLLECTION = 'discountUsage';

/**
 * Generate a unique ID for a new discount
 */
export function generateDiscountId(): string {
  return doc(collection(db, DISCOUNTS_COLLECTION)).id;
}

/**
 * Get all discount codes
 */
export async function getAllDiscounts(): Promise<DiscountCode[]> {
  const querySnapshot = await getDocs(collection(db, DISCOUNTS_COLLECTION));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as DiscountCode[];
}

/**
 * Get active discount codes only
 */
export async function getActiveDiscounts(): Promise<DiscountCode[]> {
  const q = query(
    collection(db, DISCOUNTS_COLLECTION),
    where('isActive', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as DiscountCode[];
}

/**
 * Get a single discount by ID
 */
export async function getDiscountById(id: string): Promise<DiscountCode | null> {
  const docRef = doc(db, DISCOUNTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { id: docSnap.id, ...docSnap.data() } as DiscountCode;
}

/**
 * Get a discount by code (case-insensitive)
 */
export async function getDiscountByCode(code: string): Promise<DiscountCode | null> {
  const normalizedCode = code.toUpperCase().trim();
  const q = query(
    collection(db, DISCOUNTS_COLLECTION),
    where('code', '==', normalizedCode)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DiscountCode;
}

/**
 * Create a new discount code
 */
export async function createDiscount(
  discount: Omit<DiscountCode, 'id' | 'createdAt' | 'updatedAt' | 'currentUses' | 'totalSavingsGiven'>
): Promise<DiscountCode> {
  const id = generateDiscountId();
  const now = Timestamp.now();
  
  const newDiscount: DiscountCode = {
    ...discount,
    id,
    code: discount.code.toUpperCase().trim(), // Normalize code
    createdAt: now,
    updatedAt: now,
    currentUses: 0,
    totalSavingsGiven: 0,
  };
  
  await setDoc(doc(db, DISCOUNTS_COLLECTION, id), newDiscount);
  return newDiscount;
}

/**
 * Update an existing discount code
 */
export async function updateDiscount(
  id: string,
  updates: Partial<Omit<DiscountCode, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const docRef = doc(db, DISCOUNTS_COLLECTION, id);
  
  // Normalize code if being updated
  if (updates.code) {
    updates.code = updates.code.toUpperCase().trim();
  }
  
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
}

/**
 * Delete a discount code
 */
export async function deleteDiscount(id: string): Promise<void> {
  await deleteDoc(doc(db, DISCOUNTS_COLLECTION, id));
}

/**
 * Toggle discount active status
 */
export async function toggleDiscountStatus(id: string, isActive: boolean): Promise<void> {
  await updateDiscount(id, { isActive });
}

/**
 * Validate a discount code for a specific order
 */
export async function validateDiscountCode(
  code: string,
  orderTotal: number,
  itemCount: number,
  customerId?: string,
  customerOrderCount?: number,
  productIds?: string[],
  sheetSizes?: string[]
): Promise<DiscountValidationResult> {
  // Find the discount
  const discount = await getDiscountByCode(code);
  
  if (!discount) {
    return { valid: false, message: 'Invalid discount code' };
  }
  
  // Check if active
  if (!discount.isActive) {
    return { valid: false, message: 'This discount code is no longer active' };
  }
  
  // Check date validity
  const now = Timestamp.now();
  if (discount.startDate && discount.startDate.toMillis() > now.toMillis()) {
    return { valid: false, message: 'This discount code is not yet active' };
  }
  if (discount.endDate && discount.endDate.toMillis() < now.toMillis()) {
    return { valid: false, message: 'This discount code has expired' };
  }
  
  // Check max uses
  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    return { valid: false, message: 'This discount code has reached its usage limit' };
  }
  
  // Check minimum order amount
  if (discount.minimumOrderAmount && orderTotal < discount.minimumOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order of $${discount.minimumOrderAmount.toFixed(2)} required` 
    };
  }
  
  // Check minimum quantity
  if (discount.minimumQuantity && itemCount < discount.minimumQuantity) {
    return { 
      valid: false, 
      message: `Minimum of ${discount.minimumQuantity} items required` 
    };
  }
  
  // Check first order only
  if (discount.firstOrderOnly && customerOrderCount && customerOrderCount > 0) {
    return { valid: false, message: 'This discount is only valid for first-time customers' };
  }
  
  // Check per-customer usage limit
  if (discount.maxUsesPerCustomer && customerId) {
    const usageCount = await getCustomerUsageCount(discount.id, customerId);
    if (usageCount >= discount.maxUsesPerCustomer) {
      return { valid: false, message: 'You have already used this discount code' };
    }
  }
  
  // Check applicable products
  if (discount.applicableProducts && discount.applicableProducts.length > 0 && productIds) {
    const hasApplicableProduct = productIds.some(id => 
      discount.applicableProducts!.includes(id)
    );
    if (!hasApplicableProduct) {
      return { valid: false, message: 'This discount does not apply to items in your cart' };
    }
  }
  
  // Check applicable sheet sizes
  if (discount.applicableSheetSizes && discount.applicableSheetSizes.length > 0 && sheetSizes) {
    const hasApplicableSize = sheetSizes.some(size => 
      discount.applicableSheetSizes!.includes(size)
    );
    if (!hasApplicableSize) {
      return { valid: false, message: 'This discount does not apply to the sheet sizes in your cart' };
    }
  }
  
  // Calculate discount amount
  let discountAmount = 0;
  let discountPercentage: number | undefined;
  let freeShipping = false;
  
  switch (discount.type) {
    case 'percentage':
      discountPercentage = discount.value;
      discountAmount = (orderTotal * discount.value) / 100;
      break;
    case 'fixed':
      discountAmount = Math.min(discount.value, orderTotal); // Don't exceed order total
      break;
    case 'free_shipping':
      freeShipping = true;
      discountAmount = 0; // Shipping cost will be handled separately
      break;
  }
  
  return {
    valid: true,
    discount,
    discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    discountPercentage,
    freeShipping,
    message: discount.type === 'free_shipping' 
      ? 'Free shipping applied!' 
      : `Discount of $${discountAmount.toFixed(2)} applied!`
  };
}

/**
 * Record discount usage when an order is placed
 */
export async function recordDiscountUsage(
  discountId: string,
  orderId: string,
  orderNumber: string,
  customerId: string,
  customerEmail: string,
  amountSaved: number
): Promise<void> {
  // Update the discount stats
  const discountRef = doc(db, DISCOUNTS_COLLECTION, discountId);
  await updateDoc(discountRef, {
    currentUses: increment(1),
    totalSavingsGiven: increment(amountSaved),
    updatedAt: Timestamp.now()
  });
  
  // Record the usage
  const usageId = doc(collection(db, DISCOUNT_USAGE_COLLECTION)).id;
  await setDoc(doc(db, DISCOUNT_USAGE_COLLECTION, usageId), {
    discountId,
    orderId,
    orderNumber,
    customerId,
    customerEmail,
    amountSaved,
    usedAt: Timestamp.now()
  });
}

/**
 * Get usage count for a specific customer and discount
 */
async function getCustomerUsageCount(discountId: string, customerId: string): Promise<number> {
  const q = query(
    collection(db, DISCOUNT_USAGE_COLLECTION),
    where('discountId', '==', discountId),
    where('customerId', '==', customerId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

/**
 * Get usage history for a discount
 */
export async function getDiscountUsageHistory(discountId: string, limit = 50): Promise<DiscountUsage[]> {
  const q = query(
    collection(db, DISCOUNT_USAGE_COLLECTION),
    where('discountId', '==', discountId)
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs
    .map(doc => doc.data() as DiscountUsage)
    .sort((a, b) => b.usedAt.toMillis() - a.usedAt.toMillis())
    .slice(0, limit);
}

/**
 * Generate a random discount code
 */
export function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a code already exists
 */
export async function codeExists(code: string): Promise<boolean> {
  const discount = await getDiscountByCode(code);
  return discount !== null;
}
