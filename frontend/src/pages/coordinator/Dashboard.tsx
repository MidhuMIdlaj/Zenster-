// Dashboard.jsx
import { useState, useEffect } from 'react';
import { MessageSquare, Users, ShoppingCart, CreditCard, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns'
// Import components
import StatCard from '../../components/coordinator/stateCard';
import ComplaintChart from '../../components/coordinator/ComplaintChart';
import ComplaintPieChart from '../../components/coordinator/pieChart';
// import LocationMap from '../../components/coordinator/locationMap';

// Import chart data
// import { attendanceData } from '../../components/coordinator/ChartData';
import { getAllComplaint } from '../../api/cplaint/complaint';
import UserStatsChart from '../../components/coordinator/UserStatsChart';
import ComplaintLeadersCard from './UserLocationMap';
import CoordinatorInvoiceGenerator from '../../components/coordinator/CoordinatorInvoiceGenerator';
import { ClientListApi } from '../../api/admin/Client';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsers: number;
}

interface TopComplainer {
  name: string;
  email: string;
  complaintCount: number;
  lastComplaintDate: string;
  statusDistribution: {
    completed: number;
    processing: number;
    pending: number;
  };
}


export default function Dashboard() {
  const [totalComplaint, setTotalComplaint] = useState(0);
  const [completedComplaint, setCompletedComplaint] = useState(0);
  const [pendingComplaint, setPendingComplaint] = useState(0);
  const [processingComplaint, setProcessingComplaint] = useState(0);
  const [animateCards, setAnimateCards] = useState(false);
  type ComplaintChartItem = {
    month: string;
    completed: number;
    pending: number;
    processing: number;
    total: number;
  };
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsers: 0
  });
  const [topComplainers, setTopComplainers] = useState<TopComplainer[]>([]);
  const [complaintChartData, setComplaintChartData] = useState<ComplaintChartItem[]>([]);
  type PieChartDataItem = { name: string; value: number; color: string };
  const [pieChartData, setPieChartData] = useState<PieChartDataItem[]>([]);
  const [startDate, setStartDate] = useState<Date |null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);


  const calculateTopComplainers = (complaints: any[]): TopComplainer[] => {
    const complainersMap: Record<string, TopComplainer> = {};

    complaints.forEach(complaint => {
      if (!complaint.user) return;

      const userId = complaint.user._id;
      if (!complainersMap[userId]) {
        complainersMap[userId] = {
          name: complaint.user.name || 'Unknown',
          email: complaint.user.email || 'No email',
          complaintCount: 0,
          lastComplaintDate: complaint.createdAt,
          statusDistribution: {
            completed: 0,
            processing: 0,
            pending: 0
          }
        };
      }

      complainersMap[userId].complaintCount++;
      if (new Date(complaint.createdAt) > new Date(complainersMap[userId].lastComplaintDate)) {
        complainersMap[userId].lastComplaintDate = complaint.createdAt;
      }

      // Update status distribution
      if (complaint.status === 'completed') {
        complainersMap[userId].statusDistribution.completed++;
      } else if (complaint.status === 'processing') {
        complainersMap[userId].statusDistribution.processing++;
      } else if (complaint.status === 'pending') {
        complainersMap[userId].statusDistribution.pending++;
      }
    });

    return Object.values(complainersMap)
      .sort((a, b) => b.complaintCount - a.complaintCount)
      .slice(0, 5); // Get top 5 complainers
  };

  useEffect(() => {
    setAnimateCards(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    fetchComplaints();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (allComplaints.length > 0) {
      applyFilters();
    }
  }, [ startDate,
  endDate,
  selectedMonth,
  allComplaints]);

  const fetchComplaints = async () => {
    try {
      const res = await getAllComplaint();
      if (Array.isArray(res)) {
        setAllComplaints(res);
        setFilteredComplaints(res);
        updateChartData(res);
        setTopComplainers(calculateTopComplainers(res));
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

 const applyFilters = () => {
  let filtered = [...allComplaints];

  if (selectedMonth) {
    filtered = filtered.filter((complaint) => {
      const date = new Date(complaint.createdAt);

      return (
        date.getMonth() === selectedMonth.getMonth() &&
        date.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }

  if (startDate && endDate) {
    filtered = filtered.filter((complaint) => {
      const date = new Date(complaint.createdAt);
      return date >= startDate && date <= endDate;
    });
  }

  setFilteredComplaints(filtered);
  updateChartData(filtered);
  setTopComplainers(calculateTopComplainers(filtered));
};
  const fetchUserStats = async () => {
    try {
      const res = await ClientListApi();
      setUserStats({
        totalUsers: res.totalUsers,
        activeUsers: res.activeUsers,
        inactiveUsers: res.inactiveUsers,
        newUsers: res.newUsers
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const updateChartData = (complaints: any[]) => {
    setTotalComplaint(complaints.length);
    const completed = complaints.filter(c => c.status === 'completed').length;
    setCompletedComplaint(completed);
    const pending = complaints.filter(c => c.status === 'pending').length;
    setPendingComplaint(pending);
    const processing = complaints.filter(c => c.status === 'processing').length;
    setProcessingComplaint(processing);

    const chartData = transformComplaintData(complaints);
    setComplaintChartData(chartData);

    setPieChartData([
      { name: 'Solved', value: completed, color: '#9F7AEA' },
      { name: 'Pending', value: pending, color: '#ED64A6' },
      { name: 'Processing', value: processing, color: '#4299E1' }
    ]);
  };

  const transformComplaintData = (complaints: any[]): ComplaintChartItem[] => {
    const monthlyData: { [key: string]: ComplaintChartItem } = {};

    complaints.forEach(complaint => {
      const date = new Date(complaint.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          completed: 0,
          pending: 0,
          processing: 0,
          total: 0
        };
      }

      monthlyData[month].total++;

      switch (complaint.status) {
        case 'completed':
          monthlyData[month].completed++;
          break;
        case 'pending':
          monthlyData[month].pending++;
          break;
        case 'processing':
          monthlyData[month].processing++;
          break;
      }
    });

    // Convert to array and sort by month
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = Object.values(monthlyData).sort((a, b) => {
      return monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month);
    });

    return result as ComplaintChartItem[];
  };

 const handleMonthChange = (date: Date | null) => {
  setSelectedMonth(date);
  setStartDate(null);
  setEndDate(null);
};

 

const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedMonth(null);
};

  const stats = [
    {
      title: 'TOTAL COMPLAINTS IN SYSTEM',
      value: totalComplaint,
      changeText: 'All time',
      icon: <CreditCard className="w-6 h-6 text-indigo-500" />,
      color: 'indigo'
    },
    {
      title: 'COMPLETED COMPLAINTS',
      value: completedComplaint,
      changeText: `${Math.round((completedComplaint / totalComplaint) * 100) || 0}% resolved`,
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      color: 'indigo'
    },
    {
      title: 'PENDING COMPLAINTS',
      value: pendingComplaint,
      changeText: `${Math.round((pendingComplaint / totalComplaint) * 100) || 0}% pending`,
      icon: <MessageSquare className="w-6 h-6 text-indigo-500" />,
      color: 'indigo'
    },
    {
      title: 'PROCESSING COMPLAINTS',
      value: processingComplaint,
      changeText: `${Math.round((processingComplaint / totalComplaint) * 100) || 0}% in progress`,
      icon: <ShoppingCart className="w-6 h-6 text-indigo-500" />,
      color: 'indigo'
    }
  ];

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Complaints Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" />
            <DatePicker
              selected={selectedMonth}
              onChange={(date)=>{
                  setSelectedMonth(date);
                  setStartDate(null);
                  setEndDate(null);
              }}
              showMonthYearPicker
              maxDate={new Date()}
              dateFormat="MMMM yyyy"
              placeholderText="Filter by month"
          />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" />
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(dates)=>{
                  const [start,end]=dates;

                  setStartDate(start);
                  setEndDate(end);

                  setSelectedMonth(null);
              }}
              maxDate={new Date()}
              isClearable
              dateFormat="MMMM d, yyyy"
              placeholderText="Select date range"
          />
          </div>
          {(startDate || endDate || selectedMonth) && (
            <button
              onClick={clearFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm"
            >
              Clear Filters
            </button>
          )}

          <CoordinatorInvoiceGenerator
            complaints={filteredComplaints}
            userStats={{
              totalUsers: userStats.totalUsers,
              activeUsers: userStats.activeUsers,
              inactiveUsers: userStats.inactiveUsers,
              newUsers: userStats.newUsers
            }}
            topComplainers={topComplainers}
            complaintTrends={complaintChartData}
            selectedPeriod={
            startDate && endDate
                ? `${format(startDate,'MMM d, yyyy')} - ${format(endDate,'MMM d, yyyy')}`
                : selectedMonth
                ? format(selectedMonth,'MMMM yyyy')
                : 'All Time'
        }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`transform transition-all duration-500 ${animateCards ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <StatCard {...stat} delay={index} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="animate-on-scroll opacity-0">
          <ComplaintChart data={complaintChartData.map(item => ({ month: item.month, value: item.total }))} />
        </div>

        <div className="animate-on-scroll opacity-0">
          <ComplaintPieChart data={pieChartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
        <div className="animate-on-scroll opacity-0">
          <UserStatsChart />
        </div>

        <div className="animate-on-scroll opacity-0">
          <ComplaintLeadersCard setTopComplainers={setTopComplainers} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2); opacity: 0; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </>
  );
}