import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { ComplaintFormData, Mechanic } from '../../../../types/complaint';



interface ComplaintFormStep1Props {
  formData: ComplaintFormData;
  mechanics: Mechanic[];
  coordinators?: { email: string; name?: string }[]; 
  customerEmails?: { email: string; name?: string }[];
  isSubmitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleNextStep?: () => void;
  handleSubmit?: (e: React.FormEvent) => void;
  resetForm: () => void;
  onClose: () => void;
  isEditMode: boolean;
}

const ComplaintFormStep1: React.FC<ComplaintFormStep1Props> = ({
  formData,
  customerEmails = [],
  isSubmitting,
  submitSuccess,
  submitError,
  handleInputChange,
  handleNextStep,
  handleSubmit,
  onClose,
  isEditMode
}) => {

  const [showCustomerEmailDropdown, setShowCustomerEmailDropdown] = useState(false);
  const customerEmailInputRef = useRef<HTMLInputElement>(null);
  const customerEmailDropdownRef = useRef<HTMLDivElement>(null);
  const [contactNumberError, setContactNumberError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  

  const filteredCustomerEmails = formData.customerEmail.trim() === '' 
    ? customerEmails 
    : customerEmails.filter(user =>
        user.email.toLowerCase().includes(formData.customerEmail.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(formData.customerEmail.toLowerCase()))
      );

  const handleCustomerEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(prev => ({ ...prev, customerEmail: true }));
    handleInputChange(e);
    setShowCustomerEmailDropdown(true);
  };

  const handleCustomerEmailSelect = (email: string) => {
    const event = {
      target: {
        name: 'customerEmail',
        value: email
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(event);
    setTouched(prev => ({ ...prev, customerEmail: true }));
    setShowCustomerEmailDropdown(false);
  }

  const handleValidatedInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
    handleInputChange(e);
  };

  const handleActionClick = () => {
    setSubmitAttempted(true);
    if (isEditMode) {
      return;
    }
    handleNextStep?.();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerEmailDropdownRef.current && !customerEmailDropdownRef.current.contains(event.target as Node)) {
        if (customerEmailInputRef.current && !customerEmailInputRef.current.contains(event.target as Node)) {
          setShowCustomerEmailDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

useEffect(() => {
  const contactNumber = formData.contactNumber ?? "";
  if (contactNumber === "") {
    setContactNumberError("Contact number is required.");
  } else if (!/^\d{10}$/.test(contactNumber)) {
    setContactNumberError("Contact number must be exactly 10 digits and numeric.");
  } else {
    setContactNumberError("");
  }
}, [formData.contactNumber,]);
useEffect(() => {
  if (!formData.description || formData.description.trim() === "") {
    setDescriptionError("Description is required.");
  } else if (formData.description.length < 10) {
    setDescriptionError("Description must be at least 10 characters.");
  } else if (formData.description.length > 500) {
    setDescriptionError("Description cannot exceed 500 characters.");
  } else {
    setDescriptionError("");
  }
}, [formData.description]);



  return (
    <form onSubmit={isEditMode ? handleSubmit : undefined}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Customer Email Field */}
        <div className="relative">
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={customerEmailInputRef}
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleCustomerEmailChange}
              required
              placeholder="Search customer email"
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoComplete="off"
              onFocus={() => setShowCustomerEmailDropdown(true)}
            />
            <button
              type="button"
              onClick={() => setShowCustomerEmailDropdown(!showCustomerEmailDropdown)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showCustomerEmailDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {showCustomerEmailDropdown && (
            <div 
              ref={customerEmailDropdownRef}
              className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto"
            >
              {filteredCustomerEmails.length > 0 ? (
                filteredCustomerEmails.map((user, idx) => (
                  <div
                    key={`customer-${idx}`}
                    onClick={() => handleCustomerEmailSelect(user.email)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 truncate">{user.email}</div>
                      {user.name && (
                        <div className="text-xs text-gray-500 truncate">{user.name}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  No matching emails found
                </div>
              )}
            </div>
          )}
          
          {customerEmails.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {customerEmails.length} customer emails available
            </p>
          )}
        </div>
        
        {/* Contact Number Field */}
        <div>
          <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number *
          </label>
          <input
            type="text"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber ?? ""}
            onChange={handleValidatedInputChange}
            required
            maxLength={10}
            placeholder="Phone number"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {(touched.contactNumber || submitAttempted) && contactNumberError && (
          <span className="text-xs text-red-600">{contactNumberError}</span>
          )}
        </div>
      </div>
      
      {/* Complaint Description */}
          <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Complaint Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleValidatedInputChange}
            required
            rows={4}
            placeholder="Describe the complaint..."
            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${descriptionError ? "border-red-400" : "border-gray-300"}`}
          ></textarea>
          {(touched.description || submitAttempted) && descriptionError && (
            <span className="text-xs text-red-600">{descriptionError}</span>
          )}
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {isEditMode && (
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Submission Status Messages */}
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {submitError}
        </div>
      )}
      
      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
          Complaint {isEditMode ? "updated" : "added"} successfully!
        </div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        
        <motion.button
          type={isEditMode ? "submit" : "button"}
          onClick={handleActionClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-colors ${
            isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : isEditMode ? (
            "Save Changes"
          ) : (
            "Next Step"
          )}
        </motion.button>
      </div>
    </form>
  );
};

export default ComplaintFormStep1;
