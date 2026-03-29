// /types/index.ts

/**
 * Saban-OS: הגדרות טיפוסים גלובליות
 * קובץ זה מבטיח סנכרון בין ה-API, הצינור ב-Firebase והממשק ב-Vercel
 */

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageKind = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isAgent: boolean;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;           // מזהה ייחודי של ההודעה (Firebase Push ID)
  chatId: string;       // מזהה השיחה
  senderId: string;     // מזהה השולח (מספר טלפון או ID)
  kind: MessageKind;    // סוג ההודעה
  content: string;      // תוכן ההודעה המרכזי
  
  // שדות תאימות עבור ה-UI והצינור
  body: string;         // Alias לתוכן ההודעה (לשימוש ב-MessageBubble)
  fromMe: boolean;      // האם ההודעה נשלחה מהעסק (ח. סבן) או התקבלה מהלקוח
  timestamp: number;    // זמן בפורמט Unix (למיון ותצוגה)
  
  status: MessageStatus;
  createdAt: Date | string; // תאריך יצירה
  
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    duration?: number;  // עבור הודעות קוליות
  };
  
  replyToId?: string;   // מזהה הודעה עליה הגיבו
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}

// טיפוס עזר עבור הפקודות שנשלחות לצינור של JONI
export interface JoniCommand {
  number: string;       // מספר היעד (פורמט 972...)
  text: string;         // תוכן ההודעה
  timestamp: number;
  status: 'pending' | 'sent' | 'error';
}

// SABAN HUB Extended Types
export interface CustomerIdentity {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePicture?: string;
  joinedAt: number;
  lastActive: number;
  tags?: string[];
}

export interface AIBehaviorRules {
  id: string;
  customerId: string;
  systemPrompt: string;
  dnaRules: string;  // DNA Rules for AI behavior injection
  temperature: number;
  maxTokens: number;
  responseStyle: 'formal' | 'casual' | 'professional' | 'creative';
  createdAt: number;
  updatedAt: number;
}

export interface PipelinePacket {
  id: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  source: string;
  destination: string;
  payload: Record<string, any>;
  status: 'processed' | 'pending' | 'failed';
  latency: number;  // in milliseconds
}

export interface InfrastructureConfig {
  rtdbUrl: string;
  callbackUrls: string[];
  messageThrottle: number;  // milliseconds between messages
  heartbeatInterval: number;  // milliseconds
  enableMonitoring: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface SuccessMetrics {
  totalMessages: number;
  deliveredMessages: number;
  responseTime: number;  // average in ms
  customerSatisfaction: number;  // 0-100
  automationRate: number;  // percentage of AI-handled messages
  peakHourActivity: Array<{ hour: number; count: number }>;
}

// Logistics Dashboard Types
export interface DispatchOrder {
  id: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  order_time: string;  // HH:MM format
  order_date: string;  // YYYY-MM-DD format
  items?: string;
  notes?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  assigned_driver?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DriverTimeline {
  driver_id: string;
  driver_name: string;
  orders: DispatchOrder[];
  status: 'available' | 'busy' | 'offline';
  current_location?: string;
}

export interface TimeSlot {
  time: string;        // HH:MM format
  orders: DispatchOrder[];
  isEmpty: boolean;
}

export interface LogisticsStats {
  totalOrders: number;
  deliveredToday: number;
  pendingOrders: number;
  activeDrivers: number;
  avgDeliveryTime: number;
}
