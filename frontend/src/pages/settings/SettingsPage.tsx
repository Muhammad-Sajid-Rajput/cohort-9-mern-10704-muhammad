import { uiActions } from '../../utils/uiActions';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, ShieldCheck, ShieldAlert, Fingerprint, Calendar } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

export const SettingsPage = (): ReactElement | null => {
  const { user, deleteUser } = useAuth();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const handleDeleteAccount = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteUser();
    } catch (error) {
      uiActions.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <div className="space-y-2">
        <h1 className="text-[32px] font-extrabold tracking-tight text-neutral-900">Settings</h1>
      </div>

      <div className="bg-white rounded-3xl sm:rounded-4xl border border-neutral-100 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex border-b border-neutral-100 px-8 sm:px-10">
          <button
            type="button"
            className="py-5 text-sm font-bold text-primary border-b-2 border-primary tracking-tight"
          >
            Account Information
          </button>
        </div>

        <div className="p-8 sm:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Personal Information</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 shadow-xs text-neutral-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Username</p>
                    <p className="text-[15px] font-bold text-neutral-900">{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 shadow-xs text-neutral-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Email Address</p>
                    <p className="text-[15px] font-bold text-neutral-900 truncate">{user.email}</p>
                  </div>
                  {user.isEmailVerified && (
                    <div className="ml-auto bg-emerald-50 text-emerald-600 p-1.5 rounded-lg shrink-0" title="Verified">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {!user.isEmailVerified && (
                  <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-xs font-bold">Email Unverified</p>
                    </div>
                    <Link
                      to="/verify-email"
                      className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shrink-0"
                    >
                      Verify Now
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">System Metadata</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 shadow-xs text-neutral-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">User ID</p>
                    <p className="text-[13px] font-mono font-medium text-neutral-900 truncate">{user._id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-100 shadow-xs text-neutral-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Joined On</p>
                    <p className="text-[15px] font-bold text-neutral-900">
                      {'createdAt' in user && typeof user.createdAt === 'string'
                        ? format(new Date(user.createdAt), 'MMMM d, yyyy')
                        : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModalOpen(false);
        }}
        title="Permanently Delete Account"
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-neutral-600 leading-relaxed">
            Are you absolutely sure you want to delete your account? All notes, folders, and settings will be permanently destroyed. This action cannot be reversed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
