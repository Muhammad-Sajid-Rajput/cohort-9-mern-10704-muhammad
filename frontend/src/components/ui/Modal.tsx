import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-[440px]' }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-10">
      <div 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      <div className={`relative w-full ${maxWidth} bg-white rounded-[28px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 ease-out z-[1001]`}>
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-neutral-900 tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-neutral-50 rounded-xl transition-all active:scale-90 text-neutral-400 hover:text-neutral-900"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="px-8 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};
