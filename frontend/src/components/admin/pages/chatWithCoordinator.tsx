import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  ChevronLeft,
  Send,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Clock,
  CheckCheck,
  Users,
} from "lucide-react";
import { fetchEmployees } from "../../../api/admin/Employee";
import { useSelector } from "react-redux";
import { selectAdminAuthData } from "../../../store/selectors";
import { ChatService } from "../../../api/chatService.ts/chatApi";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import ImageModal from "../../ImageModal";

interface Coordinator {
  id: string;
  name: string;
  avatar: string;
  status: "available" | "busy" | "offline";
  lastMessage: string;
  time: string;
  unreadCount?: number;
  employeeId: string;
  role: "coordinator";
  hasNewMessages?: boolean;
  newMessagesCount?: number;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  file?: File;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  time: string;
  isDelivered?: boolean;
  isRead?: boolean;
  messageType?: "text" | "task" | "urgent" | "file";
  conversationId: string;
  senderRole: string;
  receiverRole: string;
  attachments?: Attachment[];
  isOptimistic?: boolean;
}

const formatMessage = (message: any): ChatMessage => ({
  ...message,
  id: message.id || message._id || `temp-${Date.now()}`,
  time: new Date(message.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  isDelivered: message.isDelivered !== undefined ? message.isDelivered : true,
  isRead: message.isRead !== undefined ? message.isRead : false,
});

const determineMessageType = (text: string): "text" | "task" | "urgent" => {
  if (/urgent|asap|immediately|important/i.test(text)) return "urgent";
  if (/task|todo|action item/i.test(text)) return "task";
  return "text";
};

const AdminCoordinatorChat: React.FC = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] =
    useState<Coordinator | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [unreadConversations, setUnreadConversations] = useState<Record<string, number>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string>("");
  const [showImageModal, setShowImageModal] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const { adminData } = useSelector(selectAdminAuthData);
  const userId = adminData?.id;
  const token = adminData?.token;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessageSafely = (newMessage: ChatMessage) => {
    return (prev: ChatMessage[]) => {
      const exists = prev.some(msg =>
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
    };
  };

  const updateOptimisticMessage = (tempId: string, realMessage: ChatMessage) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === tempId
          ? { ...realMessage, time: new Date(realMessage.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
          : msg
      )
    );
  };

  const initializeSocket = useCallback(() => {
    if (!userId || !token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    socketRef.current = io(import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
      socketRef.current?.emit("join_user_room", userId);
    });

    socketRef.current.on("new_message", (message: ChatMessage) => {
      const conversationId = message.conversationId;
      const isCurrentConversation = selectedCoordinator &&
        conversationId === [userId, selectedCoordinator.employeeId].sort().join('_');

      if (!isCurrentConversation) {
        setUnreadConversations(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));
      }

      const formattedMessage = formatMessage(message);

      // Update coordinators list with new message
      setCoordinators(prev => prev.map(coord => {
        const coordConversationId = [userId, coord.employeeId].sort().join('_');
        if (coordConversationId === conversationId) {
          return {
            ...coord,
            lastMessage: message.text || 'File attachment',
            time: new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
        return coord;
      }).sort((a, b) => {
        // Re-sort by time - most recent first
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      }));

      // If it's our own message, update the optimistic one, otherwise add new message
      if (message.senderId === userId) {
        // Find and update optimistic message
        setMessages(prev => {
          const optimisticIndex = prev.findIndex(msg =>
            msg.isOptimistic &&
            msg.senderId === userId &&
            msg.conversationId === message.conversationId &&
            Math.abs(new Date(msg.time).getTime() - new Date(message.time).getTime()) < 5000
          );

          if (optimisticIndex !== -1) {
            // Update optimistic message with real data
            const updated = [...prev];
            updated[optimisticIndex] = { ...formattedMessage, isOptimistic: false };
            return updated;
          } else {
            // No optimistic message found, add the message
            return addMessageSafely(formattedMessage)(prev);
          }
        });
      } else {
        // Message from someone else
        setMessages(prev => addMessageSafely(formattedMessage)(prev));
      }
    });

    socketRef.current.on("message_read", ({ conversationId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.conversationId === conversationId && msg.receiverId === userId
            ? { ...msg, isRead: true }
            : msg
        )
      );
    });

    socketRef.current.on("user_status_update", (update: { userId: string; status: string }) => {
      setCoordinators(prev => prev.map(coordinator =>
        coordinator.employeeId === update.userId
          ? {
            ...coordinator,
            status:
              update.status === "available" || update.status === "busy" || update.status === "offline"
                ? update.status
                : "offline"
          }
          : coordinator
      ));
    });

    socketRef.current.on("message_delivered", ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isDelivered: true } : msg
        )
      );
    });

    socketRef.current.on("message_read", ({ messageId }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userId, token, selectedCoordinator]);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [initializeSocket]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Use the actual MIME type from the file
        const fileType = file.type;

        // Mock upload progress
        await new Promise(resolve => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        });

        newAttachments.push({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: fileType,
          size: file.size,
          file,
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetchEmployees(1, 10);
        const employees = response.data.employees || [];

        const coordinatorsWithMessages = await Promise.all(
          employees
            .filter((e: any) => e.position?.toLowerCase() === "coordinator")
            .map(async (e: any) => {
              const history = await ChatService.getChatHistory(
                userId!,
                e.id
              );
              const lastMessage = history.length > 0
                ? history[history.length - 1]
                : null;
              return {
                id: e.id,
                name: e.employeeName,
                avatar: e.employeeName?.slice(0, 2).toUpperCase() || "CO",
                status: e.status || "offline",
                lastMessage: lastMessage?.text || "No messages yet",
                time: lastMessage
                  ? new Date(lastMessage.time).toISOString()
                  : "",
                employeeId: e.id,
                role: "coordinator"
              };
            })
        );

coordinatorsWithMessages.sort((a, b) => {
  if (!a.time && !b.time) return 0;
  if (!a.time) return 1;
  if (!b.time) return -1;
  return new Date(b.time).getTime() - new Date(a.time).getTime();
});

setCoordinators(coordinatorsWithMessages);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadData();
  }, [userId]);

  const loadChatHistory = useCallback(async () => {
    if (!selectedCoordinator || !userId) return;

    try {
      const history = await ChatService.getChatHistory(
        userId,
        selectedCoordinator.employeeId
      );
      setMessages(history.map(formatMessage));
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, [selectedCoordinator, userId]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectCoordinator = async (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);

    if (userId && coordinator.employeeId) {
      const conversationId = [userId, coordinator.employeeId].sort().join('_');

      // Mark messages as read
      await ChatService.markMessagesAsRead(conversationId, userId);

      // Clear unread count
      setUnreadConversations(prev => ({
        ...prev,
        [conversationId]: 0
      }));

      // Load chat history
      const history = await ChatService.getChatHistory(userId, coordinator.employeeId);
      setMessages(history.map(formatMessage));
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedCoordinator || !userId) return;

    const messageText = newMessage.trim();
    const conversationId = [userId, selectedCoordinator.employeeId].sort().join('_');
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    setUnreadConversations(prev => {
      const updated = { ...prev };
      delete updated[conversationId];
      return updated;
    });

    await ChatService.markMessagesAsRead(conversationId, userId);

    if (socketRef.current) {
      socketRef.current.emit('mark_all_chat_notifications_read', { userId });
    }

    const tempMessage: ChatMessage = {
      id: tempId,
      senderId: userId,
      receiverId: selectedCoordinator.employeeId,
      text: messageText,
      time: new Date().toISOString(),
      isDelivered: false,
      isRead: false,
      messageType: attachments.length > 0 ? 'file' : determineMessageType(messageText),
      conversationId,
      senderRole: "admin",
      receiverRole: "coordinator",
      attachments: attachments.length > 0 ? attachments : undefined,
      isOptimistic: true,
    };

    const filesToSend = attachments.map((att) => att.file!).filter(Boolean); // Use stored File objects

    try {
      // Clear input immediately
      setNewMessage("");
      setAttachments([]);

      // Add optimistic message
      setMessages(prev => addMessageSafely(formatMessage(tempMessage))(prev));

      const savedMessage = await ChatService.sendMessage(tempMessage, filesToSend);

      // Update optimistic message with real message data
      updateOptimisticMessage(tempId, savedMessage);

      // Emit through socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit("send_message", savedMessage, (deliveryConfirmation: any) => {
          if (deliveryConfirmation?.success) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === tempId
                  ? { ...msg, id: savedMessage.id, isDelivered: true, attachments: savedMessage.attachments }
                  : msg
              )
            );
          }
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (socketRef.current && socketConnected && selectedCoordinator) {
      socketRef.current.emit("typing", {
        conversationId: [userId, selectedCoordinator.employeeId]
          .sort()
          .join("_"),
        userId,
      });
    }
  };

  const filteredCoordinators = coordinators.filter(
    (coordinator) =>
      coordinator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coordinator.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getMessageTypeStyle = (messageType?: string) => {
    switch (messageType) {
      case "urgent":
        return "border-l-4 border-red-500 bg-red-50";
      case "task":
        return "border-l-4 border-blue-500 bg-blue-50";
      default:
        return "";
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl overflow-hidden h-[calc(100vh)]">
      {/* Connection Status Indicator */}
      <div
        className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-sm font-medium ${socketConnected
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
          }`}
      >
      </div>
      {!selectedCoordinator ? (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Chat with Coordinators
              </h2>
            </div>
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search coordinators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Coordinators List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && page === 1 ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredCoordinators.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No coordinators found
              </div>
            ) : (
              filteredCoordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  className="group relative bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-xl p-4 cursor-pointer transform hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md border border-white/50"
                  onClick={() => handleSelectCoordinator(coordinator)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-lg">
                          {coordinator.avatar}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(
                          coordinator.status
                        )} rounded-full border-2 border-white`}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {coordinator.name}
                          </h3>
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-1">
                            <div className="flex items-center">
                              <Users size={12} className="mr-1" />
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Coordinator
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {coordinator.lastMessage}
                          </p>
                        </div>

                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <span className="text-xs text-gray-500">
                            {coordinator.time}
                          </span>
                          {unreadConversations[[userId, coordinator.employeeId].sort().join('_')] > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadConversations[[userId, coordinator.employeeId].sort().join('_')]}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCoordinator(null)}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {selectedCoordinator.avatar}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        selectedCoordinator.status
                      )} rounded-full border-2 border-white`}
                    ></div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedCoordinator.name}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Coordinator
                      </span>
                      <span>{selectedCoordinator.employeeId}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {selectedCoordinator.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <button className="p-2 rounded-full hover:bg-blue-100 transition-colors">
                  <MoreVertical size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/30">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${index}`}
                className={`flex ${message.senderId === userId ? "justify-end" : "justify-start"
                  }`}
              >
                <div className="max-w-xs lg:max-w-md">
                  {message.senderId !== userId && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">
                      {selectedCoordinator?.name}
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${message.senderId === userId
                        ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-md ${message.isOptimistic ? 'opacity-70' : ''}`
                        : `bg-white text-gray-800 rounded-tl-md border border-gray-100 ${getMessageTypeStyle(
                          message.messageType
                        )}`
                      }`}
                  >
                    {message.text && <p className="break-words">{message.text}</p>}

                    {/* Render attachments */}
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
                      className={`flex items-center justify-between mt-2 text-xs ${message.senderId === userId ? "text-blue-100" : "text-gray-500"
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
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input - Fixed Bottom Alignment */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-blue-100 p-4 mt-auto">
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="relative group">
                    {attachment.type === 'image' ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
                        <div className="text-center p-1">
                          <Paperclip size={14} className="mx-auto text-gray-500" />
                          <p className="text-xs text-gray-600 truncate w-14">{attachment.name}</p>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="flex items-end space-x-3 relative">
              <div className="flex space-x-1 mb-1 flex-shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Paperclip size={20} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Smile size={20} className="text-gray-500" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files)}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    socketConnected ? "Type your message..." : "Connecting..."
                  }
                  disabled={!socketConnected}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 resize-none"
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && attachments.length === 0) || !socketConnected}
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg flex-shrink-0"
              >
                <Send size={18} />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-14 left-14 z-10">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={300}
                    height={350}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

export default AdminCoordinatorChat;