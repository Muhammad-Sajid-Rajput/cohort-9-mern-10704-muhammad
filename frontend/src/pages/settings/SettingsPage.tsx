import { uiActions } from '../../utils/uiActions';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';

export const SettingsPage = () => {
  const { user, deleteUser } = useAuth();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!user) return null;

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
    } catch (error) {
      uiActions.error(error instanceof Error ? error.message : 'Failed to delete account.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="border-b border-outline-variant pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Workspace Settings</h1>
        <p className="text-on-surface-variant font-medium text-sm">
          Manage your account profile, workspace preferences, and security settings.
        </p>
      </div>

      <div className="bg-surface rounded-3xl p-8 border border-outline-variant shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-on-surface">Account Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Username</p>
              <p className="text-base font-bold text-on-surface">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container border border-outline-variant">
            <div className="h-12 w-12 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface font-bold text-lg">
              <Mail className="w-6 h-6 text-on-surface-variant" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Email Address</p>
              <p className="text-base font-bold text-on-surface">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-xs font-bold">
            Email Verified — Your account has full access to workspace and AI features.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-8 border border-red-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
        <p className="text-sm text-on-surface-variant font-medium">
          Permanently delete your account and all associated notes, folders, and vector embeddings.
        </p>
        <Button
          variant="danger"
          onClick={() => setDeleteModalOpen(true)}
          className="text-xs font-bold"
        >
          Delete Account
        </Button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Permanently delete account?"
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-variant font-medium">
            This action cannot be undone. All your notes, personal tags, and embeddings will be permanently erased.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
