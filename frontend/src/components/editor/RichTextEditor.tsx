import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useRef, type ReactNode, type KeyboardEvent } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, List, Quote, Code, Heading1, Heading2,
  Undo, Redo, Strikethrough, ListOrdered, Link as LinkIcon, Trash2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface RichTextEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  title: string;
}

const MenuButton = ({ onClick, isActive, children, title }: MenuButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`p-2 rounded-lg transition-all cursor-pointer ${
      isActive
        ? 'bg-primary text-on-primary shadow-xs'
        : 'text-on-surface-variant hover:bg-neutral-100 hover:text-on-surface'
    }`}
  >
    {children}
  </button>
);

const ensureHtml = (text: string): string => {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
    .join('');
};

const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  if (/^mailto:/i.test(url)) {
    const email = url.slice(7).trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  if (/^tel:/i.test(url)) {
    const phone = url.slice(4).trim();
    return /\d/.test(phone) && /^\+?[0-9\s\-().]{3,}$/.test(phone);
  }
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
};

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [urlError, setUrlError] = useState('');
  const [hasSelection, setHasSelection] = useState(false);
  const savedRangeRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || 'Start writing your brilliance...' }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary-hover font-semibold',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: ensureHtml(value),
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none min-h-[300px] p-6 text-on-surface leading-relaxed text-base',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(ensureHtml(value), { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const handleOpenLinkModal = () => {
    const { from, to } = editor.state.selection;
    savedRangeRef.current = { from, to };

    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const previousUrl = (editor.getAttributes('link').href as string) || '';

    setLinkUrl(previousUrl);
    setLinkText(selectedText || '');
    setUrlError('');
    setHasSelection(from !== to);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = () => {
    const rawUrl = linkUrl.trim();
    if (!rawUrl) {
      setUrlError('Please enter a valid URL');
      return;
    }

    let formattedUrl = rawUrl;
    if (
      !/^https?:\/\//i.test(formattedUrl) &&
      !/^mailto:/i.test(formattedUrl) &&
      !/^tel:/i.test(formattedUrl)
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!isValidUrl(formattedUrl)) {
      setUrlError('Please enter a valid destination (e.g. example.com, https://example.com, or mailto:user@example.com)');
      return;
    }
    setUrlError('');

    const range = savedRangeRef.current;

    if (range && (range.from !== range.to || editor.isActive('link'))) {
      editor
        .chain()
        .focus()
        .setTextSelection(range)
        .extendMarkRange('link')
        .setLink({ href: formattedUrl })
        .run();
    } else {
      const display = linkText.trim() || rawUrl;
      if (range) {
        editor.chain().focus().setTextSelection(range.from).run();
      }
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${formattedUrl}">${display}</a> `)
        .run();
    }

    onChange(editor.getHTML());
    setIsLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    const range = savedRangeRef.current;
    if (range) {
      editor.chain().focus().setTextSelection(range).extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    onChange(editor.getHTML());
    setIsLinkModalOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveLink();
    }
  };

  return (
    <div className="border border-outline-variant rounded-2xl bg-surface overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-container border-b border-outline-variant select-none">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strike"
        >
          <Strikethrough className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-outline-variant mx-1" />

        <MenuButton
          onClick={handleOpenLinkModal}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>

        <div className="flex-1" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>
      </div>

      <EditorContent editor={editor} />

      {/* Insert / Edit Link Modal (No nested form elements) */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title={editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
      >
        <div className="space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5">
            <label htmlFor="link-modal-url" className="block text-xs font-bold text-on-surface">
              Link URL <span className="text-primary">*</span>
            </label>
            <input
              id="link-modal-url"
              type="text"
              required
              autoFocus
              value={linkUrl}
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? 'link-url-error' : undefined}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com or example.com"
              className="w-full bg-surface border border-outline-variant px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {urlError && (
              <p id="link-url-error" role="alert" aria-live="assertive" className="text-[11px] font-bold text-red-600 mt-1">
                {urlError}
              </p>
            )}
          </div>

          {!hasSelection && !editor.isActive('link') && (
            <div className="space-y-1.5">
              <label htmlFor="link-modal-text" className="block text-xs font-bold text-on-surface">
                Display Text
              </label>
              <input
                id="link-modal-text"
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. My Portfolio, Resource Link..."
                className="w-full bg-surface border border-outline-variant px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {editor.isActive('link') ? (
              <button
                type="button"
                onClick={handleRemoveLink}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Link
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                onClick={handleSaveLink}
              >
                Save Link
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
