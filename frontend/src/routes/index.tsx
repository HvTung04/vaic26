import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { StudentLayout } from '@/layouts/StudentLayout';
import { PageSkeleton } from '@/components/PageSkeleton';

const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const StudentInsights = lazy(() => import('@/pages/StudentInsights'));
const QuestionBank = lazy(() => import('@/pages/QuestionBank'));
const ClassList = lazy(() => import('@/pages/ClassList'));
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
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<TeacherDashboard />) },
      { path: 'students/:studentId', element: withSuspense(<StudentInsights />) },
      { path: 'question-bank', element: withSuspense(<QuestionBank />) },
      { path: 'class-list', element: withSuspense(<ClassList />) },
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
