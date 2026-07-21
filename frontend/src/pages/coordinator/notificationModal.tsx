import React, { useEffect, useRef, useMemo } from 'react';
import { X, Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
  senderId?: string;
  senderName?: string;
  senderRole?: string;
  conversationId?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (notificationId: string, conversationId?: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationModal: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Deduplicate and categorize notifications
  const [unreadNotifications, readNotifications] = useMemo(() => {
    const unread: Notification[] = [];
    const read: Notification[] = [];
    const seen = new Set<string>();
    
    notifications.forEach(notification => {
      const key = `${notification.conversationId}-${notification.senderId}-${notification.message}-${new Date(notification.createdAt).getTime()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        if (notification.read) {
          read.push(notification);
        } else {
          unread.push(notification);
        }
      }
    });
    
    return [unread, read];
  }, [notifications]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification._id, notification.conversationId);
    }
    if (notification.type === 'chat' && notification.conversationId) {
      navigate('/employee-chat', {
        state: {
          conversationId: notification.conversationId,
          senderId: notification.senderId,
        },
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div
        ref={panelRef}
        className="bg-white w-full max-w-md h-full shadow-lg flex flex-col animate-slide-in"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <Bell size={20} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {unreadNotifications.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close notifications"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
          </span>
          {unreadNotifications.length > 0 && (
            <button
              onClick={() => {
                onMarkAllAsRead();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Bell size={40} className="text-gray-300 mb-2" />
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                You'll see notifications about new messages here
              </p>
            </div>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50">Unread</h3>
                  <div className="divide-y divide-gray-100">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={`unread-${notification._id}`}
                        className="p-4 hover:bg-blue-50 transition-colors cursor-pointer bg-blue-50"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-medium text-gray-800">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            {notification.senderName && (
                              <p className="text-xs text-gray-500 mt-1">
                                From: {notification.senderName} ({notification.senderRole})
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {readNotifications.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50">Earlier</h3>
                  <div className="divide-y divide-gray-100">
                    {readNotifications.map((notification) => (
                      <div
                        key={`read-${notification._id}`}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-medium text-gray-800">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            {notification.senderName && (
                              <p className="text-xs text-gray-500 mt-1">
                                From: {notification.senderName} ({notification.senderRole})
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;