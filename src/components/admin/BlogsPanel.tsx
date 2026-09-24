"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useRef, useEffect } from "react";
import { useProjects, BlogPost } from "@/context/ProjectContext";
import { generateSlug } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FilePlus, Trash2, Edit3, Bold, Italic, Heading,
  List, ListOrdered, Link2, Quote, Eraser, Sparkles, X,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Code, Subscript, Superscript, Minus, Paintbrush,
  Image as ImageIcon, Type, Eye, Heart, Share2,
  Search, Copy, ExternalLink, Star, Tag, Save, Undo2, Redo2, WandSparkles
} from "lucide-react";

const MASTER_BLOG_PROMPT = String.raw`CIVIL AT HAND — MASTER BLOG PROMPT
You are the Senior Content Writer, SEO Researcher, Technical Editor, and Content Strategist for Civil At Hand, covering civil engineering, construction, infrastructure, Indian Railways, engineering education, government jobs, technical concepts, and careers.

For every topic I provide, create a 100% original, technically accurate, deeply researched, professional, SEO-friendly, publication-ready article.

1. RESEARCH & ACCURACY
Research the topic using reliable, current sources, prioritising government and ministry websites, Indian Railways/RRB, BIS, IRC, MoRTH, universities and professional organisations, official notifications, research papers and primary/authoritative technical sources. Cross-check important facts. Verify current dates, vacancies, eligibility, salaries, standards, codes, formulas, dimensions, units, statistics and specifications. Never invent facts, figures, sources, URLs, rules, citations or clause numbers. Clearly label historical, current, expected and unofficial information.

2. REFERENCE MATERIAL
Any text I provide is research/reference material only. Do not copy, closely paraphrase, reproduce distinctive wording, structure, tables, introduction or conclusion. Independently create the article's structure, explanations, examples, comparisons and conclusions.

3. WRITING
Write natural, professional English with correct engineering terminology and Indian context where relevant. Avoid AI-style/generic openings, filler and repetition, keyword stuffing, fake enthusiasm, unnecessary headings, robotic phrasing, overly long paragraphs and unsupported claims. Answer the main search question early. For question-based topics, use a short Short Answer section when appropriate.

4. SEO
Determine search intent before writing. Identify Primary Keyword, Secondary Keywords and relevant search questions. Optimise naturally for search intent, semantic relevance, snippets, readability and long-tail searches. Create an SEO Title of about 50–60 characters where practical, SEO Description of about 140–160 characters where practical, and a short lowercase hyphenated URL Slug. Never sacrifice clarity for character limits.

5. ARTICLE
Create one strong H1 matching the search intent. Use logical H2/H3 headings, short paragraphs, useful bullets, numbered steps and simple mobile-friendly tables only when helpful. Write only as much as needed to completely satisfy the topic. Completeness matters more than word count. For calculations show Formula, Variables, Calculation, Unit and Result/explanation. For standards/codes verify the current applicable standard and never invent clauses.

6. INDIA-SPECIFIC CONTEXT
When relevant, prioritise Indian engineering practices, Railways/RRB, SSC JE, government jobs, IS codes, IRC/MoRTH, construction standards, salaries and education. Clearly distinguish Indian and international information where necessary.

7. IMAGES
Recommend only useful images, normally 1 featured/banner image and 2–4 in-article images. For every image provide Number, Placement, Purpose, Detailed image-generation prompt and Alt text. Every image prompt MUST include: “Realistic professional engineering scene, centered balanced composition, primary subject safely within the central 60–70% of the frame, generous safe margins on both sides, no important subject near the edges, suitable for responsive website cropping on desktop and mobile.” Images must be technically believable, realistic, clean, professionally composed and naturally lit. Do not include Civil At Hand text, logo, website URL, watermark, promotional text, random/fake text, unrealistic engineering or distorted people/machinery. For banner images use a wide horizontal composition with a strong central subject and safe mobile cropping. Alt text must be short, accurate, accessible and descriptive without keyword stuffing.

8. IMAGE PLACEMENT
Inside the article, insert only markers such as: ## [IMAGE 1 — INSERT HERE]. Place each marker exactly where the image is most useful. Never put image-generation prompts inside the article.

9. INTERNAL LINKS
Suggest 3–6 genuinely relevant Civil At Hand article topics. If the exact URL is unknown, do not invent it. Use: Suggested article: [topic]

10. FAQ
Create 3–6 useful FAQs based on real search intent. Answers must be direct, accurate and concise.

11. RESEARCH NOTES
List the important verified sources actually used. Prioritise official and authoritative sources. Clearly separate Verified sources used and Reference material supplied by the user. Never fabricate URLs.

12. CANONICAL URL
If the exact Civil At Hand domain is unknown, use: [INSERT CIVIL AT HAND BLOG URL]. Never invent the domain.

13. REQUIRED OUTPUT ORDER
Return exactly these sections in this order:
Article Title:
Category:
Status: Draft
Public URL Slug:
Author Name: CivAtHand Admin
Banner Image Search Prompt:
Accessible Image Alt Text:
Brief Summary:
SEO Title:
SEO Description:
Primary Keyword:
Secondary Keywords:
Suggested Tags:
Canonical URL:
Blog Formatting & Presentation:
Use Markdown H1/H2/H3 hierarchy, ~30–36px H1, ~24–28px H2, ~20–22px H3, ~16–18px body text, ~14–16px table text, ~13–14px captions, 1.5–1.7 line height, short paragraphs, good spacing, mobile-friendly tables and safe image cropping. Let CMS CSS control final sizing when applicable.
Recommended Image Plan:
Image 1 — Featured/Banner
Placement: Top
Purpose: [Purpose]
Image Generation Prompt: [Detailed prompt]
Alt Text: [Alt text]
Image 2
Placement: [Exact location]
Purpose: [Purpose]
Image Generation Prompt: [Detailed prompt]
Alt Text: [Alt text]
Image 3
Placement: [Exact location]
Purpose: [Purpose]
Image Generation Prompt: [Detailed prompt]
Alt Text: [Alt text]
Add more only when genuinely useful.
Suggested Internal Links:
[3–6 topics]
FAQ Section:
[Question]
[Answer]
[Question]
[Answer]
[Question]
[Answer]
Research & Verification Notes:
[Verified source]
[Verified source]
[Verified source]

FULL ARTICLE CONTENT
Write the complete, publication-ready article here. Use Markdown H1/H2/H3 headings, short paragraphs, bullets, numbered lists, useful tables, bold emphasis where appropriate and natural keyword usage. Insert image markers where required: ## [IMAGE 1 — INSERT HERE] ## [IMAGE 2 — INSERT HERE] ## [IMAGE 3 — INSERT HERE]. Do not put SEO notes, research notes, image prompts or writing instructions inside the article. FULL ARTICLE CONTENT MUST ALWAYS BE THE LAST SECTION. NOTHING MAY APPEAR AFTER IT.

14. FINAL QUALITY CHECK
Before answering, silently verify: research is current and reliable; no invented facts or sources; technical details, formulas, units and standards are correct; search intent is satisfied; SEO is natural; writing is original and professional; no copied/closely paraphrased material; article is complete but not unnecessarily long; images are realistic and technically believable; subjects stay within the central 60–70% safe area; no Civil At Hand branding inside images; image markers are correctly placed; article is mobile-friendly; Full Article Content is last.

BLOG INPUT
Topic:
[PASTE BLOG TOPIC HERE]

Reference/Copied Material:
[PASTE REFERENCE MATERIAL HERE — RESEARCH ONLY]

Optional Special Instructions:
[ADD TOPIC-SPECIFIC REQUIREMENTS HERE]`;

