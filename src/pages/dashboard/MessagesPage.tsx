import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  User,
  Plus,
  Filter,
  X,
} from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
  lastMessage: Message;
  unreadCount: number;
  starred?: boolean;
  projectId?: string;
  projectName?: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    participant: {
      id: "2",
      name: "Sarah Ahmed",
      avatar: "SA",
      role: "Investor",
      isOnline: true,
    },
    lastMessage: {
      id: "m1",
      senderId: "2",
      senderName: "Sarah Ahmed",
      senderAvatar: "SA",
      content: "I'm very interested in your Solar Energy Project. Can we schedule a call to discuss the investment details?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
    unreadCount: 3,
    projectId: "p1",
    projectName: "Solar Energy Initiative",
  },
  {
    id: "2",
    participant: {
      id: "3",
      name: "Mohammad Hassan",
      avatar: "MH",
      role: "Investor",
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    lastMessage: {
      id: "m2",
      senderId: "me",
      senderName: "You",
      senderAvatar: "Y",
      content: "Thank you for your interest! The funding goal is $50,000.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: true,
    },
    unreadCount: 0,
    starred: true,
  },
  {
    id: "3",
    participant: {
      id: "4",
      name: "Layla Khaled",
      avatar: "LK",
      role: "Investor",
      isOnline: true,
    },
    lastMessage: {
      id: "m3",
      senderId: "4",
      senderName: "Layla Khaled",
      senderAvatar: "LK",
      content: "The project proposal looks great! I have a few questions about the timeline.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
    },
    unreadCount: 1,
    projectId: "p2",
    projectName: "Clean Water Initiative",
  },
  {
    id: "4",
    participant: {
      id: "5",
      name: "Ahmad Nasser",
      avatar: "AN",
      role: "Investor",
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    lastMessage: {
      id: "m4",
      senderId: "5",
      senderName: "Ahmad Nasser",
      senderAvatar: "AN",
      content: "Looking forward to seeing the progress updates!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: "5",
    participant: {
      id: "6",
      name: "Fatima Omar",
      avatar: "FO",
      role: "Investor",
      isOnline: true,
    },
    lastMessage: {
      id: "m5",
      senderId: "me",
      senderName: "You",
      senderAvatar: "Y",
      content: "I'll send you the updated business plan tomorrow.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
      read: true,
    },
    unreadCount: 0,
    starred: true,
  },
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1-1",
      senderId: "2",
      senderName: "Sarah Ahmed",
      senderAvatar: "SA",
      content: "Hi! I came across your Solar Energy Project and found it very compelling.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true,
    },
    {
      id: "m1-2",
      senderId: "me",
      senderName: "You",
      senderAvatar: "Y",
      content: "Hello Sarah! Thank you for your interest. I'm happy to answer any questions you have.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
    },
    {
      id: "m1-3",
      senderId: "2",
      senderName: "Sarah Ahmed",
      senderAvatar: "SA",
      content: "I'm very interested in your Solar Energy Project. Can we schedule a call to discuss the investment details?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ],
  "2": [
    {
      id: "m2-1",
      senderId: "3",
      senderName: "Mohammad Hassan",
      senderAvatar: "MH",
      content: "What's the funding goal for this project?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true,
    },
    {
      id: "m2-2",
      senderId: "me",
      senderName: "You",
      senderAvatar: "Y",
      content: "Thank you for your interest! The funding goal is $50,000.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: true,
    },
  ],
};

const formatMessageTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatLastSeen = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return "Active now";
  if (hours < 24) return `Active ${hours}h ago`;
  return `Active ${Math.floor(hours / 24)}d ago`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages[selectedConversation.id] || []);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `m-${Date.now()}`,
      senderId: "me",
      senderName: "You",
      senderAvatar: user?.full_name?.[0] || "Y",
      content: newMessage.trim(),
      timestamp: new Date(),
      read: true,
    };

    setMessages([...messages, message]);
    setNewMessage("");
    inputRef.current?.focus();
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === "unread") return conv.unreadCount > 0;
    if (filter === "starred") return conv.starred;
    return true;
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout roleBase="/dashboard/entrepreneur">
      <motion.div 
        className="h-[calc(100vh-8rem)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="h-full flex flex-col sm:flex-row gap-6">
          {/* Conversations List */}
          <motion.div 
            className={`w-full sm:w-80 lg:w-96 shrink-0 ${selectedConversation ? 'hidden sm:flex' : 'flex'} flex-col`}
            variants={itemVariants}
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col h-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-transparent" />
              
              {/* Header */}
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Messages</h1>
                    <p className="text-sm text-muted-foreground">
                      {conversations.filter(c => c.unreadCount > 0).length} unread
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="pl-9 pr-10 h-10 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      showFilters ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </motion.button>
                </div>

                {/* Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-2"
                    >
                      {[
                        { id: "all", label: "All" },
                        { id: "unread", label: "Unread" },
                        { id: "starred", label: "Starred" },
                      ].map((f) => (
                        <motion.button
                          key={f.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFilter(f.id as typeof filter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filter === f.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          {f.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Conversations */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  <AnimatePresence mode="popLayout">
                    {filteredConversations.map((conv, index) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedConversation(conv)}
                        className={`relative group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          selectedConversation?.id === conv.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        {/* Unread indicator */}
                        {conv.unreadCount > 0 && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <motion.div 
                            className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold ${
                              selectedConversation?.id === conv.id
                                ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                                : "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary"
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {conv.participant.avatar}
                          </motion.div>
                          {conv.participant.isOnline && (
                            <motion.div
                              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-semibold truncate ${
                              conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                            }`}>
                              {conv.participant.name}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatMessageTime(conv.lastMessage.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className={`text-sm truncate ${
                              conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                            }`}>
                              {conv.lastMessage.senderId === "me" ? "You: " : ""}
                              {conv.lastMessage.content}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="shrink-0 h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conv.projectName && (
                            <Badge variant="outline" className="mt-1.5 text-xs border-primary/20 text-primary">
                              {conv.projectName}
                            </Badge>
                          )}
                        </div>

                        {/* Star indicator */}
                        {conv.starred && (
                          <Star className="h-4 w-4 fill-warning text-warning shrink-0" />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {filteredConversations.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">No conversations found</p>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>

          {/* Chat Area */}
          <motion.div 
            className="flex-1 flex flex-col min-h-0"
            variants={itemVariants}
          >
            <AnimatePresence mode="wait">
              {selectedConversation ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-transparent" />

                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedConversation(null)}
                          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                        
                        <div className="relative">
                          <motion.div 
                            className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20"
                            whileHover={{ scale: 1.05 }}
                          >
                            {selectedConversation.participant.avatar}
                          </motion.div>
                          {selectedConversation.participant.isOnline && (
                            <motion.div
                              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-foreground truncate">
                              {selectedConversation.participant.name}
                            </h2>
                            <Badge variant="outline" className="text-xs border-primary/20 text-primary">
                              {selectedConversation.participant.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedConversation.participant.isOnline
                              ? "Active now"
                              : selectedConversation.participant.lastSeen
                              ? formatLastSeen(selectedConversation.participant.lastSeen)
                              : "Offline"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Video className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>

                    {selectedConversation.projectName && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-center gap-2"
                      >
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedConversation.projectName}
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => {
                          const isMe = message.senderId === "me";
                          
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              {!isMe && (
                                <motion.div
                                  className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-primary"
                                  whileHover={{ scale: 1.1 }}
                                >
                                  {message.senderAvatar}
                                </motion.div>
                              )}
                              
                              <div className={`max-w-[70%] ${isMe ? "order-first" : ""}`}>
                                <motion.div
                                  whileHover={{ scale: 1.01 }}
                                  className={`relative px-4 py-3 rounded-2xl ${
                                    isMe
                                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-md"
                                      : "bg-muted rounded-bl-md"
                                  }`}
                                >
                                  <p className={`text-sm ${isMe ? "text-primary-foreground" : "text-foreground"}`}>
                                    {message.content}
                                  </p>
                                  
                                  {isMe && (
                                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                                      {message.read ? (
                                        <CheckCheck className="h-3 w-3 text-primary-foreground" />
                                      ) : (
                                        <Check className="h-3 w-3 text-primary-foreground/70" />
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                                
                                <div className={`flex items-center gap-2 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageTime(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t border-border bg-muted/20">
                    <div className="flex items-end gap-3">
                      <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Paperclip className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Image className="h-4 w-4" />
                        </motion.button>
                      </div>

                      <div className="flex-1 relative group">
                        <Input
                          ref={inputRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="w-full h-11 pr-12 bg-background border-border focus:border-primary focus:ring-primary/20 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Smile className="h-4 w-4" />
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-border bg-card shadow-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30"
                    >
                      <User className="h-12 w-12 text-white" />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-center"
                  >
                    <h3 className="text-xl font-semibold text-foreground">Select a conversation</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Choose a conversation from the sidebar to start messaging with investors and collaborators.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 flex gap-4"
                  >
                    {[
                      { icon: Star, text: "Star important chats" },
                      { icon: Archive, text: "Archive conversations" },
                      { icon: Phone, text: "Schedule calls" },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-primary" />
                        <span className="text-xs text-muted-foreground">{item.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MessagesPage;