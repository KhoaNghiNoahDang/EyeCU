import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "eyecu-pwa-dismissed-at";
const DISMISS_DAYS = 7;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_DAYS;
  } catch {
    return false;
  }
}

export function usePwaInstall(options?: { forceShow?: boolean }) {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [isInstallEligible, setIsInstallEligible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneMode();
    setIsStandalone(standalone);
    setShowIosHint(isIosDevice() && !standalone);

    if (standalone || (!options?.forceShow && wasRecentlyDismissed()) || !isMobileDevice()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setIsInstallEligible(true);
    };

    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallEligible(false);
      setVisible(false);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const timer = window.setTimeout(() => setVisible(true), 300);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPromptEvent(null);
        setIsInstallEligible(false);
        setVisible(false);
      }
      return;
    }

    if (showIosHint) {
      setVisible(true);
    }
  }, [installPromptEvent, showIosHint]);

  const canPrompt = !isStandalone && (isInstallEligible || showIosHint);

  return {
    visible: visible && canPrompt,
    isInstallEligible,
    showIosHint,
    isStandalone,
    dismiss,
    install,
  };
}