export function BlogsPanel() {
  const { blogs, addBlog, updateBlog, deleteBlog } = useProjects();
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogCategory, setBlogCategory] = useState<BlogPost["category"]>("Structure");
  const [blogAuthor, setBlogAuthor] = useState("CivAtHand Admin");
  const [blogImage, setBlogImage] = useState("");
  const [blogImageAlt, setBlogImageAlt] = useState("");
  const [blogStatus, setBlogStatus] = useState<BlogPost["status"]>("published");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogTags, setBlogTags] = useState("");
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogSeoDescription, setBlogSeoDescription] = useState("");
  const [blogCanonicalUrl, setBlogCanonicalUrl] = useState("");
  const [blogFeatured, setBlogFeatured] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<"all" | BlogPost["status"]>("all");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("All");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const resetBlogForm = () => {
    setEditingBlogId(null);
    setBlogTitle("");
    setBlogSummary("");
    setBlogContent("");
    setBlogCategory("Structure");
    setBlogAuthor("CivAtHand Admin");
    setBlogImage("");
    setBlogImageAlt("");
    setBlogStatus("published");
    setBlogSlug("");
    setBlogTags("");
    setBlogSeoTitle("");
    setBlogSeoDescription("");
    setBlogCanonicalUrl("");
    setBlogFeatured(false);
    setSlugManuallyEdited(false);
    setEditorMode("write");
  };

  const filteredAdminBlogs = blogs.filter((post) => {
    const q = adminSearch.trim().toLowerCase();
    const matchesSearch = !q || [post.title, post.summary, post.author, post.slug, ...(post.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
    const matchesStatus = adminStatusFilter === "all" || post.status === adminStatusFilter;
    const matchesCategory = adminCategoryFilter === "All" || post.category === adminCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const plainArticleText = blogContent.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const articleWordCount = plainArticleText ? plainArticleText.split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(articleWordCount / 200));
  const articleHeadingCount = (blogContent.match(/<h[2-3]\b/gi) || []).length;
  const articleParagraphCount = (blogContent.match(/<p\b/gi) || []).length;
  const articleListCount = (blogContent.match(/<(ul|ol)\b/gi) || []).length;
  const articleLinkCount = (blogContent.match(/<a\b/gi) || []).length;
  const articleImageCount = (blogContent.match(/<img\b/gi) || []).length;
  const articleSentenceCount = Math.max(1, (plainArticleText.match(/[.!?]+(?=\s|$)/g) || []).length);
  const averageSentenceLength = articleWordCount ? Math.round(articleWordCount / articleSentenceCount) : 0;
  const qualityChecks = [
    { label: "Length", pass: articleWordCount >= 700 },
    { label: "Headings", pass: articleHeadingCount >= 3 },
    { label: "Paragraphs", pass: articleParagraphCount >= Math.max(3, Math.ceil(articleWordCount / 180)) },
    { label: "SEO title", pass: blogSeoTitle.trim().length >= 30 && blogSeoTitle.trim().length <= 60 },
    { label: "SEO description", pass: blogSeoDescription.trim().length >= 120 && blogSeoDescription.trim().length <= 160 },
    { label: "Tags", pass: blogTags.split(",").map((tag) => tag.trim()).filter(Boolean).length >= 3 },
    { label: "Featured image", pass: Boolean(blogImage.trim()) },
    { label: "Image alt", pass: articleImageCount === 0 || Boolean(blogImageAlt.trim()) },
    { label: "Links", pass: articleLinkCount >= 2 },
  ];
  const qualityScore = Math.round((qualityChecks.filter((check) => check.pass).length / qualityChecks.length) * 100);
  const qualityLabel = qualityScore >= 85 ? "Excellent" : qualityScore >= 65 ? "Strong" : qualityScore >= 45 ? "Needs polish" : "Needs work";

  // Editor functions (same as original)
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return "";
    let html = markdown;
    html = html.replace(/^###\s+(.*?)$/gm, "<h3>$1</h3>");
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/^\-\s+(.*?)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);
    return html.split("\n\n").map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<li>")) return trimmed;
      return `<p>${trimmed}</p>`;
    }).join("");
  };

  useEffect(() => {
    if (editorMode === "write" && editorRef.current && editorRef.current.innerHTML !== blogContent) {
      editorRef.current.innerHTML = blogContent || "";
    }
  }, [blogContent, editorMode]);

  const escapeHtml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatInlineMarkdown = (value: string) => {
    let text = escapeHtml(value);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_\n]+)_/g, "<em>$1</em>");
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return text;
  };

  const normalizeArticleText = (value: string) => value
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*([,.;:!?])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const autoFormatArticle = (overrideSource?: string) => {
    const source = normalizeArticleText(overrideSource ?? (blogContent || editorRef.current?.innerText || ""));
    if (!source.trim()) {
      notifyAdmin("Add some article text first.");
      return;
    }

    const hasRichBlocks = /<(h[1-6]|ul|ol|blockquote|table|figure|img)\b/i.test(source);
    let html = "";
    if (hasRichBlocks) {
      html = source
        .replace(/&nbsp;/gi, " ")
        .replace(/<h1\b/gi, "<h2")
        .replace(/<\/h1>/gi, "</h2>")
        .replace(/>\s+</g, "><");
    } else {
      const normalized = normalizeArticleText(source.replace(/\r\n?/g, "\n"));
      const lines = normalized.split("\n");
      const blocks: string[] = [];
      let paragraph: string[] = [];
      let listType: "ul" | "ol" | null = null;
      let listItems: string[] = [];

      const flushList = () => {
        if (!listType || !listItems.length) return;
        blocks.push(`<${listType}>${listItems.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join("")}</${listType}>`);
        listType = null;
        listItems = [];
      };
      const flushParagraph = () => {
        if (!paragraph.length) return;
        blocks.push(`<p>${formatInlineMarkdown(paragraph.join(" ").trim())}</p>`);
        paragraph = [];
      };

      lines.forEach((raw, index) => {
        const line = raw.trim();
        if (!line) {
          flushParagraph();
          flushList();
          return;
        }

        const heading = line.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
          flushParagraph(); flushList();
          const level = index === 0 ? 2 : Math.min(3, heading[0].match(/^#+/)?.[0].length || 2);
          blocks.push(`<h${level}>${formatInlineMarkdown(heading[1].trim())}</h${level}>`);
          return;
        }

        const bullet = line.match(/^[-*•]\s+(.+)$/);
        const numbered = line.match(/^\d+[.)]\s+(.+)$/);
        if (bullet || numbered) {
          flushParagraph();
          const nextType = bullet ? "ul" : "ol";
          if (listType && listType !== nextType) flushList();
          listType = nextType;
          listItems.push((bullet || numbered)![1]);
          return;
        }

        if (/^>\s+/.test(line)) {
          flushParagraph(); flushList();
          blocks.push(`<blockquote>${formatInlineMarkdown(line.replace(/^>\s+/, ""))}</blockquote>`);
          return;
        }

        const words = line.split(/\s+/).length;
        const isLikelyHeading = words <= 10 && (
          /^[A-Z][^.!?]{2,80}:$/.test(line) ||
          /^(introduction|overview|why|what|how|benefits|advantages|disadvantages|applications|methodology|steps|process|design considerations|key considerations|common mistakes|best practices|conclusion|final thoughts|summary|frequently asked questions|faqs?)$/i.test(line)
        );
        if (isLikelyHeading) {
          flushParagraph(); flushList();
          blocks.push(`<h2>${formatInlineMarkdown(line.replace(/:$/, ""))}</h2>`);
          return;
        }

        paragraph.push(line);
      });
      flushParagraph();
      flushList();
      html = blocks.join("");
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      setBlogContent(html);
      editorRef.current.focus();
    } else {
      setBlogContent(html);
    }
    notifyAdmin("Article structure cleaned: headings, paragraphs, lists and emphasis are ready to edit.");
  };

  const copyMasterBlogPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_BLOG_PROMPT);
      notifyAdmin("Master Blog Prompt copied. Paste it into your AI tool and then paste the result here.");
    } catch {
      window.prompt("Copy the Civil At Hand Master Blog Prompt:", MASTER_BLOG_PROMPT);
    }
  };

  const suggestSeoMetadata = () => {
    const cleanTitle = blogTitle.trim();
    const firstParagraph = plainArticleText.slice(0, 155).replace(/\s+\S*$/, "");
    if (!cleanTitle && !firstParagraph) {
      notifyAdmin("Add a title or article content first.");
      return;
    }
    if (!blogSeoTitle.trim()) setBlogSeoTitle(cleanTitle.slice(0, 60));
    if (!blogSeoDescription.trim()) setBlogSeoDescription((blogSummary.trim() || firstParagraph).slice(0, 160));
    if (!blogTags.trim()) {
      const source = `${cleanTitle} ${plainArticleText.slice(0, 500)}`.toLowerCase();
      const stopWords = new Set(["about", "after", "before", "civil", "construction", "from", "have", "into", "that", "their", "this", "with", "your", "what", "when", "where", "which", "will"]);
      const words = source.match(/[a-z][a-z-]{4,}/g) || [];
      const tags = Array.from(new Set(words.filter((word) => !stopWords.has(word)))).sort((a, b) => b.length - a.length).slice(0, 5);
      if (tags.length) setBlogTags(tags.join(", "));
    }
    notifyAdmin("SEO suggestions added. Review them before publishing.");
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text/plain");
    const html = e.clipboardData.getData("text/html");
    if (!text.trim()) return;

    // AI/chat/editor paste is intentionally normalized into clean semantic blocks.
    // This prevents non-breaking spaces, inline styling and line-wrap artifacts from
    // producing uneven word spacing or giant pasted headings.
    const shouldNormalize = text.length > 180 || /(^#{1,6}\s)|(^[-*•]\s)|(^\d+[.)]\s)|\*\*[^*]+\*\*/m.test(text) || /&nbsp;|style=|font-size|font-family/i.test(html);
    if (shouldNormalize) {
      e.preventDefault();
      const existing = editorRef.current?.innerText?.trim() || "";
      const combined = existing ? `${existing}\n\n${text}` : text;
      autoFormatArticle(combined);
      return;
    }

    if (!html) {
      e.preventDefault();
      autoFormatArticle(text);
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setBlogContent(e.currentTarget.innerHTML);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      const currentWidth = img.style.width || img.getAttribute("width") || "auto";
      const newWidth = prompt("Enter new image width (e.g., 50%, 100%, 300px, or 'auto' to reset):", currentWidth);
      if (newWidth !== null) {
        const trimmed = newWidth.trim();
        if (trimmed === "" || trimmed.toLowerCase() === "auto") {
          img.style.width = "";
          img.removeAttribute("width");
        } else {
          img.style.width = trimmed;
        }
        img.style.height = "auto";
        if (editorRef.current) {
          setBlogContent(editorRef.current.innerHTML);
        }
      }
    }
  };

  const runCommand = (command: string, value: string = "") => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(command, false, value || undefined);
    } catch (err) {
      console.warn(`[RichEditor] Command "${command}" is not supported:`, err);
    }
    setBlogContent(editorRef.current.innerHTML);
  };

  const compressImage = (file: File, maxWidth: number = 1000, maxHeight: number = 1000, quality: number = 0.65): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = () => resolve(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onerror = () => resolve(file);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        };
      };
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
    } catch (e) {
      console.warn("Client image compression failed:", e);
    }
    const formData = new FormData();
    formData.append("file", fileToUpload);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    if (!data.url) throw new Error("No URL returned");
    return data.url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      runCommand("insertImage", url);
      setShowImageMenu(false);
    } catch (err) {
      console.warn("File upload failed, falling back to Base64:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          runCommand("insertImage", base64Url);
        }
      };
      reader.readAsDataURL(file);
      setShowImageMenu(false);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBannerUploading(true);
    try {
      const url = await uploadFile(file);
      setBlogImage(url);
    } catch (err) {
      console.warn("Banner file upload failed, falling back to Base64:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setBlogImage(base64Url);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsBannerUploading(false);
      e.target.value = "";
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (isMod) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        runCommand("bold");
      } else if (key === "i") {
        e.preventDefault();
        runCommand("italic");
      } else if (key === "u") {
        e.preventDefault();
        runCommand("underline");
      } else if (key === "h") {
        e.preventDefault();
        runCommand("formatBlock", "<h3>");
      } else if (key === "k") {
        e.preventDefault();
        const url = prompt("Enter link URL:", "https://");
        if (url) {
          runCommand("createLink", url);
        }
      }
    }
  };

  const insertTemplateHtml = (templateType: "spec" | "takeoff") => {
    const specTemplate = `<h3>Concrete Quality Spec Sheet</h3><ul><li>Concrete Grade: M25</li><li>Testing Standard: IS 516</li><li>7-Day Target Strength: 16.5 N/mm²</li><li>28-Day Target Strength: 25 N/mm²</li></ul><h3>Site Inspection Checklist</h3><ul><li>Check concrete slump before placing</li><li>Verify rebar clear cover spacing</li><li>Cure with ponding method for 14 days</li></ul><p></p>`;
    const takeoffTemplate = `<h3>Structural Quantity Takeoff</h3><ul><li>Member ID: column-C1-ground-floor</li><li>Cement Grade: OPC 43</li><li>Steel Bar Diameter: 12mm / 16mm / 20mm</li><li>Sand Zone: Zone II River Sand</li></ul><h3>Estimation Details</h3><ul><li>Coarse Aggregate required: 8.5 m³</li><li>Steel reinforcement required: 1.25 Tons</li><li>Total Cement required: 180 Bags</li></ul><p></p>`;
    const templateHtml = templateType === "spec" ? specTemplate : takeoffTemplate;
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = document.createRange().createContextualFragment(templateHtml);
        const lastInserted = fragment.lastChild;
        range.insertNode(fragment);
        if (lastInserted) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastInserted);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        editorRef.current.insertAdjacentHTML("beforeend", templateHtml);
      }
      setBlogContent(editorRef.current.innerHTML);
    }
    setShowTemplates(false);
  };

  const openNewBlogModal = () => {
    resetBlogForm();
    setIsBlogModalOpen(true);
  };

  const startEditBlog = (post: BlogPost) => {
    setEditingBlogId(post.id);
    setBlogTitle(post.title);
    setBlogSummary(post.summary);
    const isHtml = post.content.includes("<p>") || post.content.includes("<h3>") || post.content.includes("<ul>");
    const contentHtml = isHtml ? post.content : convertMarkdownToHtml(post.content);
    setBlogContent(contentHtml);
    setBlogCategory(post.category);
    setBlogAuthor(post.author);
    setBlogImage(post.image);
    setBlogImageAlt(post.imageAlt || post.title);
    setBlogStatus(post.status);
    setBlogSlug(post.slug || generateSlug(post.title));
    setBlogTags((post.tags || []).join(", "));
    setBlogSeoTitle(post.seoTitle || post.title);
    setBlogSeoDescription(post.seoDescription || post.summary);
    setBlogCanonicalUrl(post.canonicalUrl || "");
    setBlogFeatured(Boolean(post.featured));
    setSlugManuallyEdited(Boolean(post.slug));
    setEditorMode("write");
    setIsBlogModalOpen(true);
  };

  const duplicateBlog = (post: BlogPost) => {
    setEditingBlogId(null);
    setBlogTitle(`${post.title} — Copy`);
    setBlogSummary(post.summary);
    setBlogContent(post.content);
    setBlogCategory(post.category);
    setBlogAuthor(post.author);
    setBlogImage(post.image);
    setBlogImageAlt(post.imageAlt || post.title);
    setBlogStatus("draft");
    setBlogSlug(`${post.slug || generateSlug(post.title)}-copy`);
    setBlogTags((post.tags || []).join(", "));
    setBlogSeoTitle(`${post.seoTitle || post.title} — Copy`);
    setBlogSeoDescription(post.seoDescription || post.summary);
    setBlogCanonicalUrl("");
    setBlogFeatured(false);
    setSlugManuallyEdited(true);
    setEditorMode("write");
    setIsBlogModalOpen(true);
  };

  const cancelEditBlog = () => {
    setIsBlogModalOpen(false);
    resetBlogForm();
  };

  const copyBlogLink = async (post: BlogPost) => {
    const slug = post.slug || generateSlug(post.title);
    const url = `${window.location.origin}/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      notifyAdmin("Blog link copied.");
    } catch {
      window.prompt("Copy this blog link:", url);
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const submitStatus = submitter?.dataset.status as BlogPost["status"] | undefined;
    const effectiveStatus = submitStatus || blogStatus;

    if (!blogTitle.trim() || !blogContent.trim()) {
      notifyAdmin("Please add a title and article content.");
      return;
    }

    const cleanTitle = blogTitle.trim();
    const fallbackImage = blogImage.trim() || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80";
    const finalSlug = (blogSlug.trim() || generateSlug(cleanTitle))
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const tags = [...new Set(
      blogTags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    )].slice(0, 12);

    const normalizedContent = blogContent.replace(/&nbsp;/gi, " ").replace(/>\s+</g, "><");

    const blogMeta = {
      title: cleanTitle,
      summary: blogSummary.trim(),
      content: normalizedContent,
      category: blogCategory,
      author: blogAuthor.trim() || "CivAtHand Admin",
      image: fallbackImage,
      imageAlt: blogImageAlt.trim() || cleanTitle,
      status: effectiveStatus,
      slug: finalSlug,
      tags,
      seoTitle: blogSeoTitle.trim() || cleanTitle,
      seoDescription: blogSeoDescription.trim() || blogSummary.trim(),
      canonicalUrl: blogCanonicalUrl.trim(),
      featured: blogFeatured,
    };

    try {
      if (editingBlogId) {
        await updateBlog(editingBlogId, blogMeta);
        notifyAdmin("Blog post updated successfully.");
      } else {
        await addBlog(blogMeta);
        notifyAdmin(effectiveStatus === "published" ? "Blog post published successfully." : "Draft saved successfully.");
      }
      setIsBlogModalOpen(false);
      resetBlogForm();
    } catch {
      notifyAdmin("The blog could not be saved. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 flex-grow text-xs text-navy-950"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950">Engineering Blog & Content Management</h3>
          <p className="text-xs text-navy-600 mt-1">Write, edit, and publish engineering technical articles and site news update logs.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openNewBlogModal}
          className="self-start sm:self-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-premium cursor-pointer"
        >
          <FilePlus className="h-4.5 w-4.5 text-white" />
          Create New Article
        </motion.button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total</span>
          <p className="text-2xl font-extrabold text-navy-950 mt-1">{blogs.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Published</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1">{blogs.filter((p) => p.status === "published").length}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Drafts</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">{blogs.filter((p) => p.status === "draft").length}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-wider text-orange-700">Featured</span>
          <p className="text-2xl font-extrabold text-orange-800 mt-1">{blogs.filter((p) => p.featured).length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder="Search title, author, tags or slug..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
          />
        </div>
        <select value={adminStatusFilter} onChange={(e) => setAdminStatusFilter(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select value={adminCategoryFilter} onChange={(e) => setAdminCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800">
          <option value="All">All categories</option>
          <option value="Structure">Structure</option>
          <option value="Educational">Educational</option>
          <option value="Transportation">Transportation</option>
          <option value="General tech">General Tech</option>
          <option value="Architecture">Architecture</option>
          <option value="Case studies">Case Studies</option>
          <option value="Civil engineering">Civil Engineering</option>
        </select>
      </div>

      <div className="space-y-4">
        <h4 className="font-display font-extrabold text-sm text-navy-950 uppercase tracking-wider">
          Blog Articles ({filteredAdminBlogs.length}{blogs.length !== filteredAdminBlogs.length ? ` of ${blogs.length}` : ""})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[580px] pr-1 animate-fadeIn">
          {blogs.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
              <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3 animate-pulse" />
              No articles found. Start publishing!
            </div>
          ) : (
            filteredAdminBlogs.map((post) => (
              <div key={post.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm flex gap-4 items-start">
                <div className="h-16 w-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100">
                  <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-grow space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      {post.category}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${post.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {post.status}
                    </span>
                    {post.featured && (
                      <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-500" /> Featured
                      </span>
                    )}
                    <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {(post.views || 0)} views
                    </span>
                    <span className="text-[8px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-rose-500 stroke-rose-500" /> {(post as any).likes || 0} likes
                    </span>
                    <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                      <Share2 className="h-3 w-3" /> {(post as any).shares || 0} shares
                    </span>
                    <span className="text-[9px] text-navy-500 ml-auto font-medium">{post.date}</span>
                  </div>
                  <h5 className="font-display font-extrabold text-xs text-navy-950 truncate" title={post.title}>{post.title}</h5>
                  <p className="text-[10px] text-navy-600 line-clamp-1 italic">&ldquo;{post.summary}&rdquo;</p>
                  <p className="text-[9px] text-navy-600 font-semibold">Author: {post.author}</p>
                  <div className="flex gap-2 items-center pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        const nextStatus = post.status === "published" ? "draft" : "published";
                        updateBlog(post.id, { status: nextStatus });
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition-colors"
                    >
                      {post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        onClick={() => startEditBlog(post)}
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 p-1.5 rounded-lg transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateBlog(post)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition-colors"
                        title="Duplicate as draft"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => copyBlogLink(post)}
                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 p-1.5 rounded-lg transition-colors"
                        title="Copy public link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this blog post?")) {
                            deleteBlog(post.id);
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-1.5 rounded-lg transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isBlogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl border-b border-white/5 select-none">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    {editingBlogId ? "Edit Blog Article" : "Create New Blog Article"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Write and preview your engineering blog post in a spacious dedicated window.</p>
                </div>
                <button
                  type="button"
                  onClick={cancelEditBlog}
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleBlogSubmit} className="p-6 md:p-8 space-y-6 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Article Title</label>
                      <input
                        type="text"
                        required
                        value={blogTitle}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBlogTitle(value);
                          if (!slugManuallyEdited) setBlogSlug(generateSlug(value));
                          if (!blogSeoTitle || blogSeoTitle === blogTitle) setBlogSeoTitle(value);
                          if (!blogImageAlt || blogImageAlt === blogTitle) setBlogImageAlt(value);
                        }}
                        placeholder="e.g. Modern Rebar Placement Guide"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Category</label>
                        <select
                          value={blogCategory}
                          onChange={(e) => setBlogCategory(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        >
                          <option value="Structure">Structure</option>
                          <option value="Educational">Educational</option>
                          <option value="Transportation">Transportation</option>
                          <option value="General tech">General Tech</option>
                          <option value="Architecture">Architecture</option>
                          <option value="Case studies">Case Studies</option>
                          <option value="Civil engineering">Civil Engineering</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                          value={blogStatus}
                          onChange={(e) => setBlogStatus(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft (Private)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Public URL Slug</label>
                          <button
                            type="button"
                            onClick={() => {
                              setBlogSlug(generateSlug(blogTitle));
                              setSlugManuallyEdited(true);
                            }}
                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700"
                          >
                            Regenerate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={blogSlug}
                          onChange={(e) => {
                            setSlugManuallyEdited(true);
                            setBlogSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                          }}
                          placeholder="your-article-slug"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                        <p className="text-[9px] text-slate-400 mt-1">/blog/{blogSlug || generateSlug(blogTitle) || "your-slug"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Author Name</label>
                        <input
                          type="text"
                          required
                          value={blogAuthor}
                          onChange={(e) => setBlogAuthor(e.target.value)}
                          placeholder="e.g. Er. Amit Wagh"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Banner Image URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="bannerImageUploadInput"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            style={{ display: "none" }}
                          />
                          <button
                            type="button"
                            disabled={isBannerUploading}
                            onClick={() => document.getElementById("bannerImageUploadInput")?.click()}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                          >
                            {isBannerUploading ? "Uploading..." : "Upload Device File"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {blogImage && (
                          <div className="relative h-11 w-16 rounded-lg overflow-hidden border border-slate-300 bg-slate-50 group flex-shrink-0">
                            <img src={blogImage} alt="Banner Preview" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setBlogImage("")}
                              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-bold transition-all uppercase tracking-wide cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                        <input
                          type="text"
                          value={blogImage}
                          onChange={(e) => setBlogImage(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-grow bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Select a local device file to upload it, or paste any public image URL. Only the URL path is stored in the database.</p>
                      <input
                        type="text"
                        value={blogImageAlt}
                        onChange={(e) => setBlogImageAlt(e.target.value)}
                        placeholder="Accessible image alt text"
                        maxLength={180}
                        className="mt-2 w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Brief Summary</label>
                      <textarea
                        required
                        rows={3}
                        value={blogSummary}
                        onChange={(e) => setBlogSummary(e.target.value)}
                        placeholder="A short snippet shown on card preview..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm resize-none transition-all"
                      />
                    </div>

                    <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-orange-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-800">SEO & Publishing</span>
                      </div>
                      <input
                        type="text"
                        value={blogTags}
                        onChange={(e) => setBlogTags(e.target.value)}
                        placeholder="Tags: structural design, RCC, BOQ"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={blogSeoTitle}
                        onChange={(e) => setBlogSeoTitle(e.target.value)}
                        placeholder="SEO title (recommended 50–60 characters)"
                        maxLength={180}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <textarea
                        rows={2}
                        value={blogSeoDescription}
                        onChange={(e) => setBlogSeoDescription(e.target.value)}
                        placeholder="SEO description (clear, useful summary for search results)"
                        maxLength={320}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                      />
                      <input
                        type="url"
                        value={blogCanonicalUrl}
                        onChange={(e) => setBlogCanonicalUrl(e.target.value)}
                        placeholder="Canonical URL (optional)"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blogFeatured}
                          onChange={(e) => setBlogFeatured(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                        />
                        Feature this article on the public blog
                      </label>
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">
                          Full Article Content
                        </label>
                        <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                          <button
                            type="button"
                            onClick={() => setEditorMode("write")}
                            className={`px-3 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${editorMode === "write" ? "bg-white text-navy-950 shadow-sm" : "text-navy-600 hover:text-navy-950"}`}
                          >
                            Write
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode("preview")}
                            className={`px-3 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all ${editorMode === "preview" ? "bg-white text-navy-950 shadow-sm" : "text-navy-600 hover:text-navy-950"}`}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                      {editorMode === "write" ? (
                        <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Quality</div><div className="mt-0.5 text-sm font-black text-navy-950">{qualityScore}% <span className="text-[9px] text-orange-600">{qualityLabel}</span></div></div>
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Structure</div><div className="mt-0.5 text-sm font-black text-navy-950">{articleHeadingCount} headings · {articleListCount} lists</div></div>
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2"><div className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Reading</div><div className="mt-0.5 text-sm font-black text-navy-950">~{estimatedReadTime} min · {averageSentenceLength} words/sentence</div></div>
                          <button type="button" onClick={suggestSeoMetadata} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-left hover:bg-orange-100 transition-colors"><div className="text-[8px] font-extrabold uppercase tracking-wider text-orange-600">SEO Assist</div><div className="mt-0.5 text-[10px] font-black text-orange-800">Suggest metadata</div></button>
                        </div>
                        <div className="border border-slate-300 rounded-lg bg-white shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
                          <div className="flex flex-wrap items-center gap-1 bg-slate-50 border-b border-slate-200 px-2 py-1.5 text-slate-600 select-none rounded-t-lg">
                          <select
                            aria-label="Block style"
                            defaultValue="p"
                            onChange={(e) => runCommand("formatBlock", `<${e.target.value}>`)}
                            className="h-7 rounded border border-slate-200 bg-white px-1.5 text-[9px] font-bold text-slate-700 outline-none"
                          >
                            <option value="p">Body</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                            <option value="blockquote">Quote</option>
                            <option value="pre">Code</option>
                          </select>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("undo")} className="p-1 rounded hover:bg-slate-200" title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("redo")} className="p-1 rounded hover:bg-slate-200" title="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => autoFormatArticle()} className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-orange-700 hover:bg-orange-200" title="Automatically structure pasted AI content"><WandSparkles className="h-3 w-3" /> Auto Format</button>
                            <button type="button" onClick={copyMasterBlogPrompt} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-700 hover:bg-slate-200" title="Copy the Civil At Hand Master Blog Prompt for AI"><Copy className="h-3 w-3" /> Copy AI Prompt</button>
                          <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("bold")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Bold (Ctrl+B)"
                            >
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("italic")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Italic (Ctrl+I)"
                            >
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("underline")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Underline (Ctrl+U)"
                            >
                              <Underline className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("strikeThrough")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Strikethrough"
                            >
                              <Strikethrough className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("subscript")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Subscript"
                            >
                              <Subscript className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("superscript")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Superscript"
                            >
                              <Superscript className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                try {
                                  const current = document.queryCommandValue("fontSize") || "3";
                                  const next = Math.min(7, parseInt(current) + 1);
                                  runCommand("fontSize", next.toString());
                                } catch (err) {
                                  console.warn(err);
                                }
                              }}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors flex items-center justify-center font-display font-extrabold text-[10px] w-6 h-6 select-none"
                              title="Increase Font Size"
                            >
                              A+
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                try {
                                  const current = document.queryCommandValue("fontSize") || "3";
                                  const next = Math.max(1, parseInt(current) - 1);
                                  runCommand("fontSize", next.toString());
                                } catch (err) {
                                  console.warn(err);
                                }
                              }}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors flex items-center justify-center font-display font-extrabold text-[10px] w-6 h-6 select-none"
                              title="Decrease Font Size"
                            >
                              A-
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("formatBlock", "<h3>")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="H3 Heading"
                            >
                              <Heading className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("formatBlock", "<pre>")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Code Block"
                            >
                              <Code className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("formatBlock", "<blockquote>")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Blockquote"
                            >
                              <Quote className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("insertHorizontalRule")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Horizontal Divider"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("insertUnorderedList")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Bullet List"
                            >
                              <List className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("insertOrderedList")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Numbered List"
                            >
                              <ListOrdered className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("justifyLeft")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Align Left"
                            >
                              <AlignLeft className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("justifyCenter")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Align Center"
                            >
                              <AlignCenter className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("justifyRight")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Align Right"
                            >
                              <AlignRight className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("justifyFull")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Justify Text"
                            >
                              <AlignJustify className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const url = prompt("Enter link URL:", "https://");
                                if (url) runCommand("createLink", url);
                              }}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Insert Link (Ctrl+K)"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowImageMenu(!showImageMenu)}
                                className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors flex items-center"
                                title="Insert Image Options"
                              >
                                <ImageIcon className="h-3.5 w-3.5" />
                              </button>
                              {showImageMenu && (
                                <div className="absolute right-0 mt-1.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-premium-lg z-25 flex flex-col gap-3.5 animate-fadeIn select-none w-56">
                                  <div className="space-y-1.5">
                                    <label htmlFor="editorImageUploadInput" className="block text-[9px] font-bold text-navy-950 uppercase tracking-wider cursor-pointer hover:text-orange-500 transition-colors">Upload from Device</label>
                                    <input
                                      id="editorImageUploadInput"
                                      type="file"
                                      accept="image/*"
                                      disabled={isUploading}
                                      onChange={handleImageUpload}
                                      className="w-full text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer file:cursor-pointer"
                                    />
                                    {isUploading && (
                                      <span className="text-[8px] text-orange-600 font-semibold animate-pulse block mt-0.5">Uploading...</span>
                                    )}
                                  </div>
                                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                                    <label className="block text-[9px] font-bold text-navy-950 uppercase tracking-wider">Insert from URL</label>
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="https://example.com/image.png"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        className="flex-grow bg-slate-50 border border-slate-300 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-blue-600 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (urlInput.trim()) {
                                            runCommand("insertImage", urlInput.trim());
                                            setUrlInput("");
                                            setShowImageMenu(false);
                                          }
                                        }}
                                        className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-2.5 py-1 rounded text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                                      >
                                        Insert
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowColors(!showColors)}
                                className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors flex items-center"
                                title="Text Color"
                              >
                                <Paintbrush className="h-3.5 w-3.5" />
                              </button>
                              {showColors && (
                                <div className="absolute right-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-premium-lg z-25 grid grid-cols-6 gap-1.5 animate-fadeIn select-none w-44">
                                  {[
                                    { name: "Red", hex: "#721126ff" },
                                    { name: "Pink", hex: "#df1c1cff" },
                                    { name: "Purple", hex: "#6b1bb5ff" },
                                    { name: "Blue", hex: "#2525ebff" },
                                    { name: "Sky Blue", hex: "#026bc7e7" },
                                    { name: "Teal", hex: "#1b940dff" },
                                    { name: "Green", hex: "#16a34a" },
                                    { name: "Yellow", hex: "#ca8a04" },
                                    { name: "Orange", hex: "#dff021ff" },
                                    { name: "Gray", hex: "#1c2634ff" },
                                    { name: "Navy", hex: "#1e3a8a" },
                                    { name: "Black", hex: "#000000" }
                                  ].map((color) => (
                                    <button
                                      key={color.hex}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        runCommand("foreColor", color.hex);
                                        setShowColors(false);
                                      }}
                                      className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer shadow-sm hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color.hex }}
                                      title={color.name}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowFonts(!showFonts)}
                                className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors flex items-center"
                                title="Font Family"
                              >
                                <Type className="h-3.5 w-3.5" />
                              </button>
                              {showFonts && (
                                <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-lg shadow-premium-lg z-25 py-1 text-slate-800 text-[10px] font-semibold divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                  {[
                                    { name: "Default", family: "system-ui, sans-serif" },
                                    { name: "Times New Roman", family: "Times New Roman, Georgia, serif" },
                                    { name: "Arial", family: "Arial, Helvetica, sans-serif" },
                                    { name: "Georgia", family: "Georgia, serif" },
                                    { name: "Courier New", family: "Courier New, Courier, monospace" },
                                    { name: "Verdana", family: "Verdana, Geneva, sans-serif" },
                                    { name: "Impact", family: "Impact, Charcoal, sans-serif" }
                                  ].map((font) => (
                                    <button
                                      key={font.family}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        runCommand("fontName", font.family);
                                        setShowFonts(false);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors block text-[10px]"
                                      style={{ fontFamily: font.family }}
                                    >
                                      {font.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => runCommand("removeFormat")}
                              className="p-1 rounded hover:bg-slate-200 hover:text-navy-950 transition-colors"
                              title="Clear Selection Formatting"
                            >
                              <Eraser className="h-3.5 w-3.5" />
                            </button>
                            <div className="h-4 w-[1px] bg-slate-300 mx-1 flex-shrink-0" />
                            <div className="relative">
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded text-[9px] font-bold uppercase transition-all"
                                title="Insert Engineering Templates"
                              >
                                <Sparkles className="h-3 w-3" />
                                Templates
                              </button>
                              {showTemplates && (
                                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-premium-lg z-20 py-1 text-slate-800 text-[10px] font-semibold divide-y divide-slate-100">
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => insertTemplateHtml("spec")}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors block"
                                  >
                                    Concrete Grade & Spec Sheet
                                  </button>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => insertTemplateHtml("takeoff")}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors block"
                                  >
                                    Material Quantity Takeoff (BOQ)
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="relative w-full">
                            <style dangerouslySetInnerHTML={{
                              __html: `
                              #blogContentTextarea:empty::before {
                                content: attr(data-placeholder);
                                color: #94a3b8;
                                font-style: italic;
                                position: absolute;
                                left: 12px;
                                top: 10px;
                                pointer-events: none;
                              }
                              #blogContentTextarea h3 {
                                font-size: 1.15em;
                                font-weight: 800;
                                margin-top: 12px;
                                margin-bottom: 6px;
                                color: #0f172a;
                              }
                              #blogContentTextarea ul {
                                list-style-type: disc;
                                padding-left: 20px;
                                margin-top: 6px;
                                margin-bottom: 6px;
                              }
                              #blogContentTextarea ol {
                                list-style-type: decimal;
                                padding-left: 20px;
                                margin-top: 6px;
                                margin-bottom: 6px;
                              }
                              #blogContentTextarea blockquote {
                                border-left: 4px solid #ff6b00;
                                padding-left: 12px;
                                font-style: italic;
                                color: #64748b;
                                margin-top: 10px;
                                margin-bottom: 10px;
                              }
                              #blogContentTextarea pre {
                                background-color: #f1f5f9;
                                padding: 8px 12px;
                                border-radius: 6px;
                                font-family: monospace;
                                margin-top: 8px;
                                margin-bottom: 8px;
                                overflow-x: auto;
                              }
                              #blogContentTextarea hr {
                                border: none;
                                border-top: 2px dashed #cbd5e1;
                                margin: 16px 0;
                              }
                              #blogContentTextarea img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                margin: 12px auto;
                                display: block;
                                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                                cursor: pointer;
                                transition: outline 0.1s ease;
                              }
                              #blogContentTextarea img:hover {
                                outline: 3px solid #ff6b00;
                              }
                            `}} />
                            <div
                              ref={editorRef}
                              id="blogContentTextarea"
                              contentEditable={true}
                              onInput={handleEditorInput}
                              onKeyDown={handleEditorKeyDown}
                              onPaste={handleEditorPaste}
                              onClick={handleEditorClick}
                              data-placeholder="Paste your full AI article here. Use Auto Format to turn Markdown/plain text into clean headings, paragraphs, lists and quotes."
                              className="w-full bg-transparent border-none px-4 py-4 focus:outline-none text-slate-800 overflow-y-auto min-h-[420px] max-h-[620px] outline-none prose prose-slate prose-editor"
                              style={{ minHeight: "220px" }}
                            />
                          </div>
                          <div className="bg-slate-50 border-t border-slate-100 px-3 py-1 flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none rounded-b-lg">
                            <span>Words: {articleWordCount.toLocaleString("en-IN")}</span>
                            <span>Chars: {plainArticleText.length.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="border-t border-slate-100 bg-white px-3 py-2">
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-bold uppercase tracking-wide">
                              {qualityChecks.map((check) => <span key={check.label} className={check.pass ? "text-emerald-600" : "text-slate-400"}>{check.pass ? "✓" : "○"} {check.label}</span>)}
                            </div>
                          </div>
                        </div>
                        </>
                      ) : (
                        <div
                          className="border border-slate-300 rounded-lg p-4 bg-slate-50 min-h-[305px] overflow-y-auto max-h-[380px] prose prose-slate text-xs leading-relaxed font-medium"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(blogContent) || '<span class="text-slate-400 italic">Nothing to preview. Start writing!</span>' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {articleWordCount.toLocaleString("en-IN")} words · ~{estimatedReadTime} min read
                    {slugManuallyEdited ? " · custom slug" : ""}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={cancelEditBlog}
                      className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      data-status="draft"
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      data-status="published"
                      className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-premium cursor-pointer"
                    >
                      {editingBlogId ? "Save & Publish" : "Publish Post"}
                    </motion.button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
