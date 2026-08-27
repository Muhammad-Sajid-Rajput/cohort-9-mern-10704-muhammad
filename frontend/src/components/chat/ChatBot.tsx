import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Sparkles, User, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

export const ChatBot = (): ReactElement | null => {
  const location = useLocation();
  const isNoteOpen = /^\/notes\/(?!new$)[^/]+(\/edit)?$/.test(location.pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { chat } = useNotes();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await chat({ message: userMsg });
      const botReply = res.reply ?? res.data?.reply ?? "I couldn't process that. Could you try rephrasing?";
      setMessages((prev) => [...prev, { role: 'bot', text: botReply }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Internal Assistant Error.';
      setMessages((prev) => [...prev, { role: 'bot', text: `⚠️ ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isNoteOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-200 flex flex-col items-end gap-3 selection:bg-primary selection:text-on-primary font-sans text-left">
      {isOpen && (
        <div className="w-95 sm:w-100 h-130 max-h-[calc(100vh-120px)] bg-white rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out origin-bottom-right">
          <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-xl shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-[14px] text-on-surface uppercase tracking-wider">Assistant</h3>
                <p className="text-[11px] font-semibold text-on-surface-variant/70">Powered by Gemini AI</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Assistant"
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-primary-tint/50 rounded-xl transition-colors text-on-surface-variant hover:text-primary"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 bg-background scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-6">
                <div className="w-12 h-12 bg-primary-tint rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-on-surface font-extrabold text-sm">Workspace AI</p>
                  <p className="text-on-surface-variant font-medium text-xs leading-relaxed">
                    Ask anything about your notes, summaries, or tasks.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all ${msg.role === 'bot'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-primary-tint border-primary/20 text-primary'
                      }`}
                  >
                    {msg.role === 'bot' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed ${msg.role === 'bot'
                        ? 'bg-white text-on-surface border border-outline-variant shadow-xs'
                        : 'bg-primary text-on-primary shadow-xs'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2.5 animate-in fade-in duration-300">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-on-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-outline-variant px-4 py-3 rounded-2xl flex items-center gap-1.5 shadow-xs">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-outline-variant">
            <div className="relative flex items-center">
              <input
                aria-label="Ask a question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                className="w-full bg-background border border-outline-variant rounded-xl py-3 pl-4 pr-11 text-xs font-semibold placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 p-2 rounded-lg transition-all flex items-center justify-center ${input.trim() && !isLoading
                    ? 'bg-primary text-on-primary hover:bg-primary-hover shadow-xs'
                    : 'bg-transparent text-outline-variant'
                  }`}
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-xl transition-all transform active:scale-95 group relative ${isOpen
            ? 'rotate-90 bg-white border border-outline-variant text-primary'
            : 'bg-primary text-on-primary hover:bg-primary-hover hover:scale-105'
          }`}
        style={{ width: '52px', height: '52px' }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-5.5 h-5.5 text-white transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
};
