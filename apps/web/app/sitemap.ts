import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://avala.studio";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ECStandard {
  id: string;
  updatedAt: string;
}

interface Certifier {
  id: string;
  updatedAt: string;
}

interface Center {
  id: string;
  updatedAt: string;
}

async function getECStandards(): Promise<ECStandard[]> {
  try {
    const res = await fetch(`${API_URL}/renec/ec?limit=10000`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCertifiers(): Promise<Certifier[]> {
  try {
    const res = await fetch(`${API_URL}/renec/certifiers?limit=10000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCenters(): Promise<Center[]> {
  try {
    const res = await fetch(`${API_URL}/renec/centers?limit=10000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explorar`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/explorar/estandares`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/explorar/certificadores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/explorar/centros`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/demo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Fetch dynamic content
  const [ecStandards, certifiers, centers] = await Promise.all([
    getECStandards(),
    getCertifiers(),
    getCenters(),
  ]);

  // EC Standards pages
  const ecPages: MetadataRoute.Sitemap = ecStandards.map((ec) => ({
    url: `${BASE_URL}/explorar/estandares/${ec.id}`,
    lastModified: new Date(ec.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Certifier pages
  const certifierPages: MetadataRoute.Sitemap = certifiers.map((cert) => ({
    url: `${BASE_URL}/explorar/certificadores/${cert.id}`,
    lastModified: new Date(cert.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Center pages
  const centerPages: MetadataRoute.Sitemap = centers.map((center) => ({
    url: `${BASE_URL}/explorar/centros/${center.id}`,
    lastModified: new Date(center.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...ecPages, ...certifierPages, ...centerPages];
}
