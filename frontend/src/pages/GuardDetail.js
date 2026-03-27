import { useState, useEffect } from "react";
import axios from "axios";
import { API, toast } from "@/App";
import { getErrorMessage } from "@/lib/formatters";
import { useParams, useNavigate } from "react-router-dom";
import { Shield, ArrowLeft, Edit, Upload, CheckCircle, XCircle, Clock, FileText, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceCalendar from "@/components/AttendanceCalendar";

const GuardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guard, setGuard] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [sites, setSites] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    document_type: "aadhaar",
    expiry_date: "",
    notes: ""
  });

  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchGuardDetails();
    fetchDocuments();
    fetchSites();
    fetchFieldOfficers();
    fetchAttendanceData();
    fetchHolidays();
  }, [id]);

  const fetchGuardDetails = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/guards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuard(response.data);
      setEditData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching guard:", error);
      toast.error("Failed to fetch guard details");
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  const fetchAttendanceData = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      // Generate sample attendance data for current month
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const sampleAttendance = [];
      for (let day = 1; day <= Math.min(daysInMonth, today.getDate()); day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
        
        // Skip Sundays
        if (dayOfWeek === 0) continue;
        
        // Random attendance status (mostly present)
        const rand = Math.random();
        let status = 'present';
        if (rand < 0.05) status = 'absent';
        else if (rand < 0.10) status = 'half_day';
        else if (rand < 0.15) status = 'late';
        
        sampleAttendance.push({
          date: dateStr,
          status: status,
          shift: guard?.shift || 'day',
          marked_by: 'System',
          notes: status === 'late' ? 'Arrived 30 minutes late' : ''
        });
      }
      
      setAttendanceData(sampleAttendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const fetchHolidays = async () => {
    try {
      // Sample holidays for current year
      const currentYear = new Date().getFullYear();
      const sampleHolidays = [
        { date: `${currentYear}-01-01`, name: "New Year's Day", description: "Public Holiday" },
        { date: `${currentYear}-01-26`, name: "Republic Day", description: "National Holiday" },
        { date: `${currentYear}-03-08`, name: "Holi", description: "Festival of Colors" },
        { date: `${currentYear}-08-15`, name: "Independence Day", description: "National Holiday" },
        { date: `${currentYear}-10-02`, name: "Gandhi Jayanti", description: "National Holiday" },
        { date: `${currentYear}-10-24`, name: "Diwali", description: "Festival of Lights" },
        { date: `${currentYear}-12-25`, name: "Christmas", description: "Public Holiday" },
      ];
      setHolidays(sampleHolidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/guards/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Guard updated successfully");
      setShowEditDialog(false);
      fetchGuardDetails();
    } catch (error) {
      console.error("Error updating guard:", error);
      toast.error("Failed to update guard");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("guard_id", id);
      formData.append("document_type", uploadData.document_type);
      if (uploadData.expiry_date) formData.append("expiry_date", uploadData.expiry_date);
      if (uploadData.notes) formData.append("notes", uploadData.notes);

      await axios.post(`${API}/documents/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      toast.success("Document uploaded successfully");
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadData({ document_type: "aadhaar", expiry_date: "", notes: "" });
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(getErrorMessage(error, "Failed to upload document"));
    }
  };

  const handleVerifyDocument = async (docId, status) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(`${API}/documents/${docId}/verify`, 
        { verification_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Document ${status} successfully`);
      fetchDocuments();
    } catch (error) {
      console.error("Error verifying document:", error);
      toast.error("Failed to verify document");
    }
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

  const documentTypes = [
    { value: "aadhaar", label: "Aadhaar Card" },
    { value: "pan", label: "PAN Card" },
    { value: "police_verification", label: "Police Verification" },
    { value: "security_license", label: "Security License" },
    { value: "medical_certificate", label: "Medical Certificate" },
    { value: "training_certificate", label: "Training Certificate" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!guard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Guard not found</p>
        <Button onClick={() => navigate("/guards")} className="mt-4">
          Back to Guards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/guards")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {guard.first_name} {guard.last_name}
            </h1>
            <p className="text-gray-600 mt-1">Guard ID: {guard.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowEditDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profile Completion</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{guard.profile_completion_percentage}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification Status</p>
              <div className="mt-1">{getVerificationBadge(guard.verification_status)}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Daily Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">₹{guard.rate_per_day}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-base font-medium text-gray-900 mt-1">{guard.first_name} {guard.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-base font-medium text-gray-900 mt-1">{guard.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-base font-medium text-gray-900 mt-1">{guard.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Aadhaar Number</p>
                <p className="text-base font-medium text-gray-900 mt-1">{guard.aadhaar_number || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PAN Number</p>
                <p className="text-base font-medium text-gray-900 mt-1">{guard.pan_number || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Joining Date</p>
                <p className="text-base font-medium text-gray-900 mt-1">{new Date(guard.joining_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned Site</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {sites.find(s => s.id === guard.assigned_site_id)?.name || "Not assigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shift</p>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{guard.shift}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Salary Type</p>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{guard.salary_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate per Day</p>
                <p className="text-base font-medium text-gray-900 mt-1">₹{guard.rate_per_day}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Basic Salary</p>
                <p className="text-base font-medium text-gray-900 mt-1">₹{guard.basic_salary || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{guard.status}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Documents</h2>
              <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                          </p>
                          <p className="text-sm text-gray-600">Version {doc.version} • {doc.file_name}</p>
                          {doc.expiry_date && (
                            <p className="text-sm text-gray-600 mt-1">
                              Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVerificationBadge(doc.verification_status)}
                        {doc.verification_status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id, "verified")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyDocument(doc.id, "rejected")}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.cloudinary_url || doc.file_url, "_blank")}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="bg-white rounded-lg shadow p-6">
            <AttendanceCalendar 
              guardId={id} 
              attendanceData={attendanceData}
              holidays={holidays}
            />
          </div>
        </TabsContent>

        {/* Salary Tab */}
        <TabsContent value="salary">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Salary Information</h2>
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Salary tracking will be available in Phase 2</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guard Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={editData.first_name || ""}
                  onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={editData.last_name || ""}
                  onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label>Aadhaar Number</Label>
                <Input
                  value={editData.aadhaar_number || ""}
                  onChange={(e) => setEditData({...editData, aadhaar_number: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={editData.address || ""}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate per Day</Label>
                <Input
                  type="number"
                  value={editData.rate_per_day || ""}
                  onChange={(e) => setEditData({...editData, rate_per_day: e.target.value})}
                />
              </div>
              <div>
                <Label>Basic Salary</Label>
                <Input
                  type="number"
                  value={editData.basic_salary || ""}
                  onChange={(e) => setEditData({...editData, basic_salary: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Select value={uploadData.document_type} onValueChange={(value) => setUploadData({...uploadData, document_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files[0])}
                required
              />
            </div>
            <div>
              <Label>Expiry Date (Optional)</Label>
              <Input
                type="date"
                value={uploadData.expiry_date}
                onChange={(e) => setUploadData({...uploadData, expiry_date: e.target.value})}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Input
                value={uploadData.notes}
                onChange={(e) => setUploadData({...uploadData, notes: e.target.value})}
                placeholder="Any additional notes..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuardDetail;
