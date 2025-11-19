import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://vofmun.org";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/system",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
