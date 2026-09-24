import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Civil At Hand",
  description: "Read the Privacy Policy of Civil At Hand to understand how we collect, use, safeguard, and disclose your personal information in connection with our civil engineering and architectural services.",
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
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
              
              {/* 1. Introduction */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">1.</span> Introduction
                </h2>
                <p>
                  Welcome to <strong>Civil At Hand</strong> ("we," "us," or "our"), a sole proprietorship owned and operated by <strong>Nikhil</strong>, based in Haryana, India. We operate the website <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">civilathan.in</a> and provide comprehensive civil engineering and architectural services – including design, consultancy, and construction support – both online and on‑site. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or engage our services. Please read this policy carefully. If you disagree with its terms, please discontinue use of our website and services.
                </p>
              </div>

              {/* 2. Information We Collect */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">2.</span> Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">2.1 Personal Information You Provide</h3>
                    <p className="mb-2">
                      When you contact us, place a service request, use our online calculators, or communicate with us, we may collect the following personal information:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>Full name</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>Project-related files, drawings, and documents you share with us</li>
                      <li>Payment-related information (processed through Razorpay; we do not store card details)</li>
                      <li>Any other information you voluntarily provide during our engagement</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">2.2 Information Collected Automatically</h3>
                    <p className="mb-2">
                      When you visit our website, certain information is collected automatically through cookies and analytics tools, including:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>IP address</li>
                      <li>Browser type and version</li>
                      <li>Device type and operating system</li>
                      <li>Pages visited, time spent, and navigation patterns</li>
                      <li>Referring URLs</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">2.3 Information from Third‑Party Services</h3>
                    <p>
                      We may receive certain information through integrated third‑party tools such as Google Analytics, Razorpay, and our AI‑assisted calculation engines, subject to their respective privacy policies.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. How We Use Your Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">3.</span> How We Use Your Information
                </h2>
                <p className="mb-3">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>To deliver, manage, and improve our civil engineering and architectural design, consultancy, and construction support services</li>
                  <li>To communicate with you regarding your project, quotations, deliverables, and support</li>
                  <li>To process payments through Razorpay and maintain billing records</li>
                  <li>To send service‑related notifications and updates</li>
                  <li>To analyse website traffic and usage patterns to improve our website and tools</li>
                  <li>To comply with applicable legal obligations</li>
                  <li>To protect our rights and enforce our terms and agreements</li>
                </ul>
              </div>

              {/* 4. Legal Basis for Processing */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">4.</span> Legal Basis for Processing
                </h2>
                <p className="mb-2">
                  Where applicable law requires a legal basis for processing, we rely on:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Your consent, where explicitly given</li>
                  <li>The performance of a contract to which you are a party</li>
                  <li>Our legitimate business interests, where they do not override your rights</li>
                  <li>Compliance with a legal obligation</li>
                </ul>
              </div>

              {/* 5. Sharing of Your Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">5.</span> Sharing of Your Information
                </h2>
                <p className="mb-3">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    With third‑party service providers who assist us in operating our website and delivering services (e.g., Razorpay for payment processing, cloud storage, email services, hosting providers), solely for those purposes and under confidentiality obligations.
                  </li>
                  <li>
                    With government authorities or regulatory bodies when required by applicable law, court order, or legal process.
                  </li>
                  <li>
                    In connection with a business transfer, merger, or acquisition, subject to the same privacy commitments.
                  </li>
                </ul>
                <p className="mt-3">
                  All third‑party service providers we work with are required to handle your information securely and in accordance with applicable data protection laws.
                </p>
              </div>

              {/* 6. Data Retention */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">6.</span> Data Retention
                </h2>
                <p>
                  We retain your personal information only for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required by law. Project files and communications are generally retained for a period of three (3) years following project completion, after which they are securely deleted or anonymised. Payment records may be retained longer to comply with tax and accounting obligations.
                </p>
              </div>

              {/* 7. Your Rights */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">7.</span> Your Rights
                </h2>
                <p className="mb-3">
                  Subject to applicable law, you have the following rights regarding your personal information:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 mb-3">
                  <li><strong>Right to access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Right to deletion:</strong> Request deletion of your personal information, subject to legal retention obligations</li>
                  <li><strong>Right to restriction:</strong> Request restriction of processing of your information</li>
                  <li><strong>Right to data portability:</strong> Receive your information in a structured, machine‑readable format</li>
                  <li><strong>Right to withdraw consent:</strong> Where processing is based on consent, withdraw it at any time</li>
                </ul>
                <p>
                  To exercise any of these rights, please contact us at{" "}
                  <a href="mailto:info.civilathand@zohomail.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">
                    info.civilathand@zohomail.in
                  </a>
                  . We will respond to your request within 30 days.
                </p>
              </div>

              {/* 8. Data Security */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">8.</span> Data Security
                </h2>
                <p>
                  We implement appropriate technical and organisational security measures to protect your personal information against unauthorised access, disclosure, alteration, or destruction. All passwords and sensitive data are stored with strong hashing algorithms, and access to personal information is restricted to authorised personnel only. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
                </p>
              </div>

              {/* 9. Third‑Party Links */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">9.</span> Third‑Party Links
                </h2>
                <p>
                  Our website may contain links to third‑party websites (e.g., Razorpay, Google Analytics). We are not responsible for the privacy practices or content of those websites. We encourage you to review the privacy policies of any third‑party sites you visit.
                </p>
              </div>

              {/* 10. Children's Privacy */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">10.</span> Children's Privacy
                </h2>
                <p>
                  Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately at{" "}
                  <a href="mailto:info.civilathand@zohomail.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">
                    info.civilathand@zohomail.in
                  </a>{" "}
                  and we will take steps to delete it.
                </p>
              </div>

              {/* 11. Changes to This Privacy Policy */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">11.</span> Changes to This Privacy Policy
                </h2>
                <p>
                  We reserve the right to update this Privacy Policy at any time. Changes will be effective immediately upon posting to our website at civilathan.in. Your continued use of our website and services after any changes constitutes your acceptance of the updated policy. We encourage you to review this page periodically.
                </p>
              </div>

              {/* 12. Contact Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">12.</span> Contact Information
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
