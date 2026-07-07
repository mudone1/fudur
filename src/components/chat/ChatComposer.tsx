"use client";

import { useState } from "react";
import { IconSend } from "@tabler/icons-react";

export default function ChatComposer({
  placeholder,
  onSend,
}: {
  placeholder: string;
  onSend: (text: string) => void | Promise<void>;
}) {
  const [text, setText] = useState("");

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await onSend(trimmed);
  }

  return (
    <div className="flex flex-shrink-0 items-end gap-2 border-t border-border p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={1}
        placeholder={placeholder}
        className="max-h-24 flex-1 resize-none rounded-2xl border border-border px-3.5 py-2.5 text-sm"
      />
      <button
        onClick={handleSend}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange text-white"
      >
        <IconSend size={16} />
      </button>
    </div>
  );
}
