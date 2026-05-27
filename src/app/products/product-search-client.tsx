"use client";

import { FormEvent, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ExternalProduct } from "@/types/product";

const getSourceLabel = (source: ExternalProduct["source"]) => (source === "NAVER" ? "네이버 쇼핑 기준" : source);
const recommendedQueries = ["강아지 사료", "고양이 모래", "배변패드", "강아지 샴푸", "고양이 간식", "영양제"];

export default function ProductSearchClient({
  initialError,
  initialProducts,
  initialQuery
}: {
  initialError: string;
  initialProducts: ExternalProduct[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ExternalProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [successMessage, setSuccessMessage] = useState("");

  const searchProducts = useCallback(async (nextQuery: string) => {
    if (!nextQuery.trim()) {
      setErrorMessage("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(nextQuery)}`);
      const data = (await response.json()) as { products?: ExternalProduct[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "검색에 실패했습니다.");
      }

      setProducts(data.products ?? []);
      if (!data.products?.length) {
        setErrorMessage("검색 결과가 없습니다. 다른 검색어로 다시 시도해주세요.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchProducts(query);
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
      setSavingId("");
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
        <h1>반려동물 용품의 현재 확인 가격을 검색합니다.</h1>
        <p className="page-heading__copy">네이버 쇼핑 API 검색 결과만 표시합니다. 최종 가격과 옵션은 쇼핑몰에서 확인해야 합니다.</p>
      </section>

      <form className="search-bar" onSubmit={handleSearch}>
        <label htmlFor="product-query">검색어</label>
        <input id="product-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사료, 간식, 배변패드" />
        <button className="button button--primary" type="submit" disabled={isLoading}>
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      <section className="quick-links" aria-label="추천 검색어">
        {recommendedQueries.map((item) => (
          <button className="quick-links__item" type="button" key={item} onClick={() => setQuery(item)}>
            {item}
          </button>
        ))}
      </section>

      {errorMessage ? <p className="notice notice--error">{errorMessage}</p> : null}
      {successMessage ? <p className="notice notice--success">{successMessage}</p> : null}
      {!query.trim() && !products.length ? (
        <div className="empty-state">
          <p>검색어를 입력해 반려동물 용품 가격을 확인해보세요.</p>
        </div>
      ) : null}

      <section className="product-grid" aria-live="polite">
        {products.map((product) => (
          <article className="product-card" key={`${product.source}-${product.externalId}`}>
            <Image src={product.imageUrl} alt="" width={600} height={450} />
            <div className="product-card--body">
              <div className="product-card--meta">
                <span>{product.mallName}</span>
                <em>{getSourceLabel(product.source)}</em>
              </div>
              <h2>{product.title}</h2>
              <p>{formatPrice(product.latestPrice)}</p>
              <small>{product.category || "카테고리 확인 필요"}</small>
              <small>마지막 확인: {formatCheckedAt(product.lastSyncedAt)}</small>
              <div className="product-card--actions">
                <button className="button button--secondary" type="button" onClick={() => handleSave(product)} disabled={savingId === product.externalId}>
                  {savingId === product.externalId ? "저장 중" : "찜하기"}
                </button>
                <Link className="button button--ghost" href={`/products?query=${encodeURIComponent(product.title)}`}>
                  가격 확인
                </Link>
                <a className="button button--ghost" href={product.productUrl} target="_blank" rel="noreferrer">
                  구매하러 가기
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
