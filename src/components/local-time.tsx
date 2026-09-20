"use client";

import { useEffect, useState } from "react";

type Props = {
  iso: string;
  mode?: "time" | "datetime";
};

export function LocalTime({ iso, mode = "time" }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    const date = new Date(iso);
    setText(
      mode === "datetime"
        ? date.toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })
        : date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
    );
  }, [iso, mode]);

  return <time dateTime={iso}>{text || "…"}</time>;
}
