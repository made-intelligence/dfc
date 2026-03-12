"use client";

import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "When you register on our platform, we collect personal details including your full name, email address, phone number, date of birth, residential address, medical license number, specialty, and professional credentials. For patients seeking second opinions, we may also collect next-of-kin information and emergency contact details.",
      },
      {
        subtitle: "Medical Records and Health Data",
        text: "In connection with our second opinion services, we may collect and process medical records, diagnostic reports, imaging results, laboratory findings, treatment histories, and other health-related information provided by users or their referring physicians. All medical data is handled with the highest level of confidentiality in accordance with applicable healthcare regulations.",
      },
      {
        subtitle: "Payment Data",
        text: "We collect payment information necessary to process membership dues, second opinion service fees, and other transactions. Payment processing is handled securely through Paystack, our third-party payment processor. We do not store full credit or debit card numbers on our servers.",
      },
      {
        subtitle: "Technical and Usage Data",
        text: "We automatically collect information about your device, browser type, IP address, pages visited, time spent on the platform, and other usage analytics to improve our services and user experience.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      {
        text: "We use the information we collect for the following purposes:",
      },
      {
        text: "Account Management: To create, maintain, and secure your account on the DFC platform, verify your medical credentials, and manage your membership status.",
      },
      {
        text: "Service Delivery: To facilitate second opinion consultations, connect patients with specialist physicians, schedule appointments, and deliver telemedicine services through our platform.",
      },
      {
        text: "Communications: To send appointment reminders, membership renewal notices, newsletters, platform updates, and other relevant communications related to your use of our services.",
      },
      {
        text: "Payment Processing: To process membership dues, consultation fees, and other financial transactions securely through our payment infrastructure.",
      },
      {
        text: "Platform Improvement: To analyze usage patterns, diagnose technical issues, and enhance the functionality, security, and overall user experience of our platform.",
      },
      {
        text: "Legal Compliance: To comply with applicable laws, regulations, and legal obligations, including those specific to healthcare data handling in Nigeria and other jurisdictions where our members practice.",
      },
    ],
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: [
      {
        text: "We do not sell your personal information to third parties. We may share your data in the following limited circumstances:",
      },
      {
        text: "With Consulting Physicians: Medical records and relevant health information are shared with DFC-affiliated specialists solely for the purpose of providing second opinion consultations requested by users.",
      },
      {
        text: "Service Providers: We engage trusted third-party service providers (such as Paystack for payments, cloud hosting providers, and email service providers) who process data on our behalf under strict confidentiality agreements.",
      },
      {
        text: "Legal Requirements: We may disclose information when required by law, court order, or governmental regulation, or when we believe disclosure is necessary to protect the rights, safety, or property of DFC, our users, or the public.",
      },
      {
        text: "Professional Regulatory Bodies: We may share physician credential information with relevant medical regulatory authorities for verification and compliance purposes.",
      },
    ],
  },
  {
    title: "4. Data Security",
    content: [
      {
        text: "We implement robust technical and organizational measures to protect your personal and medical information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, secure access controls, regular security audits, and staff training on data protection protocols. While we strive to protect your information, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.",
      },
    ],
  },
  {
    title: "5. Your Rights (NDPR Compliance)",
    content: [
      {
        subtitle: "Under the Nigeria Data Protection Regulation (NDPR)",
        text: "As a data subject under the NDPR and other applicable data protection laws, you have the following rights:",
      },
      {
        text: "Right of Access: You may request a copy of the personal data we hold about you.",
      },
      {
        text: "Right to Rectification: You may request correction of any inaccurate or incomplete personal data.",
      },
      {
        text: "Right to Erasure: You may request deletion of your personal data, subject to our legal and regulatory obligations to retain certain records.",
      },
      {
        text: "Right to Restriction: You may request that we limit the processing of your personal data under certain circumstances.",
      },
      {
        text: "Right to Data Portability: You may request to receive your personal data in a structured, commonly used format.",
      },
      {
        text: "Right to Object: You may object to the processing of your personal data for direct marketing purposes or other grounds related to your particular situation.",
      },
      {
        text: "To exercise any of these rights, please contact our Data Protection Officer using the contact information provided below. We will respond to your request within 30 days.",
      },
    ],
  },
  {
    title: "6. Cookies and Tracking Technologies",
    content: [
      {
        text: "Our platform uses cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and gather analytical data. Cookies are small text files stored on your device when you visit our platform.",
      },
      {
        text: "Essential Cookies: Required for the platform to function properly, including authentication, security, and session management.",
      },
      {
        text: "Analytics Cookies: Help us understand how users interact with our platform so we can improve its performance and usability.",
      },
      {
        text: "You can manage your cookie preferences through your browser settings. Please note that disabling certain cookies may affect the functionality of our platform.",
      },
    ],
  },
  {
    title: "7. Data Retention",
    content: [
      {
        text: "We retain your personal information for as long as your account is active or as needed to provide you with our services. Medical records and consultation data may be retained for longer periods as required by applicable healthcare regulations and professional standards. Upon account deletion, we will securely erase your personal data except where retention is required by law.",
      },
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      {
        text: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will notify you of any material changes by posting the updated policy on our platform and, where appropriate, by email. Your continued use of the platform after such changes constitutes your acceptance of the revised policy.",
      },
    ],
  },
  {
    title: "9. Contact Us",
    content: [
      {
        text: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:",
      },
      {
        text: "Doctors Foundation for Care (DFC)\nEmail: privacy@doctorsfoundationforcare.org\nAddress: Lagos, Nigeria",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Topbar />

      {/* Hero Section */}
      <section
        className="relative py-20 md:py-28"
        style={{
          background: "linear-gradient(135deg, #0D1F3C 0%, #0A4A50 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how Doctors
            Foundation for Care collects, uses, and protects your information.
          </p>
          <p className="text-sm text-gray-400 mt-6">
            Last updated: March 11, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-700 leading-relaxed mb-10 text-base md:text-lg">
            Doctors Foundation for Care (&quot;DFC,&quot; &quot;we,&quot;
            &quot;our,&quot; or &quot;us&quot;) is committed to protecting the
            privacy and security of the personal information entrusted to us by
            our members, patients, and platform users. This Privacy Policy
            describes how we collect, use, disclose, and safeguard your
            information when you access or use our platform, including our
            membership portal, second opinion services, and specialist network.
          </p>

          {sections.map((section, idx) => (
            <div key={idx} className="mb-10">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[#0D1F3C]">
                {section.title}
              </h2>
              {section.content.map((item, cIdx) => (
                <div key={cIdx} className="mb-4">
                  {item.subtitle && (
                    <h3 className="text-base md:text-lg font-medium mb-2 text-[#0A4A50]">
                      {item.subtitle}
                    </h3>
                  )}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
