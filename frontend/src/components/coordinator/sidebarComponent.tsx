import { useEffect, useState } from 'react';
import { MessageSquare, Home, Users, Megaphone, User, LogOut, X } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectEmployeeAuthData } from '../../store/selectors';

interface SidebarProps {
  activeTab: string;
  handleLogout: () => void;
  unreadCount: number;
  socket?: any;
  onClose?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  handleLogout, 
  unreadCount, 
  socket, 
  onClose 
}: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const userId = employeeData?.id;


  const tabs = [
    { name: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/coordinator/dashboard' },
    { name: 'User Management', icon: <Users className="w-5 h-5" />, path: '/user-management' },
    { name: 'Complaint Management', icon: <Megaphone className="w-5 h-5" />, path: '/complaint-management' },
    { 
      name: 'Chat', 
      icon: <MessageSquare className="w-5 h-5" />, 
      path: '/employee-chat'
    },
  ];

  const getInitials = () => {
    if (!employeeData?.employeeName) return 'CO';
    return employeeData.employeeName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <div className="h-full flex flex-col bg-indigo-900 text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center">
          {expanded && <h1 className="font-bold text-xl">Coordinator Panel</h1>}
        </div>
        <div className="flex items-center space-x-2">
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-full bg-indigo-800 hover:bg-indigo-700 transition-colors"
          >
            <X size={20} />
          </button>
          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="hidden lg:block bg-indigo-800 rounded-full p-2 hover:bg-indigo-700 transition-all"
          >
            {expanded ? "«" : "»"}
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-8 flex-grow overflow-y-auto">
        {tabs.map((tab) => (
          <div key={tab.name} className="relative">
            <button
              onClick={() => handleNavigation(tab.path)}
              className={`flex items-center w-full px-4 py-3 transition-all duration-200 hover:bg-indigo-800 touch-manipulation min-h-[48px] ${
                isActive(tab.path) ? 'bg-indigo-800 border-l-4 border-white' : ''
              }`}
            >
              <span className="mr-3 flex-shrink-0">{tab.icon}</span>
              {expanded && (
                <span className="truncate">{tab.name}</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-indigo-800 space-y-2">
        <button 
          onClick={() => {
            navigate('/employee/profile');
            if (onClose) onClose();
          }}
          className="flex items-center w-full px-4 py-3 transition-all duration-200 hover:bg-indigo-800 rounded-lg touch-manipulation"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
            {expanded ? (
              <span className="font-medium text-sm">{getInitials()}</span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          {expanded && (
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium truncate">
                {employeeData?.employeeName || 'Coordinator'}
              </p>
              <p className="text-xs text-indigo-300">View Profile</p>
            </div>
          )}
        </button>

        <button
          onClick={() => {
            handleLogout();
            if (onClose) onClose();
          }}
          className="flex items-center w-full px-4 py-3 transition-all duration-200 hover:bg-indigo-800 rounded-lg touch-manipulation"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}