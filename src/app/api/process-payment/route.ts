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

    // Validate Square configuration
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.error('[PAYMENT] Missing SQUARE_ACCESS_TOKEN environment variable');
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      console.error('[PAYMENT] Missing NEXT_PUBLIC_SQUARE_LOCATION_ID environment variable');
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!sourceId || !amount || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error('[PAYMENT] Invalid amount:', amount, 'Type:', typeof amount);
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    console.log('[PAYMENT] Processing payment:', {
      amount: amountNum,
      currency: currency || 'CAD',
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      itemCount: cartItems.length
    });

    // Create the payment request
    const requestBody = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(amountNum)),
        currency: currency || 'CAD',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      idempotencyKey: randomUUID(),
      note: `DTF Print Order - ${cartItems.length} item(s)`,
      buyerEmailAddress: customerInfo.email,
    };

    // Process the payment
    const result = await client.payments.create(requestBody);

    if (result.payment) {
      // Payment successful - TWO-PHASE ORDER CREATION
      // Phase 1: Create order without print files
      const orderId = await saveOrder({
        paymentId: result.payment.id,
        amount: amount / 100, // Convert back to dollars
        currency,
        customerInfo,
        cartItems,
        userId,
        status: 'paid',
        printFiles: [], // Empty initially
      });

      console.log(`[ORDER] Order created: ${orderId}`);

      // Phase 2: Generate and upload print files
      try {
        const printFileData = await generateAndUploadPrintFiles(cartItems, orderId, userId);
        console.log(`[ORDER] ${printFileData.length} print files uploaded`);

        // Phase 3: Update order with print file URLs
        const orderManager = new OrderManager();
        await orderManager.addPrintFiles(orderId, printFileData);
        console.log(`[ORDER] Order updated with print file URLs`);

        return NextResponse.json({
          success: true,
          paymentId: result.payment.id,
          orderId,
          message: 'Payment processed successfully',
          printFiles: printFileData.map(pf => ({
            filename: pf.filename,
            url: pf.url,
            dimensions: pf.dimensions
          }))
        });

      } catch (printError) {
        // Order created but print files failed - log error but don't fail payment
        console.error('[ORDER] Print file generation failed:', printError);
        return NextResponse.json({
          success: true,
          paymentId: result.payment.id,
          orderId,
          message: 'Payment processed successfully',
          warning: 'Print files will be generated shortly',
          printFiles: []
        });
      }
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
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
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
      currency: orderData.currency || 'CAD',
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

// Helper function to generate and upload print-ready files
async function generateAndUploadPrintFiles(cartItems: any[], orderId: string, userId: string) {
  try {
    const printGenerator = new PrintExportGenerator();
    const printStorage = new PrintFileStorage();
    const printResults = [];
    const uploadedFiles: any[] = [];

    for (const item of cartItems) {
      const { layout, sheetSize } = item;
      
      if (!layout || !layout.positions || !Array.isArray(layout.positions) || layout.positions.length === 0) {
        console.warn(`[PRINT] No layout positions found for cart item:`, item);
        continue;
      }

      console.log(`[PRINT] Generating print file for ${layout.positions.length} images on ${sheetSize}" sheet`);

      // Convert layout positions to NestedImage format
      const nestedImages = layout.positions.map((pos: any) => ({
        id: pos.imageId || 'unknown',
        url: '', // Placeholder - would fetch from storage in production
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        rotated: false
      }));

      // Generate high-quality print file
      const printResult = await printGenerator.generatePrintFile(
        nestedImages,
        sheetSize,
        {
          dpi: 300,
          format: 'png',
          quality: 100
        }
      );

      printResults.push(printResult);
    }

    console.log(`[PRINT] Generated ${printResults.length} print files`);

    // Upload all print files to Firebase Storage
    for (const printResult of printResults) {
      const uploadResult = await printStorage.uploadPrintResult(
        printResult,
        orderId,
        userId
      );

      uploadedFiles.push({
        filename: uploadResult.filename,
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size,
        dimensions: printResult.dimensions
      });

      console.log(`[PRINT] Uploaded: ${uploadResult.filename} (${(uploadResult.size / 1024).toFixed(2)} KB)`);
    }

    console.log(`[PRINT] All ${uploadedFiles.length} files uploaded to Firebase Storage`);
    return uploadedFiles;

  } catch (error) {
    console.error('Error generating and uploading print files:', error);
    throw error;
  }
}