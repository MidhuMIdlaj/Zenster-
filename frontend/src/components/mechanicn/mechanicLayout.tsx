import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import MechanicSidebar from '../../pages/mechanic/MechanicSidebar';
import MechanicHeader from '../../pages/mechanic/MechanicHeader';
import NotificationPanel, { Notification } from './NotificationPanel';
import ConfirmationDialog from '../../components/reusableComponent/ConfirmationDialog';
import { selectEmployeeAuthData } from '../../store/selectors';
import { clearEmployeeAuth } from '../../store/EmployeeAuthSlice';
import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MechanicLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Add logout dialog state
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [socket, setSocket] = useState<any | null>(null);
  const token = employeeData?.token;
  const userId = employeeData?.id;
  const mechanicId = employeeData?.id || '';
  const mechanicName = `${employeeData?.employeeName || 'Unknown'} - ${employeeData?.position || 'Mechanic'}`;

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/complaints')) return 'complaints';
    if (path.includes('/history')) return 'history';
    if (path.includes('/chat')) return 'chat';
    return 'dashboard';
  };

  const fetchNotifications = useCallback(async () => {
    if (!mechanicId) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/notifications/${mechanicId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications?.filter((n: Notification) => !n.read).length || 0;
        setUnreadCount(unread);
        setGlobalUnreadCount(unread);
        localStorage.setItem('mechanicUnreadCount', unread.toString());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [mechanicId, token]);

  const upsertNotification = (incoming: any) => {
    const newNotification: Notification = {
      _id: incoming?._id || incoming?.notificationId || `message-${Date.now()}`,
      title: incoming?.title || 'New Message',
      message: incoming?.message || 'You have a new message',
      createdAt: incoming?.createdAt || new Date().toISOString(),
      read: incoming?.read ?? false,
      type: incoming?.type || 'chat',
      senderId: incoming?.senderId,
      senderName: incoming?.senderName || 'Coordinator',
      senderRole: incoming?.senderRole || 'coordinator',
      conversationId: incoming?.conversationId,
    };

    let shouldIncrement = false;
    setNotifications((prev) => {
      const duplicateById = prev.some((n) => n._id === newNotification._id);
      const duplicateKey = `${newNotification.conversationId}-${newNotification.senderId}-${newNotification.message}-${new Date(newNotification.createdAt).getTime()}`;
      const isDuplicate = duplicateById || prev.some((n) =>
        `${n.conversationId}-${n.senderId}-${n.message}-${new Date(n.createdAt).getTime()}` === duplicateKey
      );
      if (isDuplicate) return prev;
      shouldIncrement = true;
      return [newNotification, ...prev];
    });

    if (shouldIncrement) {
      setUnreadCount((prev) => prev + 1);
      setGlobalUnreadCount((prev) => prev + 1);
      localStorage.setItem('mechanicUnreadCount', `${Number(localStorage.getItem('mechanicUnreadCount') || 0) + 1}`);
    }
    return newNotification;
  };

  useEffect(() => {
    if (!userId || !token) return;

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
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error in MechanicLayout:', error);
    });

    newSocket.on('new_complaint_assigned', (data: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === data._id)) return prev;
        return [{ ...data, type: 'complaint' }, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      localStorage.setItem('mechanicUnreadCount', (globalUnreadCount + 1).toString());
      const toastId = `complaint_${data._id}`;
      if (!toast.isActive(toastId)) {
        toast.info(
          <div style={{
            padding: '12px 16px',
            borderLeft: '4px solid #0d6efd',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '4px' }}>
              📋 New Complaint Assigned
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              {data.message}
            </div>
          </div>,
          {
            toastId,
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'light',
          }
        );
      }
    });

    newSocket.on('new_message', (data: Notification) => {
      if (data.senderRole && data.senderRole !== 'coordinator' && data.senderRole !== 'admin') return;
      const newNotification = upsertNotification(data);
      const toastId = `message_${newNotification._id}`;
      if (!toast.isActive(toastId)) {
        toast.info(
          <div style={{
            padding: '12px 16px',
            borderLeft: '4px solid #0d6efd',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '4px' }}>
              📩 New Message
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              From: <strong>{newNotification.senderName} (Coordinator)</strong>
              <br />
              {newNotification.message}
            </div>
          </div>,
          {
            toastId,
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'light',
          }
        );
      }
    });

    newSocket.on('new_chat_notification', (data: Notification) => {
      upsertNotification(data);
    });

    newSocket.on('chat_notifications_read', () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setGlobalUnreadCount((prev) => Math.max(0, prev - 1));
      localStorage.setItem('mechanicUnreadCount', `${Math.max(0, Number(localStorage.getItem('mechanicUnreadCount') || 0) - 1)}`);
      fetchNotifications();
    });

    newSocket.on('all_chat_notifications_read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setGlobalUnreadCount(0);
      localStorage.setItem('mechanicUnreadCount', '0');
      fetchNotifications();
    });

    return () => {
      newSocket.off('new_complaint_assigned');
      newSocket.off('new_message');
      newSocket.off('new_chat_notification');
      newSocket.off('chat_notifications_read');
      newSocket.off('all_chat_notifications_read');
      newSocket.disconnect();
    };
  }, [userId, token, location.pathname, fetchNotifications, globalUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Logout handlers following coordinator pattern
  const handleLogout = async () => {
    try {
      await dispatch(clearEmployeeAuth());
      navigate('/employee-login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setShowLogoutConfirm(false);
    }
  };

  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  if (!mechanicId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar with responsive behavior */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-blue-800 shadow-lg z-50
        transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out lg:translate-x-0`}
      >
        <MechanicSidebar 
          activePage={getActivePage()} 
          unreadCount={globalUnreadCount}
          onClose={() => setIsSidebarOpen(false)}
          onLogoutClick={openLogoutConfirm}
        />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <MechanicHeader
          mechanicName={mechanicName}
          isCheckedIn={isCheckedIn}
          onCheckIn={() => setIsCheckedIn(true)}
          onCheckOut={() => setIsCheckedIn(false)}
          onNotificationClick={() => setShowNotifications(!showNotifications)}
          notificationCount={globalUnreadCount}
          socket={socket}
        />
        
        {/* Main content with responsive margin */}
        <main className="flex-1 lg:ml-64 pt-16 p-4 sm:p-6 overflow-auto">
          <Outlet context={{ socket }} />
        </main>
      </div>

      {/* Notification Panel with responsive positioning */}
      {showNotifications && (
        <div className="fixed inset-0 flex items-start justify-center sm:justify-end mt-16 sm:mt-16 mx-2 sm:mr-4 z-50 lg:mr-4">
          <div className="w-full max-w-sm sm:max-w-md">
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              recipientId={mechanicId}
              notifications={notifications}
              onNewNotification={(notification) => {
                setNotifications((prev) => {
                  if (prev.some((n) => n._id === notification._id)) return prev;
                  return [notification, ...prev];
                });
              }}
              onMarkAsRead={async (notificationId) => {
                await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/notification/notifications/${notificationId}/mark-read`,
                  {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                  }
                );
                setNotifications((prev) =>
                  prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
                setGlobalUnreadCount((prev) => Math.max(0, prev - 1));
                socket?.emit('chat_notifications_read', { userId, notificationId });
              }}
              onMarkAllAsRead={async () => {
                await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/notification/notifications/mark-all-chat-read`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ userId: mechanicId }),
                    credentials: 'include',
                  }
                );
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnreadCount(0);
                setGlobalUnreadCount(0);
                socket?.emit('all_chat_notifications_read', { userId });
              }}
              socket={socket}
            />
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        onClose={closeLogoutConfirm}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout from your account? You will be redirected to the login page."
        type="danger"
        confirmText="Yes, Logout"
        cancelText="Stay Logged In"
        showCloseButton={true}
      />

      <ToastContainer limit={1} />
    </div>
  );
};

export default MechanicLayout;