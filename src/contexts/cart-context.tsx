'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ManagedImage } from '@/lib/nesting-algorithm';

export interface CartItem {
  id: string;
  name: string;
  sheetSize: '13' | '17';
  images: ManagedImage[];
  layout: {
    positions: Array<{ x: number; y: number; width: number; height: number; imageId: string; copyIndex: number; rotated?: boolean }>;
    utilization: number;
    totalCopies: number;
    sheetWidth: number;
    sheetHeight: number;
  };
  pricing: {
    basePrice: number;
    setupFee: number;
    total: number;
  };
  quantity: number;
  dateAdded: Date;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'id' | 'dateAdded'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_ITEM'; payload: { id: string; item: Omit<CartItem, 'id' | 'dateAdded'> } }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem: CartItem = {
        ...action.payload,
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date(),
      };

      const newItems = [...state.items, newItem];
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + (item.pricing.total * item.quantity), 0);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + (item.pricing.total * item.quantity), 0);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + (item.pricing.total * item.quantity), 0);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...action.payload.item, id: item.id, dateAdded: item.dateAdded }
          : item
      );

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum, item) => sum + (item.pricing.total * item.quantity), 0);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    }

    case 'CLEAR_CART':
      return initialState;

    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'id' | 'dateAdded'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, item: Omit<CartItem, 'id' | 'dateAdded'>) => void;
  getItemById: (id: string) => CartItem | undefined;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Omit<CartItem, 'id' | 'dateAdded'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const updateItem = (id: string, item: Omit<CartItem, 'id' | 'dateAdded'>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, item } });
  };

  const getItemById = (id: string): CartItem | undefined => {
    return state.items.find(item => item.id === id);
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        getItemById,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}