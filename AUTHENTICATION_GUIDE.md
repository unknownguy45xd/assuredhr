# 🔐 Authentication & Role-Based Access Control - Complete Guide

## Overview

Assured Security Services uses a **JWT-based authentication system** with **role-based access control (RBAC)** to secure the application and provide different levels of access to different user types.

---

## 🎭 User Roles

The system supports 5 distinct roles:

### 1. **Super Admin** (`admin`)
- **Full system access**
- Can manage all guards, clients, sites, documents, field officers
- Access to financial data, billing, and payroll
- Can create and manage other users
- Access to all HRMS features

### 2. **HR** (`hr`)
- Manage guards, clients, sites, documents
- Manage employees and organizational structure
- Handle recruitment, onboarding, and performance
- **No access** to financial data or payroll

### 3. **Supervisor / Field Officer** (`field_officer` or `supervisor`)
- **Restricted access** to assigned guards and sites only
- Can view and edit assigned guards
- Can mark attendance for assigned guards
- Can upload documents for assigned guards
- **No access** to clients, financial data, or payroll
- **No access** to other guards or sites

### 4. **Accountant** (`accountant`)
- Access to payroll and billing
- View financial dashboards
- **No access** to guard management or HR functions

### 5. **Employee** (`employee`)
- Access to employee portal only
- View own profile, attendance, leaves, salary
- **No access** to admin portal

---

## 🔑 Authentication Flow

### 1. Login Process

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@test.com",
    "full_name": "Test Admin",
    "role": "admin"
  },
  "role": "admin"
}
```

**Frontend Storage:**
```javascript
localStorage.setItem("admin_token", token);
localStorage.setItem("admin_data", JSON.stringify(user));
localStorage.setItem("user_role", role);
```

### 2. Protected Routes

All admin portal routes are protected using the `ProtectedAdminRoute` component:

```javascript
<Route 
  path="/guards" 
  element={
    <ProtectedAdminRoute>
      <Layout>
        <Guards />
      </Layout>
    </ProtectedAdminRoute>
  } 
/>
```

**How it works:**
1. Checks if `admin_token` exists in localStorage
2. If not, redirects to `/login`
3. If yes, allows access to the route

### 3. API Authentication

All API requests include the JWT token in the Authorization header:

```javascript
const token = localStorage.getItem("admin_token");
const response = await axios.get(`${API}/guards`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Backend Validation:**
```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    role = payload.get("role", "employee")
    
    # Check admin users first
    if role in ["admin", "field_officer", "hr", "supervisor", "accountant"]:
        user = await db.admin_users.find_one({"id": user_id}, {"_id": 0})
        if user:
            return user
    
    # Check employees
    user = await db.employees.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### 4. Logout Process

**Frontend:**
```javascript
const handleLogout = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_data");
  localStorage.removeItem("user_role");
  toast.success("Logged out successfully");
  navigate("/login");
};
```

---

## 🛡️ Role-Based Access Control (RBAC)

### Menu Item Filtering

The sidebar menu dynamically filters items based on user role:

```javascript
const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard", 
    roles: ["admin", "hr", "supervisor", "field_officer", "accountant"] },
  { path: "/guards", icon: Shield, label: "Guards", 
    roles: ["admin", "hr", "supervisor", "field_officer"] },
  { path: "/clients", icon: Building2, label: "Clients", 
    roles: ["admin", "hr"] },
  { path: "/sites", icon: MapPin, label: "Sites", 
    roles: ["admin", "hr", "supervisor", "field_officer"] },
  { path: "/documents", icon: FileText, label: "Documents", 
    roles: ["admin", "hr", "supervisor", "field_officer"] },
  { path: "/field-officers", icon: UserCog, label: "Field Officers", 
    roles: ["admin", "hr"] },
  { path: "/payroll-enhanced", icon: DollarSign, label: "Payroll+", 
    roles: ["admin", "accountant"] },
  // ... more items
];

