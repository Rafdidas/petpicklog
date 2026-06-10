"use client";

import { FormEvent, useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { buildPetShoppingQuery } from "@/lib/pet-search";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ExternalProduct } from "@/types/product";

const getSourceLabel = (source: ExternalProduct["source"]) => (source === "NAVER" ? "네이버 쇼핑 기준" : source);
const recommendedQueries = ["강아지 사료", "고양이 모래", "배변패드", "강아지 샴푸", "고양이 간식", "영양제"];
const petOptions = [
  { value: "all", label: "전체 반려동물" },
  { value: "dog", label: "강아지" },
  { value: "cat", label: "고양이" },
  { value: "custom", label: "직접입력" }
];

export default function ProductSearchClient({
  initialCustomPet,
  initialError,
  initialPetType,
  initialProducts,
  initialQuery
}: {
  initialCustomPet: string;
  initialError: string;
  initialPetType: string;
  initialProducts: ExternalProduct[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [petType, setPetType] = useState(initialPetType);
  const [customPet, setCustomPet] = useState(initialCustomPet);
  const [products, setProducts] = useState<ExternalProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [successMessage, setSuccessMessage] = useState("");

  const searchProducts = useCallback(async (nextQuery: string, nextPetType: string, nextCustomPet: string) => {
    if (!nextQuery.trim()) {
      setErrorMessage("검색어를 입력해주세요.");
      return;
    }

    if (nextPetType === "custom" && !nextCustomPet.trim()) {
      setErrorMessage("직접입력 반려동물을 입력해주세요. 예: 앵무새, 거북이");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const params = new URLSearchParams({
        query: nextQuery,
        petType: nextPetType
      });

      if (nextPetType === "custom") {
        params.set("customPet", nextCustomPet);
      }

      const response = await fetch(`/api/products/search?${params.toString()}`);
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
    searchProducts(query, petType, customPet);
  }

  async function ensureExternalProduct(product: ExternalProduct) {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      throw new Error("Supabase 환경 변수를 확인해주세요.");
    }

    const { data: existingProduct, error: existingProductError } = await supabase
      .from("external_products")
      .select("id")
      .eq("source", product.source)
      .eq("external_id", product.externalId)
      .maybeSingle();

    if (existingProductError) {
      throw existingProductError;
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
        throw insertProductError;
      }

      externalProductId = insertedProduct.id as string;
    }

    return { supabase, externalProductId };
  }

  async function handleSave(product: ExternalProduct) {
    setErrorMessage("");
    setSuccessMessage("");
    setSavingId(product.externalId);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setErrorMessage("Supabase 환경 변수를 확인해주세요.");
      setSavingId("");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth?redirect=/products");
      setSavingId("");
      return;
    }

    let externalProductId: string;
    try {
      ({ externalProductId } = await ensureExternalProduct(product));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "상품 정보를 저장하지 못했습니다.");
      setSavingId("");
      return;
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
      setSuccessMessage("이미 관심상품으로 저장한 상품입니다.");
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

    setSuccessMessage("관심상품으로 저장했습니다.");
    setSavingId("");
  }

  async function handleOpenDetail(product: ExternalProduct) {
    setErrorMessage("");
    setSuccessMessage("");
    setSavingId(product.externalId);

    try {
      const { externalProductId } = await ensureExternalProduct(product);
      router.push(`/products/${externalProductId}`);
    } catch {
      router.push(`/auth?redirect=${encodeURIComponent(`/products?query=${query}`)}`);
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="products-page">
      <section className="page-heading">
        <p className="section-label">용품 가격 확인</p>
        <h1>자주 사는 반려동물 용품의 가격을 확인해보세요.</h1>
        <p className="page-heading__copy">사료, 간식, 배변용품 등을 검색하고 관심상품으로 저장할 수 있어요. 최종 가격과 옵션은 쇼핑몰에서 확인해주세요.</p>
      </section>

      <form className="search-bar" onSubmit={handleSearch}>
        <label htmlFor="product-query">검색어</label>
        <input id="product-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사료, 간식, 배변패드" />
        <button className="button button--primary" type="submit" disabled={isLoading}>
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      <section className="pet-search-panel" aria-label="반려동물 검색 범위">
        <div className="pet-filter">
          {petOptions.map((option) => (
            <button
              className={petType === option.value ? "pet-filter__item pet-filter__item--active" : "pet-filter__item"}
              key={option.value}
              type="button"
              onClick={() => setPetType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {petType === "custom" ? (
          <label className="pet-custom-input" htmlFor="custom-pet">
            반려동물 직접입력
            <input id="custom-pet" value={customPet} onChange={(event) => setCustomPet(event.target.value)} placeholder="예: 앵무새, 거북이, 햄스터" />
          </label>
        ) : null}
        <p>
          실제 검색어: <strong>{query.trim() ? buildPetShoppingQuery(query, { petType, customPet }) : "검색어 입력 전"}</strong>
        </p>
      </section>

      <section className="quick-links" aria-label="추천 검색어">
        {recommendedQueries.map((item) => (
          <button
            className="quick-links__item"
            type="button"
            key={item}
            onClick={() => {
              setQuery(item);
              searchProducts(item, petType, customPet);
            }}
          >
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
                  {savingId === product.externalId ? "저장 중" : "관심상품 저장"}
                </button>
                <button className="button button--ghost" type="button" onClick={() => handleOpenDetail(product)} disabled={savingId === product.externalId}>
                  상세 보기
                </button>
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
