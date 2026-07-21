import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ChevronLeft, ChevronRight } from "lucide-react";

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
  role?: string;
}

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData: FormData;
}

// Product types
const PRODUCT_TYPES = ['Battery', 'Solar', 'Inverter'];

// Reserved usernames
const RESERVED_USERNAMES = ['admin', 'root', 'administrator', 'superuser', 'system', 'guest'];

// Validation Regex Patterns
const usernameRegex = /^[a-z0-9_]+$/;
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const contactNumberRegex = /^[6-9]\d{9}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Validation functions
const validateUsername = (username: string): string | null => {
  const trimmed = username.trim();
  
  if (!trimmed) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
  if (trimmed.length > 20) return "Username must not exceed 20 characters";
  if (!usernameRegex.test(trimmed)) return "Username can only contain lowercase letters, numbers, and underscores";
  if (trimmed.startsWith('_') || trimmed.endsWith('_')) return "Username cannot start or end with underscore";
  if (RESERVED_USERNAMES.includes(trimmed.toLowerCase())) return "This username is reserved and cannot be used";
  
  return null;
};

const validateEmail = (email: string): string | null => {
  const trimmed = email.trim().toLowerCase();
  
  if (!trimmed) return "Email is required";
  if (trimmed.length > 150) return "Email must not exceed 150 characters";
  if (!emailRegex.test(trimmed)) return "Email format is invalid (e.g., user@example.com)";
  
  return null;
};

const validateDate = (date: string, fieldName: string, disallowFuture: boolean = false, disallowToday: boolean = false): string | null => {
  if (!date) return `${fieldName} is required`;
  if (!dateRegex.test(date)) return `${fieldName} must be in YYYY-MM-DD format`;
  
  // Parse YYYY-MM-DD as local date, not UTC
  const [year, month, day] = date.split('-').map(Number);
  const inputDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(inputDate.getTime())) return `${fieldName} is not a valid date`;
  
  if (disallowFuture && inputDate > today) {
    return `${fieldName} cannot be a future date`;
  }
  
  if (disallowToday && inputDate.getTime() === today.getTime()) {
    return `${fieldName} cannot be today's date`;
  }
  
  return null;
};

const validateContactNumber = (contact: string): string | null => {
  const trimmed = contact.trim();
  
  if (!trimmed) return "Contact number is required";
  if (!/^\d+$/.test(trimmed)) return "Contact number must contain only digits";
  if (trimmed.length !== 10) return "Contact number must be exactly 10 digits";
  if (/^0{10}$/.test(trimmed)) return "Contact number cannot be all zeros";
  if (!contactNumberRegex.test(trimmed)) return "Contact number must start with 6, 7, 8, or 9";
  
  return null;
};

const validateAddress = (address: string): string | null => {
  const trimmed = address.trim();
  
  if (!trimmed) return "Address is required";
  if (trimmed.length < 10) return "Address must be at least 10 characters";
  if (trimmed.length > 200) return "Address must not exceed 200 characters";
  
  return null;
};

const validateStep1 = (data: FormData) => {
  const errors: Record<string, string> = {};

  const usernameError = validateUsername(data.ClientName);
  if (usernameError) errors.ClientName = usernameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const dateError = validateDate(data.attendedDate, "Attended date", true);
  if (dateError) errors.attendedDate = dateError;

  const contactError = validateContactNumber(data.contactNumber);
  if (contactError) errors.contactNumber = contactError;

  const addressError = validateAddress(data.address);
  if (addressError) errors.address = addressError;

  return errors;
};

