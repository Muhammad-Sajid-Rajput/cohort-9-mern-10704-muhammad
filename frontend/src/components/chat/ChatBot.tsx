import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Sparkles, User, Bot, Loader2, Send } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

const renderInline = (text: string): (string | ReactElement)[] => {
  const parts: (string | ReactElement)[] = [];
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***')) {
      parts.push(
        <strong key={match.index} className="font-extrabold italic text-on-surface">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-on-surface">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-neutral-100 text-primary font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-on-surface">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = tokenRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
};

const FormattedBotMessage = ({ content }: { content: string }): ReactElement => {
  const lines = content.split('\n');
  const elements: ReactElement[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: string | number) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={`list-${key}`} className="space-y-2 my-2 pl-4 list-disc marker:text-primary">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-[12.5px] text-on-surface">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${key}`} className="space-y-2 my-2 pl-4 list-decimal marker:text-primary font-medium">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-[12.5px] text-on-surface">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      return;
    }

    const bulletPrefix = trimmed.match(/^[-*•]\s+/);
    if (bulletPrefix) {
      const content = trimmed.slice(bulletPrefix[0].length);
      if (currentList && currentList.type !== 'ul') flushList(idx);
      if (!currentList) currentList = { type: 'ul', items: [] };
      currentList.items.push(content);
      return;
    }

    const numberPrefix = trimmed.match(/^\d+\.\s+/);
    if (numberPrefix) {
      const content = trimmed.slice(numberPrefix[0].length);
      if (currentList && currentList.type !== 'ol') flushList(idx);
      if (!currentList) currentList = { type: 'ol', items: [] };
      currentList.items.push(content);
      return;
    }

    flushList(idx);

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="font-extrabold text-xs uppercase tracking-wider text-primary mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={idx} className="font-extrabold text-sm text-on-surface mt-3 mb-1">
          {renderInline(trimmed.replace(/^#+\s*/, ''))}
        </h3>
      );
      return;
    }

    elements.push(
      <p key={idx} className="leading-relaxed text-[12.5px] text-on-surface my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('final');

  return <div className="space-y-1 text-left">{elements}</div>;
};

export const ChatBot = (): ReactElement | null => {
  const location = useLocation();
  const isNoteOpen = /^\/notes\/(?!new$)[^/]+(\/edit)?$/.test(location.pathname);
  const noteIdMatch = location.pathname.match(/^\/notes\/([^/]+)/);
  const activeNoteId = noteIdMatch && noteIdMatch[1] !== 'new' ? noteIdMatch[1] : undefined;

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
      const res = await chat({ message: userMsg, noteId: activeNoteId });
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
        <div className="w-95 sm:w-110 h-140 max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out origin-bottom-right">
          {/* Header */}
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

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 bg-background scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-6">
                <div className="w-12 h-12 bg-primary-tint rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-on-surface font-extrabold text-sm">Workspace AI</p>
                  <p className="text-on-surface-variant font-medium text-xs leading-relaxed">
                    Ask anything about this note or search across your workspace.
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
                    className={`max-w-[88%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed ${msg.role === 'bot'
                        ? 'bg-white text-on-surface border border-outline-variant shadow-xs'
                        : 'bg-primary text-on-primary shadow-xs whitespace-pre-wrap wrap-break-word'
                      }`}
                  >
                    {msg.role === 'bot' ? (
                      <FormattedBotMessage content={msg.text} />
                    ) : (
                      msg.text
                    )}
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

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-outline-variant">
            <div className="relative flex items-center">
              <input
                aria-label="Ask a question"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question about this note..."
                className="w-full bg-background border border-outline-variant rounded-xl py-3 pl-4 pr-11 text-xs font-semibold placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-1.5 p-2 rounded-lg transition-all flex items-center justify-center ${input.trim() && !isLoading
                    ? 'bg-primary text-on-primary shadow-xs hover:brightness-110 cursor-pointer active:scale-95'
                    : 'text-on-surface-variant/30 cursor-not-allowed'
                  }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        aria-label="Open Workspace Assistant"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-12 h-12 rounded-2xl bg-primary text-on-primary shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group cursor-pointer border border-white/20"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
      </button>
    </div>
  );
};
