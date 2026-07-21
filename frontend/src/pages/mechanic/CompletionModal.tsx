import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  ImageIcon, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Camera,
  Trash2,
  DollarSign,
  QrCode,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

// ConfirmationDialog Component
type DialogType = 'danger' | 'success' | 'info';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-100';
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
      default:
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            
            {/* Dialog */}
            <motion.div
              className="relative w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Content */}
                <div className="p-8">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full border-2 ${getIconBackground()}`}>
                      {getIcon()}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {title}
                    </h3>
                  </div>
                  
                  {/* Message */}
                  <div className="text-center mb-8">
                    <p className="text-gray-600 leading-relaxed">
                      {message}
                    </p>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:ring-4 focus:ring-gray-100 focus:outline-none transition-all duration-200"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={handleConfirm}
                      className={`flex-1 px-6 py-3 text-sm font-medium text-white rounded-xl focus:ring-4 focus:outline-none transition-all duration-200 shadow-lg ${getConfirmButtonStyles()}`}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// TaskCompletionModal Component
interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompletionData) => Promise<void>;
  taskTitle: string;
  customerName: string;
  isUnderWarranty?: boolean;
  isLoading?: boolean;
}

interface CompletionData {
  description: string;
  photos: File[];
  amount: number;
  paymentStatus: string;
  paymentMothod?: string | null;
  isUnderWarranty?: boolean;
}

const TaskCompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
  customerName,
  isUnderWarranty = false,
  isLoading = false
}) => {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveScreenshot, setDragActiveScreenshot] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; photos?: string; paymentScreenshot?: string }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [serviceAmount, setServiceAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr' | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photos: 'Only image files are allowed' }));
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photos: 'File size should be less than 5MB' }));
        return false;
      }
      return true;
    });

    const totalFiles = photos.length + newFiles.length;
    if (totalFiles > 5) {
      setErrors(prev => ({ ...prev, photos: 'Maximum 5 photos allowed' }));
      return;
    }
    setPhotos(prev => [...prev, ...newFiles]);
    setErrors(prev => ({ ...prev, photos: undefined }));
  };

  const handleScreenshotChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'Only image files are allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, paymentScreenshot: 'File size should be less than 5MB' }));
      return;
    }
    setPaymentScreenshot(file);
    setErrors(prev => ({ ...prev, paymentScreenshot: undefined }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleScreenshotDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveScreenshot(true);
    } else if (e.type === 'dragleave') {
      setDragActiveScreenshot(false);
    }
  };

  const handleScreenshotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveScreenshot(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleScreenshotChange(e.dataTransfer.files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeScreenshot = () => {
    setPaymentScreenshot(null);
    setErrors(prev => ({ ...prev, paymentScreenshot: undefined }));
  };

  const validateForm = () => {
    const newErrors: { description?: string; photos?: string; paymentScreenshot?: string } = {};
    
    if (!description.trim()) {
      newErrors.description = 'Work completion description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description should be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePayment = () => {
    const newErrors: { description?: string; photos?: string; paymentScreenshot?: string } = {};
    
    if (!serviceAmount || isNaN(Number(serviceAmount)) || Number(serviceAmount) <= 0) {
      setPaymentError('Please enter a valid service amount');
      return false;
    }
    if (!paymentMethod) {
      setPaymentError('Please select a payment method');
      return false;
    }
    if (!paymentScreenshot) {
      newErrors.paymentScreenshot = 'Payment screenshot is required';
      setErrors(prev => ({ ...prev, ...newErrors }));
      setPaymentError('Please upload a payment screenshot');
      return false;
    }
    setPaymentError('');
    setErrors(prev => ({ ...prev, paymentScreenshot: undefined }));
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (isUnderWarranty) {
      await onSubmit({
        description: description.trim(),
        photos,
        amount: 0,
        paymentStatus: 'not_required',
        paymentMothod: 'warranty',
        isUnderWarranty: true
      });
      setDescription('');
      setPhotos([]);
      setErrors({});
      onClose();
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) return;
    
    // Set up confirmation dialog
    setDialogConfig({
      title: "Confirm Payment",
      message: `Confirm payment of ${serviceAmount} INR to a.hishamkk@oksbi for task "${taskTitle}"?`,
      type: 'info',
      onConfirm: async () => {
        try {
          await onSubmit({
            description: description.trim(),
            photos,
            amount: Number(serviceAmount),
            paymentStatus: 'Completed',
            paymentMothod: paymentMethod
          });
          
          setDescription('');
          setPhotos([]);
          setPaymentScreenshot(null);
          setErrors({});
          setServiceAmount('');
          setPaymentMethod(null);
          setShowPaymentModal(false);
          setShowConfirmDialog(false);
          onClose();
        } catch (error) {
          console.error('Error submitting completion data:', error);
          setPaymentError('Failed to process payment');
          setShowConfirmDialog(false);
        }
      }
    });
    
    setShowConfirmDialog(true);
  };

  const handleClose = () => {
    setDescription('');
    setPhotos([]);
    setPaymentScreenshot(null);
    setErrors({});
    setServiceAmount('');
    setPaymentMethod(null);
    setShowPaymentModal(false);
    onClose();
  };

  const warrantyBadge = isUnderWarranty
    ? {
        text: 'Warranty Covered',
        description: 'No service charge or payment proof is required for this product.',
        icon: ShieldCheck,
        colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }
    : {
        text: 'Not Under Warranty',
        description: 'A service charge and payment proof will be required before completion.',
        icon: ShieldAlert,
        colorClass: 'border-amber-200 bg-amber-50 text-amber-700'
      };

  const generateQRCodeData = () => {
    const amount = Number(serviceAmount).toFixed(2);
    const qrData = `upi://pay?pa=a.hishamkk@oksbi&pn=Midlaj&am=${amount}&cu=INR&tn=Service%20Payment`;
    return qrData;
  };

  const handleQRCodeClick = () => {
    if (!serviceAmount || isNaN(Number(serviceAmount)) || Number(serviceAmount) <= 0) {
      setPaymentError('Please enter a valid service amount');
      return;
    }
    
    // Set up confirmation dialog for QR code generation
    setDialogConfig({
      title: "Generate QR Code",
      message: `Generate QR code for payment of ${serviceAmount} INR to a.hishamkk@oksbi?`,
      type: 'info',
      onConfirm: () => {
        setPaymentMethod('qr');
        setPaymentError('');
        setShowConfirmDialog(false);
      }
    });
    
    setShowConfirmDialog(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <CheckCircle className="mr-3 text-green-600" size={28} />
                Complete Task
              </h2>
              <div className="space-y-1">
                <p className="text-gray-700 font-medium">{taskTitle}</p>
                <p className="text-sm text-gray-500">Customer: {customerName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${warrantyBadge.colorClass}`}>
            <warrantyBadge.icon className="mt-0.5 flex-shrink-0" size={18} />
            <div>
              <p className="font-semibold">{warrantyBadge.text}</p>
              <p className="text-sm mt-1">{warrantyBadge.description}</p>
            </div>
          </div>

          {/* Work Description Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FileText className="mr-2 text-blue-600" size={16} />
              Work Completion Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              className={`w-full p-4 border-2 rounded-xl transition-all duration-200 resize-none focus:outline-none ${
                errors.description 
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                  : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }`}
              rows={4}
              placeholder="Describe the work completed, any issues found, parts replaced, recommendations for the customer, etc..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          {/* Photo Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Camera className="mr-2 text-green-600" size={16} />
              Before/After Photos
              <span className="ml-2 text-xs text-gray-500 font-normal">(Optional - Max 5 photos, 5MB each)</span>
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : errors.photos 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading || photos.length >= 5}
              />
              
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-full shadow-md">
                    <Upload className="text-gray-400" size={24} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Drop photos here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB each
                  </p>
                </div>
              </div>
            </div>

            {errors.photos && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.photos}
              </p>
            )}
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <ImageIcon className="mr-2 text-purple-600" size={16} />
                Selected Photos ({photos.length}/5)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {photo.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10">
          <div className="flex flex-row gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !description.trim()}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>{isUnderWarranty ? 'Complete Task' : 'Continue to Payment'}</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 flex items-start">
              <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Note:</strong> {isUnderWarranty ? 'This product is under warranty, so no service charge or payment proof is required.' : 'This product is not under warranty, so the payment step will appear after the completion details are submitted.'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <DollarSign className="mr-2 text-green-600" size={24} />
                Process Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Amount *
                </label>
                <div className="relative">
                  <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={serviceAmount}
                    onChange={(e) => {
                      setServiceAmount(e.target.value);
                      setPaymentError('');
                    }}
                    className={`w-full pl-10 p-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      paymentError && !serviceAmount ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="Enter amount (e.g., 100.00)"
                    disabled={isLoading}
                    step="0.01"
                    min="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Payment Method *
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setPaymentError('');
                    }}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    disabled={isLoading}
                  >
                    <DollarSign size={16} />
                    <span>Cash</span>
                  </button>
                  <button
                    onClick={handleQRCodeClick}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                      paymentMethod === 'qr'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    disabled={isLoading || !serviceAmount || isNaN(Number(serviceAmount)) || Number(serviceAmount) <= 0}
                  >
                    <QrCode size={16} />
                    <span>QR Code Scan</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'qr' && serviceAmount && !isNaN(Number(serviceAmount)) && Number(serviceAmount) > 0 && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <QRCodeCanvas
                      value={generateQRCodeData()}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Camera className="mr-2 text-green-600" size={16} />
                  Payment Screenshot *
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Upload proof of payment, max 5MB)</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    dragActiveScreenshot 
                      ? 'border-blue-400 bg-blue-50' 
                      : errors.paymentScreenshot 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                  onDragEnter={handleScreenshotDrag}
                  onDragLeave={handleScreenshotDrag}
                  onDragOver={handleScreenshotDrag}
                  onDrop={handleScreenshotDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleScreenshotChange(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                  />
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-full shadow-md">
                        <Upload className="text-gray-400" size={24} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drop screenshot here or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
                {errors.paymentScreenshot && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.paymentScreenshot}
                  </p>
                )}
              </div>

              {paymentScreenshot && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <ImageIcon className="mr-2 text-purple-600" size={16} />
                    Payment Screenshot Preview
                  </h4>
                  <div className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 max-w-xs">
                      <img
                        src={URL.createObjectURL(paymentScreenshot)}
                        alt="Payment Screenshot"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={removeScreenshot}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {paymentScreenshot.name}
                    </p>
                  </div>
                </div>
              )}

              {paymentError && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {paymentError}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-row gap-3 justify-end sticky bottom-0 bg-white z-10 p-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Confirm Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default TaskCompletionModal;
