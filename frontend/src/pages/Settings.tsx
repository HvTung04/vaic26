import { DashboardHeader } from '@/layouts/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div>
      <DashboardHeader title="Cài đặt" subtitle="Tùy chỉnh bảng điều khiển giáo viên" />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Đang phát triển</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-soft">
            Trang cài đặt sẽ sớm cho phép tuỳ chỉnh thông báo, quyền truy cập lớp học và tích hợp hệ thống.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
