import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | NS Construction",
  description: "Read our Cookie Policy to understand how we use cookies and similar technologies to enhance your experience on civilathan.in.",
};

export default function CookiePolicyPage() {
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
              Cookie Policy
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
              
              {/* 1. Introduction */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">1.</span> Introduction
                </h2>
                <p>
                  NS Construction ("we," "us," or "our") uses cookies and similar tracking technologies on our website <a href="https://civilathan.in" className="text-orange-600 hover:text-orange-700 underline font-semibold">civilathan.in</a>. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use. By continuing to use our website, you consent to our use of cookies as described in this policy.
                </p>
              </div>

              {/* 2. What Are Cookies */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">2.</span> What Are Cookies
                </h2>
                <p>
                  Cookies are small text files placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners about how visitors interact with the site. Cookies can be "persistent" (remain on your device until deleted) or "session" (expire when you close your browser).
                </p>
              </div>

              {/* 3. Types of Cookies We Use */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">3.</span> Types of Cookies We Use
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">3.1 Essential Cookies</h3>
                    <p>
                      These cookies are necessary for the website to function properly. They enable basic functionalities such as page navigation, secure access to authenticated areas, and remembering your login session. Without these cookies, the website may not work as intended.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">3.2 Performance and Analytics Cookies</h3>
                    <p>
                      We use these cookies to collect information about how visitors use our website, such as which pages are most visited, how long users spend on each page, and any error messages encountered. This helps us improve the performance and user experience of our site. We use <strong>Google Analytics</strong> for this purpose; the data collected is aggregated and anonymous.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">3.3 Functional Cookies</h3>
                    <p>
                      Functional cookies allow the website to remember choices you make (such as your language preferences or region) and provide enhanced, personalised features. They may also be used to provide services you have requested, such as remembering your calculator inputs for convenience.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-wix-dark mb-1">3.4 Advertising and Marketing Cookies</h3>
                    <p>
                      Currently, we do not use advertising cookies. However, if we later partner with third‑party advertising platforms, we may use cookies to deliver relevant advertisements based on your browsing behaviour. Any such use will be disclosed in an updated version of this policy.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Third‑Party Cookies */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">4.</span> Third‑Party Cookies
                </h2>
                <p>
                  In addition to our own cookies, we may also use third‑party cookies from service providers such as Google Analytics. These third‑party cookies are governed by the privacy policies of their respective providers. We do not control these cookies, and you should review the privacy policies of those third‑party services for more information on their cookie practices.
                </p>
              </div>

              {/* 5. Your Choices Regarding Cookies */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">5.</span> Your Choices Regarding Cookies
                </h2>
                <p className="mb-2">
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by adjusting your browser settings. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer. Below are links to instructions for common browsers:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/en-in/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Apple Safari</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae39" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 underline">Microsoft Edge</a></li>
                </ul>
                <p className="mt-2">
                  Please note that blocking or deleting certain cookies may affect the functionality of our website and your ability to access some features.
                </p>
              </div>

              {/* 6. Updates to This Cookie Policy */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">6.</span> Updates to This Cookie Policy
                </h2>
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our cookie practices or for other operational, legal, or regulatory reasons. We encourage you to review this page periodically for the latest information. Your continued use of our website after any changes indicates your acceptance of the updated policy.
                </p>
              </div>

              {/* 7. Contact Information */}
              <div>
                <h2 className="font-display font-extrabold text-lg text-wix-dark uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-orange-500 font-black">7.</span> Contact Information
                </h2>
                <div className="space-y-1 text-slate-600 font-medium">
                  <p>
                    <strong>NS Construction</strong> ( Nikhil )
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
