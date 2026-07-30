import React, { useState, useEffect } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ComplaintFormData,
  ComplaintResponse,
  coordinator,
  Mechanic,
} from "../../../../types/complaint";
import ComplaintFilter from "./ComplaintFilter";
import ComplaintList from "./ComplaintList";
import Pagination from "./Pagination";
import ComplaintFormStep1 from "./ComplaintFormStep1";
import ComplaintFormStep2 from "./ComplaintFormStep2";
import ComplaintDetails from "./ComplaintDetails";
import DeleteConfirmation from "./DeleteConfirmation";
import {
  createComplaint,
  fetchAvailableMechanics,
  findEmailForInitialCreation,
  getAllComplaint,
  deleteComplaint,
  updateComplaint,
  fetchCustomerEmails,
  fetchCoordinatorEmails,
} from "../../../../api/cplaint/complaint";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store/Store";
import ActionButton from "../../../reusableComponent/ActionButton";
import RefreshButton from "../../../reusableComponent/RefreshButton";

const ComplaintTable: React.FC = () => {
  // State hooks
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [customerEmails, setCustomerEmails] = useState<{email: string, name?: string}[]>([]);
  const [coordinatorEmails, setCoordinatorEmails] = useState<{email: string, name?: string}[]>([]);
  const [formData, setFormData] = useState<ComplaintFormData>({
    customerEmail: "",
    contactNumber: "",
    description: "",
    assignedMechanicId: [],
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
  
  // Fixed Redux selector usage
  const CreateBy = useSelector((state: RootState) => state.adminAuth.adminData?.id);
  
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [coordinator, setCoordinator] = useState<coordinator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintFormData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in-progress" | "resolved" | "cancelled"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");

  // Effects
  useEffect(() => {
    loadComplaints();
    loadMechanics();
    loadCustomerEmails();
    loadCoordinator()
  }, []);

  useEffect(() => {
    applyFilters();
  }, [complaints, searchTerm, statusFilter, priorityFilter]);
  const loadComplaints = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const data = await getAllComplaint();
      
      let complaintsArray: ComplaintResponse[] = [];
      
      if (Array.isArray(data)) {
        complaintsArray = data;
      } else if (data && typeof data === 'object') {
        if (data.complaints && Array.isArray(data.complaints)) {
          complaintsArray = data.complaints;
        } else if (data.data && Array.isArray(data.data)) {
          complaintsArray = data.data;
        } else {
          complaintsArray = [data];
        }
      }
      
      
      const activeComplaints = complaintsArray.filter(comp => {
        if (comp.isDeleted === undefined || comp.isDeleted === null) {
          return true; // If isDeleted is not set, assume it's active
        }
        
        if (typeof comp.isDeleted === 'string') {
          return (comp.isDeleted as string).toLowerCase() !== 'true';
        }
        
        if (typeof comp.isDeleted === 'boolean') {
          return !comp.isDeleted;
        }
        
        return true; 
      })

      setComplaints(activeComplaints);
      setFilteredComplaints(activeComplaints);
      
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Failed to load complaints");
      setComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadCoordinator = async()=>{
    try {
      const coordinator = await fetchCoordinatorEmails();
      setCoordinator(coordinator || [])
    } catch (error) {
      console.error("Failed to fetch coordinators:", error);
      toast.error("Failed to load coordinators");
      setCoordinator([]); 
    }
  }

  const loadMechanics = async () => {
    try {
      const mechanics = await fetchAvailableMechanics();
      setMechanics(mechanics || []); // Ensure it's always an array
    } catch (error) {
      console.error("Failed to fetch mechanics:", error);
      toast.error("Failed to load mechanics");
      setMechanics([]); // Set empty array on error
    }
  };
  
  const loadCustomerEmails = async () => {
    try {
      const customers = await fetchCustomerEmails();
      setCustomerEmails(customers || []); 
    } catch (error) {
      console.error("Failed to fetch customer emails:", error);
      setCustomerEmails([]); // Set empty array on error
    }
  };
  
  const applyFilters = () => {
    if (!Array.isArray(complaints)) {
      setFilteredComplaints([]);
      return;
    }

    let result = [...complaints];

    result = result.filter((comp) => {
      if (comp.isDeleted === undefined || comp.isDeleted === null) {
        return true;
      }
      
      if (typeof comp.isDeleted === 'string') {
        return (comp.isDeleted as string).toLowerCase() !== 'true';
      }
      
      if (typeof comp.isDeleted === 'boolean') {
        return !comp.isDeleted;
      }
      
      return true;
    });

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((comp) => {
        const customerName = comp.customerName || "";
        const customerEmail = comp.customerEmail || "";
        const contactNumber = comp.contactNumber || "";
        const description = comp.description || "";
        
        return (
          customerName.toLowerCase().includes(term) ||
          customerEmail.toLowerCase().includes(term) ||
          contactNumber.includes(term) ||
          description.toLowerCase().includes(term)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((comp) => {
        const compStatus =
          comp.workingStatus ||
          (typeof comp.status === 'object' && comp.status !== null ? (comp.status as any).status : comp.status) ||
          "";
        return compStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      result = result.filter((comp) => {
        const compPriority = comp.priority || "";
        return compPriority.toLowerCase() === priorityFilter.toLowerCase();
      });
    }

    setFilteredComplaints(result);
    setCurrentPage(1);
  };

  // Form handling
  const handleNextStep = async () => {
    // Validate step 1
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
        setFormData((prev) => ({
          ...prev,
          customerName: response.customerData?.name || "",
          address: response.customerData.address,
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
        createdBy: CreateBy ?? "",
        status: formData.status ?? "pending",
        priority: formData.priority,
        customerName: formData.customerName ?? "",
        notes: formData.notes ?? "",
        selectedProductId: formData.selectedProductId ?? "",
        workingStatus: formData.workingStatus ?? "",
      };
      console.log('[FRONTEND] Submit complaint payload:', complaintData);

      let response;
      if (isEditMode && formData.id) {
        response = await updateComplaint(formData.id, complaintData);
        toast.success("Complaint updated successfully");
      } else {
        response = await createComplaint(complaintData);
        toast.success("Complaint added successfully");
      }
      
      setSubmitSuccess(true);
      await loadComplaints(); // Reload complaints after successful submission

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

  const resetForm = () => {
    setShowModal(false);
    setIsEditMode(false);
    setFormStep(1);
    setFormData({
      customerEmail: "",
      contactNumber: "",
      description: "",
      assignedMechanicId: [],
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
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
    console.log('[FRONTEND] Open complaint details:', complaint);
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
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to delete complaint. Please try again."
      );
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "#6B7280";

    switch (status.toLowerCase()) {
      case "pending":
        return "#F59E0B";
      case "in-progress":
      case "processing":
        return "#3B82F6";
        case "completed":
      case "resolved":
        return "#10B981";
      default:
        return "#6B7280";
    } 
  };
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden font-poppins">
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
      Register and manage customer complaints
    </p>
  </div>

  <div className="flex items-center gap-3">
    <RefreshButton
      isRefreshing={isRefreshing}
      onClick={loadComplaints}
      title="Refresh Complaints"
    />

    <ActionButton
      label="Add Complaint"
      icon={Plus}
      onClick={() => {
        setIsEditMode(false);
        setShowModal(true);
      }}
    />
  </div>
</div>

      </motion.div>

      {/* Search and Filter Section */}
      <ComplaintFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearchChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchTerm(e.target.value)
        }
        onStatusFilterChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setStatusFilter(
            e.target.value as "all" | "pending" | "in-progress" | "resolved" | "cancelled"
          )
        }
        onPriorityFilterChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setPriorityFilter(e.target.value as "all" | "low" | "medium" | "high")
        }
      />

      {/* Complaint Table */}
      <ComplaintList
        isLoading={isLoading}
        currentItems={currentItems}
        getStatusColor={getStatusColor}
        onView={openViewModal}
        onDelete={openDeleteModal}
      />

      {/* Pagination */}
      {filteredComplaints.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={
            indexOfLastItem < filteredComplaints.length
              ? indexOfLastItem
              : filteredComplaints.length
          }
          totalItems={filteredComplaints.length}
          onPageChange={paginate}
        />
      )}

      {/* Add/Edit Complaint Modal */}
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
                  coordinators={coordinatorEmails}
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
              onClose={() => setShowViewModal(false)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <DeleteConfirmation
            complaint={selectedComplaint}
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            submitError={submitError}
          />
        </div>
      )}
    </div>
  );
};

export default ComplaintTable;
