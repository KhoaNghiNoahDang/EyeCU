import { useEffect, useRef, useCallback } from "react";

// Định nghĩa các loại message từ Backend
export type SocketMessageType =
  | "ping"
  | "GPS_UPDATE"
  | "GATE_ARRIVED"
  | "FAST_TRACK_SYNC"
  | "PRE_ALERT"
  | "CAMERA_EVENT"
  | "INCIDENT_ALERT"
  | "OCR_RESULT_SYNC"
  | "FACE_VERIFY_SUCCESS"
  | "FALL_DETECTED"
  | "QA_ANSWERED"
  | "APPOINTMENT_BOOKED";

export interface SocketMessage {
  type: SocketMessageType;
  data?: Record<string, unknown>;
  ambulance?: string;
  condition?: string;
  severity?: string;
  room?: string;
  title?: string;
}

// Định nghĩa cấu trúc payload cho HTTP Fallback khi socket chết
export interface FallbackPayload {
  // endpoint tương ứng với API backend (VD: "/api/ems/pre-alert")
  endpoint: string;
  body: Record<string, unknown>;
}

type MessageHandler = (message: SocketMessage) => void;

interface UseEyeCUSocketOptions {
  url: string;
  onMessage: MessageHandler;
  // Cho phép tắt reconnect (VD: khi user đang đăng nhập lại)
  reconnect?: boolean;
  // Số lần thử kết nối lại tối đa (mặc định: 10 lần ~ khoảng 8 phút)
  maxRetries?: number;
}

const MAX_BACKOFF_MS = 30_000; // Giới hạn tối đa 30 giây

/**
 * useEyeCUSocket — Enterprise WebSocket hook
 *
 * Tính năng:
 *  - Tự động lọc gói "ping" của server keep_alive, không gây re-render thừa
 *  - Exponential Backoff: lần 1=2s, lần 2=4s, lần 3=8s... tối đa 30s
 *  - HTTP Fallback: khi socket chết và cần gửi data gấp, tự động gọi REST API
 *  - Chống memory leak: huỷ setTimeout trước khi unmount
 *  - onMessage luôn dùng phiên bản mới nhất (tránh stale closure)
 */
export function useEyeCUSocket({
  url,
  onMessage,
  reconnect = true,
  maxRetries = 10,
}: UseEyeCUSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  // Flag để biết component đã unmount chưa, tránh setState sau unmount
  const isMountedRef = useRef(true);
  // Ref de onMessage luon la phien ban moi nhat
  const onMessageRef = useRef<MessageHandler>(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Không kết nối lại nếu component đã unmount hoặc đã đạt tới giới hạn retry
    if (!isMountedRef.current) return;
    if (retriesRef.current >= maxRetries) {
      console.warn(`[EyeCU WS] Đã thử ${maxRetries} lần, dừng kết nối lại.`);
      return;
    }

    if (wsRef.current) {
      // Xoá handler cũ để tránh onclose bị gọi nhiều lần
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      console.log("[EyeCU WS] Connected:", url);
      retriesRef.current = 0; // Reset số lần thử khi kết nối thành công
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const msg: SocketMessage = JSON.parse(event.data);
        // Lọc gói "ping" của keep_alive — không chuyển lên component, không gây re-render
        if (msg.type === "ping") return;
        onMessageRef.current(msg);
      } catch {
        console.error("[EyeCU WS] Failed to parse message:", event.data);
      }
    };

    ws.onerror = () => {
      // onerror luôn đi kèm với onclose nên không cần xử lý thêm ở đây
      console.warn("[EyeCU WS] Connection warning: Server might be offline.");
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return; // Component đã unmount, không reconnect
      wsRef.current = null;

      if (reconnect && retriesRef.current < maxRetries) {
        // Exponential Backoff: 2^n * 1000ms, tối đa MAX_BACKOFF_MS
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), MAX_BACKOFF_MS);
        retriesRef.current += 1;
        console.log(`[EyeCU WS] Kết nối lại lần ${retriesRef.current} sau ${delay / 1000}s...`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };
  }, [url, reconnect, maxRetries]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      // Đánh dấu component đã unmount TRƯỚC khi close socket
      // Như vậy onclose sẽ thấy isMountedRef.current = false và không schedule reconnect
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onclose = null; // Xoá handler trước khi close
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else {
          ws.close();
        }
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  /**
   * send — Gửi message lên server
   *
   * - Nếu socket đang mở: gửi qua WebSocket (nhanh, real-time)
   * - Nếu socket chết: HTTP Fallback qua fetch (đảm bảo data không mất)
   *
   * @param data    Payload cần gửi
   * @param fallback Nếu socket chết, gọi endpoint nào? (tùy chọn)
   */
  const send = useCallback(
    async (data: Record<string, unknown>, fallback?: FallbackPayload): Promise<void> => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
        return;
      }

      // Socket không mở — thử HTTP Fallback nếu có cấu hình
      if (fallback) {
        console.warn("[EyeCU WS] Socket chết, chuyển sang HTTP Fallback:", fallback.endpoint);
        try {
          const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
          const API_URL = import.meta.env.VITE_API_URL ?? `http://${host}:8000`;
          const res = await fetch(`${API_URL}${fallback.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fallback.body),
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          console.log("[EyeCU WS] HTTP Fallback thành công.");
        } catch (err) {
          // Mất mạng hoàn toàn — PWA Workbox sẽ cache và bắn lại khi có mạng
          console.error("[EyeCU WS] HTTP Fallback thất bại (mất mạng hoàn toàn):", err);
        }
      } else {
        console.warn("[EyeCU WS] Socket chết và không có fallback được cấu hình.");
      }
    },
    [],
  );

  return { send };
}
