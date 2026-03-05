// /types/index.ts

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
  id: string;
  chatId: string;
  senderId: string;
  kind: MessageKind;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    duration?: number; // לאודיו
  };
  replyToId?: string;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}
