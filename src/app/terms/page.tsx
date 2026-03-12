"use client";

import Topbar from "@/components/layout/Topbar";
import Footer from "@/components/layout/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      {
        text: "By accessing, browsing, or using the Doctors Foundation for Care (\"DFC\") platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not access or use our platform. We reserve the right to modify these terms at any time, and your continued use of the platform following any changes constitutes acceptance of the revised terms.",
      },
    ],
  },
  {
    title: "2. Platform Description",
    content: [
      {
        text: "DFC is a professional medical organization serving Nigerian diaspora physicians and healthcare professionals. Our platform provides the following core services:",
      },
      {
        subtitle: "Membership Portal",
        text: "A secure platform for verified medical professionals to manage their DFC membership, access professional resources, connect with colleagues, and participate in organizational activities.",
      },
      {
        subtitle: "Second Opinion Service",
        text: "A structured referral service that enables patients to obtain independent medical second opinions from qualified DFC-affiliated specialists. This service facilitates the review of existing diagnoses, treatment plans, and medical records by experienced physicians.",
      },
      {
        subtitle: "Specialist Network",
        text: "A curated directory of DFC member physicians across various medical specialties, enabling patients and fellow physicians to identify and connect with appropriate specialists for consultations and referrals.",
      },
    ],
  },
  {
    title: "3. User Accounts and Registration",
    content: [
      {
        text: "To access certain features of our platform, you must create an account and provide accurate, complete, and current registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      },
      {
        subtitle: "Physician Accounts",
        text: "Medical professionals registering on the platform must provide valid medical license credentials, proof of qualification, and other professional documentation as required. DFC reserves the right to verify all credentials and to deny or revoke access if any information is found to be inaccurate or if a physician's license is suspended or revoked.",
      },
      {
        subtitle: "Patient Accounts",
        text: "Patients registering for second opinion services must provide accurate personal and medical information. Patients are responsible for ensuring that any medical records, reports, or documents submitted are authentic and complete.",
      },
      {
        text: "You agree to immediately notify DFC of any unauthorized use of your account or any other breach of security.",
      },
    ],
  },
  {
    title: "4. Medical Disclaimer",
    content: [
      {
        text: "DFC IS NOT A HOSPITAL, CLINIC, OR DIRECT HEALTHCARE PROVIDER. The platform serves as an intermediary that connects patients with qualified medical professionals for advisory consultations.",
      },
      {
        text: "Second opinions provided through our platform are advisory in nature and are based solely on the information, medical records, and documentation provided by the requesting party. A second opinion does not constitute a doctor-patient relationship, a definitive diagnosis, or a prescribed course of treatment.",
      },
      {
        text: "Users are strongly advised to consult their primary healthcare provider before making any medical decisions based on a second opinion obtained through our platform. DFC does not guarantee any specific medical outcome and shall not be liable for any medical decisions made by users based on consultations facilitated through the platform.",
      },
      {
        text: "In the event of a medical emergency, users should immediately contact their local emergency services or proceed to the nearest hospital. Our platform is not designed for emergency medical situations.",
      },
    ],
  },
  {
    title: "5. Payment Terms",
    content: [
      {
        text: "All financial transactions on the DFC platform are processed securely through Paystack, our authorized third-party payment processor. By making a payment on our platform, you also agree to Paystack's terms of service.",
      },
      {
        subtitle: "Membership Dues",
        text: "DFC membership requires payment of periodic membership dues as determined by the organization. Membership fees are non-refundable unless otherwise specified. Failure to pay membership dues by the specified deadline may result in suspension or termination of membership privileges.",
      },
      {
        subtitle: "Second Opinion Fees",
        text: "Fees for second opinion consultations are displayed on the platform prior to booking and must be paid in full before the consultation is scheduled. Fees vary depending on the specialty, complexity, and urgency of the consultation. Refunds for second opinion services are subject to our refund policy and may be issued at DFC's discretion if a consultation cannot be completed.",
      },
      {
        subtitle: "Currency and Taxes",
        text: "All fees are quoted in Nigerian Naira (NGN) unless otherwise stated. Users are responsible for any applicable taxes, duties, or additional charges imposed by their financial institutions.",
      },
    ],
  },
  {
    title: "6. Intellectual Property",
    content: [
      {
        text: "All content, trademarks, logos, service marks, trade names, designs, and other intellectual property displayed on or associated with the DFC platform are the property of Doctors Foundation for Care or its licensors. You may not copy, reproduce, distribute, modify, create derivative works of, publicly display, or otherwise exploit any of our intellectual property without prior written consent from DFC.",
      },
      {
        text: "By submitting content to the platform (excluding medical records and personal health information), you grant DFC a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content in connection with the operation of the platform and our organizational activities.",
      },
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      {
        text: "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DFC, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE PLATFORM.",
      },
      {
        text: "DFC does not warrant that the platform will be uninterrupted, error-free, or free from viruses or other harmful components. The platform and all content and services are provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied.",
      },
      {
        text: "DFC's total aggregate liability for any claims arising from or related to your use of the platform shall not exceed the total amount paid by you to DFC in the twelve (12) months preceding the event giving rise to the claim.",
      },
    ],
  },
  {
    title: "8. User Conduct",
    content: [
      {
        text: "You agree not to use the DFC platform to:",
      },
      {
        text: "Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.",
      },
      {
        text: "Impersonate any person or entity, or falsely represent your professional qualifications, credentials, or affiliations.",
      },
      {
        text: "Attempt to gain unauthorized access to any portion of the platform, other user accounts, or any systems or networks connected to the platform.",
      },
      {
        text: "Use the platform for any purpose that is fraudulent, deceptive, or in violation of any applicable law or regulation.",
      },
      {
        text: "Interfere with or disrupt the integrity or performance of the platform or the data contained therein.",
      },
    ],
  },
  {
    title: "9. Termination",
    content: [
      {
        text: "DFC reserves the right to suspend or terminate your account and access to the platform at any time, with or without cause and with or without notice, if we reasonably believe that you have violated these Terms of Service or any applicable law or regulation.",
      },
      {
        text: "You may terminate your account at any time by contacting us. Upon termination, your right to use the platform ceases immediately. Any outstanding payment obligations, and provisions of these terms that by their nature should survive termination, shall remain in full force and effect.",
      },
      {
        text: "Termination of a physician's account does not affect any pending or completed consultations, and all professional and legal obligations related to those consultations shall survive termination.",
      },
    ],
  },
  {
    title: "10. Governing Law (Nigerian Law)",
    content: [
      {
        text: "These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.",
      },
      {
        text: "Any dispute, controversy, or claim arising out of or relating to these terms, or the breach, termination, or invalidity thereof, shall first be submitted to mediation in Lagos, Nigeria. If the dispute is not resolved through mediation within sixty (60) days, either party may submit the dispute to the jurisdiction of the courts of Lagos State, Nigeria.",
      },
    ],
  },
  {
    title: "11. Indemnification",
    content: [
      {
        text: "You agree to indemnify, defend, and hold harmless DFC, its directors, officers, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with your use of the platform, your violation of these terms, or your infringement of any rights of a third party.",
      },
    ],
  },
  {
    title: "12. Contact",
    content: [
      {
        text: "If you have any questions or concerns about these Terms of Service, please contact us at:",
      },
      {
        text: "Doctors Foundation for Care (DFC)\nEmail: legal@doctorsfoundationforcare.org\nAddress: Lagos, Nigeria",
      },
    ],
  },
];

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Please read these terms carefully before using the Doctors
            Foundation for Care platform and services.
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
            Welcome to the Doctors Foundation for Care (&quot;DFC,&quot;
            &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) platform. These
            Terms of Service (&quot;Terms&quot;) govern your access to and use
            of our website, applications, and services, including our membership
            portal, second opinion consultation services, and specialist
            network.
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
