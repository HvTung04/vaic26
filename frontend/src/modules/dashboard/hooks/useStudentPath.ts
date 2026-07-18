import { useMutateVerifyStudentPath } from './queries/useMutateVerifyStudentPath';
import { useMutateAiUpdateStudentPath } from './queries/useMutateAiUpdateStudentPath';

export function useStudentPath(studentId: string) {
  const verifyMutation = useMutateVerifyStudentPath(studentId);
  const aiUpdateMutation = useMutateAiUpdateStudentPath(studentId);

  return { verifyMutation, aiUpdateMutation };
}
