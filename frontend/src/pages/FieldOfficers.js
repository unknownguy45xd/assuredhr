import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "@/App";
import { UserCog, Plus, Search, Edit, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FieldOfficers = () => {
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [filteredOfficers, setFilteredOfficers] = useState([]);
  const [guards, setGuards] = useState([]);
  const [sites, setSites] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    email: "",
    phone: "",
    assigned_guards: [],
    assigned_sites: []
  });

  useEffect(() => {
    fetchFieldOfficers();
    fetchGuards();
    fetchSites();
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    filterOfficers();
  }, [fieldOfficers, searchTerm]);

  const fetchFieldOfficers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/field-officers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFieldOfficers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching field officers:", error);
      toast.error("Failed to fetch field officers");
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/guards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuards(response.data);
    } catch (error) {
      console.error("Error fetching guards:", error);
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

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminUsers(response.data.filter(u => u.role !== "field_officer"));
    } catch (error) {
      console.error("Error fetching admin users:", error);
    }
  };

  const filterOfficers = () => {
    let filtered = fieldOfficers;
    if (searchTerm) {
      filtered = filtered.filter(officer =>
        officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officer.phone?.includes(searchTerm)
      );
    }
    setFilteredOfficers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await axios.post(`${API}/field-officers`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Field officer added successfully");
      setShowAddDialog(false);
      resetForm();
      fetchFieldOfficers();
    } catch (error) {
      console.error("Error adding field officer:", error);
      toast.error(error.response?.data?.detail || "Failed to add field officer");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/field-officers/${selectedOfficer.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Field officer updated successfully");
      setShowEditDialog(false);
      resetForm();
      fetchFieldOfficers();
    } catch (error) {
      console.error("Error updating field officer:", error);
      toast.error("Failed to update field officer");
    }
  };

  const handleEdit = (officer) => {
    setSelectedOfficer(officer);
    setFormData({
      user_id: officer.user_id,
      name: officer.name,
      email: officer.email,
      phone: officer.phone,
      assigned_guards: officer.assigned_guards || [],
      assigned_sites: officer.assigned_sites || []
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      name: "",
      email: "",
      phone: "",
      assigned_guards: [],
      assigned_sites: []
    });
    setSelectedOfficer(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Field Officers Management</h1>
          <p className="text-gray-600 mt-1">Manage field officers and their assignments</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Field Officer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Officers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fieldOfficers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserCog className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Officers</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {fieldOfficers.filter(o => o.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <UserCog className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {fieldOfficers.reduce((sum, o) => sum + (o.assigned_guards?.length || 0) + (o.assigned_sites?.length || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Officer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Guards
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Sites
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
              {filteredOfficers.map((officer) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{officer.phone}</div>
                    <div className="text-sm text-gray-500">{officer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{officer.assigned_guards?.length || 0} guards</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-900">{officer.assigned_sites?.length || 0} sites</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      officer.status === "active" ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                    }`}>
                      {officer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(officer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Officer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Field Officer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Select User *</Label>
              <Select value={formData.user_id} onValueChange={(value) => {
                const user = adminUsers.find(u => u.id === value);
                setFormData({
                  ...formData,
                  user_id: value,
                  name: user?.full_name || "",
                  email: user?.email || ""
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admin user" />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name} ({user.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Assigned Guards (Optional)</Label>
              <p className="text-xs text-gray-500 mb-2">You can assign guards later from the edit dialog</p>
            </div>
            <div>
              <Label>Assigned Sites (Optional)</Label>
              <p className="text-xs text-gray-500 mb-2">You can assign sites later from the edit dialog</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Field Officer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Officer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Field Officer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Assigned Guards</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {guards.map(guard => (
                  <div key={guard.id} className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      checked={formData.assigned_guards.includes(guard.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, assigned_guards: [...formData.assigned_guards, guard.id]});
                        } else {
                          setFormData({...formData, assigned_guards: formData.assigned_guards.filter(id => id !== guard.id)});
                        }
                      }}
                      className="rounded"
                    />
                    <label className="text-sm">{guard.first_name} {guard.last_name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Assigned Sites</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {sites.map(site => (
                  <div key={site.id} className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      checked={formData.assigned_sites.includes(site.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, assigned_sites: [...formData.assigned_sites, site.id]});
                        } else {
                          setFormData({...formData, assigned_sites: formData.assigned_sites.filter(id => id !== site.id)});
                        }
                      }}
                      className="rounded"
                    />
                    <label className="text-sm">{site.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldOfficers;