// CustomerDetails.tsx
import React from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Package,
  Layers,
  Tag,
  Smartphone,
  Shield,
  Clock as ClockIcon,
} from "lucide-react";
import { User as Customer } from "../../../../pages/coordinator/userManagement";

interface CustomerDetailsProps {
  customer: Customer
  onClose: () => void;
  onEdit: () => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  onClose,
  onEdit,
}) => {
  const primaryProduct = customer.products?.[0];
  const productName = primaryProduct?.productName || customer.productName;
  const quantity = primaryProduct?.quantity || customer.quantity;
  const brand = primaryProduct?.brand || customer.brand;
  const model = primaryProduct?.model || customer.model;
  const warrantyDate = primaryProduct?.warrantyDate || customer.warrantyDate;
  const guaranteeDate = primaryProduct?.guaranteeDate || customer.guaranteeDate;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">
          Customer Details
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            Personal Information
          </h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Name</div>
                <div className="text-gray-800">{customer.name}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="text-gray-800">{customer.email}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Phone</div>
                <div className="text-gray-800">{customer.phone}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Address</div>
                <div className="text-gray-800">
                  {customer.place}, {customer.district}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-blue-600" size={20} />
            Product Information
          </h4>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Product Name</div>
                <div className="text-gray-800">{productName || "N/A"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Layers className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Quantity</div>
                <div className="text-gray-800">{quantity || "N/A"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Tag className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Brand</div>
                <div className="text-gray-800">{brand || "N/A"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Smartphone className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Model</div>
                <div className="text-gray-800">{model || "N/A"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Shield className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Warranty Date</div>
                <div className="text-gray-800">
                  {warrantyDate ? new Date(warrantyDate).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-500">Guarantee Date</div>
                <div className="text-gray-800">
                  {guaranteeDate ? new Date(guaranteeDate).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={onEdit}
          className="px-4 py-2 flex items-center gap-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Edit size={16} />
          <span>Edit</span>
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CustomerDetails;
