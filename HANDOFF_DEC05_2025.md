# Handoff - December 5, 2025

## Session Summary
Major fixes to email notifications, admin order display, and 17" gang sheet margins.

## Branch
`preview/email-notifications` - Commit `32b618c`

## Key Changes

### 1. Email System - Switched to Microsoft 365
**All email notifications now use Microsoft Graph API via `orders@dtf-wholesale.ca`**

- **Removed Resend dependency** - All email functions in `src/lib/email.ts` now use `sendEmail` from `src/lib/microsoft-graph.ts`
- **Functions updated:**
  - `sendOrderConfirmationEmail()` - Customer order confirmation
  - `sendAdminNewOrderEmail()` - Internal admin notification
  - `sendOrderUpdateEmail()` - Status change notifications (printing, shipped, etc.)
  - `sendOrderReadyForPickupEmail()` - Local pickup ready notification
- **Fallback HTML** - If Firestore templates not found, uses inline fallback HTML

### 2. Test Email Page (`/admin/test-email`)
- Complete redesign with tabs: "Quick Test (Mock Data)" and "Test with Real Order"
- **Quick Test** - Send any notification type without needing a real order
- **Real Order Test** - Use actual order data from Firestore
- **All 5 notification types available:**
  - Order Confirmation (customer)
  - Status Update/Printing (customer)
  - Order Shipped (customer)
  - Ready for Pickup (customer)
  - New Order Alert (internal/admin)
- Link added to Settings > Email tab

### 3. Admin Orders Page Fixes (`/admin` and `/admin/orders`)

**Customer names not showing "Unknown":**
- Added `customerInfo` to Order type
- Display now uses: `customerInfo.firstName/lastName` → fallback to `shippingAddress.name`
- Email uses: `customerInfo.email` → fallback to `userEmail`

**Payment status empty:**
- Now shows "pending" (yellow) if `paymentStatus` is undefined
- Proper color coding: paid (green), refunded (orange), pending (yellow)

**Legacy order data handling (`/admin/jobs/[orderId]`):**
- Order summary calculates subtotal from items if stored value is 0
- Item prices use `item.pricing?.total` as fallback for `item.totalPrice`
- Utilization uses `layout.utilization` as fallback

### 4. 17" Gang Sheet Margins
**Surgical fix for printer guides:**
- Added 0.5" margin on left and right sides of 17" sheets
- Effective nesting width reduced to 16" (from 17")
- All placed items offset by 0.5" from left edge
- **13" sheets unchanged**

File: `src/lib/nesting-algorithm.ts` - `executeNesting17Advanced()` function

## Files Modified

### Email System
- `src/lib/email.ts` - Switched from Resend to Microsoft Graph
- `src/app/api/admin/test-email/route.ts` - Rebuilt to use Microsoft Graph with mock data support
- `src/app/admin/test-email/page.tsx` - Complete UI redesign with tabs
- `src/app/admin/settings/page.tsx` - Added link to test-email page

### Admin Display Fixes
- `src/app/admin/page.tsx` - Customer name/email fallbacks, payment status handling
- `src/app/admin/orders/page.tsx` - Customer info normalization from legacy structures
- `src/app/admin/jobs/[orderId]/page.tsx` - Legacy order data fallbacks for pricing/utilization
- `src/app/api/admin/shipments/route.ts` - Fixed import (sendOrderShippedEmail → sendOrderUpdateEmail)
- `src/lib/services/email-template-service.ts` - Fixed TypeScript type annotation

### Nesting
- `src/lib/nesting-algorithm.ts` - 17" sheet 0.5" side margins

## Environment Requirements
- Microsoft 365 integration must be configured in company settings
- `NEXT_PUBLIC_ADMIN_EMAILS` env var for admin notification recipients
- `NEXT_PUBLIC_APP_URL` for admin links in emails

## Testing Checklist
- [ ] Place test order - verify customer receives confirmation email
- [ ] Place test order - verify admin receives new order notification
- [ ] Change order status - verify customer receives update email
- [ ] Test 17" gang sheet - verify 0.5" margins on sides
- [ ] Check legacy orders in admin - verify pricing displays correctly

## Stable Reference
Tag `v1.1-stable-orders-fixed` at commit `0f82b5c` - known working order system before email changes

## Next Steps
1. Test real order flow with email notifications
2. Verify 17" prints have correct margins for printer guides
3. Consider merging `preview/email-notifications` to `main` after verification
