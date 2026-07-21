import React, { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {  Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectEmployeeAuthData } from '../../store/selectors';
import { NotificationService } from '../../api/NotificationService/NotificationService';
import { useDispatch } from "react-redux";
import { clearEmployeeAuth } from "../../store/EmployeeAuthSlice";

interface HeaderProps {
  mechanicName: string;
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onNotificationClick: () => void;
  notificationCount: number;
  socket: Socket | null;
}

const Header: React.FC<HeaderProps> = ({
  mechanicName,
  onNotificationClick,
  notificationCount,
  socket,
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const navigate = useNavigate();
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const token = employeeData?.token;
  const userId = employeeData?.id;
  const dispatch = useDispatch();

   useEffect(() => {
    setUnreadCount(notificationCount);
  }, [notificationCount]);
  
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        if (!userId) {
              throw new Error('User ID is required');
        }
        const response = await NotificationService.getUnreadChatNotifications(userId , "mechanic")
        
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    if (userId && token) {
      fetchNotificationCount();
    }
  }, [userId, token]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };

    const handleMarkAsRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllAsRead = () => {
      setUnreadCount(0);
    };

    socket.on('new_complaint_assigned', handleNewNotification);
    socket.on('new_message', handleNewNotification);
    socket.on('notification_marked_read', handleMarkAsRead);
    socket.on('all_notifications_marked_read', handleMarkAllAsRead);

    return () => {
      socket.off('new_complaint_assigned', handleNewNotification);
      socket.off('new_message', handleNewNotification);
      socket.off('notification_marked_read', handleMarkAsRead);
      socket.off('all_notifications_marked_read', handleMarkAllAsRead);
    };
  }, [socket]);

  const handleProfileClick = () => {
    navigate('/mechanic/profile');
  };

 const handleLogout = () => {
  dispatch(clearEmployeeAuth());
  navigate("/employee/login"); // or your login route
};

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 hidden md:block">Mechanic Dashboard</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={onNotificationClick}
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 focus:outline-none"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800 hidden sm:inline-block">
                {mechanicName}
              </span>
            </button>
          </div>
        </div>
      </div>
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="px-4 space-y-1">
            <a
              href="/mechanic/dashboard"
              className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded px-3"
            >
              Dashboard
            </a>
            <a
              href="/mechanic/tasks"
              className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded px-3"
            >
              My Task
            </a>
            <a
              href="/mechanic/chat"
              className="block py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded px-3"
            >
              Chat with coordinator
            </a>
           <button
          onClick={() => {
            handleLogout();
            setShowMobileMenu(false);
          }}
          className="block w-full text-left py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded px-3"
        >
          Sign Out
        </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;