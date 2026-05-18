import { demoProducts } from "@/lib/demo";
import type { ExternalProduct } from "@/types/product";

type NaverShoppingItem = {
  productId: string;
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
};

type NaverShoppingResponse = {
  items?: NaverShoppingItem[];
};

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').trim();

export async function searchShoppingProducts(query: string): Promise<ExternalProduct[]> {
  const clientId = process.env.NAVER_SHOPPING_CLIENT_ID;
  const clientSecret = process.env.NAVER_SHOPPING_CLIENT_SECRET;

  if (!query.trim()) {
    return demoProducts;
  }

  if (!clientId || !clientSecret) {
    const lowerQuery = query.toLowerCase();
    return demoProducts.filter((product) => product.title.toLowerCase().includes(lowerQuery) || product.category.includes(query));
  }

  const response = await fetch(
    `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20&sort=sim`,
    {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret
      },
      next: {
        revalidate: 300
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Naver shopping API failed: ${response.status}`);
  }

  const data = (await response.json()) as NaverShoppingResponse;
  const now = new Date().toISOString();

  return (data.items ?? []).map((item) => ({
    externalId: item.productId,
    title: stripHtml(item.title),
    brand: item.brand || null,
    category: [item.category1, item.category2, item.category3, item.category4].filter(Boolean).join(" > "),
    imageUrl: item.image,
    productUrl: item.link,
    mallName: item.mallName,
    latestPrice: Number(item.lprice || 0),
    source: "NAVER",
    lastSyncedAt: now
  }));
}
