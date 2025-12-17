import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  pickupInfo: {
    address: string;
    hours: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
    instructions: string;
  };
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
}

export interface PaymentIntegration {
  provider: 'square';
  enabled: boolean;
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  lastUpdated: Date;
}

export interface ShippingIntegration {
  provider: 'shipstation' | 'easypost' | 'canada-post' | 'none';
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  storeId?: string;
  lastUpdated?: Date;
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string; // HTML content
  isDefault: boolean;
}

export interface EmailIntegration {
  provider: 'microsoft365' | 'resend' | 'none';
  enabled: boolean;
  microsoft365?: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    userEmail: string;
  };
  resend?: {
    apiKey: string;
  };
  signatures?: EmailSignature[];
  lastUpdated?: Date;
}

export interface NotificationSettings {
  // Email addresses for different notification types
  orderNotificationEmail: string;      // For order placed/paid notifications
  generalInquiryEmail: string;         // For contact form / general inquiries
  
  // Toggle notifications on/off
  notifyOnOrderPlaced: boolean;
  notifyOnPaymentReceived: boolean;
  notifyOnGeneralInquiry: boolean;
}

export interface CompanySettings {
  companyInfo: CompanyInfo;
  socialMedia: SocialMediaLinks;
  payment: PaymentIntegration;
  shipping: ShippingIntegration;
  email: EmailIntegration;
  notifications?: NotificationSettings;
  updatedAt: Date;
  updatedBy: string;
}

const SETTINGS_DOC_ID = 'company-settings';

/**
 * Get company settings from Firestore
 */
export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      return getDefaultSettings();
    }
    
    const data = settingsDoc.data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
      payment: {
        ...data.payment,
        lastUpdated: data.payment?.lastUpdated?.toDate() || new Date(),
      },
      shipping: {
        ...data.shipping,
        lastUpdated: data.shipping?.lastUpdated?.toDate() || new Date(),
      },
      email: {
        ...data.email,
        lastUpdated: data.email?.lastUpdated?.toDate() || new Date(),
      },
    } as CompanySettings;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
}

/**
 * Update company settings in Firestore
 */
export async function updateCompanySettings(
  settings: Partial<CompanySettings>,
  userId: string
): Promise<boolean> {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const existingDoc = await getDoc(settingsRef);
    
    const updateData = {
      ...settings,
      updatedAt: new Date(),
      updatedBy: userId,
    };
    
    if (!existingDoc.exists()) {
      // Create new settings document
      const defaultSettings = getDefaultSettings();
      await setDoc(settingsRef, {
        ...defaultSettings,
        ...updateData,
      });
    } else {
      // Update existing settings
      await updateDoc(settingsRef, updateData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating company settings:', error);
    return false;
  }
}

/**
 * Get default settings
 */
export function getDefaultSettings(): CompanySettings {
  return {
    companyInfo: {
      name: 'DTF Wholesale',
      tagline: 'Professional DTF Printing Solutions',
      description: 'High-quality Direct-to-Film printing services for custom apparel and merchandise.',
      email: 'orders@dtf-wholesale.ca',
      phone: '(555) 123-4567',
      address: {
        street: '133 Church St',
        city: 'St Catharines',
        state: 'ON',
        zipCode: 'L2R 3C7',
        country: 'Canada',
      },
      pickupInfo: {
        address: '133 Church St, St Catharines, ON L2R 3C7',
        hours: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '10:00 AM - 2:00 PM',
          sunday: 'Closed',
        },
        instructions: 'Please bring your order confirmation and a valid ID for pickup.',
      },
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      tiktok: '',
      youtube: '',
      pinterest: '',
    },
    payment: {
      provider: 'square',
      enabled: true,
      applicationId: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '',
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
      environment: (process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      lastUpdated: new Date(),
    },
    shipping: {
      provider: 'none',
      enabled: false,
      lastUpdated: new Date(),
    },
    email: {
      provider: 'none',
      enabled: false,
      lastUpdated: new Date(),
    },
    notifications: {
      orderNotificationEmail: '',
      generalInquiryEmail: '',
      notifyOnOrderPlaced: true,
      notifyOnPaymentReceived: true,
      notifyOnGeneralInquiry: true,
    },
    updatedAt: new Date(),
    updatedBy: 'system',
  };
}

/**
 * Test shipping integration
 */
export async function testShippingIntegration(config: ShippingIntegration): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/admin/test-shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to test shipping integration',
    };
  }
}
