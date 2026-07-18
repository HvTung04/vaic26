import { http } from '@/services/httpClient';

/**
 * Upload → OCR → parse pipeline API.
 *
 * Backend endpoints:
 *   POST /content/uploads        — upload file for parsing
 *   GET  /content/uploads/{id}   — poll processing status
 *   POST /content/uploads/{id}/approve — approve parsed drafts into bank
 */

export interface UploadStatus {
  uploadId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  parsedQuestions: ParsedQuestion[];
  error: string | null;
}

export interface ParsedQuestion {
  draftId: string;
  text: string;
  type: 'mcq' | 'short_answer';
  options: string[] | null;
  answer: string | null;
  suggestedNodeId: string | null;
  suggestedDifficulty: string | null;
  confidence: number;
}

export interface ApproveItem {
  draftId: string;
  text?: string;
  options?: string[];
  answer?: string;
  nodeId: string;
  difficulty: string;
}

/** POST /content/uploads — upload a file for question extraction. */
export async function uploadFile(
  file: File,
  subject: string,
  grade: number,
  classId?: string,
): Promise<{ uploadId: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', subject);
  formData.append('grade', String(grade));
  if (classId) formData.append('class_id', classId);

  return http.postForm('/content/uploads', formData);
}

/** GET /content/uploads/{id} — poll until status=done|failed. */
export async function getUploadStatus(uploadId: string): Promise<UploadStatus> {
  return http.get<UploadStatus>(`/content/uploads/${uploadId}`);
}

/** POST /content/uploads/{id}/approve — approve parsed drafts into bank. */
export async function approveUploads(
  uploadId: string,
  questions: ApproveItem[],
): Promise<{ uploadId: string; createdQuestionIds: string[]; approvedCount: number }> {
  return http.post(`/content/uploads/${uploadId}/approve`, {
    questions: questions.map((q) => ({
      draft_id: q.draftId,
      text: q.text ?? null,
      options: q.options ?? null,
      answer: q.answer ?? null,
      node_id: q.nodeId,
      difficulty: q.difficulty,
    })),
  });
}