const validateStep2 = (data: FormData) => {
  const errors: Record<string, string> = {};
  
  data.products.forEach((product, index) => {
    if (!product.productName?.trim()) {
      errors[`products[${index}].productName`] = "Product type is required";
    }
    
    if (!product.quantity) {
      errors[`products[${index}].quantity`] = "Quantity is required";
    } else {
      const qty = parseInt(product.quantity);
      if (qty < 1) {
        errors[`products[${index}].quantity`] = "Quantity must be at least 1";
      } else if (qty > 10) {
        errors[`products[${index}].quantity`] = "Quantity cannot exceed 10";
      }
    }
    
    if (!product.brand?.trim()) {
      errors[`products[${index}].brand`] = "Brand is required";
    } else if (product.brand.trim().length < 2) {
      errors[`products[${index}].brand`] = "Brand must be at least 2 characters";
    } else if (product.brand.trim().length > 30) {
      errors[`products[${index}].brand`] = "Brand must not exceed 30 characters";
    }
    
    if (!product.model?.trim()) {
      errors[`products[${index}].model`] = "Model is required";
    } else if (product.model.trim().length < 2) {
      errors[`products[${index}].model`] = "Model must be at least 2 characters";
    } else if (product.model.trim().length > 30) {
      errors[`products[${index}].model`] = "Model must not exceed 30 characters";
    }
    
    const warrantyError = validateDate(product.warrantyDate, "Warranty date", false, false);
    if (warrantyError) {
      errors[`products[${index}].warrantyDate`] = warrantyError;
    }
    
    const guaranteeError = validateDate(product.guaranteeDate, "Guarantee date", false, false);
    if (guaranteeError) {
      errors[`products[${index}].guaranteeDate`] = guaranteeError;
    }
  });
  
  return errors;
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    ...initialData,
    products: initialData.products?.length ? initialData.products : [{
      productName: '',
      quantity: '',
      brand: '',
      model: '',
      warrantyDate: '',
      guaranteeDate: ''
    }]
  });
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const visibleErrors = useMemo(() => {
    const allErrors = formStep === 1 
      ? validateStep1(formData)
      : validateStep2(formData);
    return Object.fromEntries(
      Object.entries(allErrors).filter(([key]) => touched[key])
    );
  }, [formData, formStep, touched]);

  const isCurrentStepValid = useMemo(() => {
    if (formStep === 1) {
      const errors = validateStep1(formData);
      return Object.keys(errors).length === 0;
    } else {
      const errors = validateStep2(formData);
      return Object.keys(errors).length === 0;
    }
  }, [formData, formStep]);

  // Only reset form when modal opens, not when initialData changes
  // This prevents the form from resetting when parent re-renders
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setFormStep(1);
      setTouched({});
    }
  }, [isOpen]); // Only depend on isOpen, not initialData

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === "contactNumber") {
      const filteredValue = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, contactNumber: filteredValue }));
      return;
    }

    if (name === "email") {
      setFormData(prev => ({ ...prev, email: value.trim().toLowerCase() }));
      return;
    }

    if (name === "ClientName") {
      const filteredValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
      setFormData(prev => ({ ...prev, ClientName: filteredValue }));
      return;
    }

    const productFieldMatch = name.match(/products\[(\d+)\]\.(\w+)/);
    if (productFieldMatch) {
      const [_, indexStr, field] = productFieldMatch;
      const index = parseInt(indexStr);
      handleProductChange(index, field as keyof Product, value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    setTouched(prev => ({ ...prev, [`products[${index}].${field}`]: true }));
    setFormData(prev => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value
      };
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  const handleNextStep = () => {
    const step1Fields = ['email', 'ClientName', 'attendedDate', 'contactNumber', 'address'];
    const newTouched = { ...touched };
    step1Fields.forEach(field => { 
      newTouched[field] = true; 
    });
    setTouched(newTouched);
    
    const errors = validateStep1(formData);
    if (Object.keys(errors).length === 0) {
      setFormStep(2);
    }
  };

  const handleFinalSubmit = async () => {
    const allFields = [
      'email', 'ClientName', 'attendedDate', 'contactNumber', 'address',
      ...formData.products.flatMap((_, i) => [
        `products[${i}].productName`,
        `products[${i}].quantity`,
        `products[${i}].brand`,
        `products[${i}].model`,
        `products[${i}].warrantyDate`,
        `products[${i}].guaranteeDate`
      ])
    ];
    const newTouched = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(newTouched);

    const step1Errors = validateStep1(formData);
    const step2Errors = validateStep2(formData);
    const allErrors = { ...step1Errors, ...step2Errors };
    if (Object.keys(allErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      resetForm();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    onClose();
    setFormStep(1);
    setTouched({});
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: "spring", duration: 0.5 } 
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.95, 
      transition: { duration: 0.3 } 
    }
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <motion.div
          variants={modalVariants}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl p-6 flex justify-between items-center z-10">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              {formData.id ? "Edit Client" : formStep === 1 ? "User Information" : "Product Details"}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 mx-2 ${
                  formStep === 2 ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  formStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {formStep === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="off"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors.email ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="client@example.com"
                        maxLength={150}
                      />
                      {visibleErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="ClientName">
                        Client Name
                      </label>
                      <input
                        type="text"
                        id="ClientName"
                        name="ClientName"  
                        value={formData.ClientName}  
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors.ClientName ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="john_doe"
                        maxLength={20}
                      />
                      {visibleErrors.ClientName && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors.ClientName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="attendedDate">
                        Attended Date
                      </label>
                      <input
                        type="date"
                        id="attendedDate"
                        name="attendedDate"
                        value={formData.attendedDate}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors.attendedDate ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      {visibleErrors.attendedDate && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors.attendedDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="contactNumber">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        id="contactNumber"
                        name="contactNumber"
                        autoComplete="off"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors.contactNumber ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                      {visibleErrors.contactNumber && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors.contactNumber}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="address">
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors.address ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="123 Main St, City, Country"
                        maxLength={200}
                      />
                      {visibleErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors.address}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="productName">
                        Product Name
                      </label>
                      <select
                        id="productName"
                        name="products[0].productName"
                        value={formData.products[0].productName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].productName`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                      >
                        <option value="">Select Product Type</option>
                        {PRODUCT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {visibleErrors[`products[0].productName`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].productName`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="quantity">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="products[0].quantity"
                        value={formData.products[0].quantity}
                        onChange={handleInputChange}
                        min="1"
                        max="10"
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].quantity`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="1-10"
                      />
                      {visibleErrors[`products[0].quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].quantity`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="brand">
                        Brand
                      </label>
                      <input
                        type="text"
                        id="brand"
                        name="products[0].brand"
                        value={formData.products[0].brand}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].brand`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="Brand Name"
                        maxLength={30}
                      />
                      {visibleErrors[`products[0].brand`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].brand`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="model">
                        Model
                      </label>
                      <input
                        type="text"
                        id="model"
                        name="products[0].model"
                        value={formData.products[0].model}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].model`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="Model Number"
                        maxLength={30}
                      />
                      {visibleErrors[`products[0].model`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].model`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="warrantyDate">
                        Warranty Date
                      </label>
                      <input
                        type="date"
                        id="warrantyDate"
                        name="products[0].warrantyDate"
                        value={formData.products[0].warrantyDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].warrantyDate`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      {visibleErrors[`products[0].warrantyDate`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].warrantyDate`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="guaranteeDate">
                        Guarantee Date
                      </label>
                      <input
                        type="date"
                        id="guaranteeDate"
                        name="products[0].guaranteeDate"
                        value={formData.products[0].guaranteeDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                          visibleErrors[`products[0].guaranteeDate`] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      {visibleErrors[`products[0].guaranteeDate`] && (
                        <p className="mt-1 text-sm text-red-600">{visibleErrors[`products[0].guaranteeDate`]}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {formStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {formStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isCurrentStepValid}
                    className={`flex items-center px-4 py-2.5 rounded-lg ${
                      isCurrentStepValid
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <span>Continue</span>
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={!isCurrentStepValid || isSubmitting}
                    className={`px-5 py-2.5 rounded-lg shadow-md ${
                      isCurrentStepValid && !isSubmitting
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? "Processing..." : formData.id ? "Update" : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerForm;
