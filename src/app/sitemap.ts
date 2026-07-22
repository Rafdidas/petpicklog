import type { MetadataRoute } from "next";
import { fetchSitemapProducts } from "@/lib/catalog";
import { getAbsoluteUrl } from "@/lib/site";

const publicPaths = ["/", "/catalog", "/deals", "/products", "/hospitals", "/guide", "/price-tracking"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchSitemapProducts();

  return [
    ...publicPaths.map((path) => ({ url: getAbsoluteUrl(path) })),
    ...products.map(({ externalProductId, lastCheckedAt }) => ({
      url: getAbsoluteUrl(`/catalog/${externalProductId}`),
      lastModified: lastCheckedAt
    }))
  ];
}