// Filter based on current user role
const userRole = localStorage.getItem("user_role") || "admin";
const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));
```

### API-Level Access Control

#### Example 1: Guards API with Field Officer Filtering

```python
@api_router.get("/guards")
async def get_guards(
    status: Optional[str] = None,
    field_officer_id: Optional[str] = None,
    site_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # If user is a field officer, only show assigned guards
    if current_user.get("role") == "field_officer":
        field_officer = await db.field_officers.find_one(
            {"user_id": current_user["id"]}, 
            {"_id": 0}
        )
        if field_officer:
            query["id"] = {"$in": field_officer.get("assigned_guards", [])}
    
    # Apply other filters
    if status:
        query["status"] = status
    
    guards = await db.guards.find(query, {"_id": 0}).to_list(1000)
    return guards
```

#### Example 2: Document Verification (Admin Only)

```python
@api_router.put("/documents/{document_id}/verify")
async def verify_document(
    document_id: str,
    verification_status: str,
    current_user: dict = Depends(get_current_user)
):
    # Only admins can verify documents
    if current_user.get("role") == "field_officer":
        raise HTTPException(
            status_code=403, 
            detail="Only admins can verify documents"
        )
    
    # Proceed with verification
    # ...
```

---

## 👥 User Management

### Creating Users

**Only Super Admins can create users.**

#### 1. Create Admin User

**Endpoint:** `POST /api/auth/admin/signup`

```json
{
  "email": "admin@assured.com",
  "password": "securepassword",
  "full_name": "Admin Name"
}
```

#### 2. Create Field Officer

**Step 1:** Create admin user with role
**Step 2:** Create field officer record

```python
# Create field officer
POST /api/field-officers
{
  "user_id": "admin-user-uuid",
  "name": "Officer Name",
  "email": "officer@assured.com",
  "phone": "9876543210",
  "assigned_guards": ["guard-uuid-1", "guard-uuid-2"],
  "assigned_sites": ["site-uuid-1", "site-uuid-2"]
}
```

This automatically updates the user's role to `field_officer` in the database.

### Assigning Guards and Sites to Field Officers

**Endpoint:** `PUT /api/field-officers/{officer_id}`

```json
{
  "assigned_guards": ["guard-uuid-1", "guard-uuid-2", "guard-uuid-3"],
  "assigned_sites": ["site-uuid-1", "site-uuid-2"]
}
```

---

## 🔒 Security Best Practices

### 1. Token Security

- **JWT tokens** are stored in localStorage (client-side)
- Tokens include user ID and role
- Tokens expire after a set time (configurable)
- **Never expose JWT_SECRET_KEY** in frontend

### 2. Password Security

- Passwords are hashed using bcrypt before storage
- Minimum password length: 6 characters (configurable)
- Password confirmation required during signup

### 3. API Security

- All admin API endpoints require authentication
- Role-based access enforced at API level
- Field officers can only access assigned resources
- Sensitive operations (delete, verify) restricted to admins

### 4. Frontend Security

- Protected routes redirect unauthenticated users to login
- Menu items filtered based on role
- Sensitive UI elements hidden for non-admin users
- Token validation on every API request

---

## 🧪 Testing Authentication

### 1. Test Login

```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

### 2. Test Protected Endpoint

```bash
TOKEN="your-jwt-token-here"

curl -X GET "http://localhost:8001/api/guards" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test Role-Based Access

**As Admin:**
```bash
# Should work
curl -X GET "http://localhost:8001/api/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**As Field Officer:**
```bash
# Should return only assigned guards
curl -X GET "http://localhost:8001/api/guards" \
  -H "Authorization: Bearer $FIELD_OFFICER_TOKEN"

# Should fail (403 Forbidden)
curl -X GET "http://localhost:8001/api/clients" \
  -H "Authorization: Bearer $FIELD_OFFICER_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "Invalid authentication credentials"

**Cause:** Token is expired or invalid

**Solution:**
1. Clear localStorage
2. Login again to get a new token

```javascript
localStorage.clear();
// Navigate to /login
```

### Issue: "Access denied"

**Cause:** User role doesn't have permission for the requested resource

**Solution:**
1. Check user role: `localStorage.getItem("user_role")`
2. Verify role has access to the endpoint
3. Contact admin to update role if needed

### Issue: "User not found"

**Cause:** User ID in token doesn't exist in database

**Solution:**
1. Recreate user account
2. Ensure user exists in `admin_users` or `employees` collection

### Issue: Menu items not showing

**Cause:** Role not set in localStorage

**Solution:**
```javascript
// After login, ensure role is stored
localStorage.setItem("user_role", role);
```

---

## 📋 Role Permission Matrix

| Feature | Admin | HR | Supervisor | Field Officer | Accountant |
|---------|-------|----|-----------|--------------| -----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Guards (All) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Guards (Assigned) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clients | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sites (All) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sites (Assigned) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Documents | ✅ | ✅ | ✅ | ✅ | ❌ |
| Document Verification | ✅ | ✅ | ❌ | ❌ | ❌ |
| Field Officers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Employees | ✅ | ✅ | ❌ | ❌ | ❌ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ❌ |
| Leaves | ✅ | ✅ | ❌ | ❌ | ❌ |
| Recruitment | ✅ | ✅ | ❌ | ❌ | ❌ |
| Onboarding | ✅ | ✅ | ❌ | ❌ | ❌ |
| Payroll | ✅ | ❌ | ❌ | ❌ | ✅ |
| Performance | ✅ | ✅ | ❌ | ❌ | ❌ |
| Financial Dashboard | ✅ | ❌ | ❌ | ❌ | ✅ |
| Billing | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 Future Enhancements

### Phase 2 (Planned)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] Session management (force logout)
- [ ] Activity logging (login/logout tracking)
- [ ] IP-based access control

### Phase 3 (Planned)
- [ ] OAuth integration (Google, Microsoft)
- [ ] Biometric authentication for mobile
- [ ] Role hierarchy (sub-roles)
- [ ] Permission-based access (granular control)
- [ ] API key authentication for integrations

---

## 📞 Support

For authentication issues:
1. Check browser console for errors
2. Verify token in localStorage
3. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
4. Test API endpoints with curl
5. Clear localStorage and try again

---

**Last Updated**: March 26, 2026
**Version**: 1.0.0 (Phase 1 Complete)
