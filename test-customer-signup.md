# Customer Signup Flow Test

## Test Case: New Customer Registration

### Test Data:
```
First Name: Test
Last Name: Customer
Email: test-nov18-2025@example.com
Password: TestPass123!
Phone: (416) 555-9999
Address: 456 Test Street
City: Toronto
Province: ON
Postal Code: M5H 2N2
Country: Canada
```

### Test Steps:

1. **Navigate to Signup Page**
   - URL: https://transfernest-livid.vercel.app/login
   - Click "Sign Up" tab

2. **Fill in Form Fields**
   - Enter all test data above
   - Verify all required fields show asterisk (*)
   - Verify Province dropdown shows all Canadian provinces

3. **Submit Form**
   - Click "Create Account" button
   - Button should show "Creating Account..." while processing
   - Should not allow duplicate submissions (button disabled)

4. **Expected Results**
   ✅ Success toast: "Account created successfully!"
   ✅ Redirect to home page (/)
   ✅ User authenticated (header shows account info)
   ✅ Firestore document created in `users/{uid}` collection with all fields
   ✅ Firebase Auth user created
   ✅ User appears in Admin Customers page

5. **Verification Steps**

   **A. Check Firebase Auth:**
   - Go to Firebase Console > Authentication
   - Verify user exists with email: test-nov18-2025@example.com

   **B. Check Firestore:**
   - Go to Firebase Console > Firestore Database
   - Navigate to `users` collection
   - Find document with matching email
   - Verify all fields are populated:
     - firstName: "Test"
     - lastName: "Customer"
     - email: "test-nov18-2025@example.com"
     - phone: "(416) 555-9999"
     - address: "456 Test Street"
     - city: "Toronto"
     - state: "ON"
     - zipCode: "M5H 2N2"
     - country: "Canada"
     - createdAt: ISO timestamp

   **C. Check Admin Customers Page:**
   - Go to: https://transfernest-livid.vercel.app/admin/login
   - Login as admin
   - Navigate to Customers page
   - Search for "Test Customer" or "test-nov18-2025"
   - Verify customer appears in list with all details

6. **Edge Cases to Test**

   **A. Duplicate Email:**
   - Try signing up again with same email
   - Expected: Error message "An account with this email address already exists"

   **B. Weak Password:**
   - Try password: "12345"
   - Expected: Error message "The password is too weak"

   **C. Required Fields:**
   - Leave First Name empty
   - Expected: Form validation prevents submission

   **D. Optional Fields:**
   - Create account without phone, address, city, province, postal code
   - Expected: Account created successfully with empty fields

7. **Google Sign-In Test**
   - Click "Sign in with Google"
   - Select Google account
   - Expected: 
     - Firestore document created with name from Google profile
     - Address fields empty (to be filled later in account page)
     - User authenticated and redirected to home

## Current Status

**Code Locations:**
- Sign-up form: `/src/app/login/page.tsx`
- Firestore write: Lines 130-149 (uses `setDoc`)
- Google sign-in: Lines 64-88 (creates document if not exists)
- Admin customers view: `/src/app/admin/customers/page.tsx`

**Known Working Features:**
✅ Form validation on required fields
✅ Password strength enforcement (min 6 chars)
✅ Firestore document creation with error handling
✅ Google sign-in with auto-document creation
✅ Province dropdown with all Canadian provinces
✅ Toast notifications for success/error
✅ Loading states during submission

**Ready for Testing:** YES

**Test Before:** Configuring Firebase Admin service account for order creation
