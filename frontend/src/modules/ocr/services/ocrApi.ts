import { http } from '@/services/httpClient';

/**
 * Bubble-sheet OCR API.
 *
 * Backend endpoints:
 *   POST /ocr/scan              — submit image for scanning
 *   GET  /ocr/scan/{id}         — poll scan result
 *   POST /ocr/scan/{id}/confirm — confirm/correct detected answers
 */

export interface ScanAnswer {
  questionId: string;
  detectedAnswer: string;
  confidence: number;
}

export interface ScanResult {
  scanId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  testId: string;
  detectedStudentId: string | null;
  answers: ScanAnswer[];
  lowConfidenceFlags: string[];
}

export interface ConfirmAnswer {
  questionId: string;
  finalAnswer: string;
}

/** POST /ocr/scan — submit bubble-sheet image. */
export async function scanBubbleSheet(file: File): Promise<{ scanId: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/ocr/scan', undefined);
}

/** GET /ocr/scan/{id} — poll until done. */
export async function getScanResult(scanId: string): Promise<ScanResult> {
  return http.get<ScanResult>(`/ocr/scan/${scanId}`);
}

/** POST /ocr/scan/{id}/confirm — submit corrected answers. */
export async function confirmScan(
  scanId: string,
  studentId: string,
  answers: ConfirmAnswer[],
): Promise<{ scanId: string; submissionId: string; status: string }> {
  return http.post(`/ocr/scan/${scanId}/confirm`, {
    student_id: studentId,
    answers: answers.map((a) => ({
      question_id: a.questionId,
      final_answer: a.finalAnswer,
    })),
  });
}
