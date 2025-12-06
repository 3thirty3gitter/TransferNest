import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { PrintExportGenerator } from '@/lib/print-export';
import { PrintFileStorageAdmin } from '@/lib/print-storage-admin';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/lib/email';
import { generateGangSheet } from '@/lib/gang-sheet-generator';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      sourceId, 
      amount, 
      currency, 
      customerInfo, 
      cartItems, 
      userId, 
      taxAmount, 
      shippingAddress, 
      deliveryMethod,
      shippingCost,
      shippingRate,
      taxBreakdown,
      discountPercentage,
      discountAmount
    } = await request.json();

    console.log('[PAYMENT API] Received request:', {
      sourceId,
      amount,
      userId,
      discountPercentage,
      discountAmount
    });

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
    if (!sourceId || amount === undefined || amount === null || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum < 0) {
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
      itemCount: cartItems.length,
      isDiscounted: amountNum === 0
    });

    let paymentResult;

    // Handle 100% discount case (amount is 0)
    if (amountNum === 0 && sourceId === '100-PERCENT-DISCOUNT') {
      console.log('[PAYMENT] Processing 100% discount order - skipping Square payment');
      paymentResult = {
        payment: {
          id: `DISCOUNT-100-${randomUUID()}`,
          totalMoney: { amount: BigInt(0), currency: currency || 'CAD' },
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          receiptUrl: null
        }
      };
    } else {
      // Create the payment request for normal orders
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
      paymentResult = await client.payments.create(requestBody);
    }

    if (paymentResult.payment) {
      console.log('[PAYMENT] Payment successful:', {
        paymentId: paymentResult.payment.id,
        amountCharged: paymentResult.payment.totalMoney,
        status: paymentResult.payment.status
      });

      // Get the ACTUAL amount charged by Square (in cents)
      const actualAmountCents = Number(paymentResult.payment.totalMoney?.amount || amount);
      const actualAmountDollars = actualAmountCents / 100;
      
      console.log('[PAYMENT] Using actual amount from Square:', {
        cents: actualAmountCents,
        dollars: actualAmountDollars,
        requestedAmount: amount
      });
      
      // First, save the order without print files
      const orderId = await saveOrder({
        paymentId: paymentResult.payment.id,
        amount: actualAmountDollars, // Use ACTUAL amount charged by Square
        currency,
        customerInfo,
        cartItems,
        userId,
        status: 'paid',
        printFiles: [], // Will be updated after generation
        taxAmount: taxAmount || 0,
        shippingAddress,
        deliveryMethod,
        shippingCost,
        shippingRate,
        taxBreakdown,
        discountPercentage,
        discountAmount
      });

      console.log('[PAYMENT] Order created:', orderId);

      // Now link existing print files to the order
      console.log('[PAYMENT] Cart items for print files:', JSON.stringify(cartItems.map((item: any) => ({
        id: item.id,
        hasPngUrl: !!item.pngUrl,
        hasPlacedItems: !!item.placedItems,
        placedItemsCount: item.placedItems?.length || 0,
        sheetWidth: item.sheetWidth,
        sheetLength: item.sheetLength
      }))));
      
      const printFiles = await linkPrintFilesToOrder(cartItems, userId, orderId, customerInfo);
      
      console.log('[PAYMENT] Linked print files:', printFiles.length);
      console.log('[PAYMENT] Print files details:', JSON.stringify(printFiles, null, 2));
      
      // Update the order with print files
      if (printFiles.length > 0) {
        console.log('[PAYMENT] Updating order with print files...');
        await updateOrderPrintFiles(orderId, printFiles);
        console.log('[PAYMENT] Updated order with', printFiles.length, 'print files');
      } else {
        console.warn('[PAYMENT] No print files were linked! Check cart items data.');
        console.warn('[PAYMENT] Cart items structure:', JSON.stringify(cartItems, null, 2));
      }

      // Send emails - await to ensure they complete before function terminates
      const emailDetails = {
        orderId,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        items: cartItems,
        total: actualAmountDollars,
        shippingAddress: deliveryMethod === 'shipping' ? shippingAddress : undefined
      };

      console.log('[EMAIL] Starting email sending...');
      try {
        const emailResults = await Promise.all([
          sendOrderConfirmationEmail(emailDetails),
          sendAdminNewOrderEmail(emailDetails)
        ]);
        console.log('[EMAIL] Email sending results:', emailResults);
      } catch (emailError) {
        console.error('[EMAIL] Failed to send emails:', emailError);
        // Don't fail the order if emails fail
      }

      return NextResponse.json({
        success: true,
        paymentId: paymentResult.payment.id,
        orderId,
        message: 'Payment processed successfully',
        printFiles: printFiles.map((pf: any) => ({
          filename: pf.filename,
          dimensions: pf.dimensions
        }))
      });
    } else {
      // Payment failed
      const errorMessages = paymentResult.errors?.map((error: any) => error.detail).join(', ') || 'Payment failed';
      
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
    
    // Transform cart items to order items - preserve ALL data for admin access
    const orderItems = orderData.cartItems.map((item: any) => {
      // Extract pricing - cart items have pricing.total and pricing.basePrice
      const itemTotal = item.pricing?.total || item.totalPrice || 0;
      const itemUnitPrice = item.pricing?.basePrice || item.unitPrice || itemTotal;
      // Extract utilization from layout or item
      const itemUtilization = item.layout?.utilization || item.utilization || 0;
      
      return {
        id: randomUUID(),
        images: item.images || [],
        sheetSize: item.sheetSize,
        quantity: item.quantity || 1,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotal,
        utilization: itemUtilization,
        // Preserve layout and nesting data for admin
        layout: item.layout || null,
        placedItems: item.placedItems || [],
        sheetWidth: item.sheetWidth,
        sheetLength: item.sheetLength,
        pricing: item.pricing || null
      };
    });

    // Calculate subtotal from cart items
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    
    // Use the actual tax amount charged to the customer
    const tax = orderData.taxAmount || 0;
    
    // Shipping cost
    const shipping = orderData.shippingCost || 0;
    
    // Discount
    const discountPercentage = orderData.discountPercentage || 0;
    const discountAmount = orderData.discountAmount || 0;
    
    // Use the actual amount charged to the customer (should match subtotal + tax + shipping)
    const total = orderData.amount;

    console.log('[SAVE ORDER] Calculated values:', { 
      subtotal: subtotal.toFixed(2), 
      discount: discountAmount.toFixed(2),
      tax: tax.toFixed(2), 
      shipping: shipping.toFixed(2), 
      total: total.toFixed(2),
      verification: (subtotal - discountAmount + tax + shipping).toFixed(2)
    });

    // Helper to sanitize object for Firestore (remove undefined)
    const sanitizeForFirestore = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
      if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
          const val = sanitizeForFirestore(obj[key]);
          if (val !== undefined) {
            newObj[key] = val;
          } else {
            newObj[key] = null;
          }
        }
        return newObj;
      }
      return obj;
    };

    const order = sanitizeForFirestore({
      userId: orderData.userId,
      paymentId: orderData.paymentId,
      status: orderData.status,
      customerInfo: orderData.customerInfo,
      items: orderItems,
      subtotal,
      discountPercentage,
      discountAmount,
      tax,
      shipping,
      total,
      currency: orderData.currency || 'CAD',
      printFiles: orderData.printFiles || [],
      shippingAddress: orderData.shippingAddress,
      deliveryMethod: orderData.deliveryMethod,
      shippingRate: orderData.shippingRate,
      taxBreakdown: orderData.taxBreakdown,
    });

    console.log('[SAVE ORDER] Print files count:', orderData.printFiles?.length || 0);

    console.log('[SAVE ORDER] Order object created, calling createOrder...');
    try {
      const orderId = await orderManager.createOrder(order);
      console.log('[SAVE ORDER] Order saved to Firestore successfully:', orderId);
      return orderId;
    } catch (firestoreError) {
      console.error('[SAVE ORDER] Firestore createOrder failed:', firestoreError);
      throw firestoreError;
    }
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

