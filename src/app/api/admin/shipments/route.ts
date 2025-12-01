import { NextResponse } from 'next/server';
import EasyPost from '@easypost/api';
import { getFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const adminDb = getFirestore();

// Helper to get company settings
async function getCompanySettings() {
  const settingsDoc = await adminDb.collection('settings').doc('company-settings').get();
  if (!settingsDoc.exists) return null;
  return settingsDoc.data();
}

// Helper to get order
async function getOrder(orderId: string) {
  const orderDoc = await adminDb.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) return null;
  return { id: orderDoc.id, ...orderDoc.data() };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch Settings & Initialize EasyPost
    const settings = await getCompanySettings();
    if (!settings?.shipping?.enabled || settings.shipping.provider !== 'easypost' || !settings.shipping.apiKey) {
      return NextResponse.json({ success: false, message: 'EasyPost is not configured or enabled' }, { status: 400 });
    }

    const client = new EasyPost(settings.shipping.apiKey);

    // 2. Prepare From Address
    const fromAddress = {
      name: settings.companyInfo.name,
      street1: settings.companyInfo.address.street,
      city: settings.companyInfo.address.city,
      state: settings.companyInfo.address.state,
      zip: settings.companyInfo.address.zipCode,
      country: settings.companyInfo.address.country || 'CA',
      phone: settings.companyInfo.phone,
      email: settings.companyInfo.email,
    };

    // 3. Handle Actions
    if (action === 'rates') {
      const { toAddress, parcel } = body;

      // Create Shipment to get rates
      const shipment = await client.Shipment.create({
        to_address: {
          name: toAddress.name,
          street1: toAddress.street1,
          street2: toAddress.street2,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'CA',
          phone: toAddress.phone,
          email: toAddress.email,
        },
        from_address: fromAddress,
        parcel: {
          length: parseFloat(parcel.length),
          width: parseFloat(parcel.width),
          height: parseFloat(parcel.height),
          weight: parseFloat(parcel.weight), // in oz usually, or defined by carrier. EasyPost defaults to oz.
        },
      });

      return NextResponse.json({ success: true, shipment });
    } 
    
    else if (action === 'buy') {
      const { shipmentId, rateId } = body;

      if (!shipmentId || !rateId) {
        return NextResponse.json({ success: false, message: 'Shipment ID and Rate ID are required' }, { status: 400 });
      }

      // Retrieve shipment and buy rate
      const shipment = await client.Shipment.retrieve(shipmentId);
      const boughtShipment = await client.Shipment.buy(shipmentId, rateId);

      // Update Order in Firestore
      const trackingNumber = boughtShipment.tracker.tracking_code;
      const labelUrl = boughtShipment.postage_label.label_url;
      const carrier = boughtShipment.selected_rate.carrier;
      const service = boughtShipment.selected_rate.service;

      await adminDb.collection('orders').doc(orderId).update({
        status: 'shipped',
        shippingInfo: {
          provider: 'easypost',
          shipmentId: boughtShipment.id,
          trackingNumber,
          labelUrl,
          carrier,
          service,
          shippedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({ 
        success: true, 
        trackingNumber, 
        labelUrl,
        message: 'Label purchased and order updated' 
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Shipping API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An error occurred processing the shipping request' 
    }, { status: 500 });
  }
}
