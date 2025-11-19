# Order Creation System - Test Plan

## Date: November 19, 2025

## System Status
✅ Firebase Admin SDK configured in Vercel  
✅ OrderManagerAdmin class implemented  
✅ Payment API endpoint using Admin SDK  
✅ Checkout flow integrated  

---

## Test Plan

### 1. Pre-Test Checklist
- [x] Firebase Admin service account key configured in Vercel
- [x] Square payment credentials configured
- [x] OrderManagerAdmin using Firebase Admin SDK
- [x] Checkout page integrated with payment API
- [ ] Verify production deployment is live

### 2. Manual End-to-End Test

#### Step 1: Create Test Account
1. Navigate to `/login`
2. Create new test account with email: `test+[timestamp]@transfernest.com`
3. Complete signup form with all required fields
4. Verify redirect to nesting tool

#### Step 2: Upload and Nest Designs
1. Upload 2-3 test images (PNG with transparency)
2. Select sheet size (13" or 17")
3. Click "Auto-Nest" button
4. Verify images are nested on canvas
5. Check utilization rate (should be 90%+)
6. Add to cart

#### Step 3: Review Cart
1. Navigate to `/cart`
2. Verify items appear correctly
3. Check pricing calculations:
   - Subtotal = (total inches × price per inch)
   - Tax = subtotal × 0.08
   - Shipping = $9.99 (or $0 if subtotal > $50)
   - Total = subtotal + tax + shipping
4. Click "Checkout"

#### Step 4: Complete Checkout
1. Fill in all customer information fields:
   - First Name, Last Name
   - Email, Phone
   - Address, City, State, Zip Code
   - Company (optional)
2. Enter test card details:
   - **Sandbox Test Card**: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Exp: Any future date
   - Zip: Any 5 digits
3. Click "Place Order"
4. Wait for processing

#### Step 5: Verify Success
**Expected Behavior:**
- ✅ Toast notification: "Payment Successful!"
- ✅ Redirect to `/order-confirmation/[orderId]`
- ✅ Order confirmation page displays:
  - Order ID
  - Payment status: "Paid"
  - Order items with images
  - Subtotal, tax, shipping, total
  - Customer information
- ✅ Cart is cleared

#### Step 6: Verify in Admin Dashboard
1. Login as admin
2. Navigate to `/admin/orders`
3. Find the test order in list
4. Verify order details:
   - Customer name matches
   - Total amount matches
   - Status shows "paid"
   - Items displayed correctly
5. Click into order details
6. Verify all information is accurate

#### Step 7: Verify in Customer Account
1. Logout from admin
2. Login as test customer account
3. Navigate to account/orders page
4. Verify test order appears
5. Click to view order details
6. Verify all information matches

---

## Expected API Flow

### 1. Payment Initiation
```
POST /api/process-payment
Body: {
  sourceId: "cnon_xxx", // Square card token
  amount: 2700,         // Amount in cents
  currency: "CAD",
  customerInfo: {...},
  cartItems: [...],
  userId: "user_xxx"
}
```

### 2. Square Payment Processing
- API validates environment variables
- Creates payment request to Square
- Receives payment result

### 3. Order Creation (if payment success)
```typescript
OrderManagerAdmin.createOrder({
  userId,
  paymentId,
  status: 'paid',
  customerInfo,
  items,
  subtotal,
  tax,
  shipping,
  total,
  currency,
  printFiles,
  createdAt,
  updatedAt,
  paidAt
})
```

### 4. Response
```json
{
  "success": true,
  "paymentId": "pay_xxx",
  "orderId": "ord_xxx",
  "message": "Payment processed successfully",
  "printFiles": [...]
}
```

---

## Troubleshooting Guide

### Issue: Payment fails immediately
**Check:**
- [ ] Square credentials in Vercel env vars
- [ ] SQUARE_ACCESS_TOKEN set
- [ ] NEXT_PUBLIC_SQUARE_LOCATION_ID set
- [ ] NEXT_PUBLIC_SQUARE_APPLICATION_ID set
- [ ] Environment is set correctly (sandbox vs production)

**Logs to check:**
```
[PAYMENT] Missing SQUARE_ACCESS_TOKEN environment variable
[PAYMENT] Missing NEXT_PUBLIC_SQUARE_LOCATION_ID environment variable
```

