import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChevronLeft, Send, Search, Paperclip, Smile, CheckCheck, Users, Clock } from 'lucide-react';
import { fetchEmployees } from '../../api/admin/Employee';
import { useSelector } from 'react-redux';
import { selectEmployeeAuthData } from '../../store/selectors';
import { ChatService } from '../../api/chatService.ts/chatApi';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import ImageModal from '../../components/ImageModal'; // Import emoji picker

interface Coordinator {
  id: number | string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
  unreadCount?: number;
  employeeId: string;
  location?: string;
  status: 'available' | 'busy' | 'offline';
  role: 'coordinator';
  email?: string;
  phone?: string;
  department?: string;
  joinDate?: string;
  newMessagesCount?: number;
  hasNewMessages?: boolean;
}

interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  time: string;
  isDelivered?: boolean;
  isRead?: boolean;
  messageType?: 'text' | 'task' | 'urgent' | 'file';
  conversationId: string;
  senderRole: string;
  receiverRole: string;
  attachments?: Attachment[];
  isOptimistic?: boolean;
}

const formatMessage = (message: any): ChatMessage => ({
  ...message,
  id: message._id || message.id || `temp-${Date.now()}`,
  time: new Date(message.time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }),
  isDelivered: message.isDelivered !== undefined ? message.isDelivered : false,
  isRead: message.isRead !== undefined ? message.isRead : false,
});

const determineMessageType = (text: string | undefined, hasFiles: boolean): 'text' | 'task' | 'urgent' | 'file' => {
  if (hasFiles) return 'file';
  if (!text) return 'text';
  if (/urgent|asap|immediately|important/i.test(text)) return 'urgent';
  if (/task|todo|action item/i.test(text)) return 'task';
  return 'text';
};

const ChatWithCoordinators: React.FC = () => {
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [unreadConversations, setUnreadConversations] = useState<Record<string, number>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const { employeeData } = useSelector(selectEmployeeAuthData);
  const userId = employeeData?.id;
  const token = employeeData?.token;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null); 

  const addMessageSafely = (newMessage: ChatMessage) => {
    setMessages((prev) => {
      const exists = prev.some(
        (msg) =>
          msg.id === newMessage.id ||
          (msg.conversationId === newMessage.conversationId &&
           msg.senderId === newMessage.senderId &&
           msg.text === newMessage.text &&
           Math.abs(new Date(msg.time).getTime() - new Date(newMessage.time).getTime()) < 1000)
      );
      if (exists) {
        return prev;
      }
      return [...prev, newMessage];
    });
  };

  const updateOptimisticMessage = (tempId: string | number, realMessage: ChatMessage) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === tempId
          ? {
              ...formatMessage(realMessage),
              id: realMessage.id || realMessage.id,
              isDelivered: realMessage.isDelivered !== undefined ? realMessage.isDelivered : true,
            }
          : msg
      )
    );
  };

  // Handle clicking outside the emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false); 
  };

