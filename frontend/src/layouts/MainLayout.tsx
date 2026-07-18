import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="min-w-0 flex-1 px-8 py-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
