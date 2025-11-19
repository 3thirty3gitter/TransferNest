import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { PrintExportGenerator } from '@/lib/print-export';
import { PrintFileStorage } from '@/lib/print-storage';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
});

export async function POST(request: NextRequest) {
  try {
    const { sourceId, amount, currency, customerInfo, cartItems, userId, taxAmount, shippingAddress, deliveryMethod } = await request.json();

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
      console.log('[PAYMENT] Square payment successful:', {
        paymentId: result.payment.id,
        amountCharged: result.payment.totalMoney,
        status: result.payment.status
      });

      // Get the ACTUAL amount charged by Square (in cents)
      const actualAmountCents = Number(result.payment.totalMoney?.amount || amount);
      const actualAmountDollars = actualAmountCents / 100;
      
      console.log('[PAYMENT] Using actual amount from Square:', {
        cents: actualAmountCents,
        dollars: actualAmountDollars,
        requestedAmount: amount
      });
      
      // First, save the order without print files
      const orderId = await saveOrder({
        paymentId: result.payment.id,
        amount: actualAmountDollars, // Use ACTUAL amount charged by Square
        currency,
        customerInfo,
        cartItems,
        userId,
        status: 'paid',
        printFiles: [], // Will be updated after generation
        taxAmount: taxAmount || 0,
        shippingAddress,
        deliveryMethod
      });

      console.log('[PAYMENT] Order created:', orderId);

      // Now generate and upload print files with customer info for filename
      const printFiles = await generatePrintFiles(cartItems, userId, orderId, customerInfo);
      
      // Update the order with print files
      if (printFiles.length > 0) {
        await updateOrderPrintFiles(orderId, printFiles);
        console.log('[PAYMENT] Updated order with', printFiles.length, 'print files');
      }

      return NextResponse.json({
        success: true,
        paymentId: result.payment.id,
        orderId,
        message: 'Payment processed successfully',
        printFiles: printFiles.map((pf: any) => ({
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
  console.log('[SAVE ORDER] Starting to save order for userId:', orderData.userId);
  console.log('[SAVE ORDER] Input orderData:', JSON.stringify({
    amount: orderData.amount,
    taxAmount: orderData.taxAmount,
    cartItemsCount: orderData.cartItems?.length
  }, null, 2));
  
  try {
    const orderManager = new OrderManagerAdmin();
    
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

    // Calculate subtotal from cart items
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    
    // Use the actual tax amount charged to the customer
    const tax = orderData.taxAmount || 0;
    
    // Shipping is always free (as shown in checkout page)
    const shipping = 0;
    
    // Use the actual amount charged to the customer (should match subtotal + tax)
    const total = orderData.amount;

    console.log('[SAVE ORDER] Calculated values:', { 
      subtotal: subtotal.toFixed(2), 
      tax: tax.toFixed(2), 
      shipping: shipping.toFixed(2), 
      total: total.toFixed(2),
      verification: (subtotal + tax + shipping).toFixed(2)
    });

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
      printFiles: orderData.printFiles || [],
      shippingAddress: orderData.shippingAddress,
      deliveryMethod: orderData.deliveryMethod
    };

    console.log('[SAVE ORDER] Print files count:', orderData.printFiles?.length || 0);

    console.log('[SAVE ORDER] Order object created, calling createOrder...');
    const orderId = await orderManager.createOrder(order);
    console.log('[SAVE ORDER] Order saved to Firestore successfully:', orderId);
    
    return orderId;
  } catch (error) {
    console.error('[SAVE ORDER] Error saving order:', error);
    console.error('[SAVE ORDER] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[SAVE ORDER] Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Fallback to temporary ID if Firestore fails
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[SAVE ORDER] Returning temporary ID:', tempId);
    return tempId;
  }
}

// Helper function to generate print-ready files
async function generatePrintFiles(cartItems: any[], userId: string, orderId: string, customerInfo: any) {
  try {
    const printGenerator = new PrintExportGenerator();
    const printStorage = new PrintFileStorage();
    const printResults = [];

    // Format customer name (replace spaces and special chars with underscores)
    const customerName = `${customerInfo.firstName}_${customerInfo.lastName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    // Get last 8 characters of order ID for cleaner filename
    const orderNumber = orderId.slice(-8);

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
        url: pos.url || pos.imageUrl || '', // Get the actual image URL
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        rotated: pos.rotated || false
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

      // Create custom filename: order#_customer_name_fullsheetsize.png
      const customFilename = `${orderNumber}_${customerName}_${sheetSize}x19.png`;

      // Upload to Firebase Storage
      console.log(`[PRINT] Uploading ${customFilename} to storage...`);
      const uploadedFile = await printStorage.uploadPrintFile(
        printResult.buffer,
        customFilename,
        orderId,
        userId
      );
      
      console.log(`[PRINT] Uploaded successfully:`, uploadedFile.url);

      printResults.push({
        filename: customFilename,
        url: uploadedFile.url,
        path: uploadedFile.path,
        size: uploadedFile.size,
        dimensions: printResult.dimensions
      });
    }

    console.log(`[PRINT] Generated and uploaded ${printResults.length} print files`);
    return printResults;

  } catch (error) {
    console.error('Error generating print files:', error);
    throw error;
  }
}

// Helper function to update order with print files
async function updateOrderPrintFiles(orderId: string, printFiles: any[]) {
  try {
    const orderManager = new OrderManagerAdmin();
    await orderManager.addPrintFiles(orderId, printFiles);
    console.log('[UPDATE] Order print files updated successfully');
  } catch (error) {
    console.error('[UPDATE] Error updating order print files:', error);
    // Don't throw - order was already saved, print files are a bonus
  }
}