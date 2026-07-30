import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Plus,
  AlertCircle,
  RefreshCw,
  Briefcase,
  Check,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';
import CustomerForm from "./CustomerForm";
import DeleteConfirmation from "./DeleteConfirmation";
import { 
  ClientListApi, 
  UpdateClientStatusApi, 
  getClientById, 
  ClientApi, 
  UpdateClientApi,
  softDeleteClientApi,
  searchClientsApi
} from "../../../../api/admin/Client";
import { formatDateForInput } from "../../../../utils/dataFormat";
import CustomerDetails from "./CustomerDetails";
import Pagination from "../employees/pagination";
import Table, { TableColumn } from "../../../reusableComponent/ReusableTable";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  place: string;
  district: string;
  status: "active" | "inactive";
  attendanceData: string;
  address: string;
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
  lastLogin: string;
  products?: Product[];
}

interface Product {
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
}

interface FormData {
  id: string;
  email: string;
  ClientName: string;
  attendedDate: string;
  contactNumber: string;
  address: string;
  products: Product[]; 
  status: string;
  lastLogin?: string;
}

const CustomerTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id: "",
    email: "",
    ClientName: "",
    attendedDate: "",
    contactNumber: "",
    address: "",
    products: [{
      productName: "",
      quantity: "",
      brand: "",
      model: "",
      warrantyDate: "",
      guaranteeDate: ""
    }],
    status: "active",
    lastLogin: "",
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer;
    direction: "asc" | "desc";
  } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6;
  const [totalPages, setTotalPages] = useState(0);

  // Define table columns
  const customerColumns: TableColumn[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true
    },
    {
      key: "email",
      header: "Email",
      hidden: "md",
      icon: <Mail size={16} className="text-gray-400" />
    },
    {
      key: "phone",
      header: "Phone",
      hidden: "sm",
      icon: <Phone size={16} className="text-gray-400" />
    },
    {
      key: "place",
      header: "Location",
      hidden: "lg",
      icon: <MapPin size={16} className="text-gray-400" />
    },
    {
      key: "status",
      header: "Status"
    }
  ];

  const MIN_SEARCH_CHARS = 5;
  const hasInitialized = useRef(false);
  const isFirstSearchRun = useRef(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchCustomers = useCallback(async (page: number) => {
    try {
      setIsRefreshing(true);
      setLoading(true);
      
      const response = await ClientListApi(page, itemsPerPage);
      const responseData = response?.data;
      if (response && response.success && responseData) {
        const mappedClients = responseData.clients
          .map((client: any) => ({
            id: client.id,
            name: client.clientName,
            email: client.email,
            phone: client.contactNumber,
            place: client.address?.split(',')[0]?.trim() || 'N/A',
            district: client.address?.split(',')[1]?.trim() || 'N/A',
            status: client.status as "active" | "inactive",
            avatar: client.clientName?.charAt(0) || 'U',
            attendanceData: client.attendedDate,
            productName: client.products[0].productName || "",
            quantity: client.products[0].quantity || "",
            brand: client.products[0].brand || "",
            model: client.products[0].model || "",
            warrantyDate: client.products[0].warrantyDate || "",
            guaranteeDate: client.products[0].guaranteeDate || ""
          }));
          
        setCustomers(mappedClients);
        setTotalItems(responseData.total);
        setTotalPages(responseData.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  // Memoized search function - only takes dependencies it needs
  const searchCustomerFn = useCallback(
    async (term: string, status: "all" | "active" | "inactive") => {
      if (term.length > 0 && term.length < MIN_SEARCH_CHARS) {
        return;
      }
      try {
        setIsRefreshing(true);
        setLoading(true);
        const response = await searchClientsApi(term, status, 1, itemsPerPage);

        const responseData = response?.data;
        if (response && response.success && responseData) {
          const mappedClients = responseData.clients.map((client: any) => ({
            id: client._id,
            name: client.clientName,
            email: client.email,
            phone: client.contactNumber,
            place: client.address?.split(',')[0]?.trim() || 'N/A',
            district: client.address?.split(',')[1]?.trim() || 'N/A',
            status: client.status as "active" | "inactive",
            avatar: client.clientName?.charAt(0) || 'U',
            attendanceData: client.attendedDate,
            productName: client.productName || "",
            quantity: client.quantity || "",
            brand: client.brand || "",
            model: client.model || "",
            warrantyDate: client.warrantyDate || "",
            guaranteeDate: client.guaranteeDate || ""
          }));
          
          setCustomers(mappedClients);
          setTotalItems(responseData.total);
          setTotalPages(responseData.totalPages);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Failed to search clients:", error);
        toast.error("Failed to search customers");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [itemsPerPage]
  );

  // Load initial data on component mount (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchCustomers(1);
    }
  }, []); // Runs once on mount

  // Handle search/filter changes with debounce - but only AFTER mount
  useEffect(() => {
    // Skip the first run on mount
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all') {
        searchCustomerFn(searchTerm, statusFilter);
      } else if (searchTerm.length === 0 && statusFilter === 'all') {
        fetchCustomers(1);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  // Handle page changes separately
  useEffect(() => {
    if (currentPage === 1) {
      return;
    }

    if (searchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all') {
      searchCustomerFn(searchTerm, statusFilter);
    } else {
      fetchCustomers(currentPage);
    }
  }, [currentPage]);

  const sortedCustomers = [...customers].sort((a, b) => {
    if (!sortConfig) return 0; 
    const { key, direction } = sortConfig;
    if ((a[key] ?? "") < (b[key] ?? "")) return direction === "asc" ? -1 : 1;
    if ((a[key] ?? "") > (b[key] ?? "")) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Page change will trigger the useEffect that handles fetching
  };

  const toggleStatus = async (id: string) => {
    const customerToUpdate = customers.find(customer => customer.id === id);
    if (!customerToUpdate) return;
       
    const newStatus = customerToUpdate.status === "active" ? "inactive" : "active";
    const statusConfig = {
      active: { color: "#10B981", label: "Active" },
      inactive: { color: "#EF4444", label: "Inactive" }
    };

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
            <span class="w-3 h-3 rounded-full mr-2" style="background:${statusConfig[newStatus].color}"></span>
            <span class="font-medium" style="color:${statusConfig[newStatus].color}">${statusConfig[newStatus].label}</span>
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
      try {
        await UpdateClientStatusApi(id, newStatus);
        setCustomers(customers.map(customer =>
          customer.id === id ? { ...customer, status: newStatus as "active" | "inactive" } : customer
        ));
        
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
      } catch (error) {
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
    }
  };

  const handleEdit = async (customer: Customer) => {
    try {
      setLoading(true);
      const clientDetails = await getClientById(customer.id);
      
      if (clientDetails) {
        // Map products to format date fields for inputs correctly
        const productsWithFormattedDates: Product[] = clientDetails.products?.length ? clientDetails.products.map((product: any) => ({
          ...product,
          warrantyDate: formatDateForInput(product.warrantyDate),
          guaranteeDate: formatDateForInput(product.guaranteeDate)
        })) : [{
          productName: customer.productName || "",
          quantity: customer.quantity || "",
          brand: customer.brand || "",
          model: customer.model || "",
          warrantyDate: formatDateForInput(customer.warrantyDate),
          guaranteeDate: formatDateForInput(customer.guaranteeDate)
        }];

        setFormData({
          id: customer.id,
          email: customer.email,
          ClientName: customer.name,
          attendedDate: formatDateForInput(customer.attendanceData),
          contactNumber: customer.phone,
          address: `${customer.place}, ${customer.district}`,
          status: customer.status,
          products: productsWithFormattedDates,
          lastLogin: customer.lastLogin || ""
        });
        setShowModal(true);
      } else {
        toast.error("Could not load client details");
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast.error("Failed to load client details");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (data: FormData) => {
    try {
      const clientData = {
        id: data.id || "",
        clientName: data.ClientName,
        email: data.email,
        contactNumber: data.contactNumber,
        address: data.address,
        status: data.status,
        attendedDate: data.attendedDate,
        products: data.products, 
        lastLogin: new Date().toISOString()
      };
  
      if (data.id) {
        await UpdateClientApi(data.id, clientData);
        toast.success('Client updated successfully');
      } else {
        await ClientApi(clientData);
        toast.success('Client added successfully');
      }
      
      // Refresh the list based on current search/filter state
      if (searchTerm || statusFilter !== 'all') {
        await searchCustomerFn(searchTerm, statusFilter);
      } else {
        await fetchCustomers(currentPage);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(`Failed to ${data.id ? 'update' : 'add'} client`);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      await softDeleteClientApi(selectedCustomer.id);
      
      setCustomers(customers.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, status: "inactive" } 
          : customer
      ));
      
      toast.success("Customer has been deactivated");
      setShowDeleteConfirm(false);
      setSelectedCustomer(null);
      
      // Refresh the list based on current search/filter state
      if (searchTerm || statusFilter !== 'all') {
        await searchCustomerFn(searchTerm, statusFilter);
      } else {
        await fetchCustomers(currentPage);
      }
    } catch (error) {
      console.error("Soft delete failed:", error);
      toast.error("Failed to deactivate customer");
    }
  };

  const confirmDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteConfirm(true);
  };

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: key as keyof Customer, direction });
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600"
          ></motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading customer data...</p>
        </div>
      </div>
    );
  }

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
              <Briefcase className="text-blue-600" size={24} />
              Customer Management
            </h2>
            <p className="text-gray-600 mt-1">View and manage your client database</p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (searchTerm || statusFilter !== 'all') {
                  searchCustomerFn(searchTerm, statusFilter);
                } else {
                  fetchCustomers(currentPage);
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-full ${isRefreshing ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}`}
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <RefreshCw size={18} />
              </motion.div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setFormData({
                  id: "",
                  email: "",
                  ClientName: "",
                  attendedDate: "",
                  contactNumber: "",
                  address: "",
                  products: [{
                    productName: "",
                    quantity: "",
                    brand: "",
                    model: "",
                    warrantyDate: "",
                    guaranteeDate: ""
                  }],
                  status: "active",
                  lastLogin: "",
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add Customer</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, or location..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                <span>Filter: {statusFilter === "all" ? "All" : statusFilter === "active" ? "Active" : "Inactive"}</span>
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
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "all" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "all" ? "text-blue-600 font-medium" : ""}>All Customers</span>
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("active");
                      setShowStatusFilter(false);
                      setCurrentPage(1);
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
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "inactive" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "inactive" ? "text-blue-600 font-medium" : ""}>Inactive Only</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
    <Table<Customer>
      data={sortedCustomers}
      columns={customerColumns}
      sortConfig={sortConfig ?? undefined}
      onSort={requestSort}
      onToggleStatus={(id) => toggleStatus(id)}
      onView={(customer) => {
        setSelectedCustomer(customer);
        setShowViewModal(true);
      }}
      onEdit={handleEdit}
      onDelete={confirmDelete}
      idKey="id"
      nameKey="name"
      emailKey="email"
      rowVariants={tableRowVariants}
      emptyMessage={{
        title: "No customers found",
        description: "Try adjusting your search or filter criteria"
      }}
    />

{/* Pagination Section */}
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

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <CustomerDetails 
              customer={selectedCustomer}
              onClose={() => setShowViewModal(false)}
              onEdit={() => {
                setShowViewModal(false);
                handleEdit(selectedCustomer);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerForm 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={formData}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleSoftDelete}
        customerName={selectedCustomer?.name || ""}
      />
    </div>
  )
};

export default React.memo(CustomerTable);
