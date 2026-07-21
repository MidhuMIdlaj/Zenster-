import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Hash,
  Clock,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { EmployeeFormData } from "../../../../api/admin/Employee";

interface EmployeeFormProps {
  formData: EmployeeFormData;
  isEditMode: boolean;
  isSubmitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
   handleInputChange: {
    (name: string, value: any): void; 
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void;
  };
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  onClose: () => void;
}

const indianNumberRegex = /^[6-9]\d{9}$/;

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  formData,
  isEditMode,
  isSubmitting,
  submitSuccess,
  submitError,
  handleInputChange,
  handleSubmit,
  resetForm,
}) => {
  // State for form errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        resetForm();
        setTouched({});
        setSubmitted(false);
      }, 2000); 
      
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, resetForm]);

  // Handle field blur to mark as touched
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  // Wrapper for form submit
  const onSubmit = (e: React.FormEvent) => {
    setSubmitted(true);
    setTouched({
      emailId: true,
      employeeName: true,
      joinDate: true,
      contactNumber: true,
      address: true,
      currentSalary: true,
      age: true,
      experience: true,
      previousJob: true,
      position: true,
      fieldOfMechanic: true,
      status: true,
    });
    handleSubmit(e);
  };

  // Helper to determine if error should be shown
  const shouldShowError = (fieldName: string) => {
    return (touched[fieldName as keyof typeof touched] || submitted) && !!errors[fieldName];
  };

 useEffect(() => {
  const curErrors: { [key: string]: string } = {};

  // Email
  if (!formData.emailId) {
    curErrors.emailId = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
    curErrors.emailId = "Invalid email format.";
  } else if (!formData.emailId.includes("@") || !formData.emailId.includes(".")) {
    curErrors.emailId = "Email must contain '@' and '.'.";
  } else if (formData.emailId.length < 8 || formData.emailId.length > 30) {
    curErrors.emailId = "Email length must be 8-30 characters.";
  }

  // Employee Name
  if (!formData.employeeName) {
    curErrors.employeeName = "Employee name is required.";
  } else if (formData.employeeName.length < 5 || formData.employeeName.length > 30) {
    curErrors.employeeName = "Name must be 5-30 characters.";
  }

  // Join Date
  if (!formData.joinDate) {
    curErrors.joinDate = "Join date is required.";
  } else {
    // Parse YYYY-MM-DD as local date, not UTC
    const [year, month, day] = formData.joinDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      curErrors.joinDate = "Join date cannot be in the future.";
    }
  }

  // Contact Number
  if (!formData.contactNumber) {
    curErrors.contactNumber = "Contact number is required.";
  } else if (!/^[6-9]\d{9}$/.test(formData.contactNumber)) {
    curErrors.contactNumber = "Enter a valid 10 digit Indian mobile number starting with 6-9.";
  }

  // Employee Address
  if (!formData.address) {
    curErrors.address = "Address is required.";
  } else if (formData.address.length < 10 || formData.address.length > 150) {
    curErrors.address = "Address must be 10-150 characters.";
  }

  // Current Salary
  if (!formData.currentSalary) {
    curErrors.currentSalary = "Current salary is required.";
  } else if (isNaN(Number(formData.currentSalary)) || Number(formData.currentSalary) <= 0) {
    curErrors.currentSalary = "Enter a valid numeric salary.";
  }

  // Age
  if (!formData.age) {
    curErrors.age = "Age is required.";
  } else if (isNaN(Number(formData.age)) || Number(formData.age) < 19 || Number(formData.age) > 80) {
    curErrors.age = "Enter a valid age (19–80).";
  }

  // Experience
  if (formData.experience === undefined || formData.experience === null || formData.experience === "") {
    curErrors.experience = "Experience is required.";
  } else if (isNaN(Number(formData.experience))) {
    curErrors.experience = "Experience must be numeric.";
  }

  // Previous Job
  if (!formData.previousJob) {
    curErrors.previousJob = "Previous job is required.";
  }

  // Position
  if (!formData.position) {
    curErrors.position = "Position is required.";
  }

  // Status (edit mode)
  if (isEditMode && !formData.status) {
    curErrors.status = "Status is required.";
  }

  // Field of Mechanic
  if (!formData.fieldOfMechanic || formData.fieldOfMechanic.length === 0) {
    curErrors.fieldOfMechanic = "Select at least one field of mechanic.";
  }

  setErrors(curErrors);
}, [formData, isEditMode]);


   
  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="space-y-6">
        {submitSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
            Employee {isEditMode ? "updated" : "added"} successfully!
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            {submitError}
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            Employee Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("emailId")}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${(touched.emailId || submitted) && errors.emailId ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder="employee@company.com"
                />
              </div>
              {(touched.emailId || submitted) && errors.emailId && (
                <span className="text-xs text-red-600">{errors.emailId}</span>
              )}
            </div>

            {/* Employee Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name
              </label>
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleInputChange}
                onBlur={() => handleBlur("employeeName")}
                required
                className={`w-full px-4 py-2 border ${shouldShowError("employeeName") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                placeholder="John Doe"
              />
              {shouldShowError("employeeName") && (
                <span className="text-xs text-red-600">{errors.employeeName}</span>
              )}
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("joinDate")}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${shouldShowError("joinDate") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                />
              </div>
              {shouldShowError("joinDate") && (
                <span className="text-xs text-red-600">{errors.joinDate}</span>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("contactNumber")}
                  required
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-2 border ${shouldShowError("contactNumber") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder="9876543210"
                />
              </div>
              {shouldShowError("contactNumber") && (
                <span className="text-xs text-red-600">{errors.contactNumber}</span>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <div className="relative">
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("position")}
                  required
                  className={`w-full px-3 py-2 border ${shouldShowError("position") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                >
                  <option value="">Select a position</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="coordinator">Coordinator</option>
                </select>
              </div>
              {shouldShowError("position") && (
                <span className="text-xs text-red-600">{errors.position}</span>
              )}
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            <div className={isEditMode ? "" : "md:col-span-2"}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("address")}
                  required
                  className={`w-full pl-10 pr-4 py-2 border ${shouldShowError("address") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder="123 Main St, City, Country"
                />
              </div>
               {shouldShowError("address") && (
                <span className="text-xs text-red-600">{errors.address}</span>
              )}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="text-blue-600" size={20} />
            Professional Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Salary
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="currentSalary"
                  value={formData.currentSalary}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("currentSalary")}
                  required
                  min={0}
                  className={`w-full pl-10 pr-4 py-2 border ${shouldShowError("currentSalary") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder="75000"
                />
              </div>
               {shouldShowError("currentSalary") && (
                <span className="text-xs text-red-600">{errors.currentSalary}</span>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("age")}
                  required
                  min={18}
                  className={`w-full pl-10 pr-4 py-2 border ${shouldShowError("age") ? "border-red-400" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder="30"
                />
              </div>
                 {shouldShowError("age") && (
                <span className="text-xs text-red-600">{errors.age}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous Job
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="previousJob"
                  value={formData.previousJob}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("previousJob")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Senior Mechanic at ABC Motors"
                />
              </div>
               {shouldShowError("previousJob") && (
                <span className="text-xs text-red-600">{errors.previousJob}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("experience")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="5"
                />
              </div>
               {shouldShowError("experience") && (
                <span className="text-xs text-red-600">{errors.experience}</span>
              )}
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Mechanic
              </label>
              
              {/* Selected chips */}
              {formData.fieldOfMechanic?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.fieldOfMechanic.map((field) => (
                    <span 
                      key={field}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {field}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleInputChange(
                            "fieldOfMechanic", 
                            formData.fieldOfMechanic.filter(f => f !== field)
                          );
                        }}
                        className="ml-1.5 inline-flex items-center justify-center w-3 h-3 text-blue-600 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              <div className="relative">
                <select
                  name="fieldOfMechanic"
                  multiple
                  value={formData.fieldOfMechanic}
                  onChange={(e) => {
                    const options = e.target.options;
                    const selectedValues: string[] = [];
                    for (let i = 0; i < options.length; i++) {
                      if (options[i].selected) {
                        selectedValues.push(options[i].value);
                      }
                    }
                    handleInputChange("fieldOfMechanic", selectedValues);
                  }}
                  onBlur={() => handleBlur("fieldOfMechanic")}
                  className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none h-auto min-h-[42px]"
                  size={3}
                >
                  {["Battery", "Invertor", "Solar"].map(option => (
                    <option 
                      key={option} 
                      value={option}
                    >
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
               {shouldShowError("fieldOfMechanic") && (
                <span className="text-xs text-red-600">{errors.fieldOfMechanic}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
            isSubmitting || !isFormValid ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <span>{isEditMode ? "Update" : "Save"}</span>
          )}
        </button>
      </div>
      </div>
    </form>
  );
};

export default EmployeeForm;