### Issue: Payment succeeds but order not saved
**Check:**
- [ ] Firebase Admin SDK initialized
- [ ] FIREBASE_SERVICE_ACCOUNT_KEY in Vercel
- [ ] Service account has Firestore permissions

**Logs to check:**
```
[OrderManagerAdmin] Creating order for userId: xxx
[OrderManagerAdmin] Order created successfully with ID: xxx
[SAVE ORDER] Error saving order: xxx
```

### Issue: Order saved with temporary ID
**Symptom:** Order ID looks like `temp_1234567890_abc123`

**Cause:** Firestore write failed, fallback to temporary ID

**Fix:**
- Check Firebase Admin credentials
- Verify Firestore rules allow write
- Check service account permissions

### Issue: Order appears in admin but not customer dashboard
**Check:**
- [ ] userId matches between order and user
- [ ] Customer is logged in correctly
- [ ] Query filters in customer orders page

### Issue: Print files not generated
**Check:**
- [ ] Images uploaded successfully to Storage
- [ ] PrintExportGenerator working
- [ ] Print file URLs accessible

---

## Verification Queries

### Check Orders in Firestore (Admin Console)
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Open `orders` collection
4. Look for recent documents
5. Verify fields:
   - userId
   - paymentId
   - status: "paid"
   - total amount
   - items array
   - timestamps

### Check Square Payments (Square Dashboard)
1. Login to Square Dashboard
2. Navigate to Payments
3. Find test payment by amount/time
4. Verify status is "Completed"
5. Check if order reference matches

---

## Success Criteria

✅ **Complete Success:** All of the following must pass:
1. Payment processes through Square successfully
2. Order saves to Firestore with correct data
3. Order appears in admin dashboard
4. Order appears in customer account
5. Order confirmation page displays correctly
6. Customer receives confirmation email (if implemented)
7. Print files generated (if implemented)

⚠️ **Partial Success:** Some functionality working:
- Payment works but order not saving → Firebase Admin issue
- Order saves but doesn't appear → Query/permissions issue
- Order saves with temp ID → Firestore write permissions

❌ **Failed:** Critical issues:
- Payment fails → Square credentials issue
- Nothing works → Multiple configuration issues

---

## Post-Test Actions

### If Successful:
1. ✅ Mark system as production-ready
2. ✅ Contact previous test customer (trent.timmerman@live.ca) to recreate order
3. ✅ Run `/api/admin/sync-users` to sync any existing Auth users
4. ✅ Update documentation with confirmed working status
5. ✅ Remove test orders from database (optional)

### If Failed:
1. ❌ Document specific failure point
2. ❌ Check Vercel logs for detailed errors
3. ❌ Verify all environment variables
4. ❌ Test Firebase Admin SDK locally if possible
5. ❌ Review Firestore security rules

---

## Additional Tests

### Test Different Scenarios:
- [ ] Single item order
- [ ] Multiple items order (different sheet sizes)
- [ ] Order with free shipping (subtotal > $50)
- [ ] Order with shipping charge (subtotal < $50)
- [ ] Invalid card (should fail gracefully)
- [ ] Duplicate submission (idempotency)
- [ ] Partial payment failures

### Edge Cases:
- [ ] Very large orders (>10 items)
- [ ] Very small orders (minimum charge)
- [ ] Special characters in customer name
- [ ] International phone numbers
- [ ] Long addresses

---

## Environment Variables Checklist

### Required in Vercel (Production):
- [x] `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK
- [ ] `SQUARE_ACCESS_TOKEN` - Square API
- [ ] `NEXT_PUBLIC_SQUARE_LOCATION_ID` - Square Location
- [ ] `NEXT_PUBLIC_SQUARE_APPLICATION_ID` - Square App
- [ ] `NEXT_PUBLIC_SQUARE_ENVIRONMENT` - "production" or "sandbox"

### Firebase Config (Public):
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Notes

**Current Status (Nov 19, 2025):**
- Firebase Admin SDK confirmed configured ✅
- Code implementation complete ✅
- Ready for end-to-end testing ✅

**Previous Issues (Resolved):**
- Order creation using client SDK (fixed: now using Admin SDK)
- TypeScript errors in OrderManagerAdmin (fixed)
- Firestore rules blocking user creation (fixed)

**Known Limitations:**
- Print file generation may need additional testing
- Email notifications not yet implemented
- Order tracking not fully implemented
