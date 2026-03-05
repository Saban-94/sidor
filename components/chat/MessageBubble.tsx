// /components/chat/MessageBubble.tsx
import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Check, CheckCheck } from "lucide-react";

export const MessageBubble = ({ msg, isMe }: { msg: Message, isMe: boolean }) => {
  return (
    <div className={cn("flex w-full mb-2", isMe ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[70%] p-3 rounded-2xl shadow-sm relative",
        isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none"
      )}>
        <p className="text-sm leading-relaxed">{msg.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-70">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && (
            <span className="opacity-70">
              {msg.status === 'read' ? <CheckCheck size={14} className="text-sky-300" /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
