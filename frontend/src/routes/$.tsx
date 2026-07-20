import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  beforeLoad: ({ location }) => {
    // Catch-all route xử lý khi user F5 (tải lại trang) ở các URL ảo của SPA
    // Nếu URL bắt đầu bằng /dashboard/, chuyển hướng về trang chủ và truyền "view"
    if (location.pathname.startsWith('/dashboard/')) {
      const view = location.pathname.split('/')[2];
      throw redirect({ to: '/', search: { view } });
    }
    
    // Mặc định ném về trang chủ nếu không khớp gì cả
    throw redirect({ to: '/' });
  },
  component: () => null,
})
