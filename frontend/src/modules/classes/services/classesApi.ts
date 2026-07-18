import { withMockDelay } from '@/services/mockClient';
import type { ClassStudentsResult, ClassSummary } from '../types';

const TEACHER_ID = 'gv-lan-anh';

interface MockClass {
  id: string;
  name: string;
  subject: string;
  grade: number;
  teacherId: string;
  studentIds: string[];
}

interface MockStudent {
  id: string;
  fullName: string;
  username: string;
}

const STUDENTS: MockStudent[] = [
  { id: 'minh-tuan', fullName: 'Minh Tuấn', username: 'minhtuan08' },
  { id: 'bao-ngoc', fullName: 'Bảo Ngọc', username: 'baongoc08' },
  { id: 'gia-huy', fullName: 'Gia Huy', username: 'giahuy08' },
  { id: 'phuong-linh', fullName: 'Phương Linh', username: 'phuonglinh08' },
  { id: 'duc-anh', fullName: 'Đức Anh', username: 'ducanh08' },
  { id: 'thu-trang', fullName: 'Thu Trang', username: 'thutrang09' },
  { id: 'hoang-nam', fullName: 'Hoàng Nam', username: 'hoangnam09' },
];

const CLASSES: MockClass[] = [
  {
    id: 'khoi-8-toan',
    name: 'Toán - Khối 8',
    subject: 'Toán',
    grade: 8,
    teacherId: TEACHER_ID,
    studentIds: ['minh-tuan', 'bao-ngoc', 'gia-huy', 'phuong-linh', 'duc-anh'],
  },
  {
    id: 'khoi-9-toan',
    name: 'Toán - Khối 9',
    subject: 'Toán',
    grade: 9,
    teacherId: TEACHER_ID,
    studentIds: ['thu-trang', 'hoang-nam'],
  },
];

function findClass(classId: string): MockClass {
  const found = CLASSES.find((c) => c.id === classId);
  if (!found) throw new Error(`Không tìm thấy lớp: ${classId}`);
  return found;
}

export async function fetchClasses(): Promise<ClassSummary[]> {
  const items: ClassSummary[] = CLASSES.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    grade: c.grade,
    teacherId: c.teacherId,
    studentCount: c.studentIds.length,
  }));
  return withMockDelay(items);
}

export async function fetchClassById(classId: string): Promise<ClassSummary> {
  const klass = findClass(classId);
  return withMockDelay({
    id: klass.id,
    name: klass.name,
    subject: klass.subject,
    grade: klass.grade,
    teacherId: klass.teacherId,
    studentCount: klass.studentIds.length,
  });
}

export async function fetchClassStudents(classId: string): Promise<ClassStudentsResult> {
  const klass = findClass(classId);
  const items = klass.studentIds
    .map((id) => STUDENTS.find((s) => s.id === id))
    .filter((s): s is MockStudent => Boolean(s))
    .map((s) => ({ id: s.id, fullName: s.fullName, username: s.username }));
  return withMockDelay({ items, total: items.length });
}
