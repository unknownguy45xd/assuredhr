import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeDetail from "@/pages/EmployeeDetail";
import Attendance from "@/pages/Attendance";
import Leaves from "@/pages/Leaves";
import Recruitment from "@/pages/Recruitment";
import Onboarding from "@/pages/Onboarding";
import Payroll from "@/pages/Payroll";
import Performance from "@/pages/Performance";
import OrgStructure from "@/pages/OrgStructure";
import PayrollEnhanced from "@/pages/PayrollEnhanced";
import OnboardingEnhanced from "@/pages/OnboardingEnhanced";
import EmployeeLogin from "@/pages/EmployeeLogin";
import AdminLogin from "@/pages/AdminLogin";
import AdminSignup from "@/pages/AdminSignup";
import EmployeeSignup from "@/pages/EmployeeSignup";
import LandingPage from "@/pages/LandingPage";
import EmployeePortal from "@/pages/EmployeePortal";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import EmployeeProfile from "@/pages/EmployeeProfile";
import EmployeeAttendance from "@/pages/EmployeeAttendance";
import EmployeeLeaves from "@/pages/EmployeeLeaves";
import EmployeePayslips from "@/pages/EmployeePayslips";
import EmployeeDocuments from "@/pages/EmployeeDocuments";
import Guards from "@/pages/Guards";
import GuardDetail from "@/pages/GuardDetail";
import Clients from "@/pages/Clients";
import Sites from "@/pages/Sites";
import Documents from "@/pages/Documents";
import FieldOfficers from "@/pages/FieldOfficers";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Briefcase, 
  ClipboardCheck, 
  DollarSign, 
  TrendingUp,
  Menu,
  X,
  Shield,
  Building2,
  MapPin,
  FileText,
  UserCog
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    const role = localStorage.getItem("user_role") || "admin";
    setUserRole(role);
  }, []);

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "hr", "supervisor", "field_officer", "accountant"] },
    { path: "/guards", icon: Shield, label: "Guards", roles: ["admin", "hr", "supervisor", "field_officer"] },
    { path: "/clients", icon: Building2, label: "Clients", roles: ["admin", "hr"] },
    { path: "/sites", icon: MapPin, label: "Sites", roles: ["admin", "hr", "supervisor", "field_officer"] },
    { path: "/documents", icon: FileText, label: "Documents", roles: ["admin", "hr", "supervisor", "field_officer"] },
    { path: "/field-officers", icon: UserCog, label: "Field Officers", roles: ["admin", "hr"] },
    { path: "/employees", icon: Users, label: "Employees", roles: ["admin", "hr"] },
    { path: "/org-structure", icon: Briefcase, label: "Org Structure", roles: ["admin", "hr"] },
    { path: "/attendance", icon: Clock, label: "Attendance", roles: ["admin", "hr", "supervisor", "field_officer"] },
    { path: "/leaves", icon: Calendar, label: "Leave Management", roles: ["admin", "hr"] },
    { path: "/recruitment", icon: Briefcase, label: "Recruitment", roles: ["admin", "hr"] },
    { path: "/onboarding-enhanced", icon: ClipboardCheck, label: "Onboarding+", roles: ["admin", "hr"] },
    { path: "/payroll-enhanced", icon: DollarSign, label: "Payroll+", roles: ["admin", "accountant"] },
    { path: "/performance", icon: TrendingUp, label: "Performance", roles: ["admin", "hr"] },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
        transition-transform duration-300 w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Assured Security</h1>
                <p className="text-xs text-gray-500">Services</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                      data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("admin_data");
    if (data) {
      setAdminData(JSON.parse(data));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    localStorage.removeItem("user_role");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-700 hover:text-gray-900"
              data-testid="open-sidebar-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:ml-0 ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Human Resource Management</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{adminData?.full_name || "Admin"}</p>
                  <p className="text-xs text-gray-600">{adminData?.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {adminData?.full_name?.charAt(0) || "A"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                data-testid="logout-btn"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("admin_token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/welcome" element={<LandingPage />} />
          
          {/* Admin Login & Signup */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/signup" element={<AdminSignup />} />
          
          {/* Employee Portal Routes */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/signup" element={<EmployeeSignup />} />
          <Route path="/employee" element={<EmployeePortal />}>
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="profile" element={<EmployeeProfile />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="payslips" element={<EmployeePayslips />} />
            <Route path="documents" element={<EmployeeDocuments />} />
          </Route>

          {/* HR Portal Routes (Protected) */}
          <Route path="/" element={<ProtectedAdminRoute><Layout><Dashboard /></Layout></ProtectedAdminRoute>} />
          
          {/* Guard Management Routes */}
          <Route path="/guards" element={<ProtectedAdminRoute><Layout><Guards /></Layout></ProtectedAdminRoute>} />
          <Route path="/guards/:id" element={<ProtectedAdminRoute><Layout><GuardDetail /></Layout></ProtectedAdminRoute>} />
          <Route path="/clients" element={<ProtectedAdminRoute><Layout><Clients /></Layout></ProtectedAdminRoute>} />
          <Route path="/sites" element={<ProtectedAdminRoute><Layout><Sites /></Layout></ProtectedAdminRoute>} />
          <Route path="/documents" element={<ProtectedAdminRoute><Layout><Documents /></Layout></ProtectedAdminRoute>} />
          <Route path="/field-officers" element={<ProtectedAdminRoute><Layout><FieldOfficers /></Layout></ProtectedAdminRoute>} />
          
          {/* HRMS Routes */}
          <Route path="/employees" element={<ProtectedAdminRoute><Layout><Employees /></Layout></ProtectedAdminRoute>} />
          <Route path="/employees/:id" element={<ProtectedAdminRoute><Layout><EmployeeDetail /></Layout></ProtectedAdminRoute>} />
          <Route path="/org-structure" element={<ProtectedAdminRoute><Layout><OrgStructure /></Layout></ProtectedAdminRoute>} />
          <Route path="/attendance" element={<ProtectedAdminRoute><Layout><Attendance /></Layout></ProtectedAdminRoute>} />
          <Route path="/leaves" element={<ProtectedAdminRoute><Layout><Leaves /></Layout></ProtectedAdminRoute>} />
          <Route path="/recruitment" element={<ProtectedAdminRoute><Layout><Recruitment /></Layout></ProtectedAdminRoute>} />
          <Route path="/onboarding" element={<ProtectedAdminRoute><Layout><Onboarding /></Layout></ProtectedAdminRoute>} />
          <Route path="/onboarding-enhanced" element={<ProtectedAdminRoute><Layout><OnboardingEnhanced /></Layout></ProtectedAdminRoute>} />
          <Route path="/payroll" element={<ProtectedAdminRoute><Layout><Payroll /></Layout></ProtectedAdminRoute>} />
          <Route path="/payroll-enhanced" element={<ProtectedAdminRoute><Layout><PayrollEnhanced /></Layout></ProtectedAdminRoute>} />
          <Route path="/performance" element={<ProtectedAdminRoute><Layout><Performance /></Layout></ProtectedAdminRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
export { API, toast };
