import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect-strong border-t border-white/10 px-4 py-4 sm:px-6"
    >
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-6xl mx-auto">
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 px-5 py-3 rounded-full
            bg-[#1a2f3f] border border-white/20
            text-white placeholder-[#64748b]
            focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/30
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            text-base sm:text-sm"
          style={{
            fontSize: 'max(16px, 1rem)',
          }}
        />

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!value.trim() || isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 p-3 rounded-full
            bg-gradient-to-r from-[#10b981] to-[#059669]
            text-white shadow-lg hover:shadow-xl
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            glow-emerald-sm"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>

      {/* Footer Info */}
      <p className="text-xs text-[#64748b] mt-2 text-center sm:text-left">
        Powered by Saban AI Technology
      </p>
    </motion.div>
  );
}
