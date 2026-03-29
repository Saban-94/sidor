'use client';

import { useState, useEffect } from 'react';
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [mounted, setMounted] = useState(false);
  const isMe = message.fromMe;
  const bodyText = message.body || message.content || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  // פונקציה שמזהה ומציגה תמונות מתוך לינקים של גוגל דרייב
  const renderMessageBody = (body: string) => {
    if (!body || typeof body !== 'string') {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{'(Empty message)'}</p>;
    }

    // Regex שמחפש את ה-ID של הקובץ מתוך הלינק שנוצר בשרת
    const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/;
    const match = body.match(drivePattern);

    if (match && match[1]) {
      const fileId = match[1];
      // יצירת לינק תצוגה ישיר שגוגל מאפשרת להטמיע ב-img src
      const directImageUrl = `https://lh3.googleusercontent.com/u/0/d/${fileId}`;

      return (
        <div className="flex flex-col gap-2">
          <div className="relative group overflow-hidden rounded-lg border border-white/10">
            <img 
              src={directImageUrl} 
              alt="Uploaded file" 
              className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // אם הקובץ אינו תמונה או שיש בעיית הרשאות, נחזור להצגת הלינק כטקסט
                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
          <a 
            href={body} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`text-[11px] underline flex items-center gap-1 ${isMe ? 'text-saban-dark/70' : 'text-emerald-400'}`}
          >
            {'📎 לצפייה בדרייב ↗'}
          </a>
        </div>
      );
    }

    // אם זה טקסט רגיל
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{body}</p>;
  };

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  return (
    <div className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
          isMe
            ? 'bg-saban-emerald text-saban-dark rounded-bl-none'
            : 'bg-saban-surface text-white rounded-br-none border border-white/20'
        }`}
      >
        {renderMessageBody(bodyText)}
        
        <div className="flex items-center justify-end mt-1 gap-1">
          <span className={`text-[10px] ${isMe ? 'opacity-60' : 'opacity-70 text-saban-muted'}`}>
            {mounted ? (
              new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            ) : (
              <span className="w-10 h-3 bg-gray-600 rounded animate-pulse" />
            )}
          </span>
          {isMe && message.status && (
            <span className={`text-[10px] ${message.status === 'read' ? 'text-blue-500' : ''}`}>
              {mounted ? getStatusSymbol(message.status) : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
