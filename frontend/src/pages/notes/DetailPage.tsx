import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorView } from '../../components/ui/ErrorView';
import { RichTextDisplay } from '../../components/editor/RichTextDisplay';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ChevronLeft, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useGetById, delete: deleteNote } = useNotes();
  const { data, isLoading, isError, error, refetch } = useGetById(id || '');
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorView message={error instanceof Error ? error.message : 'Failed to load note'} onRetry={refetch} />;

  const note = data?.data;

  if (!note) return <ErrorView message="Note not found" onRetry={refetch} />;

  const handleDelete = async () => {
    if (!id) return;
    await deleteNote(id);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex items-center justify-between border-b border-outline-variant pb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-on-surface font-extrabold text-sm transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Workspace
        </Link>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/notes/${id}/edit`)}
            className="flex items-center gap-2 text-xs font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Note
          </Button>
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {note.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 bg-surface-container border border-outline-variant rounded-full text-on-surface"
            >
              {tag}
            </span>
          ))}
          <span className="text-xs text-on-surface-variant font-medium ml-2">
            Updated {note.updatedAt ? format(new Date(note.updatedAt), 'MMM dd, yyyy') : 'Recently'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
          {note.title}
        </h1>
      </div>

      <div className="bg-surface rounded-3xl p-8 border border-outline-variant shadow-xs">
        <RichTextDisplay body={note.body} />
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete this note?"
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant font-medium">
            This action cannot be undone. Are you sure you want to permanently delete this note?
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
