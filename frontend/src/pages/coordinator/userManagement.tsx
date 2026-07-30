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
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';
import UserForm from "../../components/admin/pages/customers/CustomerForm";
import DeleteConfirmation from "../../components/admin/pages/customers/DeleteConfirmation";
import {
  ClientListApi,
  UpdateClientStatusApi,
  getClientById,
  ClientApi,
  UpdateClientApi,
  softDeleteClientApi,
  searchClientsApi
} from "../../api/admin/Client";
import { formatDateForInput } from "../../utils/dataFormat";
import UserDetails from "../../components/admin/pages/customers/CustomerDetails";
import Pagination from "../../components/admin/pages/customers/pagination";

export interface User {
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
  role?: string;
  complaints?: number;
  orders?: number;
}

interface Product {
  id?: string;
  _id?: string;
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
}

const getPrimaryProduct = (client: any): Product | undefined => {
  return Array.isArray(client.products) && client.products.length > 0
    ? client.products[0]
    : undefined;
};

const mapClientToUser = (client: any): User => {
  const primaryProduct = getPrimaryProduct(client);
  const address = client.address || "";

  return {
    id: client.id || client._id,
    name: client.clientName,
    email: client.email,
    phone: client.contactNumber,
    place: address.split(',')[0]?.trim() || 'N/A',
    district: address.split(',')[1]?.trim() || 'N/A',
    status: client.status as "active" | "inactive",
    attendanceData: client.attendedDate,
    address,
    role: client.role || "Customer",
    complaints: client.complaints || 0,
    orders: client.orders || 0,
    products: client.products || [],
    productName: primaryProduct?.productName || client.productName || "",
    quantity: primaryProduct?.quantity || client.quantity || "",
    brand: primaryProduct?.brand || client.brand || "",
    model: primaryProduct?.model || client.model || "",
    warrantyDate: primaryProduct?.warrantyDate || client.warrantyDate || "",
    guaranteeDate: primaryProduct?.guaranteeDate || client.guaranteeDate || "",
    lastLogin: client.lastLogin || "Never"
  };
};

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
  role?: string;
}

const UserTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
    role: "Customer"
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "asc" | "desc";
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | string>("all");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 6;
  const [totalPages, setTotalPages] = useState(0);
  const MIN_SEARCH_CHARS = 5;
  const hasInitialized = useRef(false);
  const isFirstSearchRun = useRef(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchUsers = useCallback(async (page: number) => {
    try {
      setIsRefreshing(true);
      setLoading(true);

      const response = await ClientListApi(page, itemsPerPage);
      const responseData = response?.data;
      if (response && response.success && responseData) {
        const mappedClients = responseData.clients.map(mapClientToUser);

        setUsers(mappedClients);
        setTotalItems(responseData.total);
        setTotalPages(responseData.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage]);

  // Memoized search function - takes explicit parameters to avoid closure issues
  const searchUserFn = useCallback(
    async (term: string, status: "all" | "active" | "inactive") => {
      if (term.length > 0 && term.length < MIN_SEARCH_CHARS) {
        return;
      }
      try {
        setIsRefreshing(true);
        setLoading(true);
        const response = await searchClientsApi(
          term,
          status,
          1, // Always search from page 1
          itemsPerPage
        );

        const responseData = response?.data;
        if (response && response.success && responseData) {
          const mappedClients = responseData.clients.map(mapClientToUser);

          setUsers(mappedClients);
          setTotalItems(responseData.total);
          setTotalPages(responseData.totalPages);
          setCurrentPage(1); // Reset to page 1 when searching
        }
      } catch (error) {
        console.error("Failed to search clients:", error);
        toast.error("Failed to search users");
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
      fetchUsers(1);
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
      if (searchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all' || roleFilter !== 'all') {
        setCurrentPage(1);
        searchUserFn(searchTerm, statusFilter);
      } else if (searchTerm.length === 0 && statusFilter === 'all' && roleFilter === 'all') {
        fetchUsers(1);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, roleFilter]);

  // Handle page changes separately
  useEffect(() => {
    if (currentPage === 1) {
      return;
    }

    if (searchTerm.length >= MIN_SEARCH_CHARS || statusFilter !== 'all' || roleFilter !== 'all') {
      searchUserFn(searchTerm, statusFilter);
    } else {
      fetchUsers(currentPage);
    }
  }, [currentPage]);

  const sortedUsers = [...users].sort((a, b) => {
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

  // Handle status toggle
  const toggleStatus = async (id: string) => {
    const userToUpdate = users.find(user => user.id === id);
    if (!userToUpdate) return;

    const newStatus = userToUpdate.status === "active" ? "inactive" : "active";
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
        setUsers(users.map(user =>
          user.id === id ? { ...user, status: newStatus as "active" | "inactive" } : user
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

  // Handle edit client
  const handleEdit = async (user: User) => {
    try {
      setLoading(true);
      const clientDetails = await getClientById(user.id);

      if (clientDetails) {
        const products = clientDetails.products?.length ? clientDetails.products : user.products;
        setFormData({
          id: clientDetails.id || clientDetails._id || user.id,
          email: clientDetails.email || user.email,
          ClientName: clientDetails.clientName || user.name,
          attendedDate: formatDateForInput(clientDetails.attendedDate || user.attendanceData),
          contactNumber: clientDetails.contactNumber || user.phone,
          address: clientDetails.address || user.address || `${user.place}, ${user.district}`,
          status: clientDetails.status || user.status,
          role: user.role,
          products: products?.length ? products.map((product: Product) => ({
            ...product,
            warrantyDate: formatDateForInput(product.warrantyDate),
            guaranteeDate: formatDateForInput(product.guaranteeDate)
          })) : [{
            productName: user.productName || "",
            quantity: user.quantity || "",
            brand: user.brand || "",
            model: user.model || "",
            warrantyDate: formatDateForInput(user.warrantyDate),
            guaranteeDate: formatDateForInput(user.guaranteeDate)
          }],
          lastLogin: user.lastLogin || ""
        });
        setShowModal(true);
      } else {
        toast.error("Could not load user details");
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast.error("Failed to load user details");
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
        role: data.role,
        attendedDate: data.attendedDate,
        products: data.products,
        lastLogin: new Date().toISOString()
      };

      if (data.id) {
        await UpdateClientApi(data.id, clientData);
        toast.success('User updated successfully');
      } else {
        await ClientApi(clientData);
        toast.success('User added successfully');
      }

      if (searchTerm || statusFilter !== 'all' || roleFilter !== 'all') {
        await searchUserFn(searchTerm, statusFilter);
      } else {
        await fetchUsers(currentPage);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(`Failed to ${data.id ? 'update' : 'add'} user`);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;

    try {
      await softDeleteClientApi(selectedUser.id);

      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, status: "inactive" }
          : user
      ));

      toast.success("User has been deactivated");
      setShowDeleteConfirm(false);
      setSelectedUser(null);

      // Refresh the list based on current search/filter state
      if (searchTerm || statusFilter !== 'all' || roleFilter !== 'all') {
        await searchUserFn(searchTerm, statusFilter);
      } else {
        await fetchUsers(currentPage);
      }
    } catch (error) {
      console.error("Soft delete failed:", error);
      toast.error("Failed to deactivate user");
    }
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  // Handle sorting
  const requestSort = (key: keyof User) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Animation variants
  const tableRowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  //   const getStatusColor = (status: string) => {
  //     switch (status.toLowerCase()) {
  //       case 'active': return 'bg-green-100 text-green-800';
  //       case 'inactive': return 'bg-yellow-100 text-yellow-800';
  //       case 'suspended': return 'bg-red-100 text-red-800';
  //       default: return 'bg-gray-100 text-gray-800';
  //     }
  //   };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'VIP Customer': return 'bg-purple-100 text-purple-800';
      case 'Premium Customer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats data
  const stats = [
    {
      title: 'TOTAL USERS',
      value: totalItems.toString(),
      change: '+12',
      changeText: 'Since last month',
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      color: 'indigo'
    },
    {
      title: 'ACTIVE USERS',
      value: users.filter(u => u.status === "active").length.toString(),
      change: '+8',
      changeText: 'Since last month',
      icon: <UserCheck className="w-6 h-6 text-green-500" />,
      color: 'green'
    },
    {
      title: 'INACTIVE USERS',
      value: users.filter(u => u.status === "inactive").length.toString(),
      change: '+2',
      changeText: 'Since last month',
      icon: <UserX className="w-6 h-6 text-yellow-500" />,
      color: 'yellow'
    },
    {
      title: 'NEW THIS MONTH',
      value: users.filter(u => {
        const joinDate = new Date(u.attendanceData);
        const now = new Date();
        return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
      }).length.toString(),
      change: '+15%',
      changeText: 'Since last month',
      icon: <Clock className="w-6 h-6 text-purple-500" />,
      color: 'purple'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600"
          ></motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
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
              User Management
            </h2>
            <p className="text-gray-600 mt-1">View and manage your client database</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (searchTerm || statusFilter !== 'all' || roleFilter !== 'all') {
                  searchUserFn(searchTerm, statusFilter);
                } else {
                  fetchUsers(currentPage);
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
                  role: "Customer",
                  lastLogin: "",
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Add User</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-green-600 font-medium">{stat.change}</span> {stat.changeText}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter Section */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
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
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {statusFilter === "all" && <Check size={16} className="text-blue-600" />}
                    <span className={statusFilter === "all" ? "text-blue-600 font-medium" : ""}>All Status</span>
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

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowRoleFilter(!showRoleFilter)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} />
                <span>Role: {roleFilter === "all" ? "All" : roleFilter}</span>
                <ChevronDown size={16} />
              </motion.button>

              {showRoleFilter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-200"
                >
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setShowRoleFilter(false);
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {roleFilter === "all" && <Check size={16} className="text-blue-600" />}
                    <span className={roleFilter === "all" ? "text-blue-600 font-medium" : ""}>All Roles</span>
                  </button>
                  <button
                    onClick={() => {
                      setRoleFilter("Customer");
                      setShowRoleFilter(false);
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {roleFilter === "Customer" && <Check size={16} className="text-blue-600" />}
                    <span className={roleFilter === "Customer" ? "text-blue-600 font-medium" : ""}>Customer</span>
                  </button>
                  <button
                    onClick={() => {
                      setRoleFilter("Premium Customer");
                      setShowRoleFilter(false);
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {roleFilter === "Premium Customer" && <Check size={16} className="text-blue-600" />}
                    <span className={roleFilter === "Premium Customer" ? "text-blue-600 font-medium" : ""}>Premium Customer</span>
                  </button>
                  <button
                    onClick={() => {
                      setRoleFilter("VIP Customer");
                      setShowRoleFilter(false);
                      setCurrentPage(1);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    {roleFilter === "VIP Customer" && <Check size={16} className="text-blue-600" />}
                    <span className={roleFilter === "VIP Customer" ? "text-blue-600 font-medium" : ""}>VIP Customer</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
              <th
                className="p-4 font-medium cursor-pointer"
                onClick={() => requestSort("name")}
              >
                <div className="flex items-center gap-1">
                  <span>User</span>
                  {sortConfig?.key === "name" && (
                    sortConfig.direction === "asc" ? (
                      <ChevronUp size={16} className="text-blue-600" />
                    ) : (
                      <ChevronDown size={16} className="text-blue-600" />
                    )
                  )}
                </div>
              </th>
              <th className="p-4 font-medium hidden md:table-cell">
                <div className="flex items-center gap-1">
                  <Mail size={16} className="text-gray-400" />
                  <span>Email</span>
                </div>
              </th>
              <th className="p-4 font-medium hidden sm:table-cell">
                <div className="flex items-center gap-1">
                  <Phone size={16} className="text-gray-400" />
                  <span>Phone</span>
                </div>
              </th>
              <th className="p-4 font-medium hidden lg:table-cell">
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-gray-400" />
                  <span>Location</span>
                </div>
              </th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  className="hover:bg-blue-50 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium border-2 border-blue-200 shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 md:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="text-gray-700">{user.email}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-gray-700">{user.phone}</p>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div>
                      <p className="text-gray-700">{user.place}</p>
                      <p className="text-sm text-gray-500">
                        {user.district}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'Customer')}`}>
                      {user.role || 'Customer'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${user.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                    >
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`}></span>
                        {user.status}
                      </span>
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSelectedUser(user);
                          setShowViewModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => confirmDelete(user)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <UserDetails
              customer={selectedUser}
              onClose={() => setShowViewModal(false)}
              onEdit={() => {
                setShowViewModal(false);
                handleEdit(selectedUser);
              }}
            />
          </motion.div>
        </div>
      )}

      {/* User Form Modal */}
      <UserForm
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
          setSelectedUser(null);
        }}
        onConfirm={handleSoftDelete}
        customerName={selectedUser?.name || ""}
      />
    </div>
  )
};

export default React.memo(UserTable);
