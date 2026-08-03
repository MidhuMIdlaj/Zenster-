import React, { useState, useEffect } from 'react';
import { 
  Clock, MapPin,  User, Calendar, CheckCircle, 
  XCircle, AlertTriangle, Eye, ChevronRight, Star, 
   Wrench, PlayCircle, PauseCircle,
  AlertCircle, 
} from 'lucide-react';
import { 
  getMechanicComplaints, 
  acceptComplaint, 
  rejectComplaint, 
  updateComplaintStatus, 
  completeTask
} from '../../api/cplaint/complaint';
import { useSelector } from 'react-redux';
import { selectEmployeeAuthData } from '../../store/selectors';
import { toast } from 'react-toastify';
import TaskCompletionModal from './CompletionModal';



export type WorkingStatus = 'pending' | 'accept' | 'processing' | 'completed' | 'rejected';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ServiceRequestStatus = 'active' | 'completed' | 'cancelled' | 'on-hold';
export type CreatedByRole = 'admin' | 'technician' | 'customer';
export interface MechanicAssignment {
  mechanicId: string;
  status: 'accept' | 'reject' | 'pending';
  reason?: string | null;
}

export interface CompletionDetails {
  description: string;
  photos: string[];
  completedAt: Date | string;
  completedBy: string;
  paymentStatus?: string;
  paymentMethod?: string;
  amount?: number;
}

export interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
}

export interface TaskData {
  id: string;
  _id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  location: string;
  priority: Priority;
  workingStatus: WorkingStatus;
  status: ServiceRequestStatus;
  assignedDate: string;
  description: string;
  vehicleDetails: VehicleDetails;
  estimatedTime: string;
  serviceType: string;
  notes: string;
  productName: string;
  guaranteeDate: Date | string;
  warrantyDate: Date | string;
  createdBy: string;
  CreatedByRole: CreatedByRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignedMechanicId: MechanicAssignment[];
  rejectionReason?: string;
  completionDetails?: CompletionDetails;
  isDeleted: boolean;
}

type TabType = 'pending' | 'inprogress' | 'completed';

