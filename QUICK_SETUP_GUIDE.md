# Quick Setup Guide - Firebase Admin Service Account

## 🚀 5-Minute Setup to Fix Order Creation

Follow these steps to configure the Firebase Admin service account in Vercel:

---

## Step 1: Generate Service Account Key (2 minutes)

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `transfernest-12vn4`
3. **Go to Project Settings**:
   - Click the **gear icon ⚙️** in the top-left
   - Select **Project Settings**
4. **Navigate to Service Accounts**:
   - Click the **Service Accounts** tab
5. **Generate Key**:
   - Click **Generate New Private Key** button
   - Confirm by clicking **Generate Key**
   - A JSON file will download (e.g., `transfernest-12vn4-firebase-adminsdk-xxxxx.json`)
   - **Keep this file secure!**

---

## Step 2: Convert JSON to Base64 (30 seconds)

### Option A: Using Terminal (Recommended)

Open a terminal and run:

```bash
# Navigate to where you downloaded the file
cd ~/Downloads

# Convert to base64 (removes line breaks)
cat transfernest-12vn4-*.json | base64 -w 0 > firebase-key-base64.txt

# Copy the result
cat firebase-key-base64.txt
```

Then copy the output (the long base64 string).

### Option B: Using Node.js

```bash
node -e "console.log(Buffer.from(require('fs').readFileSync('./transfernest-12vn4-firebase-adminsdk-xxxxx.json')).toString('base64'))"
```

Copy the output.

### Option C: Using Online Tool (Not Recommended for Security)

If you must use an online tool, use: https://www.base64encode.org/
- Paste the entire JSON file content
- Click "Encode"
- Copy the result

---

## Step 3: Add to Vercel Environment Variables (2 minutes)

1. **Go to Vercel Dashboard**: https://vercel.com/
2. **Select your project**: `transfernest` (or search for it)
3. **Open Settings**:
   - Click **Settings** tab at the top
4. **Navigate to Environment Variables**:
   - Click **Environment Variables** in the left sidebar
5. **Add New Variable**:
   - Click **Add New** button
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the base64 string from Step 2
   - **Environments**: Check all three boxes:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
   - Click **Save**

---

## Step 4: Redeploy (Automatic)

The application will automatically redeploy with the new environment variable.

**Monitor the deployment**:
1. Go to **Deployments** tab in Vercel
2. Watch for the new deployment to complete (usually 1-2 minutes)
3. Status should show "Ready"

---

## Step 5: Verify It's Working (1 minute)

### Test Order Creation:

1. **Go to your site**: https://transfernest-livid.vercel.app
2. **Sign in** with your account
3. **Place a test order**:
   - Add items to cart
   - Go through checkout
   - Complete payment (use test card if in sandbox mode)
4. **Check orders page**: https://transfernest-livid.vercel.app/orders
   - You should now see your order!

### Check Logs (Optional):

1. In Vercel, go to **Deployments** tab
2. Click on the latest deployment
3. Click **Functions** tab
4. Find the `/api/process-payment` function
5. Look for these success messages:
   ```
   [OrderManagerAdmin] Order created successfully with ID: ...
   [SAVE ORDER] Order saved to Firestore successfully: ...
   ```

---

## ✅ Success Checklist

- [ ] Downloaded Firebase service account JSON
- [ ] Converted JSON to base64
- [ ] Added `FIREBASE_SERVICE_ACCOUNT_KEY` to Vercel
- [ ] Selected all three environments (Production, Preview, Development)
- [ ] Saved the environment variable
- [ ] Deployment completed successfully
- [ ] Placed test order
- [ ] Order appears in `/orders` page
- [ ] Order exists in Firestore database

---

## 🚨 Troubleshooting

### Issue: "Invalid service account credentials"

**Solution**: Make sure the base64 string has no line breaks or spaces. Re-encode with `-w 0` flag:
```bash
cat service-account.json | base64 -w 0
```

### Issue: Still getting 500 errors

**Solutions**:
1. Check the environment variable name is exactly: `FIREBASE_SERVICE_ACCOUNT_KEY`
2. Verify all three environments are checked
3. Wait for deployment to complete fully
4. Check Vercel function logs for specific error messages

### Issue: Deployment failed

**Solutions**:
1. Check Vercel build logs for TypeScript errors
2. Verify the base64 string is valid
3. Try removing and re-adding the environment variable

---

## 📞 Need Help?

If you encounter issues:

1. **Check Vercel Logs**: Deployments tab > Latest deployment > Functions
2. **Review Documentation**: `ORDER_CREATION_FIX.md` has complete details
3. **Test Firebase Admin**: The service account should have Firestore access enabled

---

## 🔒 Security Notes

- **Never commit** the service account JSON file to Git
- **Never share** the JSON file or base64 string publicly
- **Store securely**: Keep a backup of the JSON file in a secure location
- **Rotate keys**: If compromised, generate a new key and delete the old one

---

## 📝 What This Fixes

✅ Orders now save to Firestore after payment  
✅ Order history displays correctly  
✅ Admin can view all orders  
✅ Print fulfillment workflow functional  
✅ Complete customer order tracking  

---

**Estimated Total Time**: 5-7 minutes  
**Difficulty**: Easy  
**Impact**: Critical - enables core business functionality