// Helper function to generate print files after payment
async function linkPrintFilesToOrder(cartItems: any[], userId: string, orderId: string, customerInfo: any) {
  console.log('[GENERATE_PRINT] Starting print file generation');
  console.log('[GENERATE_PRINT] Cart items count:', cartItems.length);
  
  try {
    const printResults = [];

    // Format customer name (replace spaces and special chars with underscores)
    const customerName = `${customerInfo.firstName}_${customerInfo.lastName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    // Get last 8 characters of order ID for cleaner filename
    const orderNumber = orderId.slice(-8);

    for (const item of cartItems) {
      console.log('[GENERATE_PRINT] Processing cart item:', {
        id: item.id,
        hasPlacedItems: !!item.placedItems,
        placedItemsCount: item.placedItems?.length || 0,
        sheetWidth: item.sheetWidth,
        sheetLength: item.sheetLength
      });
      
      if (!item.placedItems || !item.sheetWidth || !item.sheetLength) {
        console.warn('[GENERATE_PRINT] Cart item missing required data:', {
          id: item.id,
          hasPlacedItems: !!item.placedItems,
          hasSheetWidth: !!item.sheetWidth,
          hasSheetLength: !!item.sheetLength,
          placedItemsCount: item.placedItems?.length || 0
        });
        continue;
      }

      // Generate gang sheet PNG directly (no HTTP call)
      try {
        const result = await generateGangSheet({
          placedItems: item.placedItems,
          sheetWidth: item.sheetWidth,
          sheetLength: item.sheetLength,
          userId,
          orderId,
          customerInfo
        });

        if (!result.success) {
          console.error('[GENERATE_PRINT] Failed to generate gang sheet');
          continue;
        }

        const { pngUrl, dimensions, size } = result;

        // Get actual sheet dimensions from cart item
        const sheetWidth = item.sheetWidth;
        const sheetLength = item.sheetLength || 0;
        const sheetDimensions = sheetLength > 0 ? `${sheetWidth}x${Math.round(sheetLength)}` : `${sheetWidth}`;

        // Create custom filename: order#_customer_name_widthxlength.png
        const customFilename = `${orderNumber}_${customerName}_${sheetDimensions}.png`;

        console.log('[GENERATE_PRINT] Generated print file:', {
          filename: customFilename,
          url: pngUrl,
          size
        });

        // Add the print file reference
        printResults.push({
          filename: customFilename,
          url: pngUrl,
          path: `orders/${userId}/${orderId}/${customFilename}`,
          size: size || 0,
          dimensions: {
            width: sheetWidth,
            height: sheetLength,
            dpi: 300
          }
        });
      } catch (generateError) {
        console.error('[GENERATE_PRINT] Error generating print file:', generateError);
        // Continue with other items even if one fails
      }
    }

    console.log(`[GENERATE_PRINT] Generated ${printResults.length} print files`);
    return printResults;

  } catch (error) {
    console.error('[GENERATE_PRINT] Error generating print files:', error);
    return []; // Don't fail the order if print files can't be generated
  }
}

// Helper function to generate print-ready files (legacy - keeping for reference)
async function generatePrintFiles(cartItems: any[], userId: string, orderId: string, customerInfo: any) {
  console.log('[GENERATE_PRINT] Starting print file generation');
  console.log('[GENERATE_PRINT] Cart items count:', cartItems.length);
  
  try {
    const printGenerator = new PrintExportGenerator();
    const printStorage = new PrintFileStorageAdmin();
    const printResults = [];

    // Format customer name (replace spaces and special chars with underscores)
    const customerName = `${customerInfo.firstName}_${customerInfo.lastName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    // Get last 8 characters of order ID for cleaner filename
    const orderNumber = orderId.slice(-8);

    for (const item of cartItems) {
      console.log('[GENERATE_PRINT] Processing cart item:', {
        hasLayout: !!item.layout,
        sheetSize: item.sheetSize,
        positionCount: item.layout?.positions?.length || 0
      });
      
      const { layout, sheetSize } = item;
      
      if (!layout || !layout.positions || !Array.isArray(layout.positions) || layout.positions.length === 0) {
        console.warn(`[GENERATE_PRINT] No layout positions found for cart item:`, JSON.stringify(item));
        continue;
      }

      // Get actual sheet dimensions from cart item
      const sheetWidth = item.sheetWidth || sheetSize;
      const sheetLength = item.sheetLength || 0;
      // Remove decimal for filename safety
      const sheetDimensions = sheetLength > 0 ? `${sheetWidth}x${Math.round(sheetLength)}` : `${sheetSize}`;

      console.log(`[PRINT] Generating print file for ${layout.positions.length} images on ${sheetDimensions}" sheet`);

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

      // Create custom filename: order#_customer_name_widthxlength.png
      const customFilename = `${orderNumber}_${customerName}_${sheetDimensions}.png`;

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