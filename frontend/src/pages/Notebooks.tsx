import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  Film,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  createNotebook,
  deleteNotebook,
  listNotebooks,
} from "../services/notebookService";

import { uploadPdf, uploadVideo } from "../services/uploadService";

import { getApiError } from "../services/api";

import type { Notebook } from "../types/notebook";

function Notebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [uploadingNotebookId, setUploadingNotebookId] = useState<string | null>(
    null,
  );

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Notebook | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [selectedUploadNotebookId, setSelectedUploadNotebookId] = useState<
    string | null
  >(null);

  const loadNotebooks = async () => {
    try {
      setError("");

      const response = await listNotebooks();

      setNotebooks(response.notebooks || []);
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotebooks();
  }, []);

  const handleCreateNotebook = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName || creating) return;

    try {
      setCreating(true);
      setError("");

      await createNotebook({
        name: trimmedName,
        description: description.trim() || null,
      });

      setName("");
      setDescription("");

      await loadNotebooks();
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setCreating(false);
    }
  };

  const handlePdfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !selectedUploadNotebookId) return;

    await handleUpload(selectedUploadNotebookId, file, "pdf");

    setSelectedUploadNotebookId(null);
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !selectedUploadNotebookId) return;

    await handleUpload(selectedUploadNotebookId, file, "video");

    setSelectedUploadNotebookId(null);
  };

  const handleUpload = async (
    notebookId: string,
    file: File,
    type: "pdf" | "video",
  ) => {
    try {
      setError("");
      setUploadProgress(0);
      setUploadingNotebookId(notebookId);

      setUploadMessage(
        type === "pdf" ? "Uploading PDF..." : "Uploading video...",
      );

      if (type === "pdf") {
        await uploadPdf(notebookId, file, (progress) =>
          setUploadProgress(progress),
        );
      } else {
        await uploadVideo(notebookId, file, (progress) =>
          setUploadProgress(progress),
        );
      }

      setUploadProgress(100);

      setUploadMessage(
        type === "pdf"
          ? "PDF uploaded successfully."
          : "Video uploaded successfully.",
      );

      await loadNotebooks();

      setTimeout(() => {
        setUploadingNotebookId(null);
        setUploadProgress(0);
        setUploadMessage("");
      }, 1200);
    } catch (reason) {
      setError(getApiError(reason));

      setUploadingNotebookId(null);
      setUploadProgress(0);
      setUploadMessage("");
    }
  };

  const handleDeleteNotebook = async () => {
    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);
      setError("");

      await deleteNotebook(deleteTarget.notebook_id);

      setNotebooks((current) =>
        current.filter(
          (notebook) => notebook.notebook_id !== deleteTarget.notebook_id,
        ),
      );

      setDeleteTarget(null);
    } catch (reason) {
      setError(getApiError(reason));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#212121] px-4 py-6 text-white md:px-8">
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/mpeg,video/webm,video/quicktime"
        className="hidden"
        onChange={handleVideoUpload}
      />

      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Notebooks</h1>

          <p className="mt-1 text-sm text-white/40">
            Organize your study material by subject or course.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300/60 hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Create Notebook */}
        <section className="mb-10 rounded-2xl border border-white/10 bg-[#2a2a2a] p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Plus size={18} className="text-white/80" />
            </div>

            <div>
              <h2 className="text-sm font-medium text-white">
                Create a notebook
              </h2>

              <p className="text-xs text-white/40">
                Create a private space for your study material.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateNotebook} className="space-y-4">
            <div>
              <label
                htmlFor="notebook-name"
                className="mb-2 block text-xs font-medium text-white/60"
              >
                Notebook name
              </label>

              <input
                id="notebook-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Deep Learning"
                disabled={creating}
                className="w-full rounded-lg border border-white/10 bg-[#212121] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="notebook-description"
                className="mb-2 block text-xs font-medium text-white/60"
              >
                Description
                <span className="ml-1 text-white/25">optional</span>
              </label>

              <input
                id="notebook-description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Course notes and lecture material"
                disabled={creating}
                className="w-full rounded-lg border border-white/10 bg-[#212121] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create notebook
                </>
              )}
            </button>
          </form>
        </section>

        {/* Notebook List */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/80">
              Your notebooks
            </h2>

            <span className="text-xs text-white/30">
              {notebooks.length}{" "}
              {notebooks.length === 1 ? "notebook" : "notebooks"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl border border-white/5 bg-[#2a2a2a]"
                />
              ))}
            </div>
          ) : notebooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#242424] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <BookOpen size={22} className="text-white/50" />
              </div>

              <h3 className="text-sm font-medium text-white/80">
                No notebooks yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/35">
                Create a notebook above and add your lecture material.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notebooks.map((notebook) => {
                const isUploading =
                  uploadingNotebookId === notebook.notebook_id;

                return (
                  <article
                    key={notebook.notebook_id}
                    className="rounded-xl border border-white/10 bg-[#2a2a2a] p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                          <BookOpen size={19} className="text-white/70" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-white">
                            {notebook.name}
                          </h3>

                          <p className="mt-1 text-xs text-white/35">
                            {notebook.total_documents}{" "}
                            {notebook.total_documents === 1
                              ? "material"
                              : "materials"}
                          </p>

                          {notebook.description && (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">
                              {notebook.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {/* PDF */}
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => {
                            setSelectedUploadNotebookId(notebook.notebook_id);
                            pdfInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#212121] px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FileText size={15} />
                          PDF
                        </button>

                        {/* Video */}
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => {
                            setSelectedUploadNotebookId(notebook.notebook_id);
                            videoInputRef.current?.click();
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#212121] px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Film size={15} />
                          Video
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => setDeleteTarget(notebook)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`Delete ${notebook.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Upload progress */}
                    {isUploading && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Upload size={14} />
                            {uploadMessage}
                          </div>

                          <span className="text-xs text-white/40">
                            {uploadProgress}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-200"
                            style={{
                              width: `${uploadProgress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2a2a2a] p-6 shadow-2xl">
            <h2 className="text-base font-medium text-white">
              Delete notebook?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/45">
              This will delete{" "}
              <span className="text-white/75">{deleteTarget.name}</span> and its
              associated study material.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteNotebook()}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-40"
              >
                {deleting && <Loader2 size={15} className="animate-spin" />}
                Delete notebook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notebooks;
