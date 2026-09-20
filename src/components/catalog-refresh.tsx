"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  nextRefreshAt: string;
  ttlMinutes: number;
};

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (totalSec <= 0) return "обновява се…";
  if (mins <= 0) return `след ${secs} сек`;
  return `след ${mins} мин ${secs.toString().padStart(2, "0")} сек`;
}

export function CatalogRefresh({ nextRefreshAt, ttlMinutes }: Props) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const refreshed = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = new Date(nextRefreshAt).getTime() - now;

  useEffect(() => {
    if (remaining > 0) {
      refreshed.current = false;
      return;
    }
    if (refreshed.current) return;
    refreshed.current = true;
    router.refresh();
  }, [remaining, router]);

  return (
    <span>
      Обновяване на {ttlMinutes} мин
      <br />
      следващо {formatRemaining(remaining)}
    </span>
  );
}
