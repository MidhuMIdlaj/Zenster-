import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Briefcase,  Search, Filter, Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import { 
  createEmployee, 
  fetchEmployees as fetchEmployeesApi, 
  updateEmployeeStatus, 
  updateEmployee, 
  deleteEmployee,
  searchEmployeesApi,
  EmployeeFormData,
  EmployeeResponse
} from "../../../../api/admin/Employee";
import EmployeeForm from "../../../../components/admin/pages/employees/EmployeeForm";
import EmployeeDetails from "../../../../components/admin/pages/employees/EmployeeDetails";
import DeleteConfirmation from "../../../../components/admin/pages/employees/DeleteConfirmation";
import EmployeeList from "../../../../components/admin/pages/employees/EmployeeList";
import Pagination from "../../../../components/admin/pages/employees/pagination";
import ErrorBoundary from "../../../../utils/ErrorBoundary";
import RefreshButton from "../../../reusableComponent/RefreshButton";
import ActionButton from "../../../reusableComponent/ActionButton";

const EmployeeTable: React.FC = () => {
  // State hooks
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    date: "",
    emailId: "",
    employeeName: "",
    joinDate: "",
    contactNumber: "",
    address: "",
    position: 'coordinator',
    employeeAddress: '',
    currentSalary: "",
    age: "",
    previousJob: "",
    experience: "",
    status: 'active',
    fieldOfMechanic: []
  });
  
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFormData | null>(null);
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [positionFilter, setPositionFilter] = useState<"all" | "coordinator" | "mechanic">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPositionFilter, setShowPositionFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const MIN_SEARCH_CHARS = 5;
  const hasInitialized = useRef(false);
  const isFirstRun = useRef(true);

  // Data fetching
  const fetchEmployees = useCallback(async (page: number) => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
      const response = await fetchEmployeesApi(page, itemsPerPage);
      // Check if response has .data structure or direct structure
      const employees = response.data?.employees || response.employees || [];
      const total = response.data?.pagination?.total || response.total || 0;
      const totalPages = response.data?.pagination?.totalPages || response.totalPages || 1;
      
      setEmployees(employees);
      setTotalItems(total);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  const searchEmployees = useCallback(async (searchTerm: string, statusF: "all" | "active" | "inactive", positionF: "all" | "coordinator" | "mechanic", page: number) => {
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      const response = await searchEmployeesApi(
        searchTerm, 
        statusF, 
        positionF,
        page, 
        itemsPerPage
      );
      // Check if response has nested structure
      const employees = response.data?.employees || response.employees || [];
      const total = response.data?.total || response.total || 0;
      const totalPages = response.data?.totalPages || response.totalPages || 1;
      
      setEmployees(employees);
      setTotalItems(total);
      setTotalPages(totalPages);
      
      if (!response.success && employees.length === 0) {
        toast.warning("Search returned no results");
      }
    } catch (error) {
      console.error("Failed to search employees:", error);
      toast.error("Failed to search employees");
      setEmployees([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);
  
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= MIN_SEARCH_CHARS || searchTerm === '') {
        setDebouncedSearchTerm(searchTerm);
      }
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Initialize on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchEmployees(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search/filter changes
  useEffect(() => {
    // Don't run until init is complete
    if (!hasInitialized.current) {
      return;
    }

    // Skip the first run after init completes - only run on actual changes
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    // Now only run when user actually changes search/filter after init
    if (debouncedSearchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all' || positionFilter !== 'all') {
      searchEmployees(debouncedSearchTerm, statusFilter, positionFilter, 1);
    } else if (debouncedSearchTerm === '' && statusFilter === 'all' && positionFilter === 'all') {
      fetchEmployees(1);
    }
  }, [debouncedSearchTerm, statusFilter, positionFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (debouncedSearchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all' || positionFilter !== 'all') {
      searchEmployees(debouncedSearchTerm, statusFilter, positionFilter, page);
    } else {
      fetchEmployees(page);
    }
  };

  // Form handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailId)) {
        throw new Error("Please enter a valid email address");
      }
      
      if (!formData.employeeName.trim()) {
        throw new Error("Employee name is required");
      }
      
      if (!formData.joinDate) {
        throw new Error("Join date is required");
      }
      
      if (!formData.position) {
        throw new Error("Position is required");
      }
      
      const salary = Number(formData.currentSalary);
      if (isNaN(salary) || salary <= 0) {
        throw new Error("Please enter a valid salary amount");
      }
      
      const age = Number(formData.age);
      if (isNaN(age) || age < 18 || age > 80) {
        throw new Error("Age must be between 18 and 80");
      }

      if (isEditMode && formData.id) {
        await updateEmployee(formData.id, formData);
        toast.success('Employee updated successfully');
      } else {
        await createEmployee({ ...formData, status: 'active' });
        toast.success('Employee added successfully');
      }
      
      setSubmitSuccess(true);
      await fetchEmployees(currentPage);
      
      setTimeout(() => {
        resetForm();
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error("Failed to save employee:", error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "Failed to save employee. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setIsEditMode(false);
    setFormData({
      date: "",
      emailId: "",
      employeeName: "",
      joinDate: "",
      contactNumber: "",
      address: "",
      position: 'coordinator',
      employeeAddress: "",
      currentSalary: "",
      age: "",
      previousJob: "",
      experience: "",
      status: 'active',
      fieldOfMechanic : []
    });
  };
  
const handleInputChange = (
  nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  value?: any
) => {
  if (typeof nameOrEvent === 'string') {
    setFormData(prevFormData => ({
      ...prevFormData,
      [nameOrEvent]: Array.isArray(value) ? [...value] : value
    }));
  } else {
    const { name, value } = nameOrEvent.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  }
};

  // Modal actions
  const openEditModal = (employee: EmployeeFormData) => {
    console.log("Editing employee:", employee);
    setFormData({
      id: employee.id,
      date: employee.date || Date.now().toString(),
      emailId: employee.emailId,
      employeeName: employee.employeeName,
      joinDate:employee.joinDate ? new Date(employee.joinDate).toISOString().slice(0,10): "",
      contactNumber: employee.contactNumber,
      address: employee.address || "",
      position: employee.position as 'coordinator' | 'mechanic',
      employeeAddress: employee.employeeAddress || "",
      currentSalary: employee.currentSalary || "",
      age: employee.age || "",
      previousJob: employee.previousJob || "",
      experience: employee.experience || "",
      status: employee.status as 'active' | 'inactive',
      fieldOfMechanic : employee.fieldOfMechanic 
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const openDeleteModal = (employee: EmployeeFormData) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const openViewModal = (employee: EmployeeFormData) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  // Delete employee
  const confirmDelete = async () => {
    if (!selectedEmployee?.id) return;
    try {
      await deleteEmployee(selectedEmployee.id);
      await fetchEmployees(currentPage);
      toast.success("Employee deleted successfully");
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to delete employee:", error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "Failed to delete employee. Please try again."
      );
    }
  };

  // Toggle employee status
  const statusConfig = {
    active: { label: "Active" },
    inactive: { label: "Inactive" },
  };
  
  const toggleEmployeeStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    try {
      const { value: isConfirmed } = await Swal.fire({
        title: "Confirm Status Update",
        html: `
          <div class="text-center">
            <div class="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-50 mb-4">
              <svg class="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p class="text-gray-600 mb-2">You are changing the status to:</p>
            <div class="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 bg-white shadow-xs">
              <span class="w-3 h-3 rounded-full mr-2" style="background:${newStatus === 'active' ? '#10B981' : '#EF4444'}"></span>
              <span class="font-medium" style="color:${newStatus === 'active' ? '#10B981' : '#EF4444'}">${statusConfig[newStatus].label}</span>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Confirm Update",
        cancelButtonText: "Cancel",
        focusConfirm: false,
        customClass: {
          popup: "rounded-lg border border-gray-100 shadow-lg",
          title: "text-xl font-semibold text-gray-800",
          htmlContainer: "text-gray-500",
          confirmButton: "px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium text-white transition-colors",
          cancelButton: "px-6 py-2 border border-gray-300 hover:bg-gray-50 rounded-md font-medium text-gray-700 transition-colors mr-3",
          actions: "mt-4"
        },
        buttonsStyling: false,
        showCloseButton: true,
        backdrop: "rgba(0,0,0,0.08)",
        width: "480px",
        padding: "2rem",
      });

      if (isConfirmed) {
        await updateEmployeeStatus(id, newStatus);
        setEmployees(prev => 
          prev.map(employee => 
            employee.id === id ? { ...employee, status: newStatus } : employee
          )
        );
        
        Swal.fire({
          title: "Status Updated",
          text: `Successfully changed to ${statusConfig[newStatus].label}`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "rounded-lg border border-gray-100 shadow-lg",
            title: "text-lg font-medium text-gray-800"
          }
        });
      }
    } catch (error) {
      console.error("Failed to update employee status:", error);
      Swal.fire({
        title: "Update Failed",
        text: "Please try again or contact support",
        icon: "error",
        customClass: {
          popup: "rounded-lg border border-gray-100 shadow-lg",
          title: "text-lg font-medium text-gray-800"
        }
      });
    }
  };

  // Initial data load
  useEffect(() => {
    fetchEmployees(1);
  }, []);

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
      <Briefcase className="text-blue-600" size={24} />
      Employee Management
    </h2>
    <p className="text-gray-600 mt-1">View and manage your employee database</p>
    </div>
   <div className="flex items-center gap-3">
    <RefreshButton
      isRefreshing={isRefreshing}
      onClick={() => {
        setSearchTerm('');
        setStatusFilter('all');
        setPositionFilter('all');
        setCurrentPage(1);
        fetchEmployees(1);
      }}
      title="Refresh data"
    />

    <ActionButton
      label="Add Employee"
      icon={Plus}
      onClick={() => {
        setIsEditMode(false);
        setShowModal(true);
      }}
    />
    </div>
   </div>
    </motion.div>
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name, email, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm.length > 0 && searchTerm.length < MIN_SEARCH_CHARS && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                Min {MIN_SEARCH_CHARS} chars
              </div>
            )}
            {searchTerm.length >= MIN_SEARCH_CHARS && searchTerm !== debouncedSearchTerm && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter);
                  setShowPositionFilter(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                <span>Status: {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}</span>
                <ChevronDown size={16} />
              </motion.button>
              
              {showStatusFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-200"
                >
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setShowStatusFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "all" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "all" ? "text-blue-600 font-medium" : ""}>All Statuses</span>
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("active");
                      setShowStatusFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "active" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "active" ? "text-blue-600 font-medium" : ""}>Active Only</span>
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("inactive");
                      setShowStatusFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "inactive" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "inactive" ? "text-blue-600 font-medium" : ""}>Inactive Only</span>
                  </button>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowPositionFilter(!showPositionFilter);
                  setShowStatusFilter(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                <span>Position: {positionFilter === "all" ? "All" : positionFilter === "coordinator" ? "Coordinator" : "Mechanic"}</span>
                <ChevronDown size={16} />
              </motion.button>
              
              {showPositionFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-200"
                >
                  <button
                    onClick={() => {
                      setPositionFilter("all");
                      setShowPositionFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {positionFilter === "all" && <Check size={16} className="text-blue-600" />}
                    <span className={positionFilter === "all" ? "text-blue-600 font-medium" : ""}>All Positions</span>
                  </button>
                  <button
                    onClick={() => {
                      setPositionFilter("coordinator");
                      setShowPositionFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {positionFilter === "coordinator" && <Check size={16} className="text-blue-600" />}
                    <span className={positionFilter === "coordinator" ? "text-blue-600 font-medium" : ""}>Coordinators</span>
                  </button>
                  <button
                    onClick={() => {
                      setPositionFilter("mechanic");
                      setShowPositionFilter(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {positionFilter === "mechanic" && <Check size={16} className="text-blue-600" />}
                    <span className={positionFilter === "mechanic" ? "text-blue-600 font-medium" : ""}>Mechanics</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <EmployeeList 
        isLoading={isLoading}
        currentItems={employees}
        onView={openViewModal}
        onDelete={openDeleteModal}
        onToggleStatus={toggleEmployeeStatus}
      />

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstItem={(currentPage - 1) * itemsPerPage + 1}
          indexOfLastItem={Math.min(currentPage * itemsPerPage, totalItems)}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {isEditMode ? "Edit Employee" : "Add New Employee"}
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

              <ErrorBoundary>
                <EmployeeForm 
                  formData={formData}
                  isEditMode={isEditMode}
                  isSubmitting={isSubmitting}
                  submitSuccess={submitSuccess}
                  submitError={submitError}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  resetForm={resetForm}
                  onClose={resetForm}
                />
              </ErrorBoundary>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <EmployeeDetails 
              employee={selectedEmployee}
              onClose={() => setShowViewModal(false)}
              onEdit={() => {
                setShowViewModal(false);
                openEditModal(selectedEmployee);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <DeleteConfirmation 
            employee={selectedEmployee}
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            submitError={submitError}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(EmployeeTable);