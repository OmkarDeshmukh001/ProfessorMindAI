import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Film,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { getApiError } from "../services/api";
import { deleteDocument, listDocuments } from "../services/documentService";
import { deleteNotebook } from "../services/notebookService";

import type { DocumentGroup } from "../types/api";
import type { DocumentRecord } from "../types/notebook";

type DeleteTarget =
  | {
      type: "document";
      notebookId: string;
      notebookName: string;
      document: DocumentRecord;
    }
  | {
      type: "notebook";
      notebookId: string;
      notebookName: string;
      documentCount: number;
    };

function Documents() {
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Which notebooks are expanded
  const [expandedNotebooks, setExpandedNotebooks] = useState<
    Record<string, boolean>
  >({});

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // Load documents
  // --------------------------------------------------

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await listDocuments();

      setGroups(response.notebooks || []);
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  // --------------------------------------------------
  // Expand / collapse notebook
  // --------------------------------------------------

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks((current) => ({
      ...current,
      [notebookId]: !current[notebookId],
    }));
  };

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        documents: group.documents.filter(
          (document) =>
            document.filename.toLowerCase().includes(query) ||
            group.notebook_name.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.documents.length > 0);
  }, [groups, searchQuery]);

  // --------------------------------------------------
  // File type
  // --------------------------------------------------

  const getDocumentType = (document: DocumentRecord): "video" | "pdf" => {
    const filename = document.filename.toLowerCase();

    if (
      filename.endsWith(".mp4") ||
      filename.endsWith(".mpeg") ||
      filename.endsWith(".webm") ||
      filename.endsWith(".mov")
    ) {
      return "video";
    }

    return "pdf";
  };

  // --------------------------------------------------
  // Status
  // --------------------------------------------------

  const getStatus = (status: string) => {
    const normalized = status.toLowerCase();

    if (
      normalized === "completed" ||
      normalized === "complete" ||
      normalized === "ready"
    ) {
      return {
        label: "Ready",
        icon: CheckCircle2,
        className: "bg-emerald-400/10 text-emerald-300",
      };
    }

    if (normalized === "processing" || normalized === "pending") {
      return {
        label: "Processing",
        icon: Clock,
        className: "bg-amber-400/10 text-amber-300",
      };
    }

    if (normalized === "failed" || normalized === "error") {
      return {
        label: "Failed",
        icon: AlertCircle,
        className: "bg-red-400/10 text-red-300",
      };
    }

    return {
      label: status || "Unknown",
      icon: Clock,
      className: "bg-white/5 text-white/50",
    };
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------

  const handleDelete = async () => {
    if (!deleteTarget || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      // ----------------------------------------------
      // Delete individual document
      // ----------------------------------------------

      if (deleteTarget.type === "document") {
        await deleteDocument(
          deleteTarget.notebookId,
          deleteTarget.document.file_id,
        );

        const deletedFileId = deleteTarget.document.file_id;

        setGroups((current) =>
          current
            .map((group) => {
              if (group.notebook_id !== deleteTarget.notebookId) {
                return group;
              }

              const remainingDocuments = group.documents.filter(
                (document) => document.file_id !== deletedFileId,
              );

              return {
                ...group,
                documents: remainingDocuments,
                total_documents: remainingDocuments.length,
              };
            })
            .filter((group) => group.documents.length > 0),
        );
      }

      // ----------------------------------------------
      // Delete entire notebook
      // ----------------------------------------------
      else {
        await deleteNotebook(deleteTarget.notebookId);

        setGroups((current) =>
          current.filter(
            (group) => group.notebook_id !== deleteTarget.notebookId,
          ),
        );

        setExpandedNotebooks((current) => {
          const next = { ...current };
          delete next[deleteTarget.notebookId];
          return next;
        });
      }

      setDeleteTarget(null);
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-full bg-[#212121] text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading materials...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#212121] px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-5xl">
        {/* ------------------------------------------------ */}
        {/* Header */}
        {/* ------------------------------------------------ */}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Documents</h1>

          <p className="mt-1 text-sm text-white/40">
            Manage your notebooks and study materials.
          </p>
        </div>

        {/* ------------------------------------------------ */}
        {/* Error */}
        {/* ------------------------------------------------ */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-300">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-red-300/70">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300/50 transition hover:text-red-300"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* Search */}
        {/* ------------------------------------------------ */}

        <div className="relative mb-6">
          <Search
            size={19}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search your materials..."
            className="w-full rounded-2xl border border-white/10 bg-[#2a2a2a] py-4 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-white/20"
          />
        </div>

        {/* ------------------------------------------------ */}
        {/* Empty */}
        {/* ------------------------------------------------ */}

        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#252525] px-6 py-16 text-center">
            <BookOpen size={35} className="mx-auto mb-4 text-white/20" />

            <h2 className="text-lg font-medium text-white">
              {searchQuery ? "No materials found" : "No notebooks yet"}
            </h2>

            <p className="mt-2 text-sm text-white/40">
              {searchQuery
                ? "Try a different search."
                : "Create a notebook and upload your study material."}
            </p>
          </div>
        ) : (
          /* ------------------------------------------------ */
          /* Notebook list */
          /* ------------------------------------------------ */

          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isExpanded = expandedNotebooks[group.notebook_id];

              return (
                <div
                  key={group.notebook_id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#252525]"
                >
                  {/* -------------------------------------- */}
                  {/* Notebook header */}
                  {/* -------------------------------------- */}

                  <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                    {/* Notebook icon */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <BookOpen size={19} className="text-white/70" />
                    </div>

                    {/* Notebook information */}

                    <button
                      type="button"
                      onClick={() => toggleNotebook(group.notebook_id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-semibold text-white">
                        {group.notebook_name}
                      </div>

                      <div className="mt-0.5 text-xs text-white/40">
                        {group.documents.length}{" "}
                        {group.documents.length === 1
                          ? "material"
                          : "materials"}
                      </div>
                    </button>

                    {/* Delete notebook */}

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "notebook",
                          notebookId: group.notebook_id,
                          notebookName: group.notebook_name,
                          documentCount: group.documents.length,
                        })
                      }
                      className="hidden items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/35 transition hover:bg-red-500/10 hover:text-red-300 sm:flex"
                    >
                      <Trash2 size={15} />
                      Delete notebook
                    </button>

                    {/* Dropdown */}

                    <button
                      type="button"
                      onClick={() => toggleNotebook(group.notebook_id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                      aria-label={
                        isExpanded ? "Collapse notebook" : "Expand notebook"
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  </div>

                  {/* -------------------------------------- */}
                  {/* Expanded documents */}
                  {/* -------------------------------------- */}

                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {group.documents.map((document) => {
                        const type = getDocumentType(document);

                        const status = getStatus(document.status);

                        const StatusIcon = status.icon;

                        return (
                          <div
                            key={document.file_id}
                            className="flex items-center gap-3 border-b border-white/5 px-4 py-4 last:border-b-0 sm:px-5"
                          >
                            {/* File icon */}

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                type === "video"
                                  ? "bg-purple-500/10"
                                  : "bg-red-500/10"
                              }`}
                            >
                              {type === "video" ? (
                                <Film size={19} className="text-purple-300" />
                              ) : (
                                <FileText size={19} className="text-red-300" />
                              )}
                            </div>

                            {/* File information */}

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white">
                                {document.filename}
                              </div>

                              <div className="mt-1 text-xs text-white/35">
                                {type === "video" ? "Video" : "PDF"}
                              </div>
                            </div>

                            {/* Status */}

                            <div
                              className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:flex ${status.className}`}
                            >
                              <StatusIcon size={13} />
                              {status.label}
                            </div>

                            {/* Delete document */}

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "document",
                                  notebookId: group.notebook_id,
                                  notebookName: group.notebook_name,
                                  document,
                                })
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                              aria-label={`Delete ${document.filename}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Mobile notebook delete */}

                      <div className="border-t border-white/5 px-4 py-3 sm:hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: "notebook",
                              notebookId: group.notebook_id,
                              notebookName: group.notebook_name,
                              documentCount: group.documents.length,
                            })
                          }
                          className="flex items-center gap-2 text-xs text-white/35 transition hover:text-red-300"
                        >
                          <Trash2 size={14} />
                          Delete notebook
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* Delete confirmation */}
      {/* ================================================= */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#2b2b2b] shadow-2xl">
            <div className="px-6 pb-4 pt-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 size={20} className="text-red-400" />
              </div>

              <h2 className="text-lg font-semibold text-white">
                {deleteTarget.type === "document"
                  ? "Delete material?"
                  : "Delete notebook?"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {deleteTarget.type === "document" ? (
                  <>
                    This will permanently delete{" "}
                    <span className="font-medium text-white/80">
                      {deleteTarget.document.filename}
                    </span>{" "}
                    from{" "}
                    <span className="font-medium text-white/80">
                      {deleteTarget.notebookName}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    This will permanently delete the{" "}
                    <span className="font-medium text-white/80">
                      {deleteTarget.notebookName}
                    </span>{" "}
                    notebook and its{" "}
                    <span className="font-medium text-white/80">
                      {deleteTarget.documentCount} materials
                    </span>
                    .
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="flex min-w-[100px] items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Documents;
