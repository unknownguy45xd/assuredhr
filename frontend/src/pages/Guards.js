import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "@/App";
import { Shield, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Guards = () => {
  const navigate = useNavigate();
  const [guards, setGuards] = useState([]);
  const [filteredGuards, setFilteredGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sites, setSites] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    aadhaar_number: "",
    pan_number: "",
    assigned_site_id: "",
    field_officer_id: "",
    shift: "day",
    salary_type: "daily",
    rate_per_day: "",
    basic_salary: "",
    joining_date: new Date().toISOString().split('T')[0],
    verification_status: "pending",
    status: "active"
  });

  useEffect(() => {
    fetchGuards();
    fetchSites();
    fetchFieldOfficers();
  }, []);

  useEffect(() => {
    filterGuards();
  }, [guards, searchTerm, statusFilter]);

  const fetchGuards = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/guards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuards(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching guards:", error);
      toast.error("Failed to fetch guards");
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/sites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSites(response.data);
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchFieldOfficers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/field-officers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFieldOfficers(response.data);
    } catch (error) {
      console.error("Error fetching field officers:", error);
    }
  };

  const filterGuards = () => {
    let filtered = guards;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(guard => guard.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(guard =>
        `${guard.first_name} ${guard.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guard.phone?.includes(searchTerm) ||
        guard.aadhaar_number?.includes(searchTerm)
      );
    }

    setFilteredGuards(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API}/guards`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Guard added successfully");
      setShowAddDialog(false);
      resetForm();
      fetchGuards();
    } catch (error) {
      console.error("Error adding guard:", error);
      toast.error("Failed to add guard");
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      phone: "",
      address: "",
      aadhaar_number: "",
      pan_number: "",
      assigned_site_id: "",
      field_officer_id: "",
      shift: "day",
      salary_type: "daily",
      rate_per_day: "",
      basic_salary: "",
      joining_date: new Date().toISOString().split('T')[0],
      verification_status: "pending",
      status: "active"
    });
  };

  const getProfileCompletionColor = (percentage) => {
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getVerificationBadge = (status) => {
    const badges = {
      verified: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Verified" },
      pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
      rejected: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rejected" }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guards Management</h1>
          <p className="text-gray-600 mt-1">Manage security guards and their assignments</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Guard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Guards</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{guards.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Guards</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {guards.filter(g => g.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {guards.filter(g => g.verification_status === "verified").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {guards.filter(g => g.verification_status === "pending").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, phone, or Aadhaar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Guards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guard Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuards.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {guard.first_name} {guard.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {guard.aadhaar_number ? `Aadhaar: ${guard.aadhaar_number}` : "No Aadhaar"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{guard.phone}</div>
                    <div className="text-sm text-gray-500">{guard.address?.substring(0, 30)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {sites.find(s => s.id === guard.assigned_site_id)?.name || "Not Assigned"}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">{guard.shift} Shift</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{guard.rate_per_day}/{guard.salary_type === "daily" ? "day" : "month"}</div>
                    <div className="text-sm text-gray-500 capitalize">{guard.salary_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProfileCompletionColor(guard.profile_completion_percentage)}`}>
                      {guard.profile_completion_percentage}% Complete
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVerificationBadge(guard.verification_status)}
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        guard.status === "active" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                      }`}>
                        {guard.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/guards/${guard.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guard Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Guard</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Joining Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.joining_date}
                  onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              <Input
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aadhaar Number</Label>
                <Input
                  value={formData.aadhaar_number}
                  onChange={(e) => setFormData({...formData, aadhaar_number: e.target.value})}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              <div>
                <Label>PAN Number</Label>
                <Input
                  value={formData.pan_number}
                  onChange={(e) => setFormData({...formData, pan_number: e.target.value})}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned Site</Label>
                <Select value={formData.assigned_site_id} onValueChange={(value) => setFormData({...formData, assigned_site_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Field Officer</Label>
                <Select value={formData.field_officer_id} onValueChange={(value) => setFormData({...formData, field_officer_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select officer" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOfficers.map(officer => (
                      <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shift *</Label>
                <Select value={formData.shift} onValueChange={(value) => setFormData({...formData, shift: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Salary Type *</Label>
                <Select value={formData.salary_type} onValueChange={(value) => setFormData({...formData, salary_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate per Day *</Label>
                <Input
                  type="number"
                  required
                  value={formData.rate_per_day}
                  onChange={(e) => setFormData({...formData, rate_per_day: e.target.value})}
                  placeholder="500"
                />
              </div>
              <div>
                <Label>Basic Salary (for PF/ESI)</Label>
                <Input
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                  placeholder="15000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Guard
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Guards;
