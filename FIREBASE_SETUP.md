# Firebase Setup Guide for Assured Security Services

## Overview
This guide will help you configure Firebase Storage for document management in the Security Guard Workforce Management System.

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or select existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

---

## Step 2: Enable Firebase Storage

1. In Firebase Console, click **"Storage"** in the left sidebar
2. Click **"Get Started"**
3. Choose **"Start in production mode"** (we'll configure rules later)
4. Select a Cloud Storage location (choose closest to your users)
5. Click **"Done"**

---

## Step 3: Get Backend Credentials (Firebase Admin SDK)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. Download the JSON file
5. **Rename it to `firebase-admin.json`**
6. **Move it to `/app/backend/firebase-admin.json`**

⚠️ **IMPORTANT:** Never commit this file to version control!

---

## Step 4: Get Frontend Credentials (Web App Config)

1. In Firebase Console, go to **Project Settings** → **"General"** tab
2. Scroll to **"Your apps"** section
3. If no web app exists:
   - Click **"Add app"** → Select **Web** icon (`</>`)
   - Register app with a nickname (e.g., "Assured Security Web")
   - Click **"Register app"**
4. Copy the Firebase configuration object

---

## Step 5: Configure Backend Environment

Add the following to `/app/backend/.env`:

```env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

Replace `your-project-id` with your actual Firebase project ID.

---

## Step 6: Configure Frontend Environment

Add the following to `/app/frontend/.env`:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

Replace with your actual Firebase web config values.

---

## Step 7: Configure Storage Security Rules

1. In Firebase Console, go to **Storage** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Guards documents - only authenticated users
    match /guards/{guardId}/documents/{documentType}/{version}/{fileName} {
      // Allow read for authenticated users
      allow read: if request.auth != null;
      
      // Allow write for authenticated users
      allow write: if request.auth != null;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 8: Restart Services

After adding credentials, restart the backend:

```bash
sudo supervisorctl restart backend
```

---

## Step 9: Verify Setup

Test Firebase connection:

```bash
cd /app/backend
python3 -c "
import firebase_admin
from firebase_admin import credentials, storage
cred = credentials.Certificate('firebase-admin.json')
app = firebase_admin.initialize_app(cred, {'storageBucket': 'your-project-id.appspot.com'})
bucket = storage.bucket()
print('✅ Firebase Admin SDK + Storage: WORKING')
"
```

---

## Troubleshooting

### Error: "Firebase credentials not found"
- Ensure `firebase-admin.json` is in `/app/backend/`
- Check file permissions
- Verify JSON format is valid

### Error: "Storage bucket not found"
- Verify `FIREBASE_STORAGE_BUCKET` in backend `.env`
- Ensure Storage is enabled in Firebase Console
- Check bucket name format: `project-id.appspot.com`

### Error: "Permission denied"
- Check Firebase Storage security rules
- Ensure user is authenticated
- Verify service account has Storage Admin role

---

## Security Best Practices

1. ✅ Never commit `firebase-admin.json` to Git
2. ✅ Add `firebase-admin.json` to `.gitignore`
3. ✅ Use environment variables for configuration
4. ✅ Implement proper authentication before file uploads
5. ✅ Validate file types and sizes on backend
6. ✅ Use role-based access control for document verification

---

## Storage Structure

Documents are organized as:

```
/guards/
  /{guardId}/
    /documents/
      /aadhaar/
        /v1/
          /aadhaar_front.pdf
          /aadhaar_back.pdf
        /v2/
          /aadhaar_updated.pdf
      /pan/
        /v1/
          /pan_card.pdf
      /police_verification/
        /v1/
          /police_cert.pdf
      /security_license/
        /v1/
          /license.pdf
      /medical_certificate/
        /v1/
          /medical.pdf
      /training_certificates/
        /v1/
          /training_cert.pdf
```

This structure supports:
- Multiple document types per guard
- Document versioning (v1, v2, v3...)
- Easy retrieval and management

---

## Next Steps

Once Firebase is configured:
1. Test document upload from Guards management page
2. Verify documents appear in Firebase Console → Storage
3. Test document verification workflow
4. Set up expiry alerts (Phase 2)

---

For support, refer to:
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
