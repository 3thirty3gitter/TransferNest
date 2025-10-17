import { NextRequest, NextResponse } from 'next/server';
import { Client, Environment } from 'squareup';
import { randomUUID } from 'crypto';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox,
});

export async function POST(request: NextRequest) {
  try {
    const { sourceId, amount, currency, customerInfo, cartItems, userId } = await request.json();

    // Validate required fields
    if (!sourceId || !amount || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Create the payment request
    const paymentsApi = client.paymentsApi;
    const requestBody = {
      sourceId,
      amountMoney: {
        amount: BigInt(amount),
        currency: currency || 'USD',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      idempotencyKey: randomUUID(),
      note: `DTF Print Order - ${cartItems.length} item(s)`,
      buyerEmailAddress: customerInfo.email,
    };

    // Process the payment
    const { result, statusCode } = await paymentsApi.createPayment(requestBody);

    if (statusCode === 200 && result.payment) {
      // Payment successful - now save the order
      const orderId = await saveOrder({
        paymentId: result.payment.id,
        amount: amount / 100, // Convert back to dollars
        currency,
        customerInfo,
        cartItems,
        userId,
        status: 'paid',
      });

      // TODO: Generate and store print-ready files here
      await generatePrintFiles(cartItems, orderId);

      return NextResponse.json({
        success: true,
        paymentId: result.payment.id,
        orderId,
        message: 'Payment processed successfully',
      });
    } else {
      // Payment failed
      const errorMessages = result.errors?.map((error: any) => error.detail).join(', ') || 'Payment failed';
      
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to save order to database
async function saveOrder(orderData: any) {
  // TODO: Implement Firebase Firestore order saving
  // For now, generate a temporary order ID
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In a real implementation, save to Firestore:
  // const orderDoc = await db.collection('orders').add(orderData);
  // return orderDoc.id;
  
  console.log('Order saved:', { orderId, ...orderData });
  return orderId;
}

// Helper function to generate print-ready files
async function generatePrintFiles(cartItems: any[], orderId: string) {
  // TODO: Implement high-quality PNG generation
  // This will be implemented in the next todo item
  console.log('Generating print files for order:', orderId, cartItems);
  
  // For each cart item:
  // 1. Load the nested layout
  // 2. Generate 300 DPI PNG at proper dimensions
  // 3. Store in Firebase Storage
  // 4. Update order with file URLs
}