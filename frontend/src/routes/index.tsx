import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageSkeleton } from '@/components/PageSkeleton';

const Landing = lazy(() => import('@/pages/Landing'));
const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const CreateTest = lazy(() => import('@/pages/CreateTest'));
const StudentInsights = lazy(() => import('@/pages/StudentInsights'));
const QuestionBank = lazy(() => import('@/pages/QuestionBank'));
const QuestionBankEditor = lazy(() => import('@/pages/QuestionBankEditor'));
const TestBuilder = lazy(() => import('@/pages/TestBuilder'));
const ClassList = lazy(() => import('@/pages/ClassList'));
const ClassManagement = lazy(() => import('@/pages/ClassManagement'));
const ClassDetail = lazy(() => import('@/pages/ClassDetail'));
const TestList = lazy(() => import('@/pages/TestList'));
const TestResults = lazy(() => import('@/pages/TestResults'));
const TestEdit = lazy(() => import('@/pages/TestEdit'));
const SubmissionDetail = lazy(() => import('@/pages/SubmissionDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const StudentHub = lazy(() => import('@/pages/StudentHub'));
const AssessmentConsole = lazy(() => import('@/pages/AssessmentConsole'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(<Landing />),
  },
  {
    path: '/dashboard',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<TeacherDashboard />) },
      { path: 'create-test', element: withSuspense(<CreateTest />) },
      { path: 'students/:studentId', element: withSuspense(<StudentInsights />) },
      { path: 'question-bank', element: withSuspense(<QuestionBank />) },
      { path: 'question-bank/new', element: withSuspense(<QuestionBankEditor />) },
      { path: 'question-bank/:questionId', element: withSuspense(<QuestionBankEditor />) },
      { path: 'tests/new', element: withSuspense(<TestBuilder />) },
      { path: 'class-list', element: withSuspense(<ClassList />) },
      { path: 'classes', element: withSuspense(<ClassManagement />) },
      { path: 'classes/:classId', element: withSuspense(<ClassDetail />) },
      { path: 'tests', element: withSuspense(<TestList />) },
      { path: 'tests/:testId/results', element: withSuspense(<TestResults />) },
      { path: 'tests/:testId/edit', element: withSuspense(<TestEdit />) },
      { path: 'submissions/:submissionId', element: withSuspense(<SubmissionDetail />) },
      { path: 'settings', element: withSuspense(<Settings />) },
    ],
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [{ index: true, element: withSuspense(<StudentHub />) }],
  },
  {
    path: '/assessment/:assessmentId',
    element: withSuspense(<AssessmentConsole />),
  },
  {
    path: '*',
    element: withSuspense(<NotFound />),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
