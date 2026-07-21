import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, RefreshCw, Filter, Search, Eye, Edit2, Trash2, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ComplaintFormData,
  ComplaintResponse,
  coordinator,
  Mechanic,
} from "../../types/complaint";
import ComplaintList from "../../components/admin/pages/cumplaints/ComplaintList";
import Pagination from "../../components/admin/pages/cumplaints/Pagination";
import ComplaintDetails from "../../components/admin/pages/cumplaints/ComplaintDetails";
import DeleteConfirmation from "../../components/admin/pages/cumplaints/DeleteConfirmation";
import {
  createComplaint,
  deleteComplaint,
  fetchAvailableMechanics,
  fetchCoordinatorEmails,
  fetchCustomerEmails,
  findEmailForInitialCreation,
  getComplaintsByCoordinator,
  updateComplaintStatus,
} from "../../api/cplaint/complaint";
import ComplaintFormStep1 from "../../components/admin/pages/cumplaints/ComplaintFormStep1";
import ComplaintFormStep2 from "../../components/admin/pages/cumplaints/ComplaintFormStep2";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";

const CoordinatorComplaintTable: React.FC = () => {
  // State hooks
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState<ComplaintFormData>({
    customerEmail: "",
    contactNumber: "",
    description: "",
    assignedMechanicId: "",
    createdBy: "",
    status: "pending",
    priority: "medium",
    customerName: "",
    notes: "",
    workingStatus: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<ComplaintResponse[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintFormData | null>(null);
  const [customerEmails, setCustomerEmails] = useState<{ email: string, name?: string }[]>([]);
  const [coordinator, setCoordinator] = useState<coordinator[]>([]);

  const selectEmployeeId = (state: RootState) => state.employeeAuth?.employeeData?.id;
  const employeeId = useSelector(selectEmployeeId);

  // Coordinator-specific states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in-progress" | "resolved" | "cancelled"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    cancelled: 0
  });

  // Effects
  useEffect(() => {
    loadComplaints();
    loadCustomerEmails();
    loadCoordinator();
    loadMechanics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    calculateStats();
  }, [complaints]);

  // Calculate statistics
  const calculateStats = () => {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const cancelled = complaints.filter(c => c.status === 'cancelled').length;

    setStats({ total, pending, inProgress, resolved, cancelled });
  };

  const loadMechanics = async () => {
    try {
      const mechanics = await fetchAvailableMechanics();
      setMechanics(mechanics || []);
    } catch (error) {
      console.error("Failed to fetch mechanics:", error);
      toast.error("Failed to load mechanics");
      setMechanics([]); // Set empty array on error
    }
  };

  const loadCoordinator = async () => {
    try {
      const coordinator = await fetchCoordinatorEmails();
      setCoordinator(coordinator || [])
    } catch (error) {
      console.error("Failed to fetch coordinators:", error);
      toast.error("Failed to load coordinators");
      setCoordinator([]);
    }
  }


  const loadComplaints = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const complaints = await getComplaintsByCoordinator();

      const activeComplaints = Array.isArray(complaints)
        ? complaints.filter(comp => !comp.isDeleted)
        : [];

      setComplaints(activeComplaints);
      setFilteredComplaints(activeComplaints);
      setTotalItems(activeComplaints.length);
      setTotalPages(Math.ceil(activeComplaints.length / itemsPerPage));
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadCustomerEmails = async () => {
    try {
      const customers = await fetchCustomerEmails();
      setCustomerEmails(customers);
    } catch (error) {
      console.error("Failed to fetch customer emails:", error);
    }
  };

  // Filtering with pagination
  const applyFilters = () => {
    let result = [...complaints];

    result = result.filter((comp) => !comp.isDeleted);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (comp) =>
          (comp.customerName &&
            comp.customerName.toLowerCase().includes(term)) ||
          comp.customerEmail.toLowerCase().includes(term) ||
          (comp.contactNumber || '').includes(term) ||
          (comp.description || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((comp) => {
        const compStatus = typeof comp.status === "string" ? comp.status : comp.status;
        return compStatus === statusFilter;
      });
    }

    if (priorityFilter !== "all") {
      result = result.filter((comp) => comp.priority === priorityFilter);
    }

    setFilteredComplaints(result);
    setTotalItems(result.length);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setCurrentPage(1);
  };

  // Quick status update
  const handleQuickStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setComplaints(prev =>
        prev.map(comp =>
          comp.id === complaintId ? { ...comp, status: newStatus } : comp
        )
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  // Form handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail)) {
        throw new Error("Please enter a valid email address");
      }

      const complaintData = {
        customerEmail: formData.customerEmail,
        contactNumber: formData.contactNumber ?? "",
        customerPhone: formData.contactNumber ?? "",
        description: formData.description,
        assignedMechanicId: formData.assignedMechanicId,
        createdBy: employeeId ?? "",
        status: formData.status ?? "pending",
        priority: formData.priority,
        customerName: formData.customerName ?? "",
        notes: formData.notes ?? "",
        workingStatus: formData.workingStatus ?? "",
        selectedProductId: formData.selectedProductId ?? "",
      };

      if (isEditMode && formData.id) {
        // Handle edit logic here
        toast.success("Complaint updated successfully");
      } else {
        await createComplaint(complaintData);
        toast.success("Complaint registered successfully");
      }

      setSubmitSuccess(true);
      await loadComplaints();

      setTimeout(() => {
        resetForm();
        setSubmitSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to save complaint:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save complaint. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    if (!formData.customerEmail.trim()) {
      setSubmitError("Customer email is required");
      return;
    }

    if (!(formData.contactNumber ?? "").trim()) {
      setSubmitError("Contact number is required");
      return;
    }

    if (!formData.description.trim()) {
      setSubmitError("Description is required");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await findEmailForInitialCreation(formData.customerEmail);

      if (response.success && response.exists && response.customerData) {
        setFormData(prev => ({
          ...prev,
          customerName: response.customerData?.name || "",
          address: response.customerData.address || "",
          products: response.customerData.products || [],
          selectedProductId: ""
        }));
        setFormStep(2);
      } else {
        setSubmitError("Customer not found. Please enter a valid registered email.");
      }
    } catch (error) {
      console.error("Error checking customer:", error);
      setSubmitError("Error verifying customer email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setIsEditMode(false);
    setFormStep(1);
    setFormData({
      customerEmail: "",
      contactNumber: "",
      description: "",
      assignedMechanicId: "",
      createdBy: "",
      priority: "medium",
      customerName: "",
      notes: "",
      status: "pending",
      workingStatus: "",
    });
    setSubmitError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData: ComplaintFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Modal actions
  const openEditModal = (complaint: ComplaintFormData) => {
    setFormData({ ...complaint });
    setIsEditMode(true);
    setShowModal(true);
  };

  const openDeleteModal = (id: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (complaint) {
      setSelectedComplaint(complaint);
      setShowDeleteModal(true);
    }
  };

  const openViewModal = (complaint: ComplaintFormData) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  // Delete complaint
  const confirmDelete = async () => {
    if (!selectedComplaint?.id) return;
    try {
      await deleteComplaint(selectedComplaint.id);
      await loadComplaints();
      toast.success("Complaint deleted successfully");
      setShowDeleteModal(false);
      setSelectedComplaint(null);
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      toast.error("Failed to delete complaint. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "#6B7280";

    switch (status.toLowerCase()) {
      case "pending":
        return "#fda000ff";
      case "in-progress":
      case "processing":
        return "#3B82F6";
      case "resolved":
      case "completed":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  type StatusValue =
    | 'pending'
    | 'processing'
    | 'accept'
    | 'in-progress'
    | 'resolved'
    | 'cancelled'
    | 'completed'
    | 'rejected'
    | string;

  const StatusBadge = ({ workingStatus, statusObj }: {
    workingStatus?: StatusValue;
    statusObj?: { status: string; updatedAt: string; updatedBy: string };
  }) => {
    const actualStatus = statusObj?.status || workingStatus || "";

    const statusText: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      accept: "Accepted",
      "in-progress": "In Progress",
      resolved: "Resolved",
      cancelled: "Cancelled",
      completed: "Completed",
      rejected: "Rejected",
    };

    const statusColors: Record<string, string> = {
      pending: "#FBBF24",
      processing: "#3B82F6",
      accept: "#10B981",
      "in-progress": "#3B82F6",
      resolved: "#10B981",
      cancelled: "#EF4444",
      completed: "#10B981",
      rejected: "#EF4444",
      "": "#6B7280",
    };

    const color = statusColors[actualStatus] || "#6B7280";
    const bgColor = `${color}20`;

    return (
      <div
        className="px-3 py-1 rounded-full inline-flex items-center"
        style={{ backgroundColor: bgColor }}
      >
        <span
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        ></span>
        <span className="text-xs font-medium" style={{ color }}>
          {statusText[actualStatus] || actualStatus}
        </span>
      </div>
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden font-poppins">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="text-blue-600" size={24} />
              Complaint Management
            </h2>
            <p className="text-gray-600 mt-1">
              Manage and track customer complaints
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={loadComplaints}
              className={`flex items-center gap-2 p-2 rounded-full ${isRefreshing
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                }`}
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{
                  duration: 1,
                  repeat: isRefreshing ? Infinity : 0,
                  ease: "linear",
                }}
              >
                <RefreshCw size={18} />
              </motion.div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setIsEditMode(false);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>New Complaint</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by customer name, email, or description..."
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(
                  e.target.value as "all" | "pending" | "in-progress" | "resolved" | "cancelled"
                )}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(
                  e.target.value as "all" | "low" | "medium" | "high"
                )}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Complaint Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600"
              ></motion.div>
              <p className="mt-4 text-gray-600 font-medium">Loading complaints...</p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                <th className="p-4 font-medium">Complaint_NO</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium hidden md:table-cell">Contact</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Priority</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((complaint, index) => (
                  <motion.tr
                    key={complaint.id}
                    custom={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="hover:bg-blue-50 transition-colors group"
                  >
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-gray-700">{complaint.complaintNumber}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border-2 border-blue-200 shadow-sm">
                          {complaint.customerName?.charAt(0) || complaint.customerEmail.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{complaint.customerName || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{complaint.customerEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-gray-700">{complaint.contactNumber}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-700 line-clamp-2 max-w-xs">
                        {complaint.description.length > 60
                          ? `${complaint.description.substring(0, 60)}...`
                          : complaint.description
                        }
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${getPriorityColor(complaint.priority)}20`,
                          color: getPriorityColor(complaint.priority)
                        }}
                      >
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        workingStatus={
                          (complaint.workingStatus ||
                            complaint.status ||
                            "") as StatusValue
                        }
                      />
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openViewModal(complaint)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEditModal(complaint)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openDeleteModal(complaint.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center py-8">
                      <ClipboardList size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No complaints found</p>
                      <p className="text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredComplaints.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstItem={indexOfFirstItem + 1}
          indexOfLastItem={Math.min(indexOfLastItem, filteredComplaints.length)}
          totalItems={filteredComplaints.length}
          onPageChange={paginate}
        />
      )}

      {/* Modal Components */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {isEditMode
                    ? "Edit Complaint"
                    : formStep === 1
                      ? "Register New Complaint"
                      : "Verify Complaint Details"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {isEditMode ? (
                <ComplaintFormStep1
                  formData={formData}
                  mechanics={mechanics}
                  customerEmails={customerEmails}
                  isSubmitting={isSubmitting}
                  submitSuccess={submitSuccess}
                  submitError={submitError}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  resetForm={resetForm}
                  onClose={resetForm}
                  isEditMode={true}
                />
              ) : formStep === 1 ? (
                <ComplaintFormStep1
                  formData={formData}
                  mechanics={mechanics}
                  // coordinators={coordinatorEmails}
                  customerEmails={customerEmails}
                  isSubmitting={isSubmitting}
                  submitSuccess={submitSuccess}
                  submitError={submitError}
                  handleInputChange={handleInputChange}
                  handleNextStep={handleNextStep}
                  resetForm={resetForm}
                  onClose={resetForm}
                  isEditMode={false}
                />
              ) : (
                <ComplaintFormStep2
                  formData={formData}
                  mechanics={mechanics}
                  isSubmitting={isSubmitting}
                  submitSuccess={submitSuccess}
                  submitError={submitError}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  onBack={() => setFormStep(1)}
                  onClose={resetForm}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}



      {/* View Complaint Modal */}
      {showViewModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <ComplaintDetails
              complaint={selectedComplaint}
              mechanics={mechanics}
              coordinator={coordinator}
              onClose={() => {
                setShowViewModal(false);
                setSelectedComplaint(null);
              }}
              onEdit={() => {
                setShowViewModal(false);
                openEditModal(selectedComplaint);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedComplaint && (
        <DeleteConfirmation
          complaint={selectedComplaint}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedComplaint(null);
          }} submitError={null} />
      )}
    </div>
  );
};

export default CoordinatorComplaintTable;