const MechanicTasks: React.FC = () => {
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [mechanicStatus, setMechanicStatus] = useState<'Available' | 'Occupied' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<TaskData['workingStatus']>('pending');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [taskToReject, setTaskToReject] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [taskToComplete, setTaskToComplete] = useState<TaskData | null>(null);
  useEffect(() => {
   const fetchTasks = async () => {
  try {
    setIsLoading(true);
    if (employeeData?.id) {
      console.debug('[UI] fetching mechanic complaints for id:', employeeData.id);
      const data = await getMechanicComplaints(employeeData.id);
      const formattedTasks = data.map((task: any) => {
        // Normalize status values with proper type safety
        const statusMap: Record<string, WorkingStatus> = {
          'progress': 'processing',
          'processing': 'processing',
          'accepted': 'accept',
          'accept': 'accept',
          'completed': 'completed',
          'rejected': 'rejected',
          'pending': 'pending'
        };

        const workingStatus = statusMap[task.workingStatus?.toLowerCase()] || 'pending';

        return {
          id: task.id,
          _id: task._id || task.id,
          title: task.description || task.titel || 'Service Request',
          customerName: task.clientName || task.customerName || 'Customer',
          customerPhone: task.contactNumber || task.customerPhone || '',
          customerEmail: task.customerEmail || '',
          location: task.location || task.address || 'Location not specified',
          priority: (task.priority?.toLowerCase() as Priority) || 'medium',
          workingStatus,
          status: (task.status?.toLowerCase() as ServiceRequestStatus) || 'active',
          assignedDate: task.createdAt || new Date().toISOString(),
          description: task.description || 'No description provided',
          vehicleDetails: {
            make: task.vehicleMake || task.productName || '',
            model: task.model || '',
            year: task.vehicleYear || '',
            licensePlate: task.licensePlate || ''
          },
          estimatedTime: task.estimatedTime || '1-2 hours',
          serviceType: task.serviceType || 'Repair',
          notes: task.notes || '',
          productName: task.productName || '',
          guaranteeDate: task.guaranteeDate || '',
          warrantyDate: task.warrantyDate || '',
          createdBy: task.createdBy || '',
          CreatedByRole: (task.CreatedByRole as CreatedByRole) || 'customer',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          assignedMechanicId: task.assignedMechanics || task.assignedMechanicId || [],
          rejectionReason: task.rejectionReason || '',
          completionDetails: task.completionDetails || undefined,
          isDeleted: task.isDeleted || false
        } as TaskData;
      });

      setTasks(formattedTasks);
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    toast.error('Failed to load tasks');
  } finally {
    setIsLoading(false);
  }
};
    fetchTasks();
  }, [employeeData?.id]);



type TaskAction = 'accept' | 'reject' | 'processing' | 'completed';
type WorkingStatus = 'pending' | 'accept' | 'processing' | 'completed' | 'rejected';

const handleTaskAction = async (taskId: string, action: TaskAction) => {
  try {
    if (action === 'completed') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTaskToComplete(task);
        setShowCompletionModal(true);
      }
      return;
    }
    setActionLoading(taskId);
    const statusMap: Record<TaskAction, WorkingStatus> = {
      'accept': 'accept',
      'reject': 'rejected',
      'processing': 'processing',
      'completed': 'completed'
    };

    const newStatus = statusMap[action];

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, workingStatus: newStatus } : task
      )
    );

    if (!employeeData?.id) throw new Error('Mechanic ID not found');

    let updatedTask;
    if (action === 'accept') {
      updatedTask = await acceptComplaint(taskId, employeeData.id);
    } else if (action === 'reject') {
      updatedTask = await rejectComplaint(taskId, employeeData.id, rejectReason || 'Rejected by mechanic');
    } else if (action === 'processing') {
      updatedTask = await updateComplaintStatus(taskId, action, employeeData.id);
    }

    switch (newStatus) {
      case 'accept':
      case 'processing':
        setActiveTab('inprogress');
        break;
      case 'completed':
      case 'rejected':
        setActiveTab('completed');
        break;
      case 'pending':
        setActiveTab('pending');
        break;
    }

    toast.success(`Task ${action === 'reject' ? 'rejected' : action} successfully`);
  } catch (error) {
    console.error('Error updating task:', error);
    toast.error(`Failed to ${action} task`);
    setTasks(prevTasks => prevTasks);
  } finally {
    setActionLoading(null);
    setShowRejectModal(false);
    setRejectReason('');
    setTaskToReject(null);
  }
};

