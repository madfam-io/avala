/**
 * JSON-LD Structured Data Components
 *
 * Provides schema.org structured data for better SEO and rich snippets.
 */

import type { ECDetail, Center } from "@/lib/api/renec";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// EC Standard structured data
export function ECJsonLd({ ec }: { ec: ECDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${ec.ecClave} - ${ec.titulo}`,
    description: ec.proposito || `Estándar de Competencia ${ec.ecClave}`,
    provider: {
      "@type": "Organization",
      name: "CONOCER",
      url: "https://conocer.gob.mx",
    },
    educationalCredentialAwarded: `Certificación ${ec.ecClave}`,
    hasCourseInstance: ec.certifiers.map((cert) => ({
      "@type": "CourseInstance",
      name: cert.razonSocial,
      courseMode: "onsite",
    })),
    about: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Competency Certification",
      educationalLevel: ec.nivelCompetencia
        ? `Level ${ec.nivelCompetencia}`
        : undefined,
    },
    inLanguage: "es-MX",
    url: `https://avala.mx/explorar/estandares/${ec.id}`,
  };

  return <JsonLd data={data} />;
}

// Certifier structured data
export function CertifierJsonLd({
  certifier,
}: {
  certifier: {
    id: string;
    razonSocial: string;
    nombreComercial?: string | null;
    tipo: string;
    estado?: string | null;
    telefono?: string | null;
    email?: string | null;
    sitioWeb?: string | null;
    ecCount: number;
  };
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: certifier.razonSocial,
    alternateName: certifier.nombreComercial || undefined,
    description: `${
      certifier.tipo === "ECE"
        ? "Entidad de Certificación y Evaluación"
        : "Organismo Certificador"
    } acreditado por CONOCER con ${certifier.ecCount} estándares.`,
    address: certifier.estado
      ? {
          "@type": "PostalAddress",
          addressRegion: certifier.estado,
          addressCountry: "MX",
        }
      : undefined,
    telephone: certifier.telefono || undefined,
    email: certifier.email || undefined,
    url: certifier.sitioWeb || `https://avala.mx/explorar/certificadores/${certifier.id}`,
    sameAs: certifier.sitioWeb ? [certifier.sitioWeb] : undefined,
  };

  return <JsonLd data={data} />;
}

// Center structured data (LocalBusiness for places)
export function CenterJsonLd({
  center,
}: {
  center: {
    id: string;
    nombre: string;
    direccion?: string | null;
    municipio?: string | null;
    estado?: string | null;
    telefono?: string | null;
    email?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    ecStandards: Array<{ ecClave: string; titulo: string }>;
  };
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: center.nombre,
    description: `Centro de evaluación que certifica ${center.ecStandards.length} estándares de competencia.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: center.direccion || undefined,
      addressLocality: center.municipio || undefined,
      addressRegion: center.estado || undefined,
      addressCountry: "MX",
    },
    geo:
      center.latitud && center.longitud
        ? {
            "@type": "GeoCoordinates",
            latitude: center.latitud,
            longitude: center.longitud,
          }
        : undefined,
    telephone: center.telefono || undefined,
    email: center.email || undefined,
    url: `https://avala.mx/explorar/centros/${center.id}`,
    makesOffer: center.ecStandards.map((ec) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "EducationalOccupationalCredential",
        name: `${ec.ecClave} - ${ec.titulo}`,
      },
    })),
  };

  return <JsonLd data={data} />;
}

// Breadcrumb structured data
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

// Organization structured data for the main site
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Avala",
    url: "https://avala.mx",
    logo: "https://avala.mx/logo.png",
    description:
      "Plataforma de certificación de competencias laborales en México. Prepárate y certifícate en estándares CONOCER.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hola@avala.mx",
      contactType: "customer service",
      availableLanguage: "Spanish",
    },
    sameAs: [
      "https://twitter.com/avala_mx",
      "https://linkedin.com/company/avala-mx",
    ],
  };

  return <JsonLd data={data} />;
}

// FAQ structured data
export function FAQJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const data = {
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

  return <JsonLd data={data} />;
}
