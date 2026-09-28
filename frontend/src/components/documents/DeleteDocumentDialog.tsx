import { FileText } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName: string;
  isLoading?: boolean;
}

const DeleteDocumentDialog = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
  isLoading = false,
}: DeleteDocumentDialogProps) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Document"
      confirmLabel="Delete Document"
      cancelLabel="Cancel"
      isLoading={isLoading}
      message={
        <div className="space-y-3">
          <p>
            Are you sure you want to permanently delete this document? This will remove the file 
            and all its associated AI embeddings from your workspace.
          </p>
          
          {/* Document Preview Box */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate" title={documentName}>
                {documentName}
              </p>
              <p className="text-xs text-slate-500">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default DeleteDocumentDialog;