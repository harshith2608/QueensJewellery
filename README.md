# Queens Jewellery

A mobile-first imitation jewellery e-commerce store with a full admin portal.

## Tech Stack
- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Firebase (Firestore, Storage, Auth)
- **Payments:** Razorpay
- **Orders:** Razorpay online + WhatsApp inquiry

---

## Setup

### 1. Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Firestore Database** (start in production mode)
3. Enable **Firebase Storage**
4. Enable **Authentication** → Sign-in methods:
   - **Phone** (for customer OTP login)
   - **Email/Password** (for admin login)
5. Create an admin user: Authentication → Users → Add User (email + password)

### 2. Firebase Security Rules

**Firestore rules** (Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{id} { allow read: if true; allow write: if request.auth != null && request.auth.token.email != null; }
    match /products/{id} { allow read: if true; allow write: if request.auth != null && request.auth.token.email != null; }
    match /settings/{id} { allow read: if true; allow write: if request.auth != null && request.auth.token.email != null; }
    match /users/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /orders/{id} { allow create: if request.auth != null; allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.auth.token.email != null); allow update: if request.auth != null && request.auth.token.email != null; }
    match /reviews/{id} { allow create: if request.auth != null; allow read: if true; allow update, delete: if request.auth != null && request.auth.token.email != null; }
    match /coupons/{id} { allow read: if true; allow write: if request.auth != null && request.auth.token.email != null; }
  }
}
```

**Storage rules** (Storage → Rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Environment Variables
```bash
cp .env.example .env
```
Fill in your values:
```
VITE_FIREBASE_API_KEY=         # Firebase project settings
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_RAZORPAY_KEY_ID=          # From Razorpay Dashboard → Settings → API Keys
VITE_WHATSAPP_NUMBER=          # With country code, no +: e.g. 919876543210
```

### 4. Razorpay Setup
1. Create a [Razorpay account](https://razorpay.com)
2. Go to Dashboard → Settings → API Keys → Generate Key
3. Copy the **Key ID** (starts with `rzp_test_` for test mode) into `VITE_RAZORPAY_KEY_ID`

### 5. Run locally
```bash
npm install
npm run dev
```
App runs at `http://localhost:5173`

---

## Project Structure

```
src/
├── pages/
│   ├── store/          # Customer-facing pages
│   └── admin/          # Admin portal pages
├── components/
│   ├── store/          # Customer UI components
│   └── admin/          # Admin UI components
├── contexts/           # React context (Auth, Cart)
├── hooks/              # Custom data-fetching hooks
├── firebase/           # Firebase service helpers
└── utils/              # Razorpay, WhatsApp, formatters
```

---

## Admin Portal
Access at `/admin/login` — sign in with the email/password you created in Firebase Auth.

**Admin features:** Dashboard, Products, Categories, Orders, Coupons, Reviews, Settings

---

## Customer Store Features
- Browse by category, search, product detail with image/video gallery
- Cart with coupon codes
- OTP login (mobile number) to place orders
- Pay online via Razorpay or order via WhatsApp
- Track order status

---

## Build for Production
```bash
npm run build
```

### Firebase Hosting deploy:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set dist as public dir, SPA: yes
npm run build
firebase deploy
```
