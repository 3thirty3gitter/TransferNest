'use server';

import { executeNesting, type ManagedImage } from '@/lib/nesting-algorithm';
import { CartItem, CartFlowInput, CartFlowOutput } from './schema';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    // Use environment variables for Firebase config in production
    // For now, use default project initialization
  });
}

const db = getFirestore();

export async function nestImages(images: ManagedImage[], sheetWidth: number) {
  try {
    const result = executeNesting(images, sheetWidth);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Production-ready cart actions
export async function getCartItemsAction(userId: string): Promise<CartItem[]> {
  try {
    if (!userId) {
      return [];
    }

    const cartRef = db.collection('cart_items').where('userId', '==', userId);
    const snapshot = await cartRef.get();
    
    const items: CartItem[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      items.push({
        id: doc.id,
        userId: data.userId,
        sheetWidth: data.sheetWidth,
        sheetLength: data.sheetLength,
        price: data.price,
        pngUrl: data.pngUrl,
        createdAt: data.createdAt
      });
    });

    return items;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
}

export async function removeCartItemAction(docId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('cart_items').doc(docId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error removing cart item:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function addToCartAction(cartInput: CartFlowInput): Promise<CartFlowOutput> {
  try {
    // Generate a simple PNG URL for now (in production, this would generate actual image)
    const pngUrl = `https://placeholder.pics/${cartInput.sheetWidth}x${cartInput.sheetLength}`;
    
    const cartItem = {
      userId: cartInput.userId,
      sheetWidth: cartInput.sheetWidth,
      sheetLength: cartInput.sheetLength,
      price: cartInput.price,
      pngUrl,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('cart_items').add(cartItem);
    
    return {
      success: true,
      docId: docRef.id
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
