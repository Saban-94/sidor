// /components/chat/MessageBubble.tsx
import { Message } from "../../types";


interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.fromMe;

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
        isMe 
          ? 'bg-green-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
        <div className="flex items-center justify-end mt-1 gap-1">
          <span className="text-[10px] opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
