import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      size="sm"
      showCloseButton={!isLoading}
    >
      <div className="flex gap-4">
        {/* Visual Warning Icon */}
        <div className="shrink-0 mt-1">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
        </div>
        
        {/* Message Content */}
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-slate-600" id="confirm-dialog-description">
            {message}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onClose} 
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button 
          type="button" 
          variant="danger" 
          onClick={onConfirm} 
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;