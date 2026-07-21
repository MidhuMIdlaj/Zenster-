import React from 'react';
import { motion } from 'framer-motion';
import { Complaint } from '../../types/complaint';

interface ComplaintCardProps {
  complaint: Complaint;
  type: 'pending' | 'active' | 'completed';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ 
  complaint, 
  type, 
  onAccept,
  onReject,
  onComplete
}) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-green-100 text-green-800'
  };

  const statusColors = {
    pending: 'text-amber-600',
    accept: 'text-blue-600',
    accepted: 'text-blue-600',
    processing: 'text-blue-600',
    completed: 'text-green-600',
    reject: 'text-red-600',
    rejected: 'text-red-600'
  };

  const handleAccept = () => {
    if (onAccept) onAccept(complaint._id);
  };

  const handleReject = () => {
    if (onReject) onReject(complaint._id);
  };

  const handleComplete = () => {
    if (onComplete) onComplete(complaint._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800 line-clamp-1">
          {complaint.description || complaint.model || 'Vehicle Complaint'}
        </h3>
        <span className={`text-xs px-2 py-1 rounded ${priorityColors[complaint.priority]}`}>
          {complaint.priority}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div>
          <span className="block text-xs text-gray-400">Customer</span>
          <span className="font-medium">{complaint.customerName || 'Unknown'}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Vehicle</span>
          <span className="font-medium">{complaint.model || 'Unknown'}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Date</span>
          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="block text-xs text-gray-400">Status</span>
          <span className={`font-medium ${statusColors[complaint.workingStatus || 'pending']}`}>
            {complaint.workingStatus || 'pending'}
          </span>
        </div>
      </div>

      {type === 'pending' && (
        <div className="flex justify-end space-x-2">
          <button 
            onClick={handleAccept}
            className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
          <button 
            onClick={handleReject}
            className="px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            Reject
          </button>
        </div>
      )}

      {type === 'active' && (
        <div className="flex justify-end">
          <button 
            onClick={handleComplete}
            className="px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Mark Complete
          </button>
        </div>
      )}

      {type === 'completed' && (
        <div className="text-xs text-gray-500 mt-2">
          Completed on: {new Date(complaint.updatedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
};

export default ComplaintCard;
