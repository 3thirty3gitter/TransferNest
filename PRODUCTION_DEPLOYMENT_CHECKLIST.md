# Production Deployment Checklist

**Status**: 🟡 IN PROGRESS  
**Updated**: Current Session  
**Critical Path**: Admin system print file flow

---

## 🎯 CRITICAL PATH (Must Complete Before Deploy)

### ✅ Phase 1: Core File Upload Flow (COMPLETED)
- [x] **Print File Upload Implementation**
  - Function: `generateAndUploadPrintFiles()` in `/src/app/api/process-payment/route.ts`
  - Added Firebase Storage upload loop after print generation
  - Returns array of uploaded file metadata with URLs
  - Status: Code modified, needs end-to-end testing

- [x] **Two-Phase Order Creation**
  - Step 1: Create order with empty printFiles array
  - Step 2: Upload print files to Firebase Storage
  - Step 3: Update order with printFiles URLs
  - Status: Implemented, needs testing

- [x] **OrderManager Enhancement**
  - Added `getAllOrders()` method for admin panel
  - Added `addPrintFiles()` method for updating orders
  - Status: Code complete

### 🔄 Phase 2: Security Rules (IN PROGRESS)
- [x] **Firestore Security Rules** (`firestore.rules`)
  - Admin email whitelist with `isAdmin()` helper
  - Orders: Admins full access, users can read own orders
  - Status: Created, NOT DEPLOYED
  
  ```bash
  # Deploy command:
  firebase deploy --only firestore:rules
  ```

- [x] **Storage Security Rules** (`storage.rules`)
  - Path: `orders/{userId}/{orderId}/{filename}`
  - Read: Owner or admin
  - Write: Admin only
  - Status: Created, NOT DEPLOYED
  
  ```bash
  # Deploy command:
  firebase deploy --only storage:rules
  ```

### ⏳ Phase 3: Admin Panel UI (NEXT)
- [ ] **Fix Type Definitions**
  - Current: `printFileUrl?: string`
  - Required: `printFiles: PrintFile[]`
  - File: `/src/app/admin/page.tsx`
  - Lines: Update Order interface around line 15-30

- [ ] **Update Download Logic**
  - Current: `downloadPrintFile(order.printFileUrl)`
  - Required: Handle array, show dropdown if multiple files
  - File: `/src/app/admin/page.tsx`
  - Function: `downloadPrintFile()`

- [ ] **Fix Bulk Download**
  - Current: Single file per order
  - Required: Iterate all selected orders' printFiles arrays
  - File: `/src/app/admin/page.tsx`
  - Function: `bulkDownloadPrintFiles()`

- [ ] **Calculate Real Stats**
  - Current: Hardcoded values
  - Required: Calculate from orders array
  - Metrics: Total orders, revenue, pending/processing/shipped counts
  - File: `/src/app/admin/page.tsx`

---

## 🧪 Testing Requirements

### End-to-End Order Flow Test
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 15 minutes

1. **Place Test Order**
   - Add items to cart
   - Proceed to checkout
   - Complete Square payment
   - Verify success message

2. **Verify Firebase Storage**
   - Open Firebase Console > Storage
   - Check path: `orders/{userId}/{orderId}/`
   - Verify PNG files exist (300 DPI)
   - Check file sizes (60-120KB typical)

3. **Verify Order Document**
   - Open Firebase Console > Firestore
   - Find order in `orders` collection
   - Verify `printFiles` array populated
   - Each file should have: `url`, `filename`, `path`, `size`, `dimensions`

4. **Test Admin Panel**
   - Navigate to `/admin`
   - Verify order appears in list
   - Click download button
   - Verify file downloads correctly
   - Open file, verify 300 DPI PNG

5. **Test Customer View**
   - Navigate to `/orders` (logged in as customer)
   - Verify order appears
   - Verify print files not exposed to other users

### Security Testing
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 10 minutes

1. **Admin Access Control**
   ```bash
   # Test 1: Non-admin can't access /admin
   # - Log in as regular user
   # - Navigate to /admin
   # - Should see "Access Denied" or redirect
   ```

2. **API Endpoint Security**
   ```bash
   # Test 2: Customer can't call admin endpoints
   curl -X GET https://your-domain.com/api/orders \
     -H "Authorization: Bearer CUSTOMER_TOKEN"
   # Should return 403 Forbidden
   ```

3. **File Access Control**
   ```bash
   # Test 3: Can't access other user's files
   # - Copy another user's print file URL
   # - Try to access as different user
   # - Should return 403 Forbidden
   ```

4. **Firestore Rules**
   ```bash
   # Test 4: Rules simulator in Firebase Console
   # - Test reading other user's order (should fail)
   # - Test admin reading any order (should pass)
   # - Test customer updating order (should fail)
   ```

