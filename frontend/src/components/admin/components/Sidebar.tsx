import React, { useState, useEffect } from 'react';
import { 
  Users, Layers, BarChart2, 
  ChevronDown, ChevronRight, 
  LogOut, AlertTriangle, 
  MessageSquare, Video, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearAdminAuth } from '../../../store/AdminAuthSlice';
import { selectAdminAuthData } from '../../../store/selectors';
import { NotificationService } from '../../../api/NotificationService/NotificationService';

interface NavItemData {
  icon: React.ReactNode;
  label: string;
  section?: string;
  subItems?: string[];
  path?: string;
  onClick?: () => void;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const { adminData } = useSelector(selectAdminAuthData);
  const token = adminData?.token;
  const userId = adminData?.id;

  useEffect(() => {
    const storedCount = localStorage.getItem('adminUnreadChat');
    if (storedCount) setUnreadMessages(parseInt(storedCount));
  }, []);

  useEffect(() => {
    return () => {
      setHoveredItem(null);
      setExpandedItems({});
    };
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeNavItem = navItems.find(item => item.path === currentPath);
    setHoveredItem(null);
    setExpandedItems({});

    if (activeNavItem) {
      setActiveItem(activeNavItem.label);
      if (activeNavItem.label === 'Chat') {
        setUnreadMessages(0);
        localStorage.setItem('adminUnreadChat', '0');
      }
    }
    setHoveredItem(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!token || !userId) return;

    const fetchUnreadChatCount = async () => {
      try {
        const response = await NotificationService.getUnreadChatNotifications(userId, 'coordinator');
        const unreadCount = response?.notifications?.length ?? 0;
        setUnreadMessages(unreadCount);
        localStorage.setItem('adminUnreadChat', unreadCount.toString());
      } catch (error) {
        console.error("Error fetching unread chat count:", error);
      }
    };

    fetchUnreadChatCount();
  }, [token, userId]);

  const handleLogout = async () => {
    try {
      await dispatch(clearAdminAuth());
      navigate('/admin-login');
    } catch (error) {
      console.error("Error while logging out", error);
    }
  };

  const navItems: NavItemData[] = [
    { icon: <BarChart2 size={20} />, label: 'Dashboard', path: "/admin/dashboard" },
    { icon: <Users size={20} />, label: 'Customers Management', path: "/admin/customers" },
    { icon: <Layers size={20} />, label: 'Employee management', path: "/admin/employees" },
    { icon: <AlertTriangle size={20} />, label: 'Complaint management', path: "/admin/Complaint" },
    { icon: <MessageSquare size={20} />, label: 'Chat With Coordinator', path: "/admin/chat" },
    { icon: <Video size={20} />, label: 'Video Call', path: "/admin/video-call" },
    { icon: <LogOut size={20} />, label: 'Logout', onClick: handleLogout },
  ];

  const goToPath = async (item: NavItemData) => {
    setHoveredItem(null);
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (item.onClick) {
      item.onClick();
      if (!item.path) return;
    }
    if (item.path) {
      setActiveItem(item.label);
      navigate(item.path);
      if (onClose) onClose(); // Close sidebar on mobile after navigation
    }
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="fixed h-screen flex flex-col w-72 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 font-poppins shadow-xl z-50 lg:relative lg:translate-x-0"
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white"
        >
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg"
            >
              Z
            </motion.div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">Zenster</span>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 180 }}
            className="text-gray-500 cursor-pointer p-1 rounded-lg hover:bg-gray-200 transition-all hidden lg:block"
          >
            <ChevronDown size={20} strokeWidth={2} />
          </motion.div>
        </motion.div>
        
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          <nav className="px-3 py-6 space-y-1">
            {navItems.map((item) => (
              <div key={item.label} className="mb-1">
                {item.section && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 mt-6 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {item.section}
                  </motion.p>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onHoverStart={() => setHoveredItem(item.label)}
                  onHoverEnd={() => setHoveredItem(null)}
                >
                  <div 
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                      ${activeItem === item.label ? 'bg-blue-100 text-blue-600 shadow-md' : 'text-gray-700 hover:bg-gray-200'}
                    `}
                    onClick={() => goToPath(item)}
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{
                          color: activeItem === item.label 
                            ? '#2563eb' 
                            : hoveredItem === item.label 
                              ? '#3b82f6' 
                              : '#4b5563'
                        }}
                      >
                        {item.icon}
                      </motion.div>
                      <span className={`font-medium ${
                        activeItem === item.label ? 'font-semibold' : ''
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    {item.subItems && (
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.label);
                        }}
                        animate={{ 
                          rotate: expandedItems[item.label] ? 90 : 0,
                          color: activeItem === item.label 
                            ? '#2563eb' 
                            : hoveredItem === item.label 
                              ? '#3b82f6' 
                              : '#6b7280'
                        }}
                        transition={{ duration: 0.2 }}
                        className="p-1 hover:bg-gray-100 rounded-md"
                      >
                        <ChevronRight size={18} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
                {item.subItems && (
                  <AnimatePresence>
                    {expandedItems[item.label] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-12 pt-1 space-y-1"
                      >
                        {item.subItems.map(subItem => (
                          <motion.div
                            key={subItem}
                            whileHover={{ x: 5 }}
                            className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all
                              ${activeItem === subItem 
                                ? 'bg-blue-50 text-blue-600 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'}
                            `}
                            onClick={() => {
                              setActiveItem(subItem);
                            }}
                          >
                            {subItem}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 p-5 border-t border-gray-200 bg-white sticky bottom-0"
        >
          <motion.button
            whileHover={{ 
              scale: 1.03,
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              setHoveredItem(null);
              setExpandedItems({});
              await new Promise(resolve => requestAnimationFrame(resolve));
              navigate('/admin/profilePage');
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <span>Profile Page</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Sidebar;