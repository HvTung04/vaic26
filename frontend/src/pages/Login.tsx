import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/modules/auth/AuthContext';
import { ApiError } from '@/services/httpClient';

/** Where to land after login, by role. */
const HOME_BY_ROLE = { teacher: '/dashboard', student: '/student' } as const;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const me = await login(username.trim(), password);
      navigate(redirectTo ?? HOME_BY_ROLE[me.role], { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Sai tài khoản hoặc mật khẩu.'
          : err instanceof ApiError
            ? err.message
            : 'Không kết nối được máy chủ.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-bento border border-hairline bg-white p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center gap-2.5">
          <div className="relative h-7 w-7">
            <div className="absolute inset-0 rounded-full bg-ink" />
            <div className="absolute inset-[5px] rounded-full border-2 border-lime" />
            <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-ember" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">GapLens</span>
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink">Đăng nhập</h1>
        <p className="mt-1 text-sm text-ink-soft">Dùng tài khoản giáo viên hoặc học sinh.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-medium text-ink-soft">
              Tài khoản
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="teacher1"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-ink-soft">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-ember">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-faint">
          Demo: teacher1 / student1 — mật khẩu <span className="font-mono">gaplens123</span>
        </p>
      </div>
    </div>
  );
}
