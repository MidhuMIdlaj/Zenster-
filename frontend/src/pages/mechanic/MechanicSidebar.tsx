import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, PenTool as Tool, History, Settings, LogOut, MessageSquare, X } from 'lucide-react';
import { selectEmployeeAuthData } from '../../store/selectors';
import { clearEmployeeAuth } from '../../store/EmployeeAuthSlice';
import ConfirmationDialog from '../../components/reusableComponent/ConfirmationDialog';
import { io, Socket } from 'socket.io-client';
import { NotificationService } from '../../api/NotificationService/NotificationService';

interface MechanicSidebarProps {
  activePage: string;
  unreadCount: number; 
  onClose?: () => void;
  onLogoutClick: () => void; // Add this prop
}

const MechanicSidebar: React.FC<MechanicSidebarProps> = ({ 
  activePage, 
  onClose,
  onLogoutClick // Receive the handler from parent
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const token = employeeData?.token;
  const userId = employeeData?.id;

  const showToast = (notification: any) => {
    if (location.pathname === "/mechanic/chat" && notification.type === "chat") return;

    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm transform transition-all duration-300 translate-x-full';
    
    let content = '';
    if (notification.type === 'video_call') {
      content = `
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1H4v8l4-2 4 2 4-2V6z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">${notification.title}</p>
            <p class="text-sm text-gray-500">${notification.message}</p>
            <a href="${notification.callLink}" class="text-sm text-blue-600 hover:underline mt-1 inline-block">Join Call</a>
          </div>
          <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      `;
    } else {
      content = `
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">${notification.title}</p>
            <p class="text-sm text-gray-500 truncate">${notification.message}</p>
          </div>
          <button class="flex-shrink-0 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      `;
    }

    toast.innerHTML = content;
    document.body.appendChild(toast);

    const link = toast.querySelector('a');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(notification.callLink.replace('http://localhost:5173', ''));
        toast.remove();
      });
    }

    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, 10000);
  };
  
  useEffect(() => {
    const storedCount = localStorage.getItem('mechanicUnreadChat');
    if (storedCount) setUnreadMessages(parseInt(storedCount));
  }, []);
  
  const isActive = (page: any) => {
    return activePage === page ? 
      'bg-blue-700 text-white shadow-md' : 
      'text-gray-300 hover:bg-blue-700/50 hover:text-white';
  };
  
  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        if (!userId) return;
        
        const storedCount = localStorage.getItem('mechanicUnreadChat');
        if (storedCount) {
          setUnreadMessages(parseInt(storedCount));
        }
        
        const response = await NotificationService.getUnreadChatNotifications(userId, 'mechanic');
        if (response.success) {
          setUnreadMessages(response.notifications.length);
          localStorage.setItem('mechanicUnreadChat', response.notifications.length.toString());
        }
      } catch (error) {
        console.error("Error initializing mechanic chat count:", error);
      }
    };
    fetchInitialCount();
  }, [userId]);

  useEffect(() => {
    if (!token || !userId) return;

    const newSocket = io(import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_user_room', userId);
      newSocket.emit('join_role_room', 'mechanic');
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('Mechanic sidebar socket error:', error);
    });

    newSocket.on('new_chat_notification', (notification) => {
      if (location.pathname !== '/mechanic/chat') {
        const newCount = unreadMessages + 1;
        setUnreadMessages(newCount);
        localStorage.setItem('mechanicUnreadChat', newCount.toString());
      }
    });

    newSocket.on('new_message', (notification) => {
      if (location.pathname !== '/mechanic/chat') {
        const newCount = unreadMessages + 1;
        setUnreadMessages(newCount);
        localStorage.setItem('mechanicUnreadChat', newCount.toString());
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    });

    newSocket.on('all_chat_notifications_read', () => {
      setUnreadMessages(0);
      localStorage.setItem('mechanicUnreadChat', '0');
    });

    newSocket.on('new_video_call_notification', (notification) => {
      if (notification.recipientType === 'mechanic') {
        if ('vibrate' in navigator) navigator.vibrate(200);
        
        showToast({
          title: 'Video Call Invitation',
          message: notification.message,
          type: 'video_call',
          callLink: notification.callLink,
        });
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new_chat_notification');
      newSocket.off('new_message');
      newSocket.off('all_chat_notifications_read');
      newSocket.off('new_video_call_notification');
      newSocket.off('error');
      newSocket.disconnect();
    };
  }, [token, userId, location.pathname, unreadMessages]);

  useEffect(() => {
    if (location.pathname === '/mechanic/chat') {
      setUnreadMessages(0);
      localStorage.setItem('mechanicUnreadChat', '0');
    }
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };
  
  const getInitials = () => {
    if (!employeeData) return 'ME';
    const name = employeeData.employeeName || '';
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  };

  return (
    <div className="h-full w-64 bg-blue-800 shadow-lg transition-all flex flex-col">
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Header */}
      <div className="p-5 border-b border-blue-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Tool size={28} className="text-white" />
          <h1 className="text-xl font-bold text-white">Zenster</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wider text-blue-400 mb-2">Main Menu</p>
          <nav className="space-y-1">
            <button 
              onClick={() => handleNavigation("/mechanic/dashboard")}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all touch-manipulation min-h-[44px] ${isActive('dashboard')}`}
            >
              <Home size={20} className="mr-3 flex-shrink-0" />
              <span className="font-medium truncate">Dashboard</span>
            </button>
            
            <button 
              onClick={() => handleNavigation("/mechanic/tasks")}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all touch-manipulation min-h-[44px] ${isActive('tasks')}`}
            >
              <Tool size={20} className="mr-3 flex-shrink-0" />
              <span className="font-medium truncate">My Tasks</span>
            </button>
            
            <button 
              onClick={() => handleNavigation("/mechanic/chat")}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all touch-manipulation min-h-[44px] ${isActive('chat')}`}
            >
              <div className="mr-3 flex-shrink-0">
                <MessageSquare size={20} />
              </div>
              <span className="font-medium truncate">Chat with coordinator</span>
            </button>
          </nav>
        </div>
        
        {/* Account Section */}
        <div>
          <p className="text-xs uppercase tracking-wider text-blue-400 mb-2">Account</p>
          <nav className="space-y-1">
            <button 
              onClick={() => {
                onLogoutClick(); // Call parent handler
                if (onClose) onClose();
              }}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600/70 hover:text-white transition-all touch-manipulation min-h-[44px]"
            >
              <LogOut size={20} className="mr-3 flex-shrink-0" />
              <span className="font-medium truncate">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Profile Section at Bottom */}
      <button 
        onClick={() => handleNavigation('/mechanic/profile')}
        className="w-full p-4 border-t border-blue-700 hover:bg-blue-700/50 transition-colors flex-shrink-0"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-medium text-sm">{getInitials()}</span>
          </div>
          <div className="min-w-0 text-left">
            <p className="text-white font-medium text-sm truncate">
              {employeeData?.employeeName || 'Unknown'}
            </p>
            <p className="text-blue-300 text-xs">Mechanic</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MechanicSidebar;