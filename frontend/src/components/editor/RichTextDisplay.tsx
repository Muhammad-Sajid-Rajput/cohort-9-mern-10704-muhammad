interface RichTextDisplayProps {
  body: string;
}

export const RichTextDisplay = ({ body }: RichTextDisplayProps) => (
  <div className="prose prose-neutral prose-lg max-w-none px-4" dangerouslySetInnerHTML={{ __html: body }} />
);
