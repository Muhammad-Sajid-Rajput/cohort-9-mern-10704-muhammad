import { sanitizeHtml } from '../../utils/sanitize';

interface RichTextDisplayProps {
  body: string;
}

export const RichTextDisplay = ({ body }: RichTextDisplayProps) => {
  const content = body || '';
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  const formattedHtml = isHtml
    ? content
    : content
        .split(/\r?\n/)
        .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
        .join('');

  return (
    <div
      className="prose prose-neutral prose-lg max-w-none px-4"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedHtml) }}
    />
  );
};
