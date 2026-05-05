import { motion } from "framer-motion";

export default function ChatBubble({ message, isUser, timestamp, emotion }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
              : "rounded-bl-sm bg-white/8 border border-white/10 text-white/90"
          }`}
        >
          {message}
        </div>
        <div className="flex items-center gap-2 px-1">
          {timestamp && (
            <span className="text-[10px] text-white/35">{timestamp}</span>
          )}
          {emotion && (
            <span className="text-[10px] font-medium text-violet-300/90">{emotion}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