### Performance Testing
**Priority**: 🟡 MEDIUM  
**Estimated Time**: 5 minutes

Run existing test suite:
```bash
npx tsx test-admin-system.ts
```

Expected results:
- Order creation: < 2 seconds
- Print generation: < 3 seconds (50 images)
- File upload: < 5 seconds per file
- Admin query: < 1 second

---

## 🚀 Deployment Steps

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Security rules reviewed
- [ ] Environment variables set
- [ ] Firebase project verified

### Deploy Security Rules
```bash
# Navigate to project root
cd /workspaces/TransferNest

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Verify deployment
firebase firestore:indexes:list
```

### Deploy Application
```bash
# Option 1: Vercel
vercel --prod

# Option 2: Firebase Hosting
npm run build
firebase deploy --only hosting

# Option 3: Manual deploy
./deploy.sh
```

### Post-Deployment Verification
1. **Smoke Tests**
   - [ ] Homepage loads
   - [ ] Cart functionality
   - [ ] Checkout flow
   - [ ] Admin panel accessible
   - [ ] Orders display correctly

2. **Live Order Test**
   - [ ] Place real test order
   - [ ] Verify email confirmation
   - [ ] Check Firebase Storage
   - [ ] Download print file
   - [ ] Verify 300 DPI quality

3. **Security Verification**
   - [ ] Non-admin can't access /admin
   - [ ] File URLs require auth
   - [ ] Firestore rules active

---

## 📊 Known Issues & Limitations

### Fixed Issues ✅
- ✅ Boundary violations (algorithm verified correct)
- ✅ Print file generation (300 DPI PNG working)
- ✅ File upload implementation (two-phase pattern)
- ✅ Security rules created

### Outstanding Issues ⚠️
- ⚠️ Admin panel UI still expects single `printFileUrl` instead of `printFiles[]`
- ⚠️ Download button needs array handling
- ⚠️ Bulk download not implemented
- ⚠️ Stats are hardcoded

### Future Enhancements 🔮
- Email notifications (order confirmation, shipping)
- Order status webhooks
- Batch print file generation
- Customer print file preview
- Order search/filtering

---

## 🎓 Architecture Notes

### Print File Flow
```
Cart → Checkout → Square Payment
  ↓
Create Order (empty printFiles)
  ↓
Generate Print Files (Sharp PNG, 300 DPI)
  ↓
Upload to Firebase Storage (orders/{userId}/{orderId}/)
  ↓
Update Order (add printFiles URLs)
  ↓
Admin Panel (download buttons)
```

### Security Model
```
Admin Emails → NEXT_PUBLIC_ADMIN_EMAILS env var
  ↓
Firestore Rules → isAdmin() checks email
  ↓
Storage Rules → Path-based access control
  ↓
API Middleware → verifyAdminToken() (TODO)
```

### File Structure
```
Storage Path: orders/{userId}/{orderId}/dtf-print-{size}-{dpi}dpi-{timestamp}.png
Example: orders/user123/order456/dtf-print-17x-300dpi-1699564821.png

Firestore Path: orders/{orderId}
Document: {
  userId: string
  printFiles: [{
    url: string
    filename: string
    path: string
    size: number
    dimensions: { width, height, dpi }
  }]
  ...
}
```

---

## ⏱️ Time Estimates

| Task | Priority | Time | Status |
|------|----------|------|--------|
| Deploy security rules | 🔴 Critical | 5 min | Ready |
| Fix admin UI types | 🔴 Critical | 10 min | Next |
| Update download logic | 🔴 Critical | 15 min | Next |
| End-to-end testing | 🔴 Critical | 15 min | Ready |
| Security testing | 🔴 Critical | 10 min | After deploy |
| API middleware | 🟡 Medium | 20 min | Phase 4 |
| Email notifications | 🟢 Low | 30 min | Future |

**Total Critical Path**: ~55 minutes  
**Total Remaining Work**: ~90 minutes

---

## 🚦 Status Legend

- 🔴 **CRITICAL**: Blocks production deployment
- 🟡 **MEDIUM**: Important but not blocking
- 🟢 **LOW**: Nice to have, post-launch
- ✅ **COMPLETE**: Done and verified
- 🔄 **IN PROGRESS**: Currently working
- ⏳ **NEXT**: Queued for next action
- ⚠️ **ISSUE**: Known problem, documented

---

## 📞 Support Contacts

**Firebase Console**: https://console.firebase.google.com  
**Vercel Dashboard**: https://vercel.com/dashboard  
**Square Developer**: https://developer.squareup.com

---

**Last Updated**: Current Session  
**Next Review**: After admin UI fixes complete
