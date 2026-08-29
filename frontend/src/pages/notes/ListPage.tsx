import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { ErrorView } from '../../components/ui/ErrorView';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Trash2, Search, Edit3, ChevronLeft, ChevronRight, Upload, File as FileIcon, MoreVertical, FolderPlus, Folder as FolderIcon } from 'lucide-react';
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

export const ListPage = (): ReactElement | null => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isClearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [isHoveringFolderSubmenu, setIsHoveringFolderSubmenu] = useState(false);
  const [isCreateFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderTargetNoteId, setFolderTargetNoteId] = useState<string | null>(null);

  const { useGetAllFoldersFlat, createFolder, addNoteToFolder } = useFolders();
  const { data: flatFoldersData } = useGetAllFoldersFlat();
  const availableFolders = flatFoldersData?.folders || [];

  const handleAssignToFolder = async (folderId: string): Promise<void> => {
    if (!folderTargetNoteId) return;
    try {
      await addNoteToFolder({ folderId, noteId: folderTargetNoteId });
      setActiveMenuNoteId(null);
      setFolderTargetNoteId(null);
    } catch {
      return;
    }
  };

  const handleCreateFolderAndAssign = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await createFolder({ name: newFolderName.trim() });
      const createdFolder = res.folder ?? res.data;
      if (folderTargetNoteId && createdFolder?._id) {
        await addNoteToFolder({ folderId: createdFolder._id, noteId: folderTargetNoteId });
      }
      setNewFolderName('');
      setCreateFolderModalOpen(false);
      setActiveMenuNoteId(null);
      setFolderTargetNoteId(null);
    } catch {
      return;
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { useGetAll, delete: deleteNote, deleteAll } = useNotes({
    search: debouncedSearch,
    tag: selectedTag,
    page,
    limit: 6,
  });

  const { data, isLoading, isError, error, refetch } = useGetAll();

  const handleImportTXT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
      uiActions.error('Please select a valid .txt file.');
      e.target.value = '';
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const rawContent = (event.target?.result as string) || '';
        const title = file.name.replace(/\.[^/.]+$/, '').trim() || 'Imported Note';
        const formattedBody = rawContent
          .split(/\r?\n/)
          .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
          .join('');
        await notesApi.create({
          title,
          body: formattedBody || '<p>Empty note content</p>',
          tags: ['work'],
        });
        uiActions.success(`Successfully imported "${title}".`);
        refetch();
      } catch {
        uiActions.error('Failed to import text file.');
      }
    };
    fileReader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  if (isError) return <ErrorView message={error instanceof Error ? error.message : 'Error fetching workspace'} onRetry={refetch} />;

  const notes: Note[] = data?.notes ?? data?.data ?? [];
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
            <input type="file" accept=".txt,text/plain" onChange={handleImportTXT} className="hidden" />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-surface-container border border-outline-variant hover:bg-surface-hover transition-colors text-on-surface">
              <Upload className="w-3.5 h-3.5" /> Import
            </span>
          </label>
          {notes.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setClearAllModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          )}

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
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${selectedTag === undefined
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
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all ${selectedTag === tag
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
            <div key={note._id} className="group block relative h-full">
              <Link
                to={`/notes/${note._id}`}
                className="h-64 rounded-3xl p-7 bg-white border border-outline-variant flex flex-col justify-between transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:border-primary/50 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 group-hover:bg-primary transition-colors" />

                <div className="space-y-3 pt-1 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-neutral-50 rounded-lg border border-outline-variant text-black"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                      {format(new Date(note.createdAt || note.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors leading-snug tracking-tight line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm font-medium text-on-surface-variant line-clamp-3 leading-relaxed">
                    {(note.content || note.body || '').replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant/50">
                  <span className="text-[11px] font-bold text-on-surface-variant/60">
                    Updated {format(new Date(note.updatedAt), 'p')}
                  </span>
                </div>
              </Link>

              <div className="absolute bottom-6 right-6 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Edit note"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/notes/${note._id}/edit`);
                  }}
                  className="w-9 h-9 bg-primary text-on-primary rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md hover:bg-primary-hover hover:scale-105 z-10 active:scale-95"
                  title="Edit note"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <div className="relative z-20">
                  <button
                    type="button"
                    aria-label="More actions"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (activeMenuNoteId === note._id) {
                        setActiveMenuNoteId(null);
                        setFolderTargetNoteId(null);
                      } else {
                        setActiveMenuNoteId(note._id);
                        setFolderTargetNoteId(note._id);
                      }
                    }}
                    className="w-9 h-9 bg-surface border border-outline-variant text-on-surface rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xs hover:bg-neutral-100 hover:scale-105 active:scale-95"
                    title="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuNoteId === note._id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuNoteId(null);
                          setFolderTargetNoteId(null);
                        }}
                      />
                      <div
                        className="absolute right-0 bottom-11 w-56 bg-white rounded-2xl shadow-xl border border-outline-variant py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          onMouseEnter={() => setIsHoveringFolderSubmenu(true)}
                          onMouseLeave={() => setIsHoveringFolderSubmenu(false)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsHoveringFolderSubmenu((prev) => !prev);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-neutral-100 flex items-center justify-between transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <FolderIcon className="w-3.5 h-3.5 text-on-surface-variant" /> Add to folder
                            </span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${
                                isHoveringFolderSubmenu ? 'rotate-90' : ''
                              }`}
                            />
                          </button>

                          {isHoveringFolderSubmenu && (
                            <div className="bg-neutral-50/90 border-y border-outline-variant/60 py-1.5 px-1 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                              {availableFolders.length > 0 ? (
                                <>
                                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant/60">
                                    Select Folder
                                  </div>
                                  {availableFolders.map((f) => (
                                    <button
                                      key={f._id}
                                      type="button"
                                      onClick={() => handleAssignToFolder(f._id)}
                                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-white hover:text-primary rounded-lg flex items-center gap-2 truncate transition-colors text-left"
                                    >
                                      <FolderIcon className="w-3.5 h-3.5 shrink-0 text-primary" />
                                      <span className="truncate">{f.name}</span>
                                    </button>
                                  ))}
                                  <div className="border-t border-outline-variant/60 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuNoteId(null);
                                      setCreateFolderModalOpen(true);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center gap-2 transition-colors text-left"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5" /> + Create New Folder
                                  </button>
                                </>
                              ) : (
                                <div className="p-2.5 text-center space-y-1.5">
                                  <p className="text-[11px] font-medium text-on-surface-variant">No folders created</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuNoteId(null);
                                      setCreateFolderModalOpen(true);
                                    }}
                                    className="w-full py-1 px-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <FolderPlus className="w-3.5 h-3.5" /> Create Folder
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="border-t border-outline-variant my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuNoteId(null);
                            setDeleteTarget(note);
                          }}
                          className="w-full px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
                try {
                  await deleteAll();
                  setClearAllModalOpen(false);
                } catch {
                  return;
                }
              }}
            >
              Confirm Clear All
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Move to Trash?"
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant font-medium">
            Are you sure you want to move &quot;{deleteTarget?.title}&quot; to Trash? It will remain in Trash for 3 days before being permanently deleted.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteNote(deleteTarget._id);
                  setDeleteTarget(null);
                } catch {
                  return;
                }
              }}
            >
              Move to Trash
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        title="Create New Folder"
      >
        <form onSubmit={handleCreateFolderAndAssign} className="space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Work, Research, Personal"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full bg-surface border border-outline-variant px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
