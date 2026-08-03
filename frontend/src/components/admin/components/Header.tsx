import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import NotificationModal from './NotificationModal';
import { useSelector } from 'react-redux';
import { selectAdminAuthData } from '../../../store/selectors';
import { io } from 'socket.io-client';
import { NotificationService, getUnreadChatCount, markAllChatNotificationsRead } from '../../../api/NotificationService/NotificationService';

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
  senderId?: string;
  senderName?: string;
  conversationId?: string;
}

const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tip, setTip] = useState('');
  const { adminData } = useSelector(selectAdminAuthData);
  const userId = adminData?.id;
  const token = adminData?.token;
  const role = 'admin';

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await NotificationService.getNotificationsForUser(userId);
      if (response.success && response.notifications) {
        setNotifications(response.notifications);
        setUnreadCount(response.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId || !role) return;
    try {
      const count = await getUnreadChatCount(userId, role);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string, conversationId?: string) => {
    try {
      if (conversationId) {
        const response = await NotificationService.markChatNotificationAsRead(notificationId, conversationId);
        if (response.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const response = await NotificationService.markNotificationAsRead(notificationId);
        if (response.success) {
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      const response = await markAllChatNotificationsRead(userId);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        const socket = io( import.meta.env.VITE_REACT_APP_BACKEND_URL  ||"http://localhost:5000", { auth: { token } });
        socket.emit("all_chat_notifications_read", { userId });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    if (!userId || !token) return;

    const socket = io( import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join_user_room", userId);
    });

    socket.on("new_chat_notification", () => {
      setUnreadCount((prev) => prev + 1);
      fetchNotifications();
    });

    socket.on("chat_notifications_read", () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetchNotifications();
    });

    socket.on("all_chat_notifications_read", () => {
      setUnreadCount(0);
      fetchNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, token]);

  useEffect(() => {
    if (isModalOpen) fetchNotifications();
  }, [isModalOpen, userId]);


  return (
    <div className="bg-blue-500 p-3 sm:p-4 fixed top-0 left-0 right-0 z-40 shadow-md min-h-14 sm:min-h-16">
      <div className="flex justify-between items-center max-w-full mx-auto">
        
        {/* Left Side - Hamburger + Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Hamburger for mobile/tablet */}
          <button
            className="lg:hidden p-2 rounded-md text-white hover:bg-blue-600 transition-colors touch-manipulation flex-shrink-0"
            onClick={onToggleSidebar}
          >
            <Menu size={20} />
          </button>

          {/* Admin Title - Hidden on very small screens */}
          <div className="hidden xs:flex flex-col min-w-0">
            <h1 className="text-sm sm:text-lg font-semibold text-white truncate">
              Admin Dashboard
            </h1>
            <p className="text-xs text-blue-200 hidden sm:block">
              Welcome back, Administrator
            </p>
          </div>
        </div>

        {/* Right Side - Search + Notifications */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">

        

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors touch-manipulation"
            >
              <Bell size={18} />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden mt-3 px-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 bg-blue-600 text-white placeholder-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            autoFocus
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
        </div>
      </div>

      {/* Notification Modal with responsive positioning */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center sm:justify-end mt-16 sm:mt-16 mx-2 sm:mr-4 z-50">
          <div className="w-full max-w-sm sm:max-w-md">
            <NotificationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;