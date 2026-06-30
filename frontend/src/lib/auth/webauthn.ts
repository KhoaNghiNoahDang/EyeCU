/**
 * WebAuthn (Passkey) — Face ID iOS / sinh trắc Android.
 * Yêu cầu HTTPS hoặc localhost. Platform authenticator bắt buộc userVerification.
 */

const RP_NAME = "EyeCU";

function getRpId() {
  return window.location.hostname;
}

function randomChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function cccdToUserId(cccd: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(cccd.padEnd(32, "0").slice(0, 32));
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.create === "function"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()) ?? true;
  } catch {
    return false;
  }
}

export type WebAuthnErrorCode =
  | "not_supported"
  | "not_secure"
  | "cancelled"
  | "failed"
  | "unknown";

export class WebAuthnError extends Error {
  code: WebAuthnErrorCode;
  constructor(code: WebAuthnErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "WebAuthnError";
  }
}

function mapWebAuthnError(err: unknown): WebAuthnError {
  if (err instanceof WebAuthnError) return err;
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") {
      return new WebAuthnError(
        "cancelled",
        "Bạn đã hủy xác thực sinh trắc. Vui lòng thử lại.",
      );
    }
    if (err.name === "SecurityError") {
      return new WebAuthnError(
        "not_secure",
        "WebAuthn cần HTTPS hoặc localhost. Hãy mở app qua localhost.",
      );
    }
  }
  return new WebAuthnError(
    "unknown",
    err instanceof Error ? err.message : "Xác thực sinh trắc thất bại",
  );
}

/** Đăng ký passkey gắn với CCCD — lưu credentialId vào patient registry */
export async function registerWebAuthnPasskey(cccd: string, displayName: string): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError(
      "not_supported",
      "Thiết bị không hỗ trợ WebAuthn. Dùng Safari/Chrome trên iOS hoặc Android.",
    );
  }

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: RP_NAME, id: getRpId() },
        user: {
          id: cccdToUserId(cccd),
          name: cccd,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
          requireResidentKey: false,
        },
        timeout: 120_000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new WebAuthnError("failed", "Không tạo được khóa sinh trắc");
    }

    return bufferToBase64url(credential.rawId);
  } catch (err) {
    throw mapWebAuthnError(err);
  }
}

/** Xác thực Face ID / vân tay khi đăng nhập */
export async function authenticateWebAuthnPasskey(credentialId: string): Promise<void> {
  if (!isWebAuthnSupported()) {
    throw new WebAuthnError("not_supported", "Thiết bị không hỗ trợ WebAuthn.");
  }

  if (!credentialId) {
    throw new WebAuthnError(
      "failed",
      "Tài khoản chưa đăng ký sinh trắc. Vui lòng đăng ký lại với Face ID.",
    );
  }

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        rpId: getRpId(),
        allowCredentials: [
          {
            id: base64urlToBuffer(credentialId),
            type: "public-key",
            transports: ["internal", "hybrid"],
          },
        ],
        userVerification: "required",
        timeout: 120_000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) {
      throw new WebAuthnError("failed", "Xác thực sinh trắc không thành công");
    }
  } catch (err) {
    throw mapWebAuthnError(err);
  }
}

export function getWebAuthnHint(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "Nhấn tiếp tục — iPhone sẽ mở Face ID hoặc Touch ID";
  }
  if (/Android/i.test(ua)) {
    return "Nhấn tiếp tục — điện thoại sẽ mở nhận diện khuôn mặt hoặc vân tay";
  }
  return "Nhấn tiếp tục — hệ thống sẽ yêu cầu sinh trắc học (Face ID / Windows Hello)";
}
