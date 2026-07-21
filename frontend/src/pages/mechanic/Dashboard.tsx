// src/components/mechanic/MechanicDashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Clock, 
  PenTool as Tool, 
  CheckCircle, 
  AlertCircle, 
  Filter,
  TrendingUp,
  Award,
  Timer,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getMechanicComplaints } from '../../api/cplaint/complaint'; 
import ComplaintStatistics from './complaintStatistics';
import StatusChart from './StatusChart';
import { selectEmployeeAuthData } from '../../store/selectors';
import { setCurrentComplaintId } from '../../store/ComplaintSlice';
import { ComplaintFormData } from '../../types/complaint';
import MechanicInvoiceGenerator from '../../components/mechanicn/MechanicInvoiceGenerator';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { format, isSameDay, isSameMonth } from "date-fns";


const MechanicDashboard = () => {
  const [complaints, setComplaints] = useState<ComplaintFormData[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<ComplaintFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeView, setActiveView] = useState('performance'); 
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const dispatch = useDispatch();
  const mechanicId = employeeData?.id || '';
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [animateStats, setAnimateStats] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(false);

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setIsLoading(true);
        const data = await getMechanicComplaints(mechanicId);
        
        if (data && data.length > 0) {
          const complaintId = data[0]._id;
          dispatch(setCurrentComplaintId(complaintId));
        }
        const formattedData = data.map(complaint => ({
          ...complaint,
          contactNumber: complaint.customerPhone || '',
          workingStatus: (
            ['pending', 'processing', 'completed', 'accept', 'reject']
              .includes(complaint.workingStatus || 'pending') 
              ? (complaint.workingStatus || 'pending')
              : 'pending'
          ) as ComplaintFormData['workingStatus'],
          assignedMechanicId: complaint.assignedMechanicId || '', 
          createdBy: complaint.createdBy || '', 
          status: complaint.status !== undefined ? String(complaint.status) : undefined,
          description: complaint.description || '', 
        }));
        setComplaints(formattedData);
      } catch (error) {
        console.error('Error loading complaints:', error);
      } finally {
        setIsLoading(false);
      }
    };  
    loadComplaints();
    setTimeout(() => setAnimateStats(true), 300);
    setTimeout(() => setAnimateCharts(true), 800);
  }, [mechanicId, dispatch]);

  // const handleComplaintUpdate = (updatedComplaint: Complaint) => {
  //   setComplaints(prevComplaints => 
  //     prevComplaints.map(complaint => 
  //       complaint.id === updatedComplaint._id 
  //         ? { ...complaint, workingStatus: updatedComplaint.workingStatus } 
  //         : complaint
  //     )
  //   );
  // };

  useEffect(() => {
  let filtered = complaints.filter(
    complaint => complaint.workingStatus !== "reject"
  );

  if (statusFilter !== "all") {
    filtered = filtered.filter(complaint => {
      if (statusFilter === "pending")
        return complaint.workingStatus === "pending";

      if (statusFilter === "processing")
        return (
          complaint.workingStatus === "processing" ||
          complaint.workingStatus === "accept"
        );

      if (statusFilter === "completed")
        return complaint.workingStatus === "completed";

      return true;
    });
  }

  if (startDate && endDate) {
  filtered = filtered.filter((complaint) => {
    if (!complaint.createdAt) return false;

    const complaintDate = new Date(complaint.createdAt);

    return complaintDate >= startDate && complaintDate <= endDate;
  });
}

  if (selectedMonth) {
    filtered = filtered.filter(
      complaint =>
        complaint.createdAt &&
        isSameMonth(new Date(complaint.createdAt), selectedMonth)
    );
  }

  setFilteredComplaints(filtered);
}, [  complaints,
    statusFilter,
    selectedMonth,
    startDate,
    endDate]);
  
  const stats = {
    pending: complaints.filter(c => c.workingStatus === 'pending').length,
    inProgress: complaints.filter(c => c.workingStatus === 'processing' || c.workingStatus === 'accept').length,
    completed: complaints.filter(c => c.workingStatus === 'completed').length,
    accepted: complaints.filter(c => c.workingStatus === 'accept').length,
    rejected: complaints.filter(c => c.workingStatus === 'reject').length,
    total: complaints.length
  };

  // Performance metrics
  const getPerformanceMetrics = () => {
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);
    
    const thisWeekComplaints = complaints.filter(c => c.createdAt && new Date(c.createdAt) >= thisWeek);
    const thisMonthComplaints = complaints.filter(c => c.createdAt && new Date(c.createdAt) >= thisMonth);
    const thisYearComplaints = complaints.filter(c => c.createdAt && new Date(c.createdAt) >= thisYear);
    return {
      weeklyCompleted: thisWeekComplaints.filter(c => c.workingStatus === 'completed').length,
      monthlyCompleted: thisMonthComplaints.filter(c => c.workingStatus === 'completed').length,
      yearlyCompleted: thisYearComplaints.filter(c => c.workingStatus === 'completed').length,
      averageCompletionTime: complaints.filter(c => c.workingStatus === 'completed').length > 0 ? 2.5 : 0, // Mock data
    };
  };

  // Recent activity
  const getRecentActivity = () => {
    return complaints
      .sort((a, b) => 
        new Date(b.updatedAt ?? '').getTime() - new Date(a.updatedAt ?? '').getTime()
      )
      .slice(0, 5);
  };

  // Priority analysis
  const getPriorityBreakdown = () => {
    return {
      high: complaints.filter(c => c.priority === 'high').length,
      medium: complaints.filter(c => c.priority === 'medium').length,
      low: complaints.filter(c => c.priority === 'low').length
    };
  };

  
  // Trend data (mock for demonstration)
  const getTrendData = () => {
    return [
      { month: 'Jan', completed: 15, pending: 8 },
      { month: 'Feb', completed: 20, pending: 6 },
      { month: 'Mar', completed: 18, pending: 10 },
      { month: 'Apr', completed: 25, pending: 5 },
      { month: 'May', completed: 22, pending: 7 },
      { month: 'Jun', completed: 28, pending: 4 }
    ];
  };

  const handleMonthChange = (date: Date | null) => {
  setSelectedMonth(date);
  // setSelectedDate(null);
};

