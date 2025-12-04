# Handoff Document - December 4, 2025 (Evening)

## Session Summary
Completed email notification system with manual sending for existing orders.

---

## Current State: STABLE
**Branch:** `preview/email-notifications`  
**Latest Commit:** `54886c5`

---

## Changes Made This Session

### 1. Order Data Fix
- **Issue:** Order items showing $0.00 and 0% utilization in admin
- **Fix:** Extract `pricing.total`, `pricing.basePrice`, and `layout.utilization` correctly from cart items
- **File:** `src/app/api/process-payment/route.ts`

### 2. Automatic Email Notifications
Created system to auto-send emails on order status changes:

| Trigger | Email Type | Template |
|---------|------------|----------|
| Payment completed | Order Confirmation | `order_confirmation` |
| Status → Printing | Status Update | `order_status_update` |
| Status → Shipped | Shipped Notification | `order_shipped` |
| Status → Ready for Pickup | Pickup Ready | `order_ready_pickup` |
| Status → Completed | Status Update | `order_status_update` |

**Files:**
- `src/app/api/orders/[orderId]/status/route.ts` - NEW
- `src/app/admin/page.tsx` - Updated to use API

### 3. Manual Notification Sending
Added "Send Notifications" section to Job Details page for existing orders.

**Buttons:**
- Send Order Confirmation
- Send Status Update
- Send Shipped Notification
- Send Ready for Pickup
- Send Internal Notification (to admin team)

**Files:**
- `src/app/api/admin/send-notification/route.ts` - NEW
- `src/app/admin/jobs/[orderId]/page.tsx` - Updated

### 4. Email Template Fix (Critical)
- **Issue:** "Template not found" error in production
- **Cause:** Using client-side Firebase SDK in server API routes
- **Fix:** Created `email-template-service-admin.ts` using Firebase Admin SDK
- **Files:**
  - `src/lib/services/email-template-service-admin.ts` - NEW
  - `src/lib/email.ts` - Updated import

### 5. Email Sender Configuration
All emails now sent from `orders@dtf-canada.ca`

---

## Files Created/Modified

```
NEW FILES:
src/app/api/orders/[orderId]/status/route.ts
src/app/api/admin/send-notification/route.ts
src/lib/services/email-template-service-admin.ts

MODIFIED:
src/app/api/process-payment/route.ts
src/app/admin/page.tsx
src/app/admin/jobs/[orderId]/page.tsx
src/lib/email.ts
src/lib/order-manager.ts
```

---

## How To Use

### Automatic Emails
Just change order status in admin - emails send automatically.

### Manual Emails (Existing Orders)
1. Go to Admin → Orders
2. Click on an order to open Job Details
3. Find "Send Notifications" section
4. Click the appropriate button

---

## What's Working
- ✅ Order creation with correct pricing/utilization
- ✅ Automatic confirmation emails on payment
- ✅ Automatic status change emails
- ✅ Manual email sending for any order
- ✅ Internal admin notifications
- ✅ Email templates (with fallback to defaults)

---

## Email Templates Location
Editable at: Admin → Settings → Email Tab → Email Templates

---

## Quick Test
1. Open any order in Job Details
2. Click "Send Order Confirmation"
3. Check customer email received
