import type { ExternalProduct } from "@/types/product";

export type DiscoveryRow = {
  source: ExternalProduct["source"];
  external_id: string;
  title: string;
  brand: string | null;
  category: string;
  image_url: string;
  product_url: string;
  mall_name: string;
  latest_price: number;
  raw_data: ExternalProduct;
  last_synced_at: string;
  is_tracked: true;
  category_slug: string;
  pet_type: string;
};

export function buildDiscoveryRows(products: ExternalProduct[], categorySlug: string, petType: string): DiscoveryRow[] {
  return products
    .filter((product) => product.latestPrice > 0)
    .map((product) => ({
      source: product.source,
      external_id: product.externalId,
      title: product.title,
      brand: product.brand,
      category: product.category,
      image_url: product.imageUrl,
      product_url: product.productUrl,
      mall_name: product.mallName,
      latest_price: product.latestPrice,
      raw_data: product,
      last_synced_at: product.lastSyncedAt,
      is_tracked: true,
      category_slug: categorySlug,
      pet_type: petType
    }));
}
