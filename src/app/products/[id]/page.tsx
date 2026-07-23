import { permanentRedirect } from "next/navigation";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(`/catalog/${id}`);
}
