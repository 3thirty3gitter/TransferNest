import { NextRequest, NextResponse } from 'next/server';
import { OrderManagerAdmin } from '@/lib/order-manager-admin';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { 
  sendOrderUpdateEmail, 
  sendOrderReadyForPickupEmail,
  EmailOrderDetails 
} from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const authResult = await verifyAdminRequest(request);
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.message }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const body = await request.json();
    const { status, trackingNumber, sendEmail = true } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const orderManager = new OrderManagerAdmin();
    
    // Get current order to check previous status and get customer info
    const order = await orderManager.getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const previousStatus = order.status;

    // Build additional data for specific status changes
    const additionalData: any = {};
    if (status === 'shipped' && trackingNumber) {
      additionalData.trackingNumber = trackingNumber;
      additionalData.shippingInfo = {
        ...order.shippingInfo,
        trackingNumber
      };
    }

    // Update the order status
    await orderManager.updateOrderStatus(orderId, status, additionalData);

    // Send email notifications if enabled and status actually changed
    if (sendEmail && previousStatus !== status) {
      const emailDetails: EmailOrderDetails = {
        orderId,
        customerName: order.customerInfo 
          ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
          : 'Valued Customer',
        customerEmail: order.customerInfo?.email || '',
        items: order.items || [],
        total: order.total || 0,
        shippingAddress: order.customerInfo?.shippingAddress || (order as any).shippingAddress
      };

      // Only send email if we have a customer email
      if (emailDetails.customerEmail) {
        let emailResult: { success: boolean; error?: unknown; data?: unknown } = { success: false, error: 'No email sent' };

        switch (status) {
          case 'shipped':
            console.log('[ORDER UPDATE] Sending shipped email to:', emailDetails.customerEmail);
            emailResult = await sendOrderUpdateEmail(emailDetails, 'shipped', trackingNumber);
            break;
          
          case 'ready_for_pickup':
            console.log('[ORDER UPDATE] Sending pickup ready email to:', emailDetails.customerEmail);
            emailResult = await sendOrderReadyForPickupEmail(emailDetails);
            break;
          
          case 'printing':
          case 'completed':
            console.log('[ORDER UPDATE] Sending status update email to:', emailDetails.customerEmail);
            emailResult = await sendOrderUpdateEmail(emailDetails, status);
            break;
        }

        console.log('[ORDER UPDATE] Email result:', emailResult);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      orderId,
      previousStatus,
      newStatus: status
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
