# 🔐 Clerk Domain Configuration for chowgpt.co.za

## 🚨 **URGENT: Update Required for Authentication Flow**

You're getting 404 errors because your Clerk configuration still points to the old domain. Here's how to fix it:

## 🔧 **Step 1: Update Clerk Dashboard Settings**

### **1. Go to Clerk Dashboard**
- Visit [clerk.com](https://clerk.com) and sign in
- Select your ChowGPT application

### **2. Update Domain Settings**
Navigate to **Settings > Domains** and add your new domain:
- **Production Domain**: `chowgpt.co.za`
- **Development Domain**: `localhost:5173` (keep this for local development)

### **3. Update Redirect URLs**
Navigate to **Settings > Redirect URLs** and update:

**Authorized Redirect URLs:**
```
https://chowgpt.co.za/finder
https://chowgpt.co.za/chat
https://chowgpt.co.za/
https://localhost:5173/finder
https://localhost:5173/chat
https://localhost:5173/
```

**Sign-in redirect URL:**
```
https://chowgpt.co.za/finder
```

**Sign-up redirect URL:**
```
https://chowgpt.co.za/finder
```

**Sign-out redirect URL:**
```
https://chowgpt.co.za/
```

### **4. Update Allowed Origins**
Navigate to **Settings > CORS** and add:
```
https://chowgpt.co.za
https://localhost:5173
```

## 🔧 **Step 2: Update Environment Variables**

### **Development (.env.local)**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

### **Production (Vercel Dashboard)**
- Go to your Vercel dashboard
- Select your ChowGPT project
- Navigate to **Settings > Environment Variables**
- Update or add:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_live_key_here
```

## 🔧 **Step 3: Test the Authentication Flow**

### **Test Cases:**
1. **Sign Up Flow:**
   - Go to `https://chowgpt.co.za`
   - Click "Sign Up"
   - Complete registration
   - Should redirect to `https://chowgpt.co.za/finder`

2. **Sign In Flow:**
   - Go to `https://chowgpt.co.za`
   - Click "Sign In"
   - Complete sign-in
   - Should redirect to `https://chowgpt.co.za/finder`

3. **Direct URL Access:**
   - Go directly to `https://chowgpt.co.za/finder`
   - Should work if already signed in
   - Should redirect to sign-in if not authenticated

## 🔧 **Step 4: Verify Configuration**

### **Check These URLs Work:**
- ✅ `https://chowgpt.co.za/` → Landing page
- ✅ `https://chowgpt.co.za/finder` → Restaurant finder (after auth)
- ✅ `https://chowgpt.co.za/chat` → Chat interface (after auth)

### **Check Authentication:**
- ✅ Sign-in redirects to `/finder`
- ✅ Sign-up redirects to `/finder`
- ✅ Sign-out redirects to `/`
- ✅ Protected routes require authentication

## 🔧 **Step 5: Deploy Updated Configuration**

After updating Clerk settings, redeploy your application:

```bash
# If using Vercel CLI
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Fix authentication flow for chowgpt.co.za domain"
git push origin main
```

## 🚨 **Common Issues & Solutions**

### **Issue: Still getting 404 errors**
**Solution:** Clear browser cache and cookies, or test in incognito mode

### **Issue: Authentication loop**
**Solution:** Check that all redirect URLs in Clerk match exactly (including https://)

### **Issue: CORS errors**
**Solution:** Ensure `chowgpt.co.za` is added to allowed origins in Clerk

### **Issue: Environment variables not working**
**Solution:** Verify you're using the correct publishable key for production

## 🔧 **Emergency Fix (If Still Not Working)**

If authentication still fails, you can temporarily add a bypass:

1. **In Clerk Dashboard > Settings > Advanced**
2. **Add these test redirect URLs:**
   ```
   https://chowgpt.co.za/*
   https://chowgpt.co.za/finder*
   https://chowgpt.co.za/chat*
   ```

3. **Or use wildcard (not recommended for production):**
   ```
   https://chowgpt.co.za/*
   ```

## ✅ **Final Checklist**

Before marking this as complete:
- [ ] Updated Clerk domain settings
- [ ] Updated all redirect URLs
- [ ] Updated CORS settings
- [ ] Verified environment variables
- [ ] Tested sign-in flow
- [ ] Tested sign-up flow
- [ ] Tested direct URL access
- [ ] Deployed updated configuration

## 🎯 **Expected Result**

After completing these steps:
1. Users can sign in from `chowgpt.co.za` without 404 errors
2. Authentication redirects work properly
3. All protected routes are accessible after authentication
4. The app works seamlessly on your custom domain

**The authentication flow should now work perfectly!** 🎉 