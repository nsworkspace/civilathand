"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bug, Lightbulb, Star, Send, Loader2, CheckCircle2 } from "lucide-react";

type FeedbackType = "bug" | "suggestion" | "review";

const TYPE_OPTIONS: { id: FeedbackType; label: string; icon: React.ElementType }[] = [
  { id: "bug", label: "Report a Bug", icon: Bug },
  { id: "suggestion", label: "Suggestion", icon: Lightbulb },
  { id: "review", label: "Review", icon: Star },
];

export default function FeedbackForm({ lockType }: { lockType?: FeedbackType } = {}) {
  const [type, setType] = useState<FeedbackType>(lockType || "suggestion");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          email,
          message,
          rating: type === "review" ? rating : undefined,
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong.");
      }
      setDone(true);
      setName("");
      setEmail("");
      setMessage("");
      setRating(5);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="py-16 bg-navy-950">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <h3 className="text-xl font-display font-bold text-white">Thanks — got it!</h3>
            <p className="text-slate-400 text-sm max-w-md">
              Your {type === "bug" ? "bug report" : type === "review" ? "review" : "suggestion"} has been
              received. Our team looks at every submission.
            </p>
            {!lockType && (
              <button
                onClick={() => setDone(false)}
                className="mt-2 text-orange-400 hover:text-orange-300 text-xs font-bold uppercase tracking-wide"
              >
                Submit another response
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-navy-950">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            {lockType === "bug" ? "Report a Bug" : "Report a Bug, Suggest an Idea, or Leave a Review"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {lockType === "bug"
              ? "Found something broken? Tell us exactly what happened so we can fix it fast."
              : "Found something broken? Have an idea to make Civil At Hand better? Tell us directly."}
          </p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
        >
          {!lockType && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all ${
                    type === opt.id
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {type === "review" && (
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star`}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${n <= rating ? "text-orange-400 fill-orange-400" : "text-slate-600"}`}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
            <input
              type="email"
              placeholder="Your email (optional)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          <textarea
            placeholder={
              type === "bug"
                ? "Describe the bug — what happened, and what page were you on?"
                : type === "review"
                ? "Tell us about your experience..."
                : "What would make Civil At Hand better?"
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none mb-4"
          />

          {error && <p className="text-red-400 text-xs font-medium mb-4">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-lg transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </button>
        </motion.form>
      </div>
    </section>
  );
}
