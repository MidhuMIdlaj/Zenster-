import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
  checkedIn: boolean;
  setCheckedIn: (checkedIn: boolean) => void;
  notifications: number;
  onNotificationClick: () => void;
  socket: any | null;
}

export default function Header({ userName, userRole, checkedIn, setCheckedIn, notifications, onNotificationClick }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(notifications);

  useEffect(() => {
    setUnreadCount(notifications);
  }, [notifications]);

  return (
    <div className="bg-indigo-900 text-white px-8 py-6 rounded-lg mb-6 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="rounded-full bg-white p-1">
              <div className="rounded-full bg-indigo-500 w-12 h-12 flex items-center justify-center text-white text-base font-bold">
                {userName?.charAt(0) || 'C'}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <p className="text-xl font-semibold">
              Hi {userName} <span className="text-indigo-300">({userRole})</span>
            </p>
            <p className="text-xs text-indigo-300">Welcome back! Your dashboard is ready</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => {
                onNotificationClick();
              }}
              className="p-2 rounded-full hover:bg-indigo-800 transition-colors duration-200 focus:outline-none"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}