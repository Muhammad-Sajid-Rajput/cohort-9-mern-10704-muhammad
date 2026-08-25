import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { ErrorView } from '../../components/ui/ErrorView';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Trash2, Search, Edit3, ChevronLeft, ChevronRight, Download, Upload, FileJson, FileText, File as FileIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { notesApi } from '../../api/notes.api';
import { uiActions } from '../../utils/uiActions';
import { format } from 'date-fns';
import type { Note } from '../../types/api.types';

const NoteSkeleton = () => (
  <div className="aspect-square rounded-3xl p-8 border border-outline-variant bg-surface space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <Skeleton className="h-6 w-1/2 rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <Skeleton className="h-4 w-4/6 rounded" />
    </div>
  </div>
);

export const ListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isClearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { useGetAll, deleteAll } = useNotes({
    search: debouncedSearch,
    tag: selectedTag,
    page,
    limit: 6,
  });

  const { data, isLoading, isError, error, refetch } = useGetAll();

  const handleExportJSON = async () => {
    try {
      const allNotesRes = await notesApi.getAll({ limit: 1000 });
      const notes = allNotesRes.data || [];
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `noteshub-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      uiActions.success('Exported notes as JSON backup');
      setExportModalOpen(false);
    } catch {
      uiActions.error('Failed to export notes');
    }
  };

  const handleExportPDF = async () => {
    try {
      const allNotesRes = await notesApi.getAll({ limit: 1000 });
      const notes = allNotesRes.data || [];
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.text('NotesHub - Workspace Export', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated on ${format(new Date(), 'PPP')}`, 14, 28);
      doc.line(14, 32, 196, 32);

      let yOffset = 40;
      notes.forEach((note, index) => {
        if (yOffset > 260) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${note.title}`, 14, yOffset);
        yOffset += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tags: ${note.tags.join(', ')} | Updated: ${format(new Date(note.updatedAt), 'MMM dd, yyyy')}`, 14, yOffset);
        yOffset += 6;

        const cleanBody = note.body.replace(/<[^>]*>?/gm, '');
        const splitText = doc.splitTextToSize(cleanBody, 180);
        doc.setFontSize(10);
        doc.text(splitText, 14, yOffset);
        yOffset += splitText.length * 5 + 10;
      });

      doc.save(`noteshub-notes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      uiActions.success('Exported notes as PDF document');
      setExportModalOpen(false);
    } catch {
      uiActions.error('Failed to generate PDF');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const notesArray: Note[] = Array.isArray(parsed) ? parsed : parsed.data || [];
          if (!notesArray.length) {
            uiActions.error('No notes found in imported file.');
            return;
          }

          let successCount = 0;
          for (const note of notesArray) {
            if (note.title && note.body) {
              await notesApi.create({
                title: note.title,
                body: note.body,
                tags: note.tags || ['work'],
              });
              successCount++;
            }
          }
          uiActions.success(`Successfully imported ${successCount} notes.`);
          refetch();
        } catch {
          uiActions.error('Invalid JSON structure.');
        }
      };
    }
  };

  if (isError) return <ErrorView message={error instanceof Error ? error.message : 'Error fetching workspace'} onRetry={refetch} />;

  const notes = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Workspace Notes</h1>
          <p className="text-on-surface-variant font-medium text-sm">
            Manage, organize, and create notes with rich markdown support.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-surface-container border border-outline-variant hover:bg-surface-hover transition-colors text-on-surface">
              <Upload className="w-3.5 h-3.5" /> Import JSON
            </span>
          </label>
          <Button
            variant="secondary"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          {notes.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setClearAllModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          )}
          <Link to="/notes/new">
            <Button
              className="flex items-center gap-2 text-xs font-extrabold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
            >
              <Plus className="w-4 h-4" /> New Note
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full bg-surface border border-outline-variant pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => { setSelectedTag(undefined); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
              selectedTag === undefined
                ? 'bg-black text-white shadow-xs'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-hover'
            }`}
          >
            All Tags
          </button>
          {(['work', 'personal', 'life'] as const).map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => { setSelectedTag(tag); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${
                selectedTag === tag
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-hover'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NoteSkeleton />
          <NoteSkeleton />
          <NoteSkeleton />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-3xl border border-outline-variant space-y-4">
          <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mx-auto text-on-surface-variant">
            <FileIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-on-surface">No Notes Found</h3>
            <p className="text-sm text-on-surface-variant font-medium">
              {debouncedSearch || selectedTag
                ? 'Try adjusting your search query or tag filter.'
                : 'Your workspace is empty. Create your first note now!'}
            </p>
          </div>
          <Link to="/notes/new">
            <Button
              className="mt-2 text-xs font-extrabold"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
            >
              <Plus className="w-4 h-4 mr-2" /> Capture Note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => navigate(`/notes/${note._id}`)}
              className="group cursor-pointer bg-surface rounded-3xl p-6 border border-outline-variant hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-surface-container rounded-md text-on-surface"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    {format(new Date(note.updatedAt), 'MMM dd')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                  {note.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {note.body.replace(/<[^>]*>?/gm, '')}
                </p>
              </div>

              <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2">
                <button
                  type="button"
                  aria-label="Edit note"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/notes/${note._id}/edit`);
                  }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-hover hover:text-on-surface transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-on-surface px-4">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Workspace Notes"
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant font-medium">
            Choose your preferred export format. You can download all your notes as a JSON backup or a formatted PDF document.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-outline-variant bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all text-center group"
            >
              <FileJson className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-bold text-on-surface">JSON Backup</p>
                <p className="text-xs text-on-surface-variant">Raw data for importing</p>
              </div>
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-outline-variant bg-surface hover:bg-surface-hover hover:border-primary/40 transition-all text-center group"
            >
              <FileText className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-sm font-bold text-on-surface">PDF Document</p>
                <p className="text-xs text-on-surface-variant">Formatted for reading</p>
              </div>
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClearAllModalOpen}
        onClose={() => setClearAllModalOpen(false)}
        title="Clear entire workspace?"
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant font-medium">
            This will permanently delete all notes from your workspace. This action cannot be reversed.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setClearAllModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await deleteAll();
                setClearAllModalOpen(false);
              }}
            >
              Confirm Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