const handleTaskCompletion = async (completionData: { description: string; photos: File[];  amount: number, paymentStatus : string, paymentMothod ?: string | null, isUnderWarranty?: boolean }) => {
  if (!taskToComplete || !employeeData?.id) return;
  try {
    setActionLoading(taskToComplete.id);
    const formData = new FormData();
    formData.append('taskId', taskToComplete.id);
    formData.append('mechanicId', employeeData.id);
    formData.append('description', completionData.description);
    
    completionData.photos.forEach((photo) => {
      formData.append('photos', photo);
    });

     const result = await completeTask(
      taskToComplete.id,
      employeeData.id,
      completionData.description,
      completionData.paymentStatus,
      completionData.paymentMothod  ?? '',
      completionData.amount,
      completionData.photos,
      Boolean(completionData.isUnderWarranty),
    );
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskToComplete.id 
          ? { ...task, workingStatus: 'completed' }
          : task
      )
    );

    setTimeout(() => setActiveTab('completed'), 500);
    toast.success('Task completed successfully');
    setShowCompletionModal(false);
    setTaskToComplete(null);
    
  } catch (error) {
    console.error('Error completing task:', error);
    toast.error('Failed to complete task');
  } finally {
    setActionLoading(null);
  }
};
  const handleEditStatus = (taskId: string, newStatus: TaskData['workingStatus']) => {
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === taskId 
        ? { ...task, workingStatus: newStatus }
        : task
    )
  );
    setEditingTask(null);
    
    setTimeout(() => {
      if (newStatus === 'pending') {
        setActiveTab('pending');
      } else if (newStatus === 'accept' || newStatus === 'processing') {
        setActiveTab('inprogress');
      } else if (newStatus === 'completed') {
        setActiveTab('completed');
      }
    }, 500);
  };
  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case 'pending':
        return task.workingStatus === 'pending';
      case 'inprogress':
        return task.workingStatus === 'accept' || task.workingStatus === 'processing';
      case 'completed':
        return task.workingStatus === 'completed' || task.workingStatus === 'rejected';
      default:
        return true;
    }
  });

  const getStatusColor = (status: TaskData['workingStatus']): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accept': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: TaskData['workingStatus']): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accept': return 'Accepted';
      case 'processing': return 'Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority: TaskData['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const TaskCard: React.FC<{ task: TaskData }> = ({ task }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{task.title}</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                  <AlertTriangle size={12} className={getPriorityColor(task.priority)} />
                  <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="p-6 space-y-5">
        {/* Customer Information Card */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <User size={16} className="mr-2 text-blue-600" />
            Customer Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">NAME</p>
              <p className="font-semibold text-gray-900">{task.customerName}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">PHONE</p>
              <p className="font-semibold text-gray-900">{task.customerPhone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Service Details Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Wrench size={16} className="mr-2 text-blue-600" />
            Service Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-500 font-medium mb-1">LOCATION</p>
              <p className="font-semibold text-gray-900 text-sm">{task.location}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-500 font-medium mb-1">ASSIGNED DATE</p>
              <p className="font-semibold text-gray-900">
                {new Date(task.assignedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-gray-500 font-medium mb-1">DESCRIPTION</p>
            <p className="text-gray-700 text-sm leading-relaxed">{task.description}</p>
          </div>
        </div>

        {/* Vehicle Information Card */}
        {(task.vehicleDetails.make || task.vehicleDetails.model) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Star size={16} className="mr-2 text-green-600" />
              Product Information
            </h4>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">PRODUCT</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {`${task.vehicleDetails.make} ${task.vehicleDetails.model}`}
                  </p>
                  <p className="text-xs text-gray-600">{task.vehicleDetails.year}</p>
                </div>
                {task.vehicleDetails.licensePlate && (
                  <div className="bg-gray-900 text-white px-3 py-2 rounded-lg font-mono font-bold text-sm">
                    {task.vehicleDetails.licensePlate}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Metrics Card */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <Clock size={16} className="mr-2 text-yellow-600" />
            Service Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-yellow-100 text-center">
              <p className="text-xs text-gray-500 font-medium mb-1">ESTIMATED TIME</p>
              <p className="font-bold text-gray-900">{task.estimatedTime}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-yellow-100 text-center">
              <p className="text-xs text-gray-500 font-medium mb-1">SERVICE TYPE</p>
              <p className="font-bold text-gray-900">{task.serviceType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        {task.workingStatus === 'pending' && (
          <div className="flex space-x-3">
          <button
            onClick={() => handleTaskAction(task.id, 'accept')}
            disabled={actionLoading === task.id || mechanicStatus === 'Occupied'}
            className={`flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 ${
              (actionLoading === task.id || mechanicStatus === 'Occupied') ? 
              'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {actionLoading === task.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle size={18} />
            )}
            <span>
              {mechanicStatus === 'Occupied' ? 
              'Finish current task first' : 'Accept Task'}
            </span>
          </button>
            
            <button
          onClick={() => {
            setTaskToReject(task.id);
            setShowRejectModal(true);
          }}
          disabled={actionLoading === task.id}
          className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle size={18} />
          <span>Reject Task</span>
        </button>
          </div>
        )}

        {task.workingStatus === 'accept' && (
          <div className="flex space-x-3">    
            <button
              onClick={() => handleTaskAction(task.id, 'completed')}
              disabled={actionLoading === task.id}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === task.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle size={18} />
              )}
              <span>Mark Complete</span>
            </button>
          </div>
        )}

        {task.workingStatus === 'processing' && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleTaskAction(task.id, 'completed')}
              disabled={actionLoading === task.id}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === task.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle size={18} />
              )}
              <span>Mark Complete</span>
            </button>
          </div>
        )}

        {task.workingStatus === 'completed' && (
          <div className="flex items-center justify-center space-x-2 text-green-600 py-2">
            <CheckCircle size={18} />
            <span className="font-medium">Task Completed</span>
          </div>
        )}

        {task.workingStatus === 'rejected' && (
          <div className="flex items-center justify-center space-x-2 text-red-600 py-2">
            <XCircle size={18} />
            <span className="font-medium">Task Rejected</span>
          </div>
        )}

        <button
          onClick={() => setSelectedTask(task)}
          className="w-full mt-3 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
        >
          <Eye size={16} />
          <span>View Details</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const taskCounts = {
    pending: tasks.filter(t => t.workingStatus === 'pending').length,
    inprogress: tasks.filter(t => t.workingStatus === 'accept' || t.workingStatus === 'processing').length,
    completed: tasks.filter(t => t.workingStatus === 'completed' || t.workingStatus === 'rejected').length
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
        <p className="text-gray-600">Manage your assigned service tasks with enhanced workflow</p>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
          {[
            { 
              key: 'pending' as TabType, 
              label: 'Pending Tasks', 
              count: taskCounts.pending,
              icon: AlertCircle,
              gradient: 'from-yellow-400 to-orange-500',
              bgActive: 'bg-gradient-to-r from-yellow-400 to-orange-500',
              bgInactive: 'bg-gray-50 hover:bg-yellow-50',
              textActive: 'text-white',
              textInactive: 'text-gray-600 hover:text-yellow-700',
              borderColor: 'border-yellow-200'
            },
            { 
              key: 'inprogress' as TabType, 
              label: 'In Progress', 
              count: taskCounts.inprogress,
              icon: PlayCircle,
              gradient: 'from-blue-500 to-indigo-600',
              bgActive: 'bg-gradient-to-r from-blue-500 to-indigo-600',
              bgInactive: 'bg-gray-50 hover:bg-blue-50',
              textActive: 'text-white',
              textInactive: 'text-gray-600 hover:text-blue-700',
              borderColor: 'border-blue-200'
            },
            { 
              key: 'completed' as TabType, 
              label: 'Completed', 
              count: taskCounts.completed,
              icon: CheckCircle,
              gradient: 'from-green-500 to-emerald-600',
              bgActive: 'bg-gradient-to-r from-green-500 to-emerald-600',
              bgInactive: 'bg-gray-50 hover:bg-green-50',
              textActive: 'text-white',
              textInactive: 'text-gray-600 hover:text-green-700',
              borderColor: 'border-green-200'
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm
                  transform transition-all duration-300 hover:scale-105 active:scale-95
                  border-2 shadow-md hover:shadow-lg
                  ${isActive 
                    ? `${tab.bgActive} ${tab.textActive} border-transparent shadow-lg` 
                    : `${tab.bgInactive} ${tab.textInactive} ${tab.borderColor}`
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-current'} />
                <span className="font-medium">{tab.label}</span>
                <div className={`
                  flex items-center justify-center min-w-[28px] h-7 rounded-full text-xs font-bold
                  ${isActive 
                    ? 'bg-white bg-opacity-25 text-white' 
                    : 'bg-white border-2 border-current text-current'
                  }
                `}>
                  {tab.count}
                </div>
                
                {/* Active indicator glow */}
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl ${tab.bgActive} opacity-20 blur-xl -z-10`}></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {activeTab === 'pending' && "No pending tasks at the moment."}
            {activeTab === 'inprogress' && "No tasks currently in progress."}
            {activeTab === 'completed' && "No completed tasks to show."}
          </p>
        </div>
      ) : activeTab === 'completed' ? (
        // Table view for completed tasks
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Task & Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Service Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task, index) => (
                  <tr 
                    key={task.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                          <Wrench size={16} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-600 font-medium">{task.customerName}</p>
                          <p className="text-xs text-gray-500">{task.customerPhone}</p>
                          <div className="flex items-center mt-1">
                            <AlertTriangle size={10} className={getPriorityColor(task.priority)} />
                            <span className={`text-xs font-bold ml-1 ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.serviceType}</p>
                        <p className="text-xs text-gray-600 mt-1">{task.title}</p>
                        <div className="flex items-center mt-2 space-x-3">
                          <div className="flex items-center">
                            <Clock size={12} className="text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin size={12} className="text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{task.location.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.workingStatus)}`}>
                          {getStatusLabel(task.workingStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(task.assignedDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(task.assignedDate).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={12} className="mr-1" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card view for pending and in-progress tasks
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
    <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" 
    onClick={() => setSelectedTask(null)}
  >
    <div
      className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
          <button
            onClick={() => setSelectedTask(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Basic Task Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedTask.title}</h3>
            <p className="text-gray-600">{selectedTask.title}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">CUSTOMER</h4>
              <p className="font-medium">{selectedTask.customerName}</p>
              <p className="text-gray-600 text-sm mt-1">{selectedTask.customerPhone}</p>
              <p className="text-gray-600 text-sm">{selectedTask.customerEmail}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">LOCATION</h4>
              <p className="font-medium">{selectedTask.location}</p>
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-500 mb-1">PRIORITY</h4>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {selectedTask.vehicleDetails.make && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-2">PRODUCT</h4>
              <p className="font-medium">
                {selectedTask.vehicleDetails.make} {selectedTask.vehicleDetails.model}
                {selectedTask.vehicleDetails.year && ` (${selectedTask.vehicleDetails.year})`}
              </p>
              {selectedTask.vehicleDetails.licensePlate && (
                <div className="mt-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono inline-block">
                  {selectedTask.vehicleDetails.licensePlate}
                </div>
              )}
            </div>
          )}

          {selectedTask.workingStatus === 'completed' && selectedTask.completionDetails && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                <CheckCircle className="mr-2" size={16} />
                COMPLETION DETAILS
              </h4>
              
              <div className="mb-4">
                <h5 className="text-xs font-medium text-gray-500 mb-1">WORK DONE</h5>
                <p className="text-gray-700">{selectedTask.completionDetails.description}</p>
              </div>
              
              {selectedTask.completionDetails.photos && selectedTask.completionDetails.photos.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-gray-500 mb-2">PHOTOS</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTask.completionDetails.photos.map((photo, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        <img
                           src={photo}
                          alt={`Completion photo ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <Clock className="mr-1" size={12} />
                <span>
                  Completed on {new Date(selectedTask.completionDetails.completedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-3">TASK TIMELINE</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                  <Calendar size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-600 text-sm">
                    {new Date(selectedTask.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                  <Clock size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-gray-600 text-sm">
                    {new Date(selectedTask.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedTask.workingStatus === 'completed' && (
                <div className="flex items-start">
                  <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Completed</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(selectedTask.completionDetails?.completedAt || selectedTask.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
           </div>
         </div>
        </div>
      </div>
    </div>
  )}

  {showRejectModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-900">Reject Task</h2>
        <button
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason('');
            setTaskToReject(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={24} />
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for rejection
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          rows={4}
          placeholder="Please provide a reason for rejecting this task..."
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason('');
            setTaskToReject(null);
          }}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (taskToReject && rejectReason.trim()) {
              handleTaskAction(taskToReject, 'reject');
            }
          }}
          disabled={!rejectReason.trim()}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reject Task
        </button>
      </div>
    </div>
  </div>
)}

{showCompletionModal && taskToComplete && (
  <TaskCompletionModal
    isOpen={showCompletionModal}
    onClose={() => {
      setShowCompletionModal(false);
      setTaskToComplete(null);
    }}
    onSubmit={handleTaskCompletion}
    taskTitle={taskToComplete.title}
    customerName={taskToComplete.customerName}
    isUnderWarranty={Boolean(taskToComplete.warrantyDate && new Date(taskToComplete.warrantyDate) >= new Date())}
    isLoading={actionLoading === taskToComplete.id}
  />
)}
 </div>
  );
};

export default MechanicTasks;
