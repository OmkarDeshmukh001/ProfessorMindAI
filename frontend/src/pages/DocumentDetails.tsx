import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Layers,
  Hash,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getApiError } from "../services/api";
import { listDocuments, deleteDocument } from "../services/documentService";
import type { DocumentRecord } from "../types/notebook";
import DeleteDocumentDialog from "../components/documents/DeleteDocumentDialog";

function DocumentDetails() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [notebookName, setNotebookName] = useState("");
  const [notebookId, setNotebookId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadingTimer = window.setTimeout(() => setLoading(true), 0);

    listDocuments()
      .then((data) => {
        if (cancelled) return;
        setDocument(null);
        setNotebookId("");
        setNotebookName("");
        for (const group of data.notebooks) {
          const found = group.documents.find(
            (item) => item.file_id === documentId,
          );
          if (found) {
            setDocument(found);
            setNotebookId(group.notebook_id);
            setNotebookName(group.notebook_name);
            break;
          }
        }
      })
      .catch((reason: unknown) => setError(getApiError(reason)))
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [documentId]);

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "completed" || normalized === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-semibold">
          <CheckCircle2 size={14} />
          {status}
        </span>
      );
    }
    if (normalized === "processing" || normalized === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold">
          <Clock size={14} />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold">
        {status}
      </span>
    );
  };

  const handleDeleteDocument = async () => {
    if (!document) return;
    setIsDeleting(true);
    try {
      await deleteDocument(notebookId, document.file_id);
      navigate("/documents");
    } catch (reason) {
      setError(getApiError(reason, "Failed to delete document."));
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Failed to load document</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-6 w-64 rounded bg-slate-100" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse"
            >
              <div className="h-3 w-16 rounded bg-slate-100" />
              <div className="h-5 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 animate-fade-in">
        <FileText size={32} className="text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Document not found
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          The document you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/documents"
          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          ← Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* ==========================================
          BACK NAVIGATION
          ========================================== */}
      <Link
        to="/documents"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        All Documents
      </Link>

      {/* ==========================================
          DOCUMENT HERO
          ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
              <FileText size={28} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} className="text-teal-600 shrink-0" />
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider truncate">
                  {notebookName}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-words">
                {document.filename}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={14} className="shrink-0" />
                <span>
                  Uploaded{" "}
                  {new Date(document.uploaded_at).toLocaleDateString(
                    undefined,
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 sm:mt-1 flex flex-col sm:items-end gap-3">
            {getStatusBadge(document.status)}
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              Delete Document
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          METADATA GRID
          ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pages
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {document.total_pages ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chunks
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {document.total_chunks ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Embedding Dimension
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {document.embedding_dimension ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stored Filename
            </span>
          </div>
          <p className="text-sm font-mono text-slate-700 break-all">
            {document.stored_as}
          </p>
        </div>
      </div>

      {/* ==========================================
          DELETE CONFIRMATION DIALOG
          ========================================== */}
      <DeleteDocumentDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteDocument}
        documentName={document.filename}
        isLoading={isDeleting}
      />
    </section>
  );
}

export default DocumentDetails;
