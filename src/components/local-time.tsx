"use client";

import { useSyncExternalStore } from "react";

type Props = {
  iso: string;
  mode?: "time" | "datetime";
};

function formatClock(iso: string, mode: "time" | "datetime", timeZone: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (mode === "datetime") {
    return date.toLocaleString("bg-BG", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone,
    });
  }
  return date.toLocaleTimeString("bg-BG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

const emptySubscribe = () => () => {};

export function LocalTime({ iso, mode = "time" }: Props) {
  const text = useSyncExternalStore(
    emptySubscribe,
    () =>
      formatClock(
        iso,
        mode,
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Sofia"
      ),
    () => formatClock(iso, mode, "Europe/Sofia")
  );

  return <time dateTime={iso}>{text || "…"}</time>;
}
