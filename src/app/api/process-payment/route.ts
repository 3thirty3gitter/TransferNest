import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { PrintExportGenerator } from '@/lib/print-export';
import { PrintFileStorage } from '@/lib/print-storage';
import { OrderManager } from '@/lib/order-manager';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
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
    const result = await client.payments.create(requestBody);

    if (result.payment) {
      // Payment successful - now save the order and generate print files
      const printFiles = await generatePrintFiles(cartItems, userId);
      
      const orderId = await saveOrder({
        paymentId: result.payment.id,
        amount: amount / 100, // Convert back to dollars
        currency,
        customerInfo,
        cartItems,
        userId,
        status: 'paid',
        printFiles,
      });

      return NextResponse.json({
        success: true,
        paymentId: result.payment.id,
        orderId,
        message: 'Payment processed successfully',
        printFiles: printFiles.map(pf => ({
          filename: pf.filename,
          dimensions: pf.dimensions
        }))
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
  try {
    const orderManager = new OrderManager();
    
    // Transform cart items to order items
    const orderItems = orderData.cartItems.map((item: any) => ({
      id: randomUUID(),
      images: item.images,
      sheetSize: item.sheetSize,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      utilization: item.utilization || 0
    }));

    // Calculate totals
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    const order = {
      userId: orderData.userId,
      paymentId: orderData.paymentId,
      status: orderData.status,
      customerInfo: orderData.customerInfo,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      currency: orderData.currency || 'USD',
      printFiles: []
    };

    const orderId = await orderManager.createOrder(order);
    console.log('Order saved to Firestore:', orderId);
    
    return orderId;
  } catch (error) {
    console.error('Error saving order:', error);
    // Fallback to temporary ID if Firestore fails
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Helper function to generate print-ready files
async function generatePrintFiles(cartItems: any[], userId: string) {
  try {
    const printGenerator = new PrintExportGenerator();
    const printStorage = new PrintFileStorage();
    const printResults = [];

    for (const item of cartItems) {
      const { images, sheetSize } = item;
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        console.warn(`No images found for cart item`);
        continue;
      }

      // Generate high-quality print file
      const printResult = await printGenerator.generatePrintFile(
        images,
        sheetSize,
        {
          dpi: 300,
          format: 'png',
          quality: 100
        }
      );

      printResults.push(printResult);
    }

    console.log(`Generated ${printResults.length} print files`);
    return printResults;

  } catch (error) {
    console.error('Error generating print files:', error);
    throw error;
  }
}