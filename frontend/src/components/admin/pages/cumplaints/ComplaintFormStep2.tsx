import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ComplaintFormData, Mechanic } from "../../../../types/complaint";
import { Product } from "../../../../types/dashboard";

export type DateType = Date | string;
interface ComplaintFormStep2Props {
    formData: ComplaintFormData;
    mechanics: Mechanic[];
    isSubmitting: boolean;
    submitSuccess: boolean;
    submitError: string | null;
    handleInputChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => void;
    handleSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
    onClose: () => void;
}

// Helper function to safely get product ID
const getProductId = (product: Product & { _id?: string }, index: number): string => {
    return product.id || product._id || "";
};

const ComplaintFormStep2: React.FC<ComplaintFormStep2Props> = ({
    formData,
    mechanics,
    isSubmitting,
    submitSuccess,
    submitError,
    handleInputChange,
    handleSubmit,
    onBack,
    onClose,
}) => {
    const [selectedProduct, setSelectedProduct] = useState<(Product & { _id?: string, tempId?: string }) | null>(null);
    const [showProductSelect, setShowProductSelect] = useState(true);
    const [normalizedProducts, setNormalizedProducts] = useState<(Product & { _id?: string, tempId?: string })[]>([]);

    const safeMechanics = Array.isArray(mechanics) ? mechanics : [];
    const assignedMechanic = safeMechanics.find(
        (m) => m.mechanicId === (typeof formData.assignedMechanicId === "string" ? formData.assignedMechanicId : "")
    );

    // Normalize products array to ensure all products have a reliable ID
    useEffect(() => {
        if (formData.products && formData.products.length > 0) {
            const products = formData.products.map((product, index) => {
                const normalizedId = getProductId(product, index);
                return {
                    ...product,
                    tempId: normalizedId || `temp-product-${index}`
                };
            });
            
            setNormalizedProducts(products);
        } else {
            setNormalizedProducts([]);
        }
    }, [formData.products]);

    // Handle product selection when selectedProductId changes
    useEffect(() => {
        if (normalizedProducts.length > 0) {
            if (formData.selectedProductId) {
                // Try to find product by selectedProductId
                let product = normalizedProducts.find(p => 
                    p.id === formData.selectedProductId || 
                    p._id === formData.selectedProductId || 
                    p.tempId === formData.selectedProductId
                );
                
                
                if (product) {
                    setSelectedProduct(product);
                    setShowProductSelect(false);
                } else {
                    setShowProductSelect(true);
                }
            } else {
                setShowProductSelect(true);
                setSelectedProduct(null);
            }
        }
    }, [normalizedProducts, formData.selectedProductId]);

   const handleProductSelect = (productId: string) => {
  const product = normalizedProducts.find(p => 
    p.id === productId || p._id === productId || p.tempId === productId
  );
  
  if (product) {
    setSelectedProduct(product);
    setShowProductSelect(false);
    
    const selectedId = product.id || product._id || "";
    handleInputChange({
      target: {
        name: "selectedProductId",
        value: selectedId
      }
    } as React.ChangeEvent<HTMLInputElement>);

    handleInputChange({
      target: {
        name: "productName",
        value: product.productName || product.productName || ""
      }
    } as React.ChangeEvent<HTMLInputElement>);

    handleInputChange({
      target: {
        name: "model",
        value: product.model || ""
      }
    } as React.ChangeEvent<HTMLInputElement>);

    handleInputChange({
      target: {
        name: "warrantyDate",
        value: product.warrantyDate || ""
      }
    } as React.ChangeEvent<HTMLInputElement>);

    handleInputChange({
      target: {
        name: "guaranteeDate",
        value: product.guaranteeDate || ""
      }
    } as React.ChangeEvent<HTMLInputElement>);
  } else {
    console.error("Selected product not found in normalized products array");
  }
};

    const handleChangeProduct = () => {
        setShowProductSelect(true);
        setSelectedProduct(null);
        handleInputChange({
            target: {
                name: "selectedProductId",
                value: ""
            }
        } as React.ChangeEvent<HTMLInputElement>);
    };

    const formatDate = (dateString: DateType | undefined) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) 
                ? 'Invalid date' 
                : date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid date format';
        }
    };

    const safeGetProductValue = (product: any, propertyPath: string, defaultValue: string = 'N/A') => {
        if (!product) return defaultValue;
        
        try {
            const properties = propertyPath.split('.');
            let value = product;
            
            for (const prop of properties) {
                if (value === undefined || value === null) return defaultValue;
                value = value[prop];
            }
            
            return value !== undefined && value !== null && value !== '' ? value : defaultValue;
        } catch (e) {
            console.error(`Error getting product property ${propertyPath}:`, e);
            return defaultValue;
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <p className="text-green-700 font-medium">
                        Please verify complaint details
                    </p>
                </div>

                {!formData.customerName && (
                    <div className="flex items-start mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <AlertTriangle
                            className="text-amber-500 mr-2 flex-shrink-0 mt-0.5"
                            size={16}
                        />
                        <p className="text-amber-700 text-sm">
                            This email is not associated with an existing customer. A new
                            customer will be created.
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                        <p className="text-sm font-medium text-gray-500">Customer Name</p>
                        <p className="text-sm font-medium text-gray-900">{formData.customerName || 'N/A'}</p>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="text-sm font-medium text-gray-900">{formData.status || 'N/A'}</p>
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">{formData.address || 'N/A'}</p>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Contact Details</h4>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900 mt-1">{formData.customerEmail}</p>
                        <p className="text-sm font-medium text-gray-500 mt-3">Phone</p>
                        <p className="text-gray-900">{formData.contactNumber || 'N/A'}</p>
                    </div>

                    {/* Complaint Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Complaint Details</h4>
                        <p className="text-sm font-medium text-gray-500">Description</p>
                        <p className="text-gray-900 mt-1 mb-4">{formData.description}</p>
                        <p className="text-sm font-medium text-gray-500">Assigned Mechanic</p>
                        <p className="text-gray-900 mt-1 mb-4">
                            {assignedMechanic
                                ? `${assignedMechanic.name} (${assignedMechanic.specialization})`
                                : "Not assigned"}
                        </p>
                        <p className="text-sm font-medium text-gray-500">Created By</p>
                        <p className="text-gray-900 mt-1">
                            {formData.CreatedByRole || 'N/A'} ({formData.createdByEmail || 'N/A'})
                        </p>
                    </div>

                    {/* Product Details */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Product Details</h4>
                        
                        {!normalizedProducts || normalizedProducts.length === 0 ? (
                            <p className="text-gray-500">No products available for this customer</p>
                        ) : showProductSelect ? (
                            <div className="space-y-2">
                                <label htmlFor="productSelect" className="block text-sm font-medium text-gray-700">
                                    Select a Product
                                </label>
                           <select
                                id="productSelect"
                                name="productSelect"
                                onChange={(e) => handleProductSelect(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={selectedProduct?.tempId || selectedProduct?.id || selectedProduct?._id || ""}
                            >
                                <option value="">Select a product</option>
                                {normalizedProducts.map((product, index) => {
                                    const productId = product.tempId || product.id || product._id || `product-${index}`;
                                    
                                    return (
                                        <option key={productId} value={productId}>
                                          {product.productName ||
                                          `Product ${index + 1}`}
                                      </option>
                                    );
                                })}
                            </select>
                            </div>
                        ) : selectedProduct ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-medium text-gray-700">Selected Product</h5>
                                    <button
                                        type="button"
                                        onClick={handleChangeProduct}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Change Product
                                    </button>
                                </div>
                                
                               <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Product Name</p>
                                    <p className="text-gray-900">{selectedProduct.productName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Brand</p>
                                    <p className="text-gray-900">{selectedProduct.brand || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Model</p>
                                    <p className="text-gray-900">{selectedProduct.model || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Quantity</p>
                                    <p className="text-gray-900">{selectedProduct.quantity || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Warranty Date</p>
                                    <p className="text-gray-900">{formatDate(selectedProduct.warrantyDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Guarantee Date</p>
                                    <p className="text-gray-900">{formatDate(selectedProduct.guaranteeDate)}</p>
                                </div>
                            </div>

                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Priority Selection */}
            <div className="mb-4">
                <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
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

            {/* Additional Notes */}
            <div className="mb-4">
                <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Additional Notes
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add any additional notes..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.notes || ''}
                ></textarea>
            </div>

            {/* Error/Success Messages */}
            {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                    {submitError}
                </div>
            )}

            {submitSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
                    Complaint added successfully!
                </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between mt-6">
                <motion.button
                    type="button"
                    onClick={onBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                </motion.button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>

                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSubmitting || (!selectedProduct && normalizedProducts.length > 0)}
                        className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                            isSubmitting || (!selectedProduct && normalizedProducts.length > 0)
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                Processing...
                            </div>
                        ) : (
                            "Create Complaint"
                        )}
                    </motion.button>
                </div>
            </div>
        </form>
    );
};

export default ComplaintFormStep2;
