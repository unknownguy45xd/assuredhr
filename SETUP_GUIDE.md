# 🚀 Assured Security Services - Complete Setup Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Firebase Configuration](#firebase-configuration)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Project Structure](#project-structure)
10. [API Documentation](#api-documentation)

---

## 🎯 System Overview

**Assured Security Services** is a comprehensive Security Guard Workforce Management System built with:
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **File Storage**: Firebase Storage
- **PDF Generation**: Puppeteer (for invoices & salary slips)

### Key Features (Phase 1 - Completed)
✅ Guards Management with profile completion tracking
✅ Clients Management with GST details
✅ Sites Management with billing rates
✅ Document Management with Firebase Storage integration
✅ Field Officers Management with role-based access control
✅ Audit Logging for all critical operations
✅ Role-based authentication (Admin, Field Officer)

### Upcoming Features (Phase 2 & 3)
⏳ Attendance tracking with daily salary calculation
⏳ Automated billing & invoice generation
⏳ Financial intelligence dashboard
⏳ Payroll with Indian tax compliance (PF, ESI, TDS)
⏳ Notifications system
⏳ PDF generation for salary slips & invoices

---

## 📦 Prerequisites

### Required Software
- **Node.js**: v18+ (for frontend)
- **Python**: 3.11+ (for backend)
- **MongoDB**: 4.4+ (database)
- **Yarn**: 1.22+ (package manager)
- **Git**: For version control

### Optional
- **Firebase Account**: For document storage (can be configured later)

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd /app/backend
```

### 2. Install Python Dependencies
```bash
# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Linux/Mac
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create or update `/app/backend/.env`:

```env
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="assured_security_db"

# Security
JWT_SECRET_KEY="your-super-secret-jwt-key-change-in-production"
CORS_ORIGINS="*"

# Firebase Storage (Optional - for document uploads)
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
```

**Important**: 
- Change `JWT_SECRET_KEY` to a strong random string in production
- Update `MONGO_URL` if using remote MongoDB
- `FIREBASE_STORAGE_BUCKET` is optional for now

### 4. Start MongoDB
```bash
# If using local MongoDB
sudo systemctl start mongodb

# OR if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run Backend Server
```bash
# Development mode (with auto-reload)
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# OR using supervisor (production)
sudo supervisorctl restart backend
```

### 6. Verify Backend is Running
```bash
curl http://localhost:8001/api/guards
# Should return: [] (empty array if no guards exist)
```

---

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd /app/frontend
```

### 2. Install Dependencies
```bash
# Install all npm packages
yarn install
```

### 3. Configure Environment Variables
Create or update `/app/frontend/.env`:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# WebSocket Configuration (for development)
WDS_SOCKET_PORT=443

# Feature Flags
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false

# Firebase Web Configuration (Optional - for document uploads)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

**Important**:
- Update `REACT_APP_BACKEND_URL` to your backend URL
- Firebase config is optional for now (document upload won't work without it)

### 4. Run Frontend Development Server
```bash
# Start development server
yarn start

# OR using supervisor (production)
sudo supervisorctl restart frontend
```

### 5. Build for Production
```bash
yarn build
# Output will be in /app/frontend/build/
```

### 6. Verify Frontend is Running
Open browser and navigate to:
```
http://localhost:3000
```

---

## 🔥 Firebase Configuration

Firebase is used for secure document storage (Aadhaar, PAN, Police Verification, etc.).

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or select existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

### Step 2: Enable Firebase Storage
1. In Firebase Console, click **"Storage"** in the left sidebar
2. Click **"Get Started"**
3. Choose **"Start in production mode"**
4. Select a Cloud Storage location (choose closest to your users)
5. Click **"Done"**

### Step 3: Get Backend Credentials (Firebase Admin SDK)
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **"Service Accounts"** tab
3. Click **"Generate New Private Key"**
4. Download the JSON file
5. **Rename it to `firebase-admin.json`**
6. **Move it to `/app/backend/firebase-admin.json`**

⚠️ **IMPORTANT**: Never commit this file to version control!

### Step 4: Get Frontend Credentials (Web App Config)
1. In Firebase Console, go to **Project Settings** → **"General"** tab
2. Scroll to **"Your apps"** section
3. If no web app exists:
   - Click **"Add app"** → Select **Web** icon (`</>`)
   - Register app with a nickname (e.g., "Assured Security Web")
   - Click **"Register app"**
4. Copy the Firebase configuration object

### Step 5: Update Environment Variables

**Backend** (`/app/backend/.env`):
```env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Frontend** (`/app/frontend/.env`):
```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 6: Configure Storage Security Rules
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

### Step 7: Restart Services
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Step 8: Verify Firebase Setup
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

## 🚀 Running the Application

### Option 1: Using Supervisor (Recommended for Production)
```bash
# Start all services
sudo supervisorctl start all

# Check status
sudo supervisorctl status

# Restart specific service
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View logs
sudo supervisorctl tail -f backend
sudo supervisorctl tail -f frontend
```

### Option 2: Manual Start (Development)
```bash
# Terminal 1: Start MongoDB
mongod --dbpath /data/db

# Terminal 2: Start Backend
cd /app/backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Terminal 3: Start Frontend
cd /app/frontend
yarn start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

---

## 🧪 Testing

### 1. Create Test Admin Account
```bash
curl -X POST "http://localhost:8001/api/auth/admin/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "full_name": "Test Admin"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

### 3. Test Guards API
```bash
# Get all guards
curl -X GET "http://localhost:8001/api/guards" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a guard
curl -X POST "http://localhost:8001/api/guards" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "phone": "9876543211",
    "address": "456 Guard Colony, Mumbai",
    "aadhaar_number": "1234-5678-9012",
    "pan_number": "ABCDE1234F",
    "shift": "day",
    "salary_type": "daily",
    "rate_per_day": 600,
    "basic_salary": 15000,
    "joining_date": "2025-01-01"
  }'
```

### 4. Test Clients API
```bash
# Create a client
curl -X POST "http://localhost:8001/api/clients" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "company": "ABC Corp Pvt Ltd",
    "address": "123 Business Park, Mumbai",
    "gst_number": "27AABCU9603R1ZM",
    "contact_person": "John Doe",
    "contact_phone": "9876543210",
    "contact_email": "john@abc.com"
  }'
```

### 5. Test Sites API
```bash
# Create a site (replace CLIENT_ID with actual client ID)
curl -X POST "http://localhost:8001/api/sites" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corporate Office",
    "client_id": "CLIENT_ID_HERE",
    "location": "Mumbai, Maharashtra",
    "address": "123 Business Park, Andheri East, Mumbai",
    "guards_required": 5,
    "billing_rate_per_guard": 800,
    "shift_type": "24x7"
  }'
```

### 6. Frontend Testing
1. Open browser: http://localhost:3000
2. Login with: `admin@test.com` / `admin123`
3. Navigate through:
   - Dashboard
   - Guards Management
   - Clients Management
   - Sites Management
   - Documents Management
   - Field Officers Management

---

## 🔍 Troubleshooting

### Backend Issues

#### Issue: "Module not found" error
```bash
# Solution: Reinstall dependencies
cd /app/backend
pip install -r requirements.txt
```

#### Issue: "MongoDB connection failed"
```bash
# Solution: Check if MongoDB is running
sudo systemctl status mongodb

# OR restart MongoDB
sudo systemctl restart mongodb
```

#### Issue: "Firebase credentials not found"
```bash
# Solution: Ensure firebase-admin.json exists
ls -la /app/backend/firebase-admin.json

# If missing, follow Firebase Configuration steps
```

#### Issue: "Port 8001 already in use"
```bash
# Solution: Kill existing process
sudo lsof -ti:8001 | xargs kill -9

# OR use different port
uvicorn server:app --reload --host 0.0.0.0 --port 8002
```

### Frontend Issues

#### Issue: "Module not found" error
```bash
# Solution: Reinstall dependencies
cd /app/frontend
rm -rf node_modules yarn.lock
yarn install
```

#### Issue: "Cannot connect to backend"
```bash
# Solution: Check REACT_APP_BACKEND_URL in .env
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL

# Ensure backend is running
curl http://localhost:8001/api/guards
```

#### Issue: "Firebase not initialized"
```bash
# Solution: Check Firebase config in .env
cat /app/frontend/.env | grep FIREBASE

# Ensure all Firebase env variables are set
```

### Database Issues

#### Issue: "Collection not found"
```bash
# Solution: Collections are created automatically on first insert
# Just create your first guard/client/site via API or UI
```

#### Issue: "Duplicate key error"
```bash
# Solution: Clear the collection
mongo
use assured_security_db
db.guards.deleteMany({})
db.clients.deleteMany({})
db.sites.deleteMany({})
```

---

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py                 # Main FastAPI application
│   ├── models_enhanced.py        # Pydantic models
│   ├── firebase_config.py        # Firebase Admin SDK setup
│   ├── firebase-admin.json       # Firebase credentials (DO NOT COMMIT)
│   ├── firebase-admin.json.example  # Template for credentials
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Backend environment variables
│   └── tests/                    # Backend tests (Phase 2)
│
├── frontend/
│   ├── src/
│   │   ├── App.js                # Main React component with routing
│   │   ├── pages/
│   │   │   ├── Guards.js         # Guards management page
│   │   │   ├── GuardDetail.js    # Guard detail view with tabs
│   │   │   ├── Clients.js        # Clients management page
│   │   │   ├── Sites.js          # Sites management page
│   │   │   ├── Documents.js      # Documents management page
│   │   │   ├── FieldOfficers.js  # Field officers management page
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── Employees.js      # HRMS employees (existing)
│   │   │   └── ...               # Other HRMS pages
│   │   ├── components/
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── firebase.js       # Firebase client SDK
│   │   │   └── utils.js          # Utility functions
│   │   └── index.js              # React entry point
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies
│   ├── .env                      # Frontend environment variables
│   └── yarn.lock                 # Yarn lock file
│
├── SETUP_GUIDE.md                # This file
├── FIREBASE_SETUP.md             # Detailed Firebase setup
├── .gitignore                    # Git ignore rules
└── README.md                     # Project overview
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/admin/signup
Create a new admin account.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword",
  "full_name": "Admin Name"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Admin Name",
    "role": "admin"
  },
  "role": "admin"
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...},
  "role": "admin"
}
```

### Guards Endpoints

#### GET /api/guards
Get all guards (with optional filters).

**Query Parameters:**
- `status`: Filter by status (active/inactive)
- `field_officer_id`: Filter by field officer
- `site_id`: Filter by site

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
[
  {
    "id": "uuid",
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "phone": "9876543211",
    "address": "456 Guard Colony, Mumbai",
    "aadhaar_number": "1234-5678-9012",
    "pan_number": "ABCDE1234F",
    "assigned_site_id": "site-uuid",
    "field_officer_id": "officer-uuid",
    "shift": "day",
    "salary_type": "daily",
    "rate_per_day": 600,
    "basic_salary": 15000,
    "joining_date": "2025-01-01",
    "verification_status": "pending",
    "status": "active",
    "profile_completion_percentage": 91,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### POST /api/guards
Create a new guard.

**Request Body:**
```json
{
  "first_name": "Rajesh",
  "last_name": "Kumar",
  "phone": "9876543211",
  "address": "456 Guard Colony, Mumbai",
  "aadhaar_number": "1234-5678-9012",
  "pan_number": "ABCDE1234F",
  "assigned_site_id": "site-uuid",
  "shift": "day",
  "salary_type": "daily",
  "rate_per_day": 600,
  "basic_salary": 15000,
  "joining_date": "2025-01-01"
}
```

#### GET /api/guards/{guard_id}
Get guard by ID.

#### PUT /api/guards/{guard_id}
Update guard information.

#### DELETE /api/guards/{guard_id}
Soft delete guard (sets status to inactive).

### Clients Endpoints

#### GET /api/clients
Get all clients.

#### POST /api/clients
Create a new client.

**Request Body:**
```json
{
  "name": "ABC Corporation",
  "company": "ABC Corp Pvt Ltd",
  "address": "123 Business Park, Mumbai",
  "gst_number": "27AABCU9603R1ZM",
  "contact_person": "John Doe",
  "contact_phone": "9876543210",
  "contact_email": "john@abc.com"
}
```

#### GET /api/clients/{client_id}
Get client by ID.

#### PUT /api/clients/{client_id}
Update client information.

#### DELETE /api/clients/{client_id}
Soft delete client.

### Sites Endpoints

#### GET /api/sites
Get all sites (with optional filters).

**Query Parameters:**
- `client_id`: Filter by client
- `field_officer_id`: Filter by field officer
- `status`: Filter by status

#### POST /api/sites
Create a new site.

**Request Body:**
```json
{
  "name": "Corporate Office",
  "client_id": "client-uuid",
  "location": "Mumbai, Maharashtra",
  "address": "123 Business Park, Andheri East, Mumbai",
  "guards_required": 5,
  "billing_rate_per_guard": 800,
  "shift_type": "24x7",
  "assigned_field_officer_id": "officer-uuid"
}
```

#### GET /api/sites/{site_id}
Get site by ID.

#### PUT /api/sites/{site_id}
Update site information.

#### DELETE /api/sites/{site_id}
Soft delete site.

### Documents Endpoints

#### GET /api/documents/{guard_id}
Get all documents for a guard.

#### POST /api/documents/upload
Upload a document for a guard.

**Request Body (multipart/form-data):**
- `file`: File to upload (PDF/Image)
- `guard_id`: Guard ID
- `document_type`: Type of document (aadhaar, pan, police_verification, etc.)
- `expiry_date`: Optional expiry date
- `notes`: Optional notes

#### PUT /api/documents/{document_id}/verify
Verify or reject a document.

**Request Body:**
```json
{
  "verification_status": "verified",  // or "rejected"
  "notes": "Optional verification notes"
}
```

#### DELETE /api/documents/{document_id}
Delete a document.

### Field Officers Endpoints

#### GET /api/field-officers
Get all field officers.

#### POST /api/field-officers
Create a new field officer.

**Request Body:**
```json
{
  "user_id": "admin-user-uuid",
  "name": "Officer Name",
  "email": "officer@example.com",
  "phone": "9876543210",
  "assigned_guards": ["guard-uuid-1", "guard-uuid-2"],
  "assigned_sites": ["site-uuid-1", "site-uuid-2"]
}
```

#### GET /api/field-officers/{officer_id}
Get field officer by ID.

#### PUT /api/field-officers/{officer_id}
Update field officer information.

#### DELETE /api/field-officers/{officer_id}
Soft delete field officer.

### Audit Logs Endpoints

#### GET /api/audit-logs
Get audit logs (with optional filters).

**Query Parameters:**
- `entity_type`: Filter by entity type (guard, client, site, document, field_officer)
- `entity_id`: Filter by entity ID
- `user_id`: Filter by user ID
- `limit`: Number of logs to return (default: 100)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "admin-uuid",
    "user_name": "Admin Name",
    "action_type": "created",
    "entity_type": "guard",
    "entity_id": "guard-uuid",
    "details": {
      "name": "Rajesh Kumar"
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }
]
```

---

## 🎓 Next Steps

### Phase 2 Implementation
1. **Attendance System**
   - Daily attendance marking
   - Attendance history
   - Attendance reports

2. **Daily Auto Salary Engine**
   - Automatic salary calculation based on attendance
   - Daily salary logs
   - Monthly salary aggregation

3. **Billing & Invoice System**
   - Auto-generate invoices from attendance
   - Invoice PDF generation
   - Payment tracking

### Phase 3 Implementation
1. **Financial Intelligence Dashboard**
   - Revenue tracking (site-wise)
   - Salary cost tracking
   - Office expenses
   - Profit/loss analysis

2. **Payroll with Indian Tax Compliance**
   - PF calculation (12% employee + 12% employer)
   - ESI calculation (0.75% employee + 3.25% employer)
   - TDS calculation
   - Salary slips PDF generation

3. **Notifications System**
   - Document expiry alerts
   - Missing documents alerts
   - Salary processed notifications
   - Invoice due alerts

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](#api-documentation)
3. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
4. Check frontend logs: `tail -f /var/log/supervisor/frontend.err.log`

---

## 📝 License

This project is proprietary software developed for Assured Security Services.

---

**Last Updated**: March 26, 2026
**Version**: 1.0.0 (Phase 1 Complete)
