import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { API, toast } from "@/App";
import { MapPin, Plus, Search, Edit, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [clients, setClients] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    location: "",
    address: "",
    guards_required: "",
    billing_rate_per_guard: "",
    shift_type: "day",
    assigned_field_officer_id: ""
  });

  useEffect(() => {
    fetchSites();
    fetchClients();
    fetchFieldOfficers();
  }, []);

  useEffect(() => {
    filterSites();
  }, [sites, searchTerm]);

  const fetchSites = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await apiClient.get(`${API}/sites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSites(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to fetch sites");
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await apiClient.get(`${API}/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchFieldOfficers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await apiClient.get(`${API}/field-officers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFieldOfficers(response.data);
    } catch (error) {
      console.error("Error fetching field officers:", error);
    }
  };

  const filterSites = () => {
    let filtered = sites;
    if (searchTerm) {
      filtered = filtered.filter(site =>
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredSites(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await apiClient.post(`${API}/sites`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Site added successfully");
      setShowAddDialog(false);
      resetForm();
      fetchSites();
    } catch (error) {
      console.error("Error adding site:", error);
      toast.error("Failed to add site");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await apiClient.put(`${API}/sites/${selectedSite.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Site updated successfully");
      setShowEditDialog(false);
      resetForm();
      fetchSites();
    } catch (error) {
      console.error("Error updating site:", error);
      toast.error("Failed to update site");
    }
  };

  const handleEdit = (site) => {
    setSelectedSite(site);
    setFormData({
      name: site.name,
      client_id: site.client_id,
      location: site.location,
      address: site.address,
      guards_required: site.guards_required,
      billing_rate_per_guard: site.billing_rate_per_guard,
      shift_type: site.shift_type,
      assigned_field_officer_id: site.assigned_field_officer_id || ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client_id: "",
      location: "",
      address: "",
      guards_required: "",
      billing_rate_per_guard: "",
      shift_type: "day",
      assigned_field_officer_id: ""
    });
    setSelectedSite(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Sites Management</h1>
          <p className="text-gray-600 mt-1">Manage client sites and guard assignments</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sites</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{sites.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sites</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {sites.filter(s => s.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Guards Required</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {sites.reduce((sum, s) => sum + (s.guards_required || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Billing Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ₹{sites.length > 0 ? Math.round(sites.reduce((sum, s) => sum + (s.billing_rate_per_guard || 0), 0) / sites.length) : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
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
            placeholder="Search by site name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guards Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{site.name}</div>
                        <div className="text-sm text-gray-500">{site.address?.substring(0, 30)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {clients.find(c => c.id === site.client_id)?.name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{site.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{site.guards_required}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{site.billing_rate_per_guard}/guard</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 capitalize">
                      {site.shift_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(site)}
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

      {/* Add Site Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Site</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Client *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location *</Label>
                <Input
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label>Shift Type *</Label>
                <Select value={formData.shift_type} onValueChange={(value) => setFormData({...formData, shift_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="rotating">Rotating</SelectItem>
                    <SelectItem value="24x7">24x7</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Guards Required *</Label>
                <Input
                  type="number"
                  required
                  value={formData.guards_required}
                  onChange={(e) => setFormData({...formData, guards_required: e.target.value})}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Billing Rate per Guard *</Label>
                <Input
                  type="number"
                  required
                  value={formData.billing_rate_per_guard}
                  onChange={(e) => setFormData({...formData, billing_rate_per_guard: e.target.value})}
                  placeholder="800"
                />
              </div>
            </div>
            <div>
              <Label>Assigned Field Officer</Label>
              <Select value={formData.assigned_field_officer_id} onValueChange={(value) => setFormData({...formData, assigned_field_officer_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field officer" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOfficers.map(officer => (
                    <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Site
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Site</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <Label>Shift Type</Label>
                <Select value={formData.shift_type} onValueChange={(value) => setFormData({...formData, shift_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="rotating">Rotating</SelectItem>
                    <SelectItem value="24x7">24x7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Guards Required</Label>
                <Input
                  type="number"
                  value={formData.guards_required}
                  onChange={(e) => setFormData({...formData, guards_required: e.target.value})}
                />
              </div>
              <div>
                <Label>Billing Rate per Guard</Label>
                <Input
                  type="number"
                  value={formData.billing_rate_per_guard}
                  onChange={(e) => setFormData({...formData, billing_rate_per_guard: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Assigned Field Officer</Label>
              <Select value={formData.assigned_field_officer_id} onValueChange={(value) => setFormData({...formData, assigned_field_officer_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field officer" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOfficers.map(officer => (
                    <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default Sites;