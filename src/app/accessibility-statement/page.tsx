import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Accessibility Statement | NS Construction",
  description: "NS Construction is committed to making our website accessible to all individuals, including those with disabilities. Read our Accessibility Statement.",
};

export default function AccessibilityStatementPage() {
  return (
    <div className="flex flex-col min-h-screen bg-wix-gray">
      <Header />

      <main className="flex-grow">
        {/* Editorial Page Header */}
        <section className="bg-wix-dark text-white py-16 md:py-20 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest block mb-3">Legal Documentation</span>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight">
              Accessibility Statement
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs font-medium text-slate-400">
              <span>NS Construction</span>
              <span>•</span>
              <span>civilathan.in</span>
              <span>•</span>
              <span className="text-white">Effective Date: June 10, 2026</span>
            </div>
          </div>
        </section>

        {/* Legal Text Layout */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-slate-200/80 rounded-md p-8 md:p-12 shadow-sm font-sans text-sm text-slate-700 leading-relaxed space-y-10">
              
              {/* 1. Our Commitment */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">1.</span> Our Commitment
                </h2>
                <p>
                  NS Construction is committed to providing an inclusive and accessible digital experience for all individuals, including those with disabilities. We strive to ensure that our website <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">civilathan.in</a> is usable and accessible to as many people as possible, regardless of ability or assistive technology. We continuously work to improve the accessibility of our site in line with recognised standards.
                </p>
              </div>

              {/* 2. Accessibility Standards */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">2.</span> Accessibility Standards
                </h2>
                <p>
                  We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1</strong> at the AA level, as published by the World Wide Web Consortium (W3C). These guidelines explain how to make web content more accessible for people with disabilities. While we strive to meet these standards, we acknowledge that some areas may not yet be fully compliant. We are actively working to address any gaps.
                </p>
              </div>

              {/* 3. Accessibility Features */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">3.</span> Accessibility Features
                </h2>
                <p className="mb-2">
                  Our website incorporates a variety of accessibility features, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Keyboard navigation:</strong> All interactive elements can be accessed using a keyboard.</li>
                  <li><strong>Screen reader compatibility:</strong> Proper semantic HTML and ARIA landmarks support assistive technologies.</li>
                  <li><strong>Colour contrast:</strong> Sufficient colour contrast between text and background for readability.</li>
                  <li><strong>Text resizing:</strong> Text can be resized using browser settings without loss of functionality.</li>
                  <li><strong>Alt text:</strong> All meaningful images have descriptive alt text.</li>
                  <li><strong>Clear headings and structure:</strong> Consistent heading hierarchy for easy navigation.</li>
                  <li><strong>Focus indicators:</strong> Visible focus states for interactive elements.</li>
                </ul>
              </div>

              {/* 4. Third‑Party Content */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">4.</span> Third‑Party Content
                </h2>
                <p>
                  Some parts of our website may include content from third‑party providers (e.g., embedded videos, social media widgets, or payment gateways). While we strive to ensure these are accessible, we cannot control the accessibility of third‑party content. We encourage you to contact us if you encounter any accessibility barriers associated with third‑party elements on our site.
                </p>
              </div>

              {/* 5. Ongoing Efforts */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">5.</span> Ongoing Efforts
                </h2>
                <p>
                  We are committed to continuous improvement. We regularly review our website for accessibility issues and work with accessibility experts to address any shortcomings. We also provide training for our content creators and developers on accessibility best practices. We welcome feedback from our users to help us improve.
                </p>
              </div>

              {/* 6. Limitations and Exceptions */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">6.</span> Limitations and Exceptions
                </h2>
                <p>
                  Despite our efforts, there may be some parts of our website that are not fully accessible. For example, some older documents may be in formats that are not fully accessible, or certain interactive features may have limitations. We are actively working to address these issues and will update this statement as improvements are made.
                </p>
              </div>

              {/* 7. Feedback and Contact */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">7.</span> Feedback and Contact
                </h2>
                <p className="mb-2">
                  We value your feedback. If you encounter any accessibility barriers on our website, have suggestions for improvement, or require assistance accessing any content, please contact us. We will make every effort to respond to your inquiry and provide the information you need in an accessible format.
                </p>
                <div className="space-y-1 text-slate-600 font-medium">
                  <p>
                    <strong>NS Construction</strong> (Nikhil)
                  </p>
                  <p>
                    Email:{" "}
                    <a href="mailto:info.civilathand@zohomail.in" className="text-orange-600 hover:text-orange-700 underline">
                      info.civilathand@zohomail.in
                    </a>
                  </p>
                  <p>
                    Phone: <a href="https://civilathan.in/contact" className="text-orange-600 hover:text-orange-700 underline">CONTACT US</a>
                  </p>
                  <p>
                    Address: Haryana, India
                  </p>
                </div>
              </div>

              {/* 8. Updates to This Statement */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">8.</span> Updates to This Statement
                </h2>
                <p>
                  This Accessibility Statement may be updated from time to time to reflect changes in our accessibility practices or legal requirements. We encourage you to review this page periodically. Your continued use of our website after any updates constitutes your acceptance of the revised statement.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
