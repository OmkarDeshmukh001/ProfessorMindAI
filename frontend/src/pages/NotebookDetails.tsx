import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  UploadCloud, 
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApiError } from '../services/api';
import { getNotebook } from '../services/notebookService';
import type { Notebook } from '../types/notebook';

function NotebookDetails() {
  const { notebookId } = useParams();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadingTimer = window.setTimeout(() => setLoading(true), 0);

    if (notebookId) {
      getNotebook(notebookId)
        .then((value) => {
          if (!cancelled) setNotebook(value);
        })
        .catch((reason: unknown) => setError(getApiError(reason)))
        .finally(() => setLoading(false));
    }

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [notebookId]);

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === 'completed' || normalized === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-medium">
          <CheckCircle2 size={12} />
          {status}
        </span>
      );
    }
    if (normalized === 'processing' || normalized === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium">
          <Clock size={12} />
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
        {status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Failed to load notebook</p>
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
              <div className="h-6 w-48 rounded bg-slate-100" />
              <div className="h-3 w-64 rounded bg-slate-100" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-32 rounded-lg bg-slate-100" />
            <div className="h-10 w-32 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-3 w-1/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 animate-fade-in">
        <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Notebook not found</h3>
        <p className="text-sm text-slate-500 mb-4">The notebook you are looking for does not exist or has been removed.</p>
        <Link to="/notebooks" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
          ← Back to Notebooks
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
        to="/notebooks" 
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        All Notebooks
      </Link>

      {/* ==========================================
          NOTEBOOK HERO
          ========================================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <BookOpen size={28} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                Notebook
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight break-words">
                {notebook.name}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {notebook.description || 'No description provided.'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to={`/upload?notebook=${notebook.notebook_id}`}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-200"
            >
              <UploadCloud size={16} />
              Upload PDF
            </Link>
            <Link
              to={`/chat?notebook=${notebook.notebook_id}`}
              className="inline-flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <MessageSquare size={16} />
              Ask AI
            </Link>
          </div>
        </div>
      </div>

      {/* ==========================================
          DOCUMENTS SECTION
          ========================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Sources
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {notebook.total_documents} document{notebook.total_documents === 1 ? '' : 's'}
            </h3>
          </div>
        </div>

        {notebook.documents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-300 transition-colors duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
              <FolderOpen size={28} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No documents uploaded yet
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Upload a lecture PDF to give this notebook something to search and analyze.
            </p>
            <Link
              to={`/upload?notebook=${notebook.notebook_id}`}
              className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <UploadCloud size={16} />
              Upload first document
            </Link>
          </div>
        ) : (
          /* Document List */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {notebook.documents.map((document) => (
              <Link
                to={`/documents/${document.file_id}`}
                key={document.file_id}
                className="group flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-800 transition-colors">
                      {document.filename}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {document.total_chunks ?? '—'} chunks
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      {getStatusBadge(document.status)}
                    </div>
                  </div>
                </div>
                <ArrowRight 
                  size={18} 
                  className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all ml-4 shrink-0" 
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default NotebookDetails;