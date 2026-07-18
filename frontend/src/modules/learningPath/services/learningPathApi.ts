import { withMockDelay } from '@/services/mockClient';
import type { LearningPath } from '../types';

const MY_LEARNING_PATH: LearningPath = {
  pathId: 'path-minh-anh-01',
  generatedAt: '2025-10-16T02:00:00Z',
  status: 'active',
  tiers: [
    {
      tier: 'foundation',
      nodeIds: ['node-dao-ham', 'node-song-co'],
      recommendedQuestionIds: [],
      rationale: 'Củng cố nền tảng đạo hàm và sóng cơ trước khi học các dạng nâng cao.',
    },
    {
      tier: 'bridge',
      nodeIds: ['node-khao-sat-ham-so', 'node-dao-dong'],
      recommendedQuestionIds: [],
      rationale: 'Kết nối kiến thức nền với các dạng bài khảo sát hàm số và dao động điều hòa.',
    },
    {
      tier: 'application',
      nodeIds: ['node-tich-phan', 'node-este'],
      recommendedQuestionIds: [],
      rationale: 'Vận dụng cao: tích phân và các bài toán Este thường gặp trong đề thi.',
    },
  ],
};

export async function fetchMyLearningPath(): Promise<LearningPath> {
  return withMockDelay(structuredClone(MY_LEARNING_PATH));
}
