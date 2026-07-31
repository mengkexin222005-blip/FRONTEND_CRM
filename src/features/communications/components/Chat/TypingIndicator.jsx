import React from 'react';

export default function TypingIndicator({ user = 'Someone' }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
      <span>{user} is typing</span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
      </span>
    </div>
  );
}