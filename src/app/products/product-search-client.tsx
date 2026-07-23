"use client";

import { FormEvent, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { buildPetShoppingQuery } from "@/lib/pet-search";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ExternalProduct } from "@/types/product";

const getSourceLabel = (source: ExternalProduct["source"]) => (source === "NAVER" ? "네이버 쇼핑 기준" : source);
const recommendedQueries = [
  "강아지 사료",
  "고양이 모래",
  "배변패드",
  "강아지 샴푸",
  "고양이 간식",
  "반려동물 영양제",
  "강아지 장난감",
  "고양이 장난감",
  "강아지 하네스",
  "고양이 이동장",
  "강아지 미용용품",
  "반려동물 안전문"
];
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
      router.push(`/catalog/${externalProductId}`);
    } catch {
      router.push(`/auth?redirect=${encodeURIComponent(`/products?query=${query}`)}`);
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="products-page">
      <section className="page-heading">
        <p className="section-label">실시간 검색</p>
        <h1>네이버 쇼핑에서 지금 이 순간 가격을 검색해보세요.</h1>
        <p className="page-heading__copy">카탈로그에 없는 상품은 이곳에서 실시간으로 검색할 수 있어요. 매일 자동으로 가격을 추적하는 상품은 <Link href="/catalog">카탈로그</Link>에서 확인하세요.</p>
      </section>

      <div className="search-card">
        <form className="search-card__row" onSubmit={handleSearch}>
          <input
            className="ui-input"
            id="product-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="사료, 간식, 배변패드"
            aria-label="검색어"
          />
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? "검색 중" : "검색"}
          </Button>
        </form>
        <div className="search-card__pets">
          {petOptions.map((option) => (
            <Chip key={option.value} active={petType === option.value} onClick={() => setPetType(option.value)}>
              {option.label}
            </Chip>
          ))}
          <span className="search-card__effective">
            실제 검색어: <strong>{query.trim() ? buildPetShoppingQuery(query, { petType, customPet }) : "검색어 입력 전"}</strong>
          </span>
        </div>
        {petType === "custom" ? (
          <label className="search-card__custom" htmlFor="custom-pet">
            반려동물 직접입력
            <input
              className="ui-input"
              id="custom-pet"
              value={customPet}
              onChange={(event) => setCustomPet(event.target.value)}
              placeholder="예: 앵무새, 거북이, 햄스터"
            />
          </label>
        ) : null}
        <div className="search-card__quick">
          {recommendedQueries.map((item) => (
            <button
              className="search-card__quick-item"
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
        </div>
      </div>

      {errorMessage ? <p className="notice notice--error">{errorMessage}</p> : null}
      {successMessage ? <p className="notice notice--success">{successMessage}</p> : null}
      {!query.trim() && !products.length ? (
        <EmptyState title="검색어를 입력해 보세요">반려동물 용품의 실시간 가격을 확인해드려요.</EmptyState>
      ) : null}

      <section className="product-grid" aria-live="polite">
        {products.map((product) => (
          <article className="product-card" key={`${product.source}-${product.externalId}`}>
            <Image src={product.imageUrl} alt="" width={600} height={450} />
            <div className="product-card--meta">
              <span>{product.mallName}</span>
              <em>{getSourceLabel(product.source)}</em>
            </div>
            <h2>{product.title}</h2>
            <div className="product-card--body">
              <p>{formatPrice(product.latestPrice)}</p>
              <small>{product.category || "카테고리 확인 필요"}</small>
              <small>마지막 확인: {formatCheckedAt(product.lastSyncedAt)}</small>
            </div>
            <div className="product-card--actions">
              <Button variant="outline" size="sm" onClick={() => handleSave(product)} disabled={savingId === product.externalId}>
                {savingId === product.externalId ? "저장 중" : "관심상품 저장"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(product)} disabled={savingId === product.externalId}>
                상세 보기
              </Button>
              <Button variant="primary" size="sm" href={product.productUrl} external>
                구매하러 가기
              </Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
