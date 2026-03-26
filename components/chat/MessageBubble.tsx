// /components/chat/MessageBubble.tsx
import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.fromMe;

  return (
    <div className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
          isMe
            ? 'bg-saban-emerald text-saban-dark rounded-bl-none'
            : 'bg-saban-surface text-white rounded-br-none border border-white/20'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
        <div className="flex items-center justify-end mt-1 gap-1">
          <span className={`text-[10px] ${isMe ? 'opacity-60' : 'opacity-70 text-saban-muted'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isMe && message.status && (
            <span className="text-[10px]">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
