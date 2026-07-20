import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Trang không tải được
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã xảy ra lỗi. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      // iOS PWA meta tags
      { name: "apple-mobile-web-app-title", content: "EyeCU" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      // Android PWA
      { name: "mobile-web-app-capable", content: "yes" },
      // Theme colors
      { name: "theme-color", content: "#88E8F2", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0A9BAD", media: "(prefers-color-scheme: dark)" },
      // SEO & Branding
      { title: "EyeCU — Ambient Clinical OS" },
      {
        name: "description",
        content:
          "EyeCU — Hệ thống quản lý bệnh viện thông minh tích hợp eKYC, AI và nhận diện sinh trắc học.",
      },
      { name: "author", content: "EyeCU Team" },
      { property: "og:title", content: "EyeCU — Ambient Clinical OS" },
      {
        property: "og:description",
        content:
          "EyeCU — Hệ thống quản lý bệnh viện thông minh tích hợp eKYC, AI và nhận diện sinh trắc học.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EyeCU — Ambient Clinical OS" },
      {
        name: "twitter:description",
        content:
          "EyeCU — Hệ thống quản lý bệnh viện thông minh tích hợp eKYC, AI và nhận diện sinh trắc học.",
      },
      {
        property: "og:image",
        content: "/apple-touch-icon.png",
      },
      {
        name: "twitter:image",
        content: "/apple-touch-icon.png",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "mask-icon", href: "/apple-touch-icon.png", color: "#88E8F2" },
      // iOS Splash screens (covers iPhone SE through iPhone 15 Pro Max)
      { rel: "apple-touch-startup-image", href: "/apple-touch-icon.png" },
      // Performance: preconnect to backends
      { rel: "dns-prefetch", href: "https://ekyc.vnpt.vn" },
      // SmartUX: preconnect to VNPT tracking CDN
      { rel: "dns-prefetch", href: "https://console-smartux.vnpt.vn" },
      { rel: "preconnect", href: "https://console-smartux.vnpt.vn" },
    ],
    // VNPT SmartUX — khai báo config object trước khi SDK lôad
    // Dùng head() scripts[] là cách duy nhất để inject script đúng trong TanStack Start SSR
    scripts: [
      {
        children: `
          var VNPT = window.VNPT || {};
          VNPT.q = VNPT.q || [];
          VNPT.app_key = '3d4e11b8bb1194a02ffbad65aca9e0dad528be55';
          VNPT.url = 'https://console-smartux.vnpt.vn';
          VNPT.q.push(['track_sessions']);
          VNPT.q.push(['track_clicks']);
          VNPT.q.push(['track_scrolls']);
          VNPT.q.push(['track_errors']);
          VNPT.q.push(['track_links']);
          VNPT.q.push(['track_forms']);
          VNPT.q.push(['collect_from_forms']);
          window.VNPT = VNPT;
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


// VNPT SmartUX loader — chạy phía client sau khi component mount
// Dùng useEffect vì:
// 1. dangerouslySetInnerHTML trong <head> KHÔNG thực thi script (HTML5 spec)
// 2. Script cần chạy sau khi DOM sẵn sàng (client-side only)
function SmartUXLoader() {
  useEffect(() => {
    // Tránh load hai lần
    if (document.getElementById('vnpt-smartux-sdk')) return;

    const cly = document.createElement('script');
    cly.id = 'vnpt-smartux-sdk';
    cly.type = 'text/javascript';
    cly.async = true;
    cly.src = 'https://console-smartux.vnpt.vn/sdk/web/core-track.js';
    cly.onload = function () {
      if (window.VNPT && typeof window.VNPT.init === 'function') {
        window.VNPT.init();
      }
    };
    document.head.appendChild(cly);
  }, []); // chạy 1 lần duy nhất khi app mount

  return null;
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        <SmartUXLoader />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { AuthProvider } from "../lib/auth/auth-context";
import { useLocation } from "@tanstack/react-router";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();

  // SmartUX Virtual Pageview — chạy đồng bộ để đảm bảo SDK bắt được view context ngay lập tức
  useEffect(() => {
    if (location.pathname === '/') return; // Bỏ qua trang chủ, index.tsx sẽ tự lo virtual path
    
    try {
      if (window.VNPT?.q) {
        window.VNPT.q.push(['track_pageview', location.pathname]);
      }
    } catch (_) {} // never let tracking crash the app
  }, [location.pathname]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <PwaInstallPrompt />
      </QueryClientProvider>
    </AuthProvider>
  );
}
