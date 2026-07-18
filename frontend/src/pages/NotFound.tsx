import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="font-serif text-5xl font-bold text-ink">404</p>
      <p className="text-sm text-ink-soft">Trang bạn tìm không tồn tại.</p>
      <Button asChild variant="primary">
        <Link to="/">Về Dashboard</Link>
      </Button>
    </div>
  );
}
