import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms and Conditions | Civil At Hand",
  description: "Read the Terms and Conditions of Civil At Hand governing the use of our website and the provision of civil engineering and architectural services.",
};

export default function TermsAndConditionsPage() {
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
              Terms and Conditions
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
              
              {/* 1. Acceptance of Terms */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">1.</span> Acceptance of Terms
                </h2>
                <p>
                  By accessing and using the website <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">civilathan.in</a> (the "Site") and engaging the services of <strong>Civil At Hand</strong> ("we," "us," or "our"), owned by Nikhil, you agree to comply with and be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Site or our services.
                </p>
              </div>

              {/* 2. Scope of Services */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">2.</span> Scope of Services
                </h2>
                <p className="mb-2">
                  Civil At Hand provides a comprehensive range of civil engineering and architectural services, including but not limited to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Structural design and analysis</li>
                  <li>Architectural design and planning</li>
                  <li>Quantity surveying and BOQ preparation</li>
                  <li>Construction support and supervision</li>
                  <li>Feasibility studies and site assessments</li>
                  <li>Project management consultancy</li>
                  <li>Online design assistance and remote consultancy</li>
                </ul>
                <p className="mt-2">
                  All services are delivered either online or on‑site, as agreed with the client. We reserve the right to modify or expand our service offerings at any time.
                </p>
              </div>

              {/* 3. Client Obligations */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">3.</span> Client Obligations
                </h2>
                <p className="mb-2">
                  To enable us to provide our services effectively, you agree to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Provide accurate, complete, and up‑to‑date information, drawings, and specifications</li>
                  <li>Communicate promptly and clearly regarding project requirements and feedback</li>
                  <li>Review and approve deliverables within a reasonable timeframe</li>
                  <li>Obtain any necessary permits, approvals, or certifications required by local authorities for your project</li>
                  <li>Engage a licensed professional engineer in your jurisdiction to review and certify our deliverables where required by law</li>
                </ul>
              </div>

              {/* 4. Fees and Payment */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">4.</span> Fees and Payment
                </h2>
                <div className="space-y-3">
                  <p>
                    <strong>4.1 Fee Structure:</strong> Our fees are quoted on a per‑project basis, depending on the scope, complexity, and deliverables required. A detailed quotation will be provided before work commences.
                  </p>
                  <p>
                    <strong>4.2 Payment Terms:</strong> A deposit of 50% of the total project fee is required before the start of any work. The remaining 50% is due upon delivery of the final deliverables, unless otherwise agreed in writing.
                  </p>
                  <p>
                    <strong>4.3 Payment Methods:</strong> We accept payments through <strong>Razorpay</strong>, which supports all major credit/debit cards, UPI, net banking, and other payment methods available through the Razorpay platform. All transactions are processed securely; we do not store your card or banking details.
                  </p>
                  <p>
                    <strong>4.4 Tax:</strong> Our fees are exclusive of any taxes, duties, or levies that may be applicable under Indian law. Any such taxes will be added to the invoice as required.
                  </p>
                </div>
              </div>

              {/* 5. Refund and Cancellation Policy */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">5.</span> Refund and Cancellation Policy
                </h2>
                <div className="space-y-3">
                  <p>
                    <strong>5.1 Project Cancellation by Client:</strong> If you wish to cancel a project before any work has commenced, you may request a refund of the deposit paid, subject to a deduction of <strong>10% of the total project fee</strong> to cover administrative and processing costs. The remaining amount will be refunded within 15 business days.
                  </p>
                  <p>
                    <strong>5.2 Project Cancellation After Commencement:</strong> Once any work has begun (including but not limited to design, drafting, analysis, or consultation), <strong>no refunds will be issued</strong>. In exceptional circumstances, we may, at our sole discretion, offer a partial refund or credit, but we are under no obligation to do so.
                  </p>
                  <p>
                    <strong>5.3 Project Delays by Client:</strong> If the client fails to provide required information or feedback within a reasonable time, we reserve the right to suspend work and charge additional fees for any delay or re‑initiation of work.
                  </p>
                  <p>
                    <strong>5.4 Dissatisfaction with Deliverables:</strong> We strive for 100% client satisfaction. If you are not satisfied with any deliverable, you may request revisions within 10 business days of receipt. We will make reasonable efforts to address your concerns at no additional cost. Beyond that period, revisions may be subject to additional charges.
                  </p>
                </div>
              </div>

              {/* 6. Intellectual Property */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">6.</span> Intellectual Property
                </h2>
                <p>
                  All designs, drawings, reports, calculations, models, and other deliverables created by Civil At Hand for a client remain our intellectual property until full payment is received. Upon full payment, the client receives a non‑exclusive, non‑transferable license to use the deliverables for the specific project for which they were created. We retain all rights to our underlying methodologies, processes, and proprietary tools. The client may not sell, distribute, or sub‑license our deliverables to any third party without our prior written consent.
                </p>
              </div>

              {/* 7. Limitation of Liability */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">7.</span> Limitation of Liability
                </h2>
                <p>
                  To the maximum extent permitted by applicable law, Civil At Hand shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, arising out of or in connection with your use of our website, services, or deliverables, even if we have been advised of the possibility of such damages. Our total liability to you for any claim arising under these Terms shall not exceed the total amount paid by you to us for the specific project giving rise to the claim.
                </p>
              </div>

              {/* 8. Indemnification */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">8.</span> Indemnification
                </h2>
                <p className="mb-2">
                  You agree to indemnify, defend, and hold harmless Civil At Hand, its owner, collaborators, and service providers from and against any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising from:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Your breach of these Terms or any applicable law</li>
                  <li>Your use or misuse of our deliverables</li>
                  <li>Incorrect or misleading information provided by you</li>
                  <li>Any third‑party claims resulting from your use of our services</li>
                </ul>
              </div>

              {/* 9. Use of AI and Calculator Tools */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">9.</span> Use of AI and Calculator Tools
                </h2>
                <p>
                  We may employ artificial intelligence and proprietary calculation engines to assist in generating estimates, designs, and other technical outputs. These tools are used solely as aids, and all final outputs are reviewed and verified by our qualified engineering team. However, we make no warranty that AI‑generated content is free from errors or that it is suitable for your specific project. You are responsible for having all deliverables independently reviewed by a licensed professional in your jurisdiction.
                </p>
              </div>

              {/* 10. Data Privacy and Security */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">10.</span> Data Privacy and Security
                </h2>
                <p>
                  We take data security seriously. All personal information provided by you is stored securely in our database, with sensitive data such as passwords hashed using strong cryptographic algorithms. We restrict access to your information to authorised personnel only. For more details, please refer to our <a href="/privacy-policy" className="text-orange-600 hover:text-orange-700 underline font-semibold">Privacy Policy</a>.
                </p>
              </div>

              {/* 11. Third‑Party Services */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">11.</span> Third‑Party Services
                </h2>
                <p>
                  Our website and services integrate with third‑party providers, including Razorpay for payment processing and Google Analytics for website analytics. We are not responsible for the practices, content, or security of these third‑party services. You should review their respective terms and policies.
                </p>
              </div>

              {/* 12. Governing Law and Dispute Resolution */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">12.</span> Governing Law and Dispute Resolution
                </h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of India, specifically the laws of the State of Haryana. Any dispute, controversy, or claim arising out of or relating to these Terms or the provision of our services shall be resolved through amicable negotiations. If no resolution is reached within 30 days, the dispute shall be submitted to the exclusive jurisdiction of the courts of Haryana, India.
                </p>
              </div>

              {/* 13. Modifications to Terms */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">13.</span> Modifications to Terms
                </h2>
                <p>
                  We reserve the right to update or modify these Terms at any time without prior notice. Changes will be effective immediately upon posting to our website. Your continued use of the Site or our services after any changes constitutes your acceptance of the revised Terms. We encourage you to review this page periodically.
                </p>
              </div>

              {/* 14. Contact Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">14.</span> Contact Information
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
                    Phone: <a href="https://civilathan.in/contact" className="text-orange-600 hover:text-orange-700 underline">CONTACT US</a>
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
