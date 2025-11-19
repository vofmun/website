import type { MetadataRoute } from "next";

const baseUrl = "https://vofmun.org";

const routes = [
  "",
  "/committees",
  "/resources",
  "/secretariat",
  "/signup",
  "/proof-of-payment",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
