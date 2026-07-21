// Validation utility functions for customer form

export const validateEmail = (email: string): string | null => {
    if (!email) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email";
    }
    return null;
  };
  
  export const validateName = (name: string): string | null => {
    if (!name) {
      return "Name is required";
    }
    if (name.length < 2) {
      return "Name must be at least 2 characters";
    }
    return null;
  };
  
  export const validatePhone = (phone: string): string | null => {
    if (!phone) {
      return "Phone number is required";
    }
    if (!/^[\d\+\- ]{8,15}$/.test(phone)) {
      return "Please enter a valid phone number (8-15 digits)";
    }
    return null;
  };
  
  export const validateAddress = (address: string): string | null => {
    if (!address) {
      return "Address is required";
    }
    if (address.length < 5) {
      return "Address must be at least 5 characters";
    }
    return null;
  };
  
  export const validateDate = (date: string, allowFuture = false): string | null => {
    if (!date) {
      return "Date is required";
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    
    // Clear time part for comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (!allowFuture && selectedDate > today) {
      return "Date cannot be in the future";
    }
    
    return null;
  };
  
  export const validateQuantity = (quantity: string): string | null => {
    if (!quantity) {
      return "Quantity is required";
    }
    
    const numValue = Number(quantity);
    
    if (isNaN(numValue)) {
      return "Quantity must be a number";
    }
    
    if (numValue < 1) {
      return "Quantity must be at least 1";
    }
    
    return null;
  };
  
  // Validate all fields in step 1 (personal details)
  export const validateStep1 = (formData: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const nameError = validateName(formData.ClientName);
    if (nameError) errors.ClientName = nameError;
    
    const attendedDateError = validateDate(formData.attendedDate);
    if (attendedDateError) errors.attendedDate = attendedDateError;
    
    const phoneError = validatePhone(formData.contactNumber);
    if (phoneError) errors.contactNumber = phoneError;
    
    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;
    
    return errors;
  };
  
export const validateStep2 = (formData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  const product = formData.products?.[0] || {};

  const isEditMode = Boolean(formData.id);

  if (!product.productName) {
    errors['products[0].productName'] = "Product name is required";
  } else if (product.productName.length < 2) {
    errors['products[0].productName'] = "Product name must be at least 2 characters";
  }

  const quantityError = validateQuantity(product.quantity);
  if (quantityError) errors['products[0].quantity'] = quantityError;

  if (!product.brand) {
    errors['products[0].brand'] = "Brand is required";
  } else if (product.brand.length < 2) {
    errors['products[0].brand'] = "Brand must be at least 2 characters";
  }

  if (!product.model) {
    errors['products[0].model'] = "Model is required";
  } else if (product.model.length < 2) {
    errors['products[0].model'] = "Model must be at least 2 characters";
  }

  // Conditionally validate warrantyDate:
  if (!product.warrantyDate) {
    errors['products[0].warrantyDate'] = "Warranty date is required";
  } else if (!isEditMode && new Date(product.warrantyDate) < new Date()) {
    // For add mode, warrantyDate must be in the future
    errors['products[0].warrantyDate'] = "Warranty date should be in the future";
  }

  // Conditionally validate guaranteeDate:
  if (!product.guaranteeDate) {
    errors['products[0].guaranteeDate'] = "Guarantee date is required";
  } else if (!isEditMode && new Date(product.guaranteeDate) < new Date()) {
    // For add mode, guaranteeDate must be in the future
    errors['products[0].guaranteeDate'] = "Guarantee date should be in the future";
  }

  // Validate guaranteeDate > warrantyDate regardless of mode
  if (product.warrantyDate && product.guaranteeDate) {
    if (new Date(product.guaranteeDate) <= new Date(product.warrantyDate)) {
      errors['products[0].guaranteeDate'] = "Guarantee date must be after warranty date";
    }
  }

  return errors;
};
