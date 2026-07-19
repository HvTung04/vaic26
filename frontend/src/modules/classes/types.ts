export interface ClassSummary {
  id: string;
  name: string;
  subject: string;
  grade: number;
  teacherId: string;
  studentCount: number;
}

export interface ClassStudent {
  id: string;
  fullName: string;
  username: string;
}

export interface ClassStudentsResult {
  items: ClassStudent[];
  total: number;
}

export interface ClassListResult {
  items: ClassSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClassListParams {
  page: number;
  pageSize?: number;
  search?: string;
  grade?: number;
}
