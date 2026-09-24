"use client";

import React, { useRef, useState } from "react";
import { Paperclip, Send, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";
import type { TicketAttachment } from "@/context/ProjectContext";

export function ChatComposer({
  onSend,
  sending,
  placeholder = "Type a message...",
  accentClass = "bg-orange-500 hover:bg-orange-600 shadow-orange-glow",
}: {
  onSend: (text: string, attachments: TicketAttachment[]) => Promise<void> | void;
  sending: boolean;
  placeholder?: string;
  accentClass?: string;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<TicketAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        // Keep the live chat lightweight — 15MB cap per file
        if (file.size > 15 * 1024 * 1024) {
          alert(`"${file.name}" is larger than 15MB and was skipped.`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          setPending((prev) => [
            ...prev,
            {
              url: data.url,
              name: file.name,
              type: file.type || "",
              size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Attachment upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePending = (idx: number) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || uploading) return;
    if (!text.trim() && pending.length === 0) return;
    await onSend(text.trim(), pending);
    setText("");
    setPending([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pending.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-semibold text-navy-950 max-w-[160px]"
            >
              {a.type.startsWith("image/") ? (
                <ImageIcon className="h-3 w-3 text-orange-500 flex-shrink-0" />
              ) : (
                <FileText className="h-3 w-3 text-orange-500 flex-shrink-0" />
              )}
              <span className="truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="text-slate-400 hover:text-red-500 flex-shrink-0 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Attach image or PDF"
          className="flex-shrink-0 w-10 h-[42px] rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </button>

        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-navy-950 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none max-h-24"
        />

        <button
          type="submit"
          disabled={sending || uploading || (!text.trim() && pending.length === 0)}
          className={`flex-shrink-0 h-[42px] px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-300 disabled:shadow-none ${accentClass}`}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
