import type { Metadata } from "next";
import ProductDetailClient from "./product-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  return {
    alternates: {
      canonical: `/products/${id}`
    }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ProductDetailClient productId={id} />;
}
