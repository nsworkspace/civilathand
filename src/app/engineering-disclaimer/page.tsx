import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Engineering Disclaimer | Civil At Hand",
  description: "Read the Engineering Disclaimer of Civil At Hand to understand the limitations, scope of technical advice, and liability regarding civil engineering and architectural design deliverables.",
};

export default function EngineeringDisclaimerPage() {
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
              Engineering Disclaimer
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3 text-xs font-medium text-slate-400">
              <span>Civil At Hand</span>
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
              
              {/* 1. General Disclaimer */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">1.</span> General Disclaimer
                </h2>
                <p className="mb-3">
                  The information, content, services, and deliverables provided by <strong>Civil At Hand</strong> ("we," "us," or "our") – owned by Nikhil – through our website{" "}
                  <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">
                    civilathan.in
                  </a>{" "}
                  are offered in good faith for general civil engineering and architectural design, consultancy, and construction support purposes. Nothing on this website constitutes formal professional certification, statutory engineering approval, or a guarantee of fitness for any specific construction or regulatory purpose.
                </p>
                <p>
                  By accessing our website or engaging our services, you acknowledge and agree to the terms of this Disclaimer.
                </p>
              </div>

              {/* 2. Engineering and Technical Advice */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">2.</span> Engineering and Technical Advice
                </h2>
                <p className="mb-2">
                  All engineering estimates, designs, drawings, BOQs, structural inputs, and technical outputs provided by Civil At Hand are based solely on the information, data, dimensions, and specifications supplied by the client. Accordingly:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>We make no warranty that any estimate, drawing, or technical document is accurate, complete, or suitable for any specific site, structure, or jurisdiction</li>
                  <li>Our services constitute design assistance and consultancy only and do not replace the certification or verification of a registered, licensed professional engineer in the client's jurisdiction</li>
                  <li>Clients are strongly advised to have all deliverables reviewed and certified by a locally licensed engineer or competent authority where required by applicable law or building regulations</li>
                  <li>Civil At Hand does not take responsibility for errors arising from incorrect, incomplete, or outdated information provided by the client</li>
                </ul>
              </div>

              {/* 3. Limitation of Liability for Construction and Site Use */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">3.</span> Limitation of Liability for Construction and Site Use
                </h2>
                <p className="mb-2">
                  Our deliverables are prepared as design and planning tools. Civil At Hand expressly disclaims all liability for:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>Construction defects, structural failures, or site accidents arising from the use or misuse of our deliverables</li>
                  <li>Losses, damages, or injuries resulting from the implementation of our designs or estimates on‑site</li>
                  <li>Third‑party modifications made to our deliverables after delivery, whether by the client, a contractor, or any other party</li>
                  <li>Non‑compliance with local building codes, regulations, or statutory requirements arising from the client's use of our deliverables</li>
                  <li>Decisions made by contractors, builders, or project managers based on our deliverables</li>
                </ul>
              </div>

              {/* 4. AI‑Assisted Services and Calculator Tools Disclaimer */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">4.</span> AI‑Assisted Services and Calculator Tools
                </h2>
                <p>
                  Civil At Hand utilises artificial intelligence (AI) tools, platforms, and custom calculation engines to assist in the preparation of certain deliverables, including estimates generated through our online calculators. These tools are used solely as aids; all outputs are reviewed, refined, and verified by our team of qualified engineers before delivery. Nevertheless, we make no warranty that such outputs are free from errors, limitations, or biases inherent in AI technologies. AI‑generated and calculator‑derived content should always be reviewed critically and verified by a qualified professional before implementation.
                </p>
              </div>

              {/* 5. Website Content Disclaimer */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">5.</span> Website Content Disclaimer
                </h2>
                <p>
                  All content published on{" "}
                  <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">
                    civilathan.in
                  </a>
                  , including articles, guides, project examples, and service descriptions, is provided for general informational and educational purposes only. It does not constitute professional engineering or architectural advice tailored to your specific circumstances. You should not rely solely on website content to make construction, structural, or design decisions.
                </p>
              </div>

              {/* 6. Third‑Party Content and Links */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">6.</span> Third‑Party Content and Links
                </h2>
                <p>
                  Our website may contain links to, or embed content from, third‑party websites and platforms (e.g., Razorpay, Google Analytics). Civil At Hand has no control over, and accepts no responsibility for, the content, accuracy, or privacy practices of any third‑party website. The inclusion of any link or reference does not imply our endorsement of the linked website or its content.
                </p>
              </div>

              {/* 7. No Warranty */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">7.</span> No Warranty
                </h2>
                <p>
                  To the maximum extent permitted by applicable law, Civil At Hand provides all services and content on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, non‑infringement, or accuracy.
                </p>
              </div>

              {/* 8. Accuracy of Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">8.</span> Accuracy of Information
                </h2>
                <p>
                  While we make every effort to ensure that information on our website is accurate and up to date, we do not guarantee the completeness, reliability, or currency of any content. Industry standards, building codes, and engineering best practices evolve, and information on our website may not always reflect the most current developments.
                </p>
              </div>

              {/* 9. Indemnification */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">9.</span> Indemnification
                </h2>
                <p className="mb-2">
                  By using our website and services, you agree to indemnify, defend, and hold harmless Civil At Hand, its owner, collaborators, and service providers from and against any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising from:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>Your breach of these terms or any applicable law</li>
                  <li>Your use or misuse of our deliverables</li>
                  <li>Incorrect or misleading information provided by you</li>
                  <li>Any third‑party claims resulting from your use of our services</li>
                </ul>
              </div>

              {/* 10. Governing Law */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">10.</span> Governing Law
                </h2>
                <p>
                  This Disclaimer shall be governed by the laws of India, and specifically the laws of the State of Haryana. Any disputes arising in connection with this Disclaimer shall be subject to the exclusive jurisdiction of the courts of Haryana, India.
                </p>
              </div>

              {/* 11. Contact Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">11.</span> Contact Information
                </h2>
                <div className="space-y-1 text-slate-600 font-medium">
                  <p>
                    <strong>Civil At Hand</strong> (Nikhil)
                  </p>
                  <p>
                    Email:{" "}
                    <a href="mailto:info.civilathand@zohomail.in" className="text-orange-600 hover:text-orange-700 underline">
                      info.civilathand@zohomail.in
                    </a>
                  </p>
                  <p>
                    Phone: <a href="https://civilathan.in/contact" className="text-orange-600 hover:text-orange-700 unde0rline">CONTACT US</a>
                  </p>
                  <p>
                    Address: Haryana, India
                  </p>
                  <p>
                    Udyam Registration: Registered (Udyam‑recognised micro‑enterprise)
                  </p>
                  <p>
                    GST: Not yet registered (applicable thresholds)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
