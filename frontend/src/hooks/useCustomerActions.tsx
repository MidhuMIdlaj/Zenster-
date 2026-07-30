import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  ClientListApi, 
  UpdateClientStatusApi, 
  getClientById, 
  ClientApi, 
  UpdateClientApi,
  softDeleteClientApi
} from '../api/admin/Client';
import { formatDateForInput } from '../utils/dataFormat';
import { Customer } from '../types/dashboard';
import { FormData } from '../types/dashboard';

export const useCustomerActions = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: "",
    email: "",
    ClientName: "",
    attendedDate: "",
    contactNumber: "",
    address: "",
    productName: "",
    quantity: "",
    brand: "",
    model: "",
    warrantyDate: "",
    guaranteeDate: "",
    status: "active",
    lastLogin: "",
  });

  // Fetch all customers
  const fetchCustomers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setLoading(true);
      const response = await ClientListApi(); 
      const responseData = response?.data;
      
      if (response && responseData && Array.isArray(responseData.clients)) {
        const mappedClients = responseData.clients
          .filter((client: { isDeleted: boolean }) => !client.isDeleted)
          .map((client: { 
            id: string; 
            clientName: string; 
            email: string; 
            contactNumber: string; 
            address?: string; 
            status: string; 
            attendedDate: string; 
            productName?: string; 
            quantity?: string; 
            brand?: string; 
            model?: string; 
            warrantyDate?: string; 
            guaranteeDate?: string; 
            isDeleted: boolean;
            lastLogin?: string;
          }) => ({
            id: client.id,
            name: client.clientName,
            email: client.email,
            phone: client.contactNumber,
            place: client.address?.split(',')[0]?.trim() || 'N/A',
            district: client.address?.split(',')[1]?.trim() || 'N/A',
            status: client.status as "active" | "inactive",
            attendanceData: client.attendedDate,
            address: client.address || '',
            productName: client.productName || "",
            quantity: client.quantity || "",
            brand: client.brand || "",
            model: client.model || "",
            warrantyDate: client.warrantyDate || "",
            guaranteeDate: client.guaranteeDate || "",
            lastLogin: client.lastLogin || ""
          }));
        setCustomers(mappedClients);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Toggle customer status
  const toggleStatus = async (id: string) => {
    try {
      const customerToUpdate = customers.find(customer => customer.id === id);
      if (!customerToUpdate) return;

      const newStatus = customerToUpdate.status === "active" ? "inactive" : "active";
      await UpdateClientStatusApi(id, newStatus);
      
      setCustomers(customers.map(customer =>
        customer.id === id ? { ...customer, status: newStatus as "active" | "inactive" } : customer
      ));
      
      toast.success(`Customer status changed to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update customer status");
    }
  };

  // Handle edit customer
  const handleEdit = async (customer: Customer) => {
    try {
      setLoading(true);
      const clientDetails = await getClientById(customer.id);
      
      if (clientDetails) {
        setFormData({
          id: customer.id,
          email: customer.email,
          ClientName: customer.name,
          attendedDate: formatDateForInput(customer.attendanceData),
          contactNumber: customer.phone,
          address: `${customer.place}, ${customer.district}`,
          productName: customer.productName || "",
          quantity: customer.quantity || "",
          brand: customer.brand || "",
          model: customer.model || "",
          warrantyDate: formatDateForInput(customer.warrantyDate),
          guaranteeDate: formatDateForInput(customer.guaranteeDate),
          status: customer.status,
          lastLogin: customer.lastLogin || ""
        });
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

  // Handle form submission (create/update)
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
        productName: data.productName,
        quantity: data.quantity,
        brand: data.brand,
        model: data.model,
        warrantyDate: data.warrantyDate,
        guaranteeDate: data.guaranteeDate,
        lastLogin: new Date().toISOString()
      };
      
      if (data.id) {
        await UpdateClientApi(data.id, clientData);
        toast.success('Client updated successfully');
      } else {
        await ClientApi(clientData);
        toast.success('Client added successfully');
      }
      
      // Refresh the client list
      await fetchCustomers();
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error(`Failed to ${data.id ? 'update' : 'add'} client`);
    }
  };

  // Handle soft delete
  const handleSoftDelete = async (id: string) => {
    try {
      await softDeleteClientApi(id);
      
      setCustomers(customers.map(customer => 
        customer.id === id 
          ? { ...customer, status: "inactive" } 
          : customer
      ));
      
      toast.success("Customer has been deactivated");
    } catch (error) {
      console.error("Soft delete failed:", error);
      toast.error("Failed to deactivate customer");
    }
  };

  return {
    customers,
    loading,
    isRefreshing,
    formData,
    setFormData,
    fetchCustomers,
    toggleStatus,
    handleEdit,
    handleSubmit,
    handleSoftDelete
  };
};