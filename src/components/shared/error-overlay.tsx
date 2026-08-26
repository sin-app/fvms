"use client";

import { useEffect } from "react";

// Diagnostik sementara: tampilkan error JS apa pun (termasuk hydration crash
// yang membunuh pohon React) langsung ke DOM agar terlihat di perangkat.
export function ErrorOverlay() {
  useEffect(() => {
    const show = (msg: string) => {
      let el = document.getElementById("__err_overlay");
      if (!el) {
        el = document.createElement("div");
        el.id = "__err_overlay";
        el.style.cssText =
          "position:fixed;left:0;right:0;top:0;z-index:99999;background:#7f1d1d;color:#fff;font:12px/1.5 monospace;padding:10px;white-space:pre-wrap;max-height:60%;overflow:auto;";
        document.body && document.body.appendChild(el);
      }
      el.textContent = "ERR: " + msg;
    };
    const onError = (e: ErrorEvent) =>
      show((e.error && e.error.stack) || e.message || String(e));
    const onReject = (e: PromiseRejectionEvent) =>
      show("promise: " + ((e.reason && e.reason.stack) || String(e.reason)));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);
  return null;
}