useEffect(() => {
  const loadCoordinators = async () => {
    try {
      setLoading(true);
      const response = await fetchEmployees(page, 10);
      const employees = response.data.employees || [];
      const coordinatorsWithMessages = await Promise.all(
        employees
          .filter((employee: any) => employee.position?.toLowerCase() === 'coordinator')
          .map(async (employee: any) => {
            const history = await ChatService.getChatHistory(
              userId!, 
              employee.id 
            );
            const lastMessage = history.length > 0 
              ? history[history.length - 1] 
              : null;

            return {
              id: employee.id || Math.random() * 1000,
              name: employee.employeeName || 'Unknown Coordinator',
              avatar: employee.avatar || employee.employeeName?.slice(0, 2).toUpperCase() || '??',
              lastMessage: lastMessage?.text || 'No messages yet',
              time: lastMessage 
                ? new Date(lastMessage.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "",
              sortableTime: lastMessage ? new Date(lastMessage.time).toISOString() : "", // <-- added for sorting
              isOnline: employee.status === 'available' || employee.status === 'busy',
              unreadCount: employee.unreadCount || 0,
              employeeId: employee.id || `COORD_${employee._id}`,
              location: employee.address || 'Unknown Location',
              status: employee.status || 'offline',
              role: 'coordinator',
              email: employee.email,
              phone: employee.phone,
              department: employee.department || 'Coordination',
            };
          })
      );

      coordinatorsWithMessages.sort((a, b) => {
        if (!a.sortableTime && !b.sortableTime) return 0;
        if (!a.sortableTime) return 1;
        if (!b.sortableTime) return -1;
        return new Date(b.sortableTime).getTime() - new Date(a.sortableTime).getTime();
      });

      setCoordinators((prev) => (page === 1 ? coordinatorsWithMessages : [...prev, ...coordinatorsWithMessages]));
      setHasMore(coordinatorsWithMessages.length === 10);
    } catch (error) {
      console.error('Failed to fetch coordinators:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userId) loadCoordinators(); 
}, [page, userId]);


  useEffect(() => {
    if (!userId || !token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io( import.meta.env.VITE_REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setSocketConnected(true);
      socketRef.current?.emit('join_user_room', userId, () => {
      });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    socketRef.current.on('disconnect', () => {
      setSocketConnected(false);
    });

    socketRef.current.on('new_message', (message: ChatMessage) => {
      const conversationId = message.conversationId;
      const isCurrentConversation =
        selectedCoordinator &&
        conversationId === [userId, selectedCoordinator.employeeId].sort().join('_');

      if (!isCurrentConversation) {
        setUnreadConversations((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }

      // Update coordinators list with new message
      setCoordinators((prev) =>
        prev.map((coord) => {
          const coordConversationId = [userId, coord.employeeId].sort().join('_');
          if (coordConversationId === conversationId) {
            return {
              ...coord,
              lastMessage: message.text || 'File attachment',
              time: new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hasNewMessages: !isCurrentConversation,
              unreadCount: !isCurrentConversation ? (coord.unreadCount || 0) + 1 : coord.unreadCount,
            };
          }
          return coord;
        }).sort((a, b) => {
          // Re-sort by time - most recent first
          if (!a.time && !b.time) return 0;
          if (!a.time) return 1;
          if (!b.time) return -1;
          // Parse time strings to compare them
          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeB - timeA;
        })
      );

      const formattedMessage = formatMessage({
        ...message,
        id: message.id || message.id,
      });

      setMessages((prev) => {
        const optimisticIndex = prev.findIndex(
          (msg) => msg.isOptimistic && msg.id === `temp-${message.id || message.id}`
        );
        if (optimisticIndex !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[optimisticIndex] = formattedMessage;
          return updatedMessages;
        }
        if (isCurrentConversation) {
          addMessageSafely(formattedMessage);
        }
        return prev;
      });
    });

    socketRef.current.on('message_delivered', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isDelivered: true } : msg
        )
      );
    });

    socketRef.current.on('message_read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    socketRef.current.on('messages_read', ({ conversationId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.conversationId === conversationId && !msg.isRead
            ? { ...msg, isRead: true }
            : msg
        )
      );
    });

    socketRef.current.on('receive_typing', ({ conversationId, userId: typingUserId }) => {
      if (
        selectedCoordinator &&
        conversationId === [userId, selectedCoordinator.employeeId].sort().join('_') &&
        typingUserId !== userId
      ) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userId, token, selectedCoordinator]);

  useEffect(() => {
    if (selectedCoordinator && userId) {
      const loadChatHistory = async () => {
        try {
          const history = await ChatService.getChatHistory(userId, selectedCoordinator.employeeId);
          const formattedMessages = history.map(formatMessage);

          setMessages(formattedMessages);

          if (socketRef.current) {
            socketRef.current.emit('mark_messages_read', {
              conversationId: [userId, selectedCoordinator.employeeId].sort().join('_'),
              userId: userId,
            });
          }

          setCoordinators((prev) =>
            prev.map((coord) => {
              if (coord.employeeId === selectedCoordinator.employeeId) {
                return {
                  ...coord,
                  unreadCount: 0,
                  hasNewMessages: false,
                };
              }
              return coord;
            })
          );
          setUnreadConversations((prev) => ({
            ...prev,
            [[userId, selectedCoordinator.employeeId].sort().join('_')]: 0,
          }));
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      };

      loadChatHistory();
    }
  }, [selectedCoordinator, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    if (socketRef.current && socketConnected && selectedCoordinator) {
      socketRef.current.emit('typing', {
        conversationId: [userId, selectedCoordinator.employeeId].sort().join('_'),
        userId,
      });
    }
  };

  const handleSendMessage = async () => {
    if (!selectedCoordinator || !userId) return;
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    const conversationId = [userId, selectedCoordinator.employeeId].sort().join('_');
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const tempMessage: ChatMessage = {
      id: tempId,
      senderId: userId,
      receiverId: selectedCoordinator.employeeId,
      text: newMessage.trim() || undefined,
      time: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
      messageType: determineMessageType(newMessage, selectedFiles.length > 0),
      conversationId,
      senderRole: 'mechanic',
      receiverRole: 'coordinator',
      attachments: selectedFiles.length > 0
        ? selectedFiles.map((file) => ({
            url: URL.createObjectURL(file),
            type: file.type,
            name: file.name,
            size: file.size,
          }))
        : undefined,
      isOptimistic: true,
    };

    try {
      setNewMessage('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowEmojiPicker(false); // Close emoji picker on send

      setMessages((prev) => [
        ...prev,
        formatMessage(tempMessage),
      ]);

      const savedMessage = await ChatService.sendMessage(tempMessage, selectedFiles);

      updateOptimisticMessage(tempId, savedMessage);

      if (socketRef.current) {
        socketRef.current.emit('send_message', savedMessage, (deliveryConfirmation: any) => {
          if (deliveryConfirmation?.success) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempId
                  ? {
                      ...formatMessage(savedMessage),
                      id: savedMessage._id || savedMessage.id,
                      isDelivered: true,
                    }
                  : msg
              )
            );
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(tempMessage.text || '');
      setSelectedFiles(selectedFiles);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socketRef.current && socketConnected && selectedCoordinator) {
      socketRef.current.emit('typing', {
        conversationId: [userId, selectedCoordinator.employeeId].sort().join('_'),
        userId,
      });
    }
  };

  const filteredCoordinators = coordinators.filter((coordinator) => {
    const matchesSearch =
      coordinator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coordinator.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || coordinator.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getMessageTypeStyle = (messageType?: string) => {
    switch (messageType) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'task':
        return 'border-l-4 border-blue-500 bg-blue-50';
      case 'file':
        return 'border-l-4 border-green-500 bg-green-50';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl overflow-hidden h-[calc(107vh-12rem)]">
      <div
        className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-sm font-medium ${
          socketConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {!selectedCoordinator ? (
        <div className="h-full flex flex-col">
          <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Chat with Coordinators
              </h2>
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredCoordinators.filter((c) => c.isOnline).length} Online
                </div>
                <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredCoordinators.filter((c) => c.status === 'available').length} Available
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search coordinators or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" onScroll={handleScroll}>
            {loading && page === 1 ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredCoordinators.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No coordinators found</div>
            ) : (
              filteredCoordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  className="group relative bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl p-4 cursor-pointer transform hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md border border-white/50"
                  onClick={() => setSelectedCoordinator(coordinator)}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-lg">{coordinator.avatar}</span>
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                          coordinator.status
                        )} rounded-full border-2 border-white`}
                      ></div>
                    </div>
                    <div className="flex-1 ml-4 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 truncate">{coordinator.name}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Users size={12} className="mr-1" />
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">
                              Coordinator
                            </span>
                            <span>{coordinator.employeeId}</span>
                            {coordinator.location && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{coordinator.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{coordinator.time}</span>
                          {unreadConversations[
                            [userId, coordinator.employeeId].sort().join('_')
                          ] > 0 && (
                            <div className="bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                              {unreadConversations[[userId, coordinator.employeeId].sort().join('_')]}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{coordinator.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && page > 1 && (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedCoordinator(null)}
                  className="mr-3 p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-medium">{selectedCoordinator.avatar}</span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        selectedCoordinator.status
                      )} rounded-full border-2 border-white`}
                    ></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-800">{selectedCoordinator.name}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">
                        Coordinator
                      </span>
                      <span>{selectedCoordinator.employeeId}</span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{selectedCoordinator.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/30">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    message.senderId === userId
                      ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md ${
                          message.isOptimistic ? 'opacity-70' : ''
                        }`
                      : `bg-white text-gray-800 rounded-tl-md border border-gray-100 ${getMessageTypeStyle(
                          message.messageType
                        )}`
                  }`}
                >
                  {message.text && <p className="break-words">{message.text}</p>}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx} className="border-t pt-2">
                          {attachment.type.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setSelectedImage(attachment.url);
                                setSelectedImageName(attachment.name);
                                setShowImageModal(true);
                              }}
                            />
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2 text-sm hover:underline ${
                                message.senderId === userId
                                  ? 'text-white'
                                  : 'text-blue-500'
                              }`}
                            >
                              <Paperclip size={14} />
                              <span>{attachment.name}</span>
                              <span>({Math.round(attachment.size / 1024)} KB)</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    className={`flex items-center justify-between mt-2 text-xs ${
                      message.senderId === userId ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    <span>{message.time}</span>
                    {message.senderId === userId && (
                      <div className="flex items-center ml-2 space-x-0.5">
                        {message.isOptimistic ? (
                          <Clock size={14} className="text-gray-400" />
                        ) : !message.isDelivered ? (
                          <>
                            <CheckCheck size={14} className="text-red-500" />
                            <CheckCheck size={14} className="text-red-500 -ml-1" />
                          </>
                        ) : message.isRead ? (
                          <>
                            <CheckCheck size={14} className="text-green-500" />
                            <CheckCheck size={14} className="text-green-500 -ml-1" />
                          </>
                        ) : (
                          <>
                            <CheckCheck size={14} className="text-gray-500" />
                            <CheckCheck size={14} className="text-gray-500 -ml-1" />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white/90 backdrop-blur-sm border-t border-blue-100 p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Paperclip size={20} className="text-gray-500" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={socketConnected ? 'Type your message...' : 'Connecting...'}
                  disabled={!socketConnected}
                  className="w-full px-4 py-3 bg-gray-50 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Smile size={18} className="text-gray-500" />
                </button>
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-10">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || !socketConnected}
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                ))}
              </div>
            )}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => setNewMessage('Please provide project status update')}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
              >
                Status Update
              </button>
              <button
                onClick={() => setNewMessage('URGENT: ')}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
              >
                Urgent
              </button>
              <button
                onClick={() => setNewMessage('Great coordination! ')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
              >
                Praise
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <ImageModal
        isOpen={showImageModal}
        imageUrl={selectedImage || ""}
        imageName={selectedImageName}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
          setSelectedImageName("");
        }}
      />
    </div>
  );
};

export default ChatWithCoordinators;