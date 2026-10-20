// Escape characters that could break out of the <script> tag when embedding
// JSON-LD. JSON.stringify does not escape <, >, & or the JS line separators
// (U+2028 / U+2029), so a user-controlled field containing "</script>" would
// otherwise inject HTML. Encode each such character as a \uXXXX escape, which
// is still valid inside a JSON string.
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: "Doctors Foundation For Care (DFC)",
    alternateName: "DFC",
    url: "https://dfcare.org",
    logo: "https://dfcare.org/dfc-logo.png",
    description:
      "A global healthcare movement reconnecting Nigerian diaspora doctors with patients at home through telemedicine consultations, second opinions, and specialist care.",
    foundingDate: "2024",
    areaServed: [
      { "@type": "Country", name: "Nigeria" },
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Country", name: "United States" },
    ],
    medicalSpecialty: [
      "Cardiology",
      "Oncology",
      "Neurology",
      "General Surgery",
      "Paediatrics",
      "Obstetrics and Gynaecology",
      "Internal Medicine",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@dfcare.org",
      availableLanguage: "English",
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

export function MedicalWebPageJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name,
    description,
    url,
    publisher: {
      "@type": "MedicalOrganization",
      name: "Doctors Foundation For Care (DFC)",
      url: "https://dfcare.org",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

export function DoctorJsonLd({
  name,
  specialty,
  description,
  image,
  url,
}: {
  name: string;
  specialty: string;
  description?: string;
  image?: string;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name,
    medicalSpecialty: specialty,
    description: description || `${name} — ${specialty} at Doctors Foundation For Care`,
    image: image || undefined,
    url,
    memberOf: {
      "@type": "MedicalOrganization",
      name: "Doctors Foundation For Care (DFC)",
      url: "https://dfcare.org",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}

export function EventJsonLd({
  name,
  description,
  url,
  image,
  startDate,
  endDate,
  isInPerson,
  isVirtual,
  venue,
  city,
  registrationUrl,
}: {
  name: string;
  description: string | null;
  url: string;
  image: string | null;
  startDate: string;
  endDate: string | null;
  isInPerson: boolean;
  isVirtual: boolean;
  venue: string | null;
  city: string | null;
  registrationUrl: string | null;
}) {
  const place = {
    "@type": "Place",
    name: venue || city || "Venue to be confirmed",
    address: { "@type": "PostalAddress", addressLocality: city || undefined },
  };
  const online = { "@type": "VirtualLocation", url };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description: description || undefined,
    url,
    image: image ? [image] : undefined,
    startDate,
    endDate: endDate || startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode:
      isInPerson && isVirtual
        ? "https://schema.org/MixedEventAttendanceMode"
        : isVirtual
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    location: isInPerson && isVirtual ? [place, online] : isVirtual ? online : place,
    organizer: {
      "@type": "Organization",
      name: "Doctors Foundation For Care (DFC)",
      url: "https://dfcare.org",
    },
    offers: registrationUrl
      ? { "@type": "Offer", url: registrationUrl, availability: "https://schema.org/InStock" }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
    />
  );
}
