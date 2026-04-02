import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export default function ChatWindow({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-[500px] bg-slate-50">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
            msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'
          }`}>
            {/* כאן הקסם קורה - רינדור Markdown */}
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => <img {...props} className="w-10 h-10 mt-2 inline-block shadow-lg rounded-lg" />,
                table: ({ node, ...props }) => <table {...props} className="border-collapse border border-slate-200 my-2 text-xs w-full" />,
                th: ({ node, ...props }) => <th {...props} className="border border-slate-200 bg-slate-100 p-1" />,
                td: ({ node, ...props }) => <td {...props} className="border border-slate-200 p-1" />,
              }}
            >
              {msg.text}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}
