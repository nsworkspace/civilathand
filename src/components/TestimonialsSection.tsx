"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, Quote, Send, CheckCircle2 } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role?: string;
  company?: string;
  message: string;
  rating: number;
};

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/testimonials")
      .then(res => res.json())
      .then(data => setTestimonials(data.testimonials || []))
      .catch(err => console.error("Failed to load testimonials:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError("Please add your name and a short review.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, message, rating }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong.");
      setDone(true);
      setName("");
      setRole("");
      setMessage("");
      setRating(5);
    } catch (err: any) {
      setError(err.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && testimonials.length === 0 && !showForm) {
    // Still let visitors leave the first review even with none approved yet.
  }

  return (
    <section className="py-20 bg-wix-dark text-white border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold text-orange-400 uppercase tracking-widest block mb-2">Client Feedback</span>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold uppercase tracking-tight text-white">What Our Clients Say</h2>
          <p className="text-slate-300 text-sm mt-2 font-medium">Real feedback from real projects.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-colors hover:border-orange-500/40"
              >
                <Quote className="h-6 w-6 text-orange-400 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= t.rating ? "text-orange-400 fill-orange-400" : "text-white/15"}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">"{t.message}"</p>
                <p className="text-sm font-bold text-white">{t.name}</p>
                {(t.role || t.company) && (
                  <p className="text-[11px] text-slate-400">{[t.role, t.company].filter(Boolean).join(" · ")}</p>
                )}
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="text-center">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 text-xs uppercase tracking-widest rounded-full transition-all shadow-orange-glow"
            >
              Share Your Experience
            </button>
          ) : done ? (
            <div className="max-w-md mx-auto flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-bold text-white">Thanks for the review!</p>
              <p className="text-xs text-slate-400">It'll appear here once our team approves it.</p>
            </div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left"
            >
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                    <Star className={`h-6 w-6 ${n <= rating ? "text-orange-400 fill-orange-400" : "text-white/15"}`} />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Role / Company"
                  className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none mb-3"
              />
              {error && <p className="text-red-400 text-xs font-medium mb-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-full"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Review
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}