const handleDateChange = (date: Date | null) => {
  // setSelectedDate(date);
  setSelectedMonth(null);
};

const clearFilters = () => {
  setStartDate(null);
  setEndDate(null);
  setSelectedMonth(null);
};

  const performanceMetrics = getPerformanceMetrics();
  const recentActivity = getRecentActivity();
  const priorityBreakdown = getPriorityBreakdown();
  const trendData = getTrendData();

  const renderAlternativeContent = () => {
    switch(activeView) {
      case 'performance':
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">This Week</p>
              <p className="text-2xl font-bold text-blue-800">{performanceMetrics.weeklyCompleted}</p>
              <p className="text-xs text-blue-600">Completed</p>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">This Month</p>
              <p className="text-2xl font-bold text-green-800">{performanceMetrics.monthlyCompleted}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Avg. Time</p>
              <p className="text-2xl font-bold text-purple-800">{performanceMetrics.averageCompletionTime}d</p>
              <p className="text-xs text-purple-600">Per Task</p>
            </div>
            <Timer className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">This Year</p>
              <p className="text-2xl font-bold text-yellow-800">{performanceMetrics.yearlyCompleted}</p>
              <p className="text-xs text-yellow-600">Completed</p>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
        
      case 'recent':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((complaint) => (
                <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{complaint.description}</p>
                    <p className="text-xs text-gray-500">{complaint.customerName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      complaint.workingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      complaint.workingStatus === 'processing' || complaint.workingStatus === 'accept' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.workingStatus}
                    </span>
                    <span className="text-xs text-gray-400">
                      {complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'priority':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Priority Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="font-medium">High Priority</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{priorityBreakdown.high}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Medium Priority</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{priorityBreakdown.medium}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Low Priority</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{priorityBreakdown.low}</span>
              </div>
            </div>
          </div>
        );
        
      case 'trends':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">6-Month Trends</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {trendData.map((data) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full space-y-1 flex flex-col-reverse">
                    <div 
                      className="bg-green-500 rounded-t"
                      style={{ height: `${(data.completed / 30) * 100}px` }}
                    ></div>
                    <div 
                      className="bg-orange-500 rounded-t"
                      style={{ height: `${(data.pending / 30) * 100}px` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-2 font-medium">{data.month}</p>
                  <div className="text-xs text-gray-500 text-center">
                    <div className="text-green-600">{data.completed}</div>
                    <div className="text-orange-600">{data.pending}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Pending</span>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

  <h1 className="text-2xl font-bold text-gray-800">
    Mechanic Dashboard
  </h1>

  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

    <div className="flex items-center gap-2">
      <Calendar className="text-gray-500" />

   <DatePicker
      selected={selectedMonth}
      onChange={handleMonthChange}
      showMonthYearPicker
      dateFormat="MMMM yyyy"
      placeholderText="Filter by month"
      maxDate={new Date()}
      className="border rounded-md px-3 py-2 text-sm w-full"
    />
    </div>

    <div className="flex items-center gap-2">
      <Calendar className="text-gray-500" />

     
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={(dates) => {
          const [start, end] = dates;
          setStartDate(start);
          setEndDate(end);
          setSelectedMonth(null); // Clear month filter
        }}
        maxDate={new Date()}
        dateFormat="MMMM d, yyyy"
        placeholderText="Select date range"
        className="border rounded-md px-3 py-2 text-sm w-full"
        isClearable
      />
    </div>

    {(startDate || endDate || selectedMonth) && (
      <button
        onClick={clearFilters}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md"
      >
        Clear Filters
      </button>
    )}

    <MechanicInvoiceGenerator
      mechanicData={employeeData}
      complaints={filteredComplaints}
      selectedPeriod={
       startDate && endDate
      ? `${format(startDate,"MMM d, yyyy")} - ${format(endDate,"MMM d, yyyy")}`
      : selectedMonth
          ? format(selectedMonth,"MMMM yyyy")
          : "All Time"
      }
    />

  </div>

</div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: animateStats ? 1 : 0, 
            y: animateStats ? 0 : 20 
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">PENDING TASKS</p>
              <h2 className="text-2xl font-bold">{stats.pending}</h2>
              <p className="text-amber-500 text-sm mt-1">Needs attention</p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <Clock size={24} className="text-amber-500" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: animateStats ? 1 : 0, 
            y: animateStats ? 0 : 20 
          }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">IN PROGRESS</p>
              <h2 className="text-2xl font-bold">{stats.inProgress}</h2>
              <p className="text-blue-500 text-sm mt-1">Currently working</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Tool size={24} className="text-blue-500" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: animateStats ? 1 : 0, 
            y: animateStats ? 0 : 20 
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">COMPLETED</p>
              <h2 className="text-2xl font-bold">{stats.completed}</h2>
              <p className="text-green-500 text-sm mt-1">Successfully resolved</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: animateStats ? 1 : 0, 
            y: animateStats ? 0 : 20 
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">TOTAL ASSIGNED</p>
              <h2 className="text-2xl font-bold">{stats.total}</h2>
              <p className="text-gray-500 text-sm mt-1">All complaints</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-lg">
              <AlertCircle size={24} className="text-gray-500" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Data Visualization with Alternative Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status chart - Takes 1/3 width on large screens */}
        <motion.div
          className="bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: animateCharts ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <StatusChart 
            pending={stats.pending} 
            inProgress={stats.inProgress} 
            completed={stats.completed} 
            animate={animateCharts}
          />
        </motion.div>
        
        <motion.div
          className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: animateCharts ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'performance', label: 'Performance', icon: TrendingUp },
              { key: 'recent', label: 'Recent', icon: Clock },
              { key: 'priority', label: 'Priority', icon: AlertCircle },
              { key: 'trends', label: 'Trends', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  activeView === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          {/* Alternative Content */}
          {renderAlternativeContent()}
        </motion.div>
      </div>
      
      {/* Daily work summary */}
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: animateCharts ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold mb-4">Daily Work Summary</h2>
        <ComplaintStatistics complaints={complaints as any} />
      </motion.div>
    </>
  );
};

export default MechanicDashboard;
