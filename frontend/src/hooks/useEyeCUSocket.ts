import { useEffect, useRef, useCallback } from "react";

// Dinh nghia cac loai message tu Backend
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
  | "FALL_DETECTED";

export interface SocketMessage {
  type: SocketMessageType;
  data?: Record<string, unknown>;
  ambulance?: string;
  condition?: string;
  severity?: string;
  room?: string;
  title?: string;
}

// Dinh nghia cau truc payload cho HTTP Fallback khi socket chet
export interface FallbackPayload {
  // endpoint tuong ung voi API backend (VD: "/api/ems/pre-alert")
  endpoint: string;
  body: Record<string, unknown>;
}

type MessageHandler = (message: SocketMessage) => void;

interface UseEyeCUSocketOptions {
  url: string;
  onMessage: MessageHandler;
  // Cho phep tat reconnect (VD: khi user dang nhap lai)
  reconnect?: boolean;
  // So lan thu ket noi lai toi da (mac dinh: 10 lan ~ khoang 8 phut)
  maxRetries?: number;
}

const MAX_BACKOFF_MS = 30_000; // Gioi han toi da 30 giay

/**
 * useEyeCUSocket — Enterprise WebSocket hook
 *
 * Tinh nang:
 *  - Tu dong loc goi "ping" cua server keep_alive, khong gay re-render thua
 *  - Exponential Backoff: lan 1=2s, lan 2=4s, lan 3=8s... toi da 30s
 *  - HTTP Fallback: khi socket chet va can gui data gap, tu dong goi REST API
 *  - Chong memory leak: huy setTimeout truoc khi unmount
 *  - onMessage luon dung phien ban moi nhat (tranh stale closure)
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
  // Flag de biet component da unmount chua, tranh setState sau unmount
  const isMountedRef = useRef(true);
  // Ref de onMessage luon la phien ban moi nhat
  const onMessageRef = useRef<MessageHandler>(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    // Khong ket noi lai neu component da unmount hoac da dat toi gioi han retry
    if (!isMountedRef.current) return;
    if (retriesRef.current >= maxRetries) {
      console.warn(`[EyeCU WS] Da thu ${maxRetries} lan, dung ket noi lai.`);
      return;
    }

    if (wsRef.current) {
      // Xoa handler cu de tranh onclose bi goi nhieu lan
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      console.log("[EyeCU WS] Connected:", url);
      retriesRef.current = 0; // Reset so lan thu khi ket noi thanh cong
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMountedRef.current) return;
      try {
        const msg: SocketMessage = JSON.parse(event.data);
        // Loc goi "ping" cua keep_alive — khong chuyen len component, khong gay re-render
        if (msg.type === "ping") return;
        onMessageRef.current(msg);
      } catch {
        console.error("[EyeCU WS] Failed to parse message:", event.data);
      }
    };

    ws.onerror = () => {
      // onerror luon di kem voi onclose nen khong can xu ly them o day
      console.error("[EyeCU WS] Connection error.");
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return; // Component da unmount, khong reconnect
      wsRef.current = null;

      if (reconnect && retriesRef.current < maxRetries) {
        // Exponential Backoff: 2^n * 1000ms, toi da MAX_BACKOFF_MS
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), MAX_BACKOFF_MS);
        retriesRef.current += 1;
        console.log(`[EyeCU WS] Ket noi lai lan ${retriesRef.current} sau ${delay / 1000}s...`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      }
    };
  }, [url, reconnect, maxRetries]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      // Danh dau component da unmount TRUOC khi close socket
      // Nhu vay onclose se thay isMountedRef.current = false va khong schedule reconnect
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Xoa handler truoc khi close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  /**
   * send — Gui message len server
   *
   * - Neu socket dang mo: gui qua WebSocket (nhanh, real-time)
   * - Neu socket chet: HTTP Fallback qua fetch (dam bao data khong mat)
   *
   * @param data    Payload can gui
   * @param fallback Neu socket chet, goi endpoint nao? (tuy chon)
   */
  const send = useCallback(
    async (data: Record<string, unknown>, fallback?: FallbackPayload): Promise<void> => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
        return;
      }

      // Socket khong mo — thu HTTP Fallback neu co cau hinh
      if (fallback) {
        console.warn("[EyeCU WS] Socket chet, chuyen sang HTTP Fallback:", fallback.endpoint);
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
          console.log("[EyeCU WS] HTTP Fallback thanh cong.");
        } catch (err) {
          // Mat mang hoan toan — PWA Workbox se cache va bắn lai khi co mang
          console.error("[EyeCU WS] HTTP Fallback that bai (mat mang hoan toan):", err);
        }
      } else {
        console.warn("[EyeCU WS] Socket chet va khong co fallback duoc cau hinh.");
      }
    },
    [],
  );

  return { send };
}
