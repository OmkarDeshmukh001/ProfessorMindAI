import api from './api';
import type { UploadResponse } from '../types/api';

export async function uploadPdf(
  notebookId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return uploadFile(
    `/api/notebooks/${encodeURIComponent(notebookId)}/upload-pdf`,
    notebookId,
    file,
    onProgress
  );
}

export async function uploadVideo(
  notebookId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return uploadFile(
    `/api/notebooks/${encodeURIComponent(notebookId)}/upload-video`,
    notebookId,
    file,
    onProgress
  );
}

async function uploadFile(
  endpoint: string,
  notebookId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<UploadResponse>(
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Upload error:', {
      notebookId,
      fileName: file.name,
      fileSize: file.size,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}