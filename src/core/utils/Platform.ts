export type PlatformKind = 'mobile' | 'desktop';

export const Platform = {
  isTouchDevice(): boolean {
    try {
      // Use multiple signals to detect touch capability
       
      const navAny: any = typeof navigator !== 'undefined' ? navigator : {};
      const hasTouchPoints = Number(navAny.maxTouchPoints || navAny.msMaxTouchPoints || 0) > 0;
      const hasTouchEvents = typeof window !== 'undefined' && ('ontouchstart' in window || 'ontouchend' in window);
      return hasTouchPoints || hasTouchEvents;
    } catch {
      return false;
    }
  },

  isMobileUA(): boolean {
    try {
      const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
      return /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile)/i.test(ua);
    } catch {
      return false;
    }
  },

  kind(): PlatformKind {
    return (this.isMobileUA() || this.isTouchDevice()) ? 'mobile' : 'desktop';
  },

  hasGamepadAPI(): boolean {
    try {
      return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
    } catch {
      return false;
    }
  },

  sharedArrayBufferAvailable(): boolean {
    try { return typeof (globalThis as any).SharedArrayBuffer !== 'undefined' && !!(globalThis as any).crossOriginIsolated; } catch { return false; }
  }
};

