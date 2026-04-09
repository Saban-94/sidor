import { Message } from "@/types";
import { 
  PlayCircle, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  ChevronLeft 
} from 'lucide-react'; // וודא שספריית lucide-react מותקנת

interface MessageBubbleProps {
  message: Message & {
    suggested_media?: {
      videos?: any[];
      specs?: any[];
      message?: string;
    }
  };
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isMe = message.fromMe;
  const bodyText = message.body || message.content || '';

  const renderMessageBody = (body: string) => {
    if (!body || typeof body !== 'string') {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-70 italic">{"(הודעה ריקה)"}</p>;
    }

    // Regex לזיהוי לינקים רגילים של דרייב (כדי לשמור על תמיכה לאחור)
    const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([^\/]+)\/view/;
    const match = body.match(drivePattern);

    if (match && match[1]) {
      const fileId = match[1];
      const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

      return (
        <div className="flex flex-col gap-2">
          <div className="relative group overflow-hidden rounded-xl border border-white/10 shadow-lg">
            <img 
              src={directImageUrl} 
              alt="תצוגה מקדימה" 
              className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <a href={body} target="_blank" className={`text-[10px] font-bold ${isMe ? 'text-saban-dark/70' : 'text-emerald-400'}`}>
            📎 פתח בדרייב ↗
          </a>
        </div>
      );
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{body}</p>;
  };

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-[22px] shadow-2xl transition-all duration-300 ${
          isMe
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-saban-dark rounded-bl-none'
            : 'bg-[#1a2c3e]/80 backdrop-blur-xl text-white rounded-br-none border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
        }`}
      >
        {/* תוכן ההודעה */}
        {renderMessageBody(bodyText)}

        {/* רכיב הערך המוסף - ה-NotebookLM של סבן */}
        {!isMe && message.suggested_media && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-emerald-500/20 p-1 rounded-md">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Saban AI Expert Insights
              </span>
            </div>

            {/* רשימת כפתורי המדיה */}
            <div className="flex flex-col gap-2">
              {message.suggested_media.videos?.map((vid, idx) => (
                <a 
                  key={idx}
                  href={vid.link} 
                  target="_blank"
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-100">צפה בסרטון הדרכה</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:translate-x-[-4px] transition-transform" />
                </a>
              ))}

              {message.suggested_media.specs?.map((spec, idx) => (
                <a 
                  key={idx}
                  href={spec.link} 
                  target="_blank"
                  className="flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-3 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-50">מפרט טכני ומצגת (PDF)</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-400/50" />
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* זמן וסטטוס */}
        <div className="flex items-center justify-end mt-2 gap-1 opacity-50">
          <span className="text-[9px] font-medium uppercase">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isMe && <span className="text-[9px]">✓✓</span>}
        </div>
      </div>
    </div>
  );
};
