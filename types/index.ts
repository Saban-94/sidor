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
