import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Header from '../../components/admin/components/Header';
import StatsCard from '../../components/admin/components/StatsCard';
import ChartCard from '../../components/admin/components/ChartCard';
import ClientsList from '../../components/admin/components/ClientList';
import { COLORS } from '../../data/dashboardData';
import { getAllComplaint } from '../../api/cplaint/complaint';
import { fetchEmployees } from '../../api/admin/Employee';
import { ClientListApi } from '../../api/admin/Client';
import { format, parseISO } from 'date-fns';
import InvoiceGenerator from '../../components/admin/components/InvoiceGenerator';

interface DashboardData {
  totalComplaints: number;
  totalUsers: number;
  totalMechanics: number;
  totalCoordinators: number;
  complaintsTrend: { name: string; value: number }[];
  complaintsByStatus: { name: string; value: number }[];
  recentUsers: any[];
  complaintsSummary: {
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
  };
  topMechanics: {
    id: string;
    name: string;
    resolvedCount: number;
    avatar?: string;
  }[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState<DashboardData | null>(null);
  const [rawComplaints, setRawComplaints] = useState<any[]>([]);
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(-1); 
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [complaints, user, emp] = await Promise.all([
          getAllComplaint(),
          ClientListApi(),
          fetchEmployees()
        ]);

        const complaintsArray = complaints || [];
        const usersArray = user?.clients || [];
        const employeesArray = emp?.data?.employees || [];

        setRawComplaints(complaintsArray);
        setRawUsers(usersArray);
        setRawEmployees(employeesArray);
        
        processAndSetData(complaintsArray, usersArray, employeesArray);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    processAndSetData(rawComplaints, rawUsers, rawEmployees);
  }, [selectedMonth, startDate, endDate]);

  const processAndSetData = (complaints: any[] = [], users: any[] = [], employees: any[] = []) => {
    let filteredComplaints = [...complaints];
    
    if (selectedMonth >= 0) {
      const year = new Date().getFullYear();
      const monthStart = new Date(year, selectedMonth, 1);
      const monthEnd = new Date(year, selectedMonth + 1, 0);
      
      filteredComplaints = filteredComplaints.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); 
      
      filteredComplaints = filteredComplaints.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    }
    
    // Process complaints data for charts
    const complaintsByMonth = processComplaintsByMonth(filteredComplaints);
    const complaintsByStatus = processComplaintsByStatus(filteredComplaints);
    
    const mechanics = employees.filter((e: any) => e.position === 'mechanic');
    const coordinators = employees.filter((e: any) => e.position === 'coordinator');

    const topMechanics = processTopMechanics(filteredComplaints, mechanics);
    const summary = {
      pending: filteredComplaints.filter((c: any) => c.status === 'pending').length,
      inProgress: filteredComplaints.filter((c: any) => c.status === 'in_progress').length,
      resolved: filteredComplaints.filter((c: any) => c.status === 'resolved').length,
      cancelled: filteredComplaints.filter((c: any) => c.status === 'cancelled').length,
    };

    const dashboardData = {
      totalComplaints: filteredComplaints.length,
      totalUsers: users.length,
      totalMechanics: mechanics.length,
      totalCoordinators: coordinators.length,
      complaintsTrend: complaintsByMonth,
      complaintsByStatus,
      recentUsers: users.slice(0, 5), 
      complaintsSummary: summary,
      topMechanics
    };

    setData(dashboardData);
    setFilteredData(dashboardData);
  };

  const processComplaintsByMonth = (complaints: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return monthNames.map((month, index) => {
      const monthComplaints = complaints.filter(c => {
        const date = new Date(c.createdAt);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      return { name: month, value: monthComplaints.length };
    });
  };

  const processComplaintsByStatus = (complaints: any[]) => {
    const statusGroups = complaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusGroups).map(([status, count]) => ({
      name: status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      value: count as number
    }));
  };
const processTopMechanics = (complaints: any[], mechanics: any[]) => {
  const resolvedComplaints = complaints.filter(c => 
    c.workingStatus === 'completed'
  );
  
  
  const mechanicCounts = resolvedComplaints.reduce((acc: Record<string, number>, complaint) => {
    if (complaint.assignedMechanicId) {
      if (typeof complaint.assignedMechanicId === 'string') {
        acc[complaint.assignedMechanicId] = (acc[complaint.assignedMechanicId] || 0) + 1;
      }
      else if (Array.isArray(complaint.assignedMechanicId)) {
        complaint.assignedMechanicId.forEach((assignment: any) => {
          const mechanicId = assignment?.mechanicId?._id || 
                           assignment?.mechanicId || 
                           assignment?._id || 
                           assignment;
          if (mechanicId) {
            acc[mechanicId] = (acc[mechanicId] || 0) + 1;
          }
        });
      }
      else if (typeof complaint.assignedMechanicId === 'object') {
        const mechanicId = complaint.assignedMechanicId._id || 
                         complaint.assignedMechanicId.mechanicId || 
                         complaint.assignedMechanicId;
        if (mechanicId) {
          acc[mechanicId] = (acc[mechanicId] || 0) + 1;
        }
      }
    }
    return acc;
  }, {});

  
  const topMechanics = Object.entries(mechanicCounts)
    .map(([mechanicId, count]) => {
      const mechanic = mechanics.find((m: any) => 
        m.id == mechanicId
      );
      return {
        id: mechanicId,
        name: mechanic ? mechanic.employeeName : `Mechanic ${mechanicId}`,
        resolvedCount: count,
        avatar: mechanic?.avatar,
        specialization: mechanic?.fieldOfMechanic,
        contact: mechanic?.contactNumber,
        status: mechanic?.workingStatus,
        mechanicDetails: mechanic || null
      };
    })
    .sort((a, b) => b.resolvedCount - a.resolvedCount)
    .slice(0, 3);
  return topMechanics;
};

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(e.target.value);
    setSelectedMonth(monthIndex);
    
    setStartDate('');
    setEndDate('');
  };

  const handleDateRangeApply = () => {
    setSelectedMonth(-1);
    
  };

  const handleClearFilters = () => {
    setSelectedMonth(-1);
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading dashboard data...</div>;
  }

  if (!data) {
    return <div className="flex-1 flex items-center justify-center">Failed to load dashboard data</div>;
  }

  const statsCards = [
    { 
      title: 'ALL COMPLAINTS', 
      value: (filteredData?.totalComplaints || data.totalComplaints).toString(), 
      period: 'From last month' 
    },
    { 
      title: 'ALL USERS', 
      value: (filteredData?.totalUsers || data.totalUsers).toString(), 
      period: 'From last month' 
    },
    { 
      title: 'ALL MECHANICS', 
      value: (filteredData?.totalMechanics || data.totalMechanics).toString(), 
      period: 'From last month' 
    },
    { 
      title: 'ALL COORDINATORS', 
      value: (filteredData?.totalCoordinators || data.totalCoordinators).toString(), 
      period: 'From last month' 
    }
  ];

  const summaryItems = [
    { 
      title: 'Pending Complaints', 
      value: (filteredData?.complaintsSummary.pending || data.complaintsSummary.pending).toString(), 
      subtitle: 'Waiting for action' 
    },
    { 
      title: 'In Progress', 
      value: (filteredData?.complaintsSummary.inProgress || data.complaintsSummary.inProgress).toString(), 
      subtitle: 'Currently being handled' 
    },
    { 
      title: 'Resolved', 
      value: (filteredData?.complaintsSummary.resolved || data.complaintsSummary.resolved).toString(), 
      subtitle: 'Successfully resolved' 
    },
    { 
      title: 'Cancelled', 
      value: (filteredData?.complaintsSummary.cancelled || data.complaintsSummary.cancelled).toString(), 
      subtitle: 'Cancelled complaints' 
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Header onToggleSidebar={() => { /* implement sidebar toggle logic here if needed */ }} />
      <div className="p-6 overflow-y-auto">
        {/* Filter Section */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button 
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={-1}>All Months</option>
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
            
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleDateRangeApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Date Range
            </button>
          </div>
          
          {selectedMonth >= 0 && (
            <div className="mt-3 text-sm text-gray-600">
              Showing data for: {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]}
            </div>
          )}
          
          {startDate && endDate && (
            <div className="mt-3 text-sm text-gray-600">
              Showing data from: {format(parseISO(startDate), 'MMM dd, yyyy')} to {format(parseISO(endDate), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <StatsCard key={index} title={card.title} value={card.value} period={card.period} />
          ))}
        </div>
        
        {/* Charts Row */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
           <ChartCard title="Complaints Trend" subtitle={`Jan ${new Date().getFullYear()} - Dec ${new Date().getFullYear()}`}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData?.complaintsTrend || data.complaintsTrend}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4c83ee" 
                      strokeWidth={2} 
                      dot={{ fill: '#4c83ee', strokeWidth: 2, r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
          
          {/* Complaints by Status Chart */}
          <ChartCard title="Complaints by Status">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredData?.complaintsByStatus || data.complaintsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(filteredData?.complaintsByStatus || data.complaintsByStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} complaints`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        
        {/* Recent Users List */}
        <div className="mt-6">
          <ClientsList clients={filteredData?.recentUsers || data.recentUsers} />
        </div>
        
        {/* Dispatch and Segment Charts - Repurposed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Complaint Priority */}
          <ChartCard title="COMPLAINT PRIORITY">
            <div>
              <p className="text-xl font-bold">{filteredData?.totalComplaints || data.totalComplaints}</p>
              <p className="text-xs text-gray-500 mb-4">Total complaints received</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData?.complaintsByStatus || data.complaintsByStatus}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          
          {/* Mechanic Performance */}
          <ChartCard 
            title="TOP MECHANICS"
            subtitle="Based on resolved complaints"
          >
            <div className="h-48">
              {(filteredData?.topMechanics || data.topMechanics).length > 0 ? (
                <div className="space-y-4">
                  {(filteredData?.topMechanics || data.topMechanics).map((mechanic, index) => (
                    <div key={mechanic.id} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {mechanic.avatar ? (
                          <img src={mechanic.avatar} alt={mechanic.name} className="w-full h-full rounded-full" />
                        ) : (
                          <span className="text-xs font-medium">
                            {mechanic.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{mechanic.name}</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ 
                              width: `${(mechanic.resolvedCount / 
                                ((filteredData?.complaintsSummary.resolved || data.complaintsSummary.resolved) || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold ml-2">
                        {mechanic.resolvedCount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No resolved complaints data available
                </div>
              )}
            </div>
          </ChartCard>
        </div>
        
        {/* Complaints Summary */}
      <div className="mt-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex justify-end">
          <InvoiceGenerator 
            dashboardData={filteredData || data} 
            selectedMonth={selectedMonth}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;