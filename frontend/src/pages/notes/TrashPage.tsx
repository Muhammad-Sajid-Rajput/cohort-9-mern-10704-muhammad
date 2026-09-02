import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { ErrorView } from '../../components/ui/ErrorView';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Trash2,
  RotateCcw,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Info,
  Folder as FolderIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Note, Folder } from '../../types/api.types';

const TrashSkeleton = (): ReactElement => (
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

export interface ExpiryBadge {
  text: string;
  className: string;
}

type TrashFolderItem = Folder & { parentName?: string | null; noteCount?: number };

export const TrashPage = (): ReactElement | null => {
  const { useGetTrash, restore, permanentDelete, emptyTrash } = useNotes();
  const {
    data: notesData,
    isLoading: isNotesLoading,
    isError: isNotesError,
    error: notesError,
    refetch: refetchNotes,
  } = useGetTrash();

  const { useGetTrashFolders, restoreFolder, permanentDeleteFolder } = useFolders();
  const {
    data: foldersData,
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    error: foldersError,
    refetch: refetchFolders,
  } = useGetTrashFolders();

  const [isEmptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);
  const [deleteTargetNoteId, setDeleteTargetNoteId] = useState<string | null>(null);
  const [deleteTargetFolderId, setDeleteTargetFolderId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

const getExpiryBadge = (deletedAt?: string | null): ExpiryBadge => {
    if (!deletedAt) {
      return { text: 'Expires in 3 days', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    const deletedTime = new Date(deletedAt).getTime();
    if (Number.isNaN(deletedTime)) {
      return { text: 'Expires in 3 days', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    const diffMs = now - deletedTime;
    const remainingHours = Math.max(0, 72 - diffMs / (1000 * 60 * 60));
    const days = Math.ceil(remainingHours / 24);

    if (days > 1) {
      return { text: `Expires in ${days} days`, className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (remainingHours > 1) {
      return { text: `Expires in ${Math.ceil(remainingHours)}h`, className: 'bg-orange-50 text-orange-700 border-orange-200' };
    }
    return { text: 'Expires soon', className: 'bg-red-50 text-red-700 border-red-200' };
  };

  const handleRestoreNote = async (noteId: string): Promise<void> => {
    try {
      await restore(noteId);
      await Promise.all([refetchNotes(), refetchFolders()]);
    } catch {
      return;
    }
  };

  const handleRestoreFolder = async (folderId: string): Promise<void> => {
    try {
      await restoreFolder(folderId);
      await Promise.all([refetchNotes(), refetchFolders()]);
    } catch {
      return;
    }
  };

  const handlePermanentDeleteNote = async (): Promise<void> => {
    if (!deleteTargetNoteId) return;
    try {
      await permanentDelete(deleteTargetNoteId);
      setDeleteTargetNoteId(null);
      await Promise.all([refetchNotes(), refetchFolders()]);
    } catch {
      return;
    }
  };

  const handlePermanentDeleteFolder = async (): Promise<void> => {
    if (!deleteTargetFolderId) return;
    try {
      await permanentDeleteFolder(deleteTargetFolderId);
      setDeleteTargetFolderId(null);
      await Promise.all([refetchNotes(), refetchFolders()]);
    } catch {
      return;
    }
  };

  const handleEmptyTrash = async (): Promise<void> => {
    try {
      await emptyTrash();
      setEmptyTrashModalOpen(false);
      await Promise.all([refetchNotes(), refetchFolders()]);
    } catch {
      return;
    }
  };

  const handleRetryAll = async (): Promise<void> => {
    await Promise.all([refetchNotes(), refetchFolders()]);
  };

  if (isNotesError || isFoldersError) {
    const errorMessage =
      (notesError instanceof Error ? notesError.message : null) ||
      (foldersError instanceof Error ? foldersError.message : null) ||
      'Error fetching trash items';
    return (
      <ErrorView
        message={errorMessage}
        onRetry={handleRetryAll}
      />
    );
  }

  const trashNotes: Note[] = notesData?.notes ?? notesData?.data ?? [];
  const trashFolders: TrashFolderItem[] = foldersData?.folders || [];
  const totalTrashCount = trashNotes.length + trashFolders.length;
  const isLoading = isNotesLoading || isFoldersLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Trash</h1>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-outline-variant">
              {totalTrashCount} {totalTrashCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-on-surface-variant font-medium text-sm">
            Items in Trash stay for 3 days before being deleted permanently.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant hover:bg-surface-container transition-colors text-xs font-bold text-on-surface"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Notes
          </Link>
          {totalTrashCount > 0 && (
            <Button
              variant="danger"
              onClick={() => setEmptyTrashModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Empty Trash
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start sm:items-center gap-3 text-xs font-medium">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
        <p>
          Items in trash cannot be opened or edited. You can restore them to your active workspace or delete them permanently. Subfolders restore back into their parent folder.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TrashSkeleton />
          <TrashSkeleton />
          <TrashSkeleton />
        </div>
      ) : totalTrashCount === 0 ? (
        <div className="text-center py-20 bg-surface rounded-3xl border border-outline-variant space-y-4">
          <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mx-auto text-on-surface-variant">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-on-surface">Trash is Empty</h3>
            <p className="text-sm text-on-surface-variant font-medium">
              Deleted notes and non-empty folders stay here for 3 days before permanent removal.
            </p>
          </div>
          <Link
            to="/notes"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-colors"
          >
            Return to Workspace
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {trashFolders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant/80 flex items-center gap-2">
                <FolderIcon className="w-4 h-4 text-primary" /> Folders in Trash ({trashFolders.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trashFolders.map((folder) => {
                  const badge = getExpiryBadge(folder.deletedAt);

                  return (
                    <div
                      key={folder._id}
                      className="rounded-3xl p-7 bg-white border border-outline-variant flex flex-col justify-between relative shadow-xs select-none"
                    >
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${badge.className}`}
                          >
                            <Clock className="w-3 h-3" /> {badge.text}
                          </span>
                          <span className="text-[11px] font-bold text-on-surface-variant/70">
                            {folder.deletedAt
                              ? format(new Date(folder.deletedAt), 'MMM d, yyyy')
                              : 'Recent'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-primary shrink-0">
                            <FolderIcon className="w-5 h-5 fill-primary/20" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-extrabold text-on-surface truncate">
                              {folder.name}
                            </h3>
                            <p className="text-xs font-medium text-on-surface-variant truncate">
                              {folder.noteCount || 0} notes inside
                              {folder.parentName && ` • Subfolder of ${folder.parentName}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 flex items-center justify-between border-t border-outline-variant">
                        <span className="text-[11px] font-semibold text-on-surface-variant/60">
                          Non-editable
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Restore folder"
                            onClick={() => handleRestoreFolder(folder._id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Restore folder and contained notes"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            type="button"
                            aria-label="Delete folder permanently"
                            onClick={() => setDeleteTargetFolderId(folder._id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Delete folder permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes in Trash Section */}
          {trashNotes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant/80">
                Notes in Trash ({trashNotes.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trashNotes.map((note) => {
                  const badge = getExpiryBadge(note.deletedAt);
                  const cleanBody = (note.content || note.body || '').replace(/<[^>]*>?/gm, '');

                  return (
                    <div
                      key={note._id}
                      className="rounded-3xl p-7 bg-white border border-outline-variant flex flex-col justify-between relative shadow-xs select-none"
                    >
                      <div className="space-y-3 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${badge.className}`}
                          >
                            <Clock className="w-3 h-3" /> {badge.text}
                          </span>
                          <span className="text-[11px] font-bold text-on-surface-variant/70">
                            {note.deletedAt
                              ? format(new Date(note.deletedAt), 'MMM d, yyyy')
                              : 'Recent'}
                          </span>
                        </div>

                        <h3 className="text-lg font-extrabold text-on-surface leading-snug tracking-tight line-clamp-2">
                          {note.title}
                        </h3>

                        <p className="text-sm font-medium text-on-surface-variant line-clamp-3 leading-relaxed">
                          {cleanBody || 'Empty note content'}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 flex items-center justify-between border-t border-outline-variant">
                        <span className="text-[11px] font-semibold text-on-surface-variant/60">
                          Non-editable
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Restore note"
                            onClick={() => handleRestoreNote(note._id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Restore note to workspace"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            type="button"
                            aria-label="Delete note permanently"
                            onClick={() => setDeleteTargetNoteId(note._id)}
                            className="h-8 px-2.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Delete note permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Target Note Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetNoteId)}
        onClose={() => setDeleteTargetNoteId(null)}
        title="Permanently Delete Note?"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-red-50/70 border border-red-200 rounded-2xl text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              This note will be deleted permanently. This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTargetNoteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handlePermanentDeleteNote}>
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Target Folder Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetFolderId)}
        onClose={() => setDeleteTargetFolderId(null)}
        title="Permanently Delete Folder?"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-red-50/70 border border-red-200 rounded-2xl text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              This folder and all its contents will be deleted permanently from Trash. This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTargetFolderId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handlePermanentDeleteFolder}>
              Delete Folder Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* Empty Trash Modal */}
      <Modal
        isOpen={isEmptyTrashModalOpen}
        onClose={() => setEmptyTrashModalOpen(false)}
        title="Empty Entire Trash?"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-red-50/70 border border-red-200 rounded-2xl text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              All notes and folders in Trash will be deleted permanently. This action cannot be reversed.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setEmptyTrashModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleEmptyTrash}>
              Confirm Empty Trash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
