"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { demoProducts } from "@/lib/demo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ExternalProduct } from "@/types/product";

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

export default function ProductSearchClient() {
  const router = useRouter();
  const [query, setQuery] = useState("사료");
  const [products, setProducts] = useState<ExternalProduct[]>(demoProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { products?: ExternalProduct[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "검색에 실패했습니다.");
      }

      setProducts(data.products ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(product: ExternalProduct) {
    const supabase = createBrowserSupabaseClient();
    setErrorMessage("");
    setSuccessMessage("");

    if (!supabase) {
      setErrorMessage("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    setSavingId(product.externalId);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth?redirect=/products");
      return;
    }

    const { data: existingProduct, error: existingProductError } = await supabase
      .from("external_products")
      .select("id")
      .eq("source", product.source)
      .eq("external_id", product.externalId)
      .maybeSingle();

    if (existingProductError) {
      setErrorMessage(existingProductError.message);
      setSavingId("");
      return;
    }

    let externalProductId = existingProduct?.id as string | undefined;

    if (!externalProductId) {
      const { data: insertedProduct, error: insertProductError } = await supabase
        .from("external_products")
        .insert({
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
          last_synced_at: product.lastSyncedAt
        })
        .select("id")
        .single();

      if (insertProductError) {
        setErrorMessage(insertProductError.message);
        setSavingId("");
        return;
      }

      externalProductId = insertedProduct.id as string;
    }

    const { data: existingSave, error: existingSaveError } = await supabase
      .from("saved_products")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_product_id", externalProductId)
      .maybeSingle();

    if (existingSaveError) {
      setErrorMessage(existingSaveError.message);
      setSavingId("");
      return;
    }

    if (existingSave) {
      setSuccessMessage("이미 찜한 상품입니다.");
      setSavingId("");
      return;
    }

    const { error: saveError } = await supabase.from("saved_products").insert({
      user_id: user.id,
      external_product_id: externalProductId,
      status: "WISHLIST",
      saved_price: product.latestPrice
    });

    if (saveError) {
      setErrorMessage(saveError.message);
      setSavingId("");
      return;
    }

    await supabase.from("price_histories").insert({
      external_product_id: externalProductId,
      source: product.source,
      mall_name: product.mallName,
      price: product.latestPrice,
      product_url: product.productUrl,
      checked_at: product.lastSyncedAt
    });

    setSuccessMessage("찜 목록에 저장했습니다.");
    setSavingId("");
  }

  return (
    <main className="products-page">
      <section className="page-heading">
        <p className="section-label">상품 검색</p>
        <h1>쇼핑몰 상품 후보를 검색하고 저장할 대상을 고릅니다.</h1>
      </section>

      <form className="search-bar" onSubmit={handleSearch}>
        <label htmlFor="product-query">검색어</label>
        <input id="product-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사료, 간식, 배변패드" />
        <button className="button button--primary" type="submit" disabled={isLoading}>
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      {errorMessage ? <p className="notice notice--error">{errorMessage}</p> : null}
      {successMessage ? <p className="notice notice--success">{successMessage}</p> : null}

      <section className="product-grid" aria-live="polite">
        {products.map((product) => (
          <article className="product-card" key={`${product.source}-${product.externalId}`}>
            <Image src={product.imageUrl} alt="" width={600} height={450} />
            <div className="product-card--body">
              <span>{product.mallName}</span>
              <h2>{product.title}</h2>
              <p>{formatPrice(product.latestPrice)}원</p>
              <small>{product.category || "카테고리 확인 필요"}</small>
              <div className="product-card--actions">
                <button className="button button--secondary" type="button" onClick={() => handleSave(product)} disabled={savingId === product.externalId}>
                  {savingId === product.externalId ? "저장 중" : "찜하기"}
                </button>
                <a className="button button--ghost" href={product.productUrl} target="_blank" rel="noreferrer">
                  구매 링크
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
