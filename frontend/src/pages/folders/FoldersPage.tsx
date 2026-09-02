import { useState, type ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFolders } from '../../hooks/useFolders';
import { useNotes } from '../../hooks/useNotes';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Spinner } from '../../components/ui/Spinner';
import { ErrorView } from '../../components/ui/ErrorView';
import {
  Folder as FolderIcon,
  FolderPlus,
  Plus,
  FilePlus,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  FileText,
  Search,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Folder, Note } from '../../types/api.types';

const FolderCardSkeleton = (): ReactElement => (
  <div className="rounded-3xl p-6 border border-outline-variant bg-surface space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  </div>
);

interface FolderCardProps {
  folder: Folder;
  isActiveMenu: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onStartRename: () => void;
  onStartDelete: () => void;
}

const FolderCard = ({
  folder,
  isActiveMenu,
  onToggleMenu,
  onCloseMenu,
  onStartRename,
  onStartDelete,
}: FolderCardProps): ReactElement => {
  return (
    <div className="group relative rounded-3xl p-6 border border-outline-variant bg-surface hover:bg-surface-hover hover:border-primary/40 hover:shadow-md transition-all flex items-center justify-between">
      <Link to={`/folders/${folder._id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
          <FolderIcon className="w-6 h-6 fill-primary/20 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">
            {folder.name}
          </h3>
          <p className="text-xs font-medium text-on-surface-variant">
            {folder.subfolderCount || 0} subfolders &bull; {folder.noteCount || 0} notes
          </p>
        </div>
      </Link>

      <div className="relative shrink-0 ml-2">
        <button
          type="button"
          aria-label="Folder options"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-neutral-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isActiveMenu && (
          <>
            <button
              type="button"
              aria-label="Close folder options backdrop"
              tabIndex={-1}
              className="fixed inset-0 z-30 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                onCloseMenu();
              }}
            />
            <div className="absolute right-0 top-10 w-36 bg-white rounded-2xl shadow-xl border border-outline-variant py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  onCloseMenu();
                  onStartRename();
                }}
                className="w-full px-3.5 py-2 text-xs font-semibold text-on-surface hover:bg-neutral-100 flex items-center gap-2 transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5" /> Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  onCloseMenu();
                  onStartDelete();
                }}
                className="w-full px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface FolderNoteCardProps {
  note: Note;
  onRemove: () => Promise<void>;
}

const FolderNoteCard = ({ note, onRemove }: FolderNoteCardProps): ReactElement => {
  const cleanBody = (note.content || note.body || '').replace(/<[^>]*>?/gm, '');

  return (
    <div className="group rounded-3xl p-7 bg-white border border-outline-variant hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
      <Link to={`/notes/${note._id}`} className="space-y-3 text-left flex-1">
        <div className="flex items-center justify-between gap-2">
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
          <span className="text-[11px] font-bold text-on-surface-variant/70">
            {format(new Date(note.createdAt || note.updatedAt), 'MMM d, yyyy')}
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-on-surface group-hover:text-primary transition-colors leading-snug tracking-tight line-clamp-2">
          {note.title}
        </h3>
        <p className="text-sm font-medium text-on-surface-variant line-clamp-3 leading-relaxed">
          {cleanBody || 'No additional content'}
        </p>
      </Link>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-outline-variant/50">
        <span className="text-[11px] font-bold text-on-surface-variant/60">
          Updated {format(new Date(note.updatedAt), 'p')}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-bold text-on-surface-variant hover:text-red-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          title="Remove note from folder"
        >
          <X className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
    </div>
  );
};

export const FoldersPage = (): ReactElement | null => {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();

  const {
    useGetFolders,
    useGetFolderDetails,
    createFolder,
    renameFolder,
    deleteFolder,
    addNoteToFolder,
    removeNoteFromFolder,
  } = useFolders();

  const { useGetAll } = useNotes();
  const { data: allNotesData, isLoading: isAllNotesLoading, refetch: refetchAllNotes } = useGetAll({ limit: 100 });
  const allWorkspaceNotes: Note[] = allNotesData?.notes ?? allNotesData?.data ?? [];

  const {
    data: rootFoldersData,
    isLoading: isRootLoading,
    isError: isRootError,
    error: rootError,
    refetch: refetchRoot,
  } = useGetFolders(null);

  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetFolderDetails(folderId || '');

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);

  const isInsideFolder = Boolean(folderId);
  const isLoading = isInsideFolder ? isDetailsLoading : isRootLoading;
  const isError = isInsideFolder ? isDetailsError : isRootError;
  const currentError = isInsideFolder ? detailsError : rootError;
  const handleRefetch = isInsideFolder ? refetchDetails : refetchRoot;

  const currentFolder = detailsData?.folder;
  const breadcrumbs = detailsData?.breadcrumbs || [];
  const foldersToDisplay: Folder[] = isInsideFolder
    ? detailsData?.subfolders || []
    : rootFoldersData?.folders || [];
  const folderNotes: Note[] = detailsData?.notes || [];

  const handleOpenCreateModal = (parentId: string | null = null) => {
    setCreateParentId(parentId);
    setNewFolderName('');
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolder({
        name: newFolderName.trim(),
        parentFolderId: createParentId,
      });
      setCreateModalOpen(false);
      setNewFolderName('');
      await Promise.all([refetchDetails(), refetchRoot()]);
    } catch {
      return;
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameFolder({
        id: renameTarget._id,
        name: renameValue.trim(),
      });
      setRenameTarget(null);
      setRenameValue('');
      await Promise.all([refetchDetails(), refetchRoot()]);
    } catch {
      return;
    }
  };

  const handleDeleteSubmit = async (): Promise<void> => {
    if (!deleteTarget) return;
    try {
      await deleteFolder(deleteTarget._id);
      setDeleteTarget(null);
      await Promise.all([refetchDetails(), refetchRoot()]);
      if (currentFolder && currentFolder._id === deleteTarget._id) {
        if (currentFolder.parentFolder) {
          navigate(`/folders/${currentFolder.parentFolder}`);
        } else {
          navigate('/folders');
        }
      }
    } catch {
      return;
    }
  };

  const handleToggleNoteInFolder = async (note: Note): Promise<void> => {
    if (!folderId) return;
    try {
      const isAlreadyIn = folderNotes.some((fn) => fn._id === note._id);
      if (isAlreadyIn) {
        await removeNoteFromFolder({ folderId, noteId: note._id });
      } else {
        await addNoteToFolder({ folderId, noteId: note._id });
      }
      await Promise.all([refetchDetails(), refetchAllNotes()]);
    } catch {
      return;
    }
  };

  if (isError) {
    return (
      <ErrorView
        message={currentError instanceof Error ? currentError.message : 'Error loading folders'}
        onRetry={handleRefetch}
      />
    );
  }

  const filteredWorkspaceNotes = allWorkspaceNotes.filter((n) =>
    n.title.toLowerCase().includes(noteSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant overflow-x-auto pb-1">
          <Link to="/folders" className="hover:text-primary transition-colors flex items-center gap-1.5 shrink-0">
            <FolderIcon className="w-3.5 h-3.5" />
            <span>Root Folders</span>
          </Link>
          {isInsideFolder &&
            breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <div key={crumb._id} className="flex items-center gap-2 shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/40" />
                  {isLast ? (
                    <span className="text-on-surface font-extrabold">{crumb.name}</span>
                  ) : (
                    <Link to={`/folders/${crumb._id}`} className="hover:text-primary transition-colors">
                      {crumb.name}
                    </Link>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
              {isInsideFolder ? currentFolder?.name || 'Folder' : 'Folders'}
            </h1>
            <p className="text-on-surface-variant font-medium text-sm">
              {isInsideFolder
                ? 'Organize subfolders and notes inside this folder.'
                : 'Create and organize hierarchical folder trees for your workspace.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isInsideFolder ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleOpenCreateModal(folderId)}
                  className="flex items-center gap-1.5 text-xs font-bold"
                  title="Create subfolder inside this folder"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-primary" /> New Subfolder
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setNoteSearchQuery('');
                    setAddNoteModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold"
                  title="Add an existing note to this folder"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" /> Add Note
                </Button>

                <Button
                  variant="primary"
                  onClick={() => navigate(`/notes/new?folderId=${folderId}`)}
                  className="flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  title="Create a new note inside this folder"
                >
                  <FilePlus className="w-3.5 h-3.5" /> Create Note
                </Button>

                {currentFolder && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRenameTarget(currentFolder);
                      setRenameValue(currentFolder.name);
                    }}
                    className="p-2"
                    title="Rename this folder"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => handleOpenCreateModal(null)}
                className="flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <FolderPlus className="w-4 h-4" /> Create Folder
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isInsideFolder && (
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant/70">
            Subfolders ({foldersToDisplay.length})
          </h2>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FolderCardSkeleton />
            <FolderCardSkeleton />
            <FolderCardSkeleton />
          </div>
        ) : foldersToDisplay.length === 0 ? (
          !isInsideFolder ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-outline-variant bg-surface space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <FolderIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-xl font-bold text-on-surface">No Folders Created</h3>
                <p className="text-sm font-medium text-on-surface-variant">
                  Organize your workspace notes into folders and nested subfolders.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleOpenCreateModal(null)}
                className="text-xs font-bold"
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> Create Your First Folder
              </Button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-outline-variant text-center text-xs font-medium text-on-surface-variant/60">
              No subfolders in this folder.
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {foldersToDisplay.map((folder) => (
              <FolderCard
                key={folder._id}
                folder={folder}
                isActiveMenu={activeMenuFolderId === folder._id}
                onToggleMenu={() =>
                  setActiveMenuFolderId(activeMenuFolderId === folder._id ? null : folder._id)
                }
                onCloseMenu={() => setActiveMenuFolderId(null)}
                onStartRename={() => {
                  setRenameTarget(folder);
                  setRenameValue(folder.name);
                }}
                onStartDelete={() => setDeleteTarget(folder)}
              />
            ))}
          </div>
        )}
      </div>

      {isInsideFolder && (
        <div className="space-y-4 pt-6 border-t border-outline-variant">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant/70">
              Notes in this folder ({folderNotes.length})
            </h2>
          </div>

          {folderNotes.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-dashed border-outline-variant bg-surface space-y-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-0.5 max-w-sm mx-auto">
                <h4 className="text-base font-bold text-on-surface">No Notes in this Folder</h4>
                <p className="text-xs font-medium text-on-surface-variant">
                  Add existing notes or create a new note directly in this folder.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNoteSearchQuery('');
                    setAddNoteModalOpen(true);
                  }}
                  className="text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Existing Note
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/notes/new?folderId=${folderId}`)}
                  className="text-xs font-bold"
                >
                  <FilePlus className="w-3.5 h-3.5 mr-1" /> Create Note
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {folderNotes.map((note) => (
                <FolderNoteCard
                  key={note._id}
                  note={note}
                  onRemove={() => handleToggleNoteInFolder(note)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={createParentId ? 'Create Subfolder' : 'Create New Folder'}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label htmlFor="create-folder-name" className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Folder Name
            </label>
            <input
              id="create-folder-name"
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
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename Folder"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label htmlFor="rename-folder-name" className="text-xs font-bold text-on-surface uppercase tracking-wider">
              New Folder Name
            </label>
            <input
              id="rename-folder-name"
              type="text"
              required
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full bg-surface border border-outline-variant px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Move Folder to Trash?"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
            Are you sure you want to move folder{' '}
            <span className="font-bold text-on-surface">"{deleteTarget?.name}"</span> to trash?
            Contained subfolders and notes will remain safely in the workspace.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit}>
              Move to Trash
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddNoteModalOpen}
        onClose={() => setAddNoteModalOpen(false)}
        title="Add Existing Notes to Folder"
      >
        <div className="space-y-4 text-left">
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes to add..."
              value={noteSearchQuery}
              onChange={(e) => setNoteSearchQuery(e.target.value)}
              className="w-full bg-surface border border-outline-variant pl-10 pr-4 py-2 rounded-xl text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {isAllNotesLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner />
              </div>
            ) : filteredWorkspaceNotes.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-on-surface-variant/60">
                No matching notes found.
              </div>
            ) : (
              filteredWorkspaceNotes.map((note) => {
                const isSelected = folderNotes.some((fn) => fn._id === note._id);

                return (
                  <div
                    key={note._id}
                    onClick={() => handleToggleNoteInFolder(note)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5 text-on-surface'
                        : 'border-outline-variant bg-surface hover:bg-surface-hover text-on-surface'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5 mr-3">
                      <p className="text-xs font-bold truncate">{note.title}</p>
                      <p className="text-[10px] text-on-surface-variant/70">
                        {note.tags?.join(', ') || 'No tags'}
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-outline-variant bg-surface-container'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button variant="primary" onClick={() => setAddNoteModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
