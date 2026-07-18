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
