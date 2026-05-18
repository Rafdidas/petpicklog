"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SavedProductRow = {
  id: string;
  external_product_id: string | null;
  saved_price: number | null;
  status: string;
  created_at: string;
  external_products: {
    id: string;
    source: string;
    external_id: string;
    title: string;
    image_url: string | null;
    product_url: string;
    mall_name: string | null;
    latest_price: number | null;
    category: string | null;
    last_synced_at: string;
  } | null;
};

type SearchProduct = {
  externalId: string;
  title: string;
  brand: string | null;
  category: string;
  imageUrl: string;
  productUrl: string;
  mallName: string;
  latestPrice: number;
  source: "NAVER" | "DEMO";
  lastSyncedAt: string;
};

const statusOptions = [
  { value: "WISHLIST", label: "관심 있음" },
  { value: "WANT_TO_BUY", label: "구매 예정" },
  { value: "USING", label: "사용 중" },
  { value: "USED", label: "사용해봄" },
  { value: "REPURCHASE", label: "다시 살 예정" }
];

const formatPrice = (price: number | null) => (price ? `${new Intl.NumberFormat("ko-KR").format(price)}원` : "가격 확인 필요");

const formatSignedPrice = (price: number) => {
  const prefix = price > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("ko-KR").format(price)}원`;
};

function normalizeSavedRows(rows: unknown): SavedProductRow[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const item = row as Omit<SavedProductRow, "external_products"> & {
      external_products: SavedProductRow["external_products"] | SavedProductRow["external_products"][];
    };

    return {
      ...item,
      external_products: Array.isArray(item.external_products) ? item.external_products[0] ?? null : item.external_products
    };
  });
}

export default function SavedProductsClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [items, setItems] = useState<SavedProductRow[]>([]);
  const [message, setMessage] = useState("불러오는 중입니다.");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [repurchaseIntent, setRepurchaseIntent] = useState("true");

  useEffect(() => {
    async function loadSavedProducts() {
      if (!supabase) {
        setMessage("Supabase 환경 변수를 확인해주세요.");
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("로그인 후 찜 목록을 볼 수 있습니다.");
        return;
      }

      const { data, error } = await supabase
        .from("saved_products")
        .select(
          "id, external_product_id, saved_price, status, created_at, external_products(id, source, external_id, title, image_url, product_url, mall_name, latest_price, category, last_synced_at)"
        )
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        return;
      }

      setItems(normalizeSavedRows(data));
      setMessage(data?.length ? "" : "아직 찜한 상품이 없습니다.");
    }

    loadSavedProducts();
  }, [supabase]);

  async function handleStatusChange(savedProductId: string, nextStatus: string) {
    if (!supabase) {
      setNotice("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    setPendingId(savedProductId);
    setNotice("");

    const previousItems = items;
    setItems((currentItems) => currentItems.map((item) => (item.id === savedProductId ? { ...item, status: nextStatus } : item)));

    const { error } = await supabase.from("saved_products").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", savedProductId);

    if (error) {
      setItems(previousItems);
      setNotice(error.message);
    }

    setPendingId("");
  }

  async function handleRefreshPrice(item: SavedProductRow) {
    const product = item.external_products;
    if (!supabase || !product) {
      setNotice("가격을 확인할 상품 정보가 없습니다.");
      return;
    }

    setPendingId(item.id);
    setNotice("");

    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(product.title)}`);
      const data = (await response.json()) as { products?: SearchProduct[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "가격 재조회에 실패했습니다.");
      }

      const candidates = data.products ?? [];
      const lowest = candidates.reduce<SearchProduct | null>((currentLowest, candidate) => {
        if (!candidate.latestPrice) {
          return currentLowest;
        }

        if (!currentLowest || candidate.latestPrice < currentLowest.latestPrice) {
          return candidate;
        }

        return currentLowest;
      }, null);

      if (!lowest) {
        throw new Error("새 가격 후보를 찾지 못했습니다.");
      }

      const checkedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("external_products")
        .update({
          title: lowest.title,
          brand: lowest.brand,
          category: lowest.category,
          image_url: lowest.imageUrl,
          product_url: lowest.productUrl,
          mall_name: lowest.mallName,
          latest_price: lowest.latestPrice,
          raw_data: lowest,
          last_synced_at: checkedAt
        })
        .eq("id", product.id);

      if (updateError) {
        throw updateError;
      }

      await supabase.from("price_histories").insert({
        external_product_id: product.id,
        source: lowest.source,
        mall_name: lowest.mallName,
        price: lowest.latestPrice,
        product_url: lowest.productUrl,
        checked_at: checkedAt
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                external_products: {
                  ...product,
                  title: lowest.title,
                  source: lowest.source,
                  external_id: lowest.externalId,
                  image_url: lowest.imageUrl,
                  product_url: lowest.productUrl,
                  mall_name: lowest.mallName,
                  latest_price: lowest.latestPrice,
                  category: lowest.category,
                  last_synced_at: checkedAt
                }
              }
            : currentItem
        )
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "가격 재조회에 실패했습니다.");
    } finally {
      setPendingId("");
    }
  }

  function openReviewForm(savedProductId: string) {
    setReviewingId(savedProductId);
    setReviewContent("");
    setReviewRating("5");
    setRepurchaseIntent("true");
    setNotice("");
  }

  async function handleSubmitReview(item: SavedProductRow) {
    if (!supabase) {
      setNotice("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    if (!reviewContent.trim()) {
      setNotice("후기 내용을 입력해주세요.");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setNotice("로그인 후 후기를 작성할 수 있습니다.");
      return;
    }

    setPendingId(item.id);
    setNotice("");

    const { error } = await supabase.from("product_reviews").insert({
      user_id: user.id,
      external_product_id: item.external_product_id,
      rating: Number(reviewRating),
      repurchase_intent: repurchaseIntent === "true",
      review_type: "ITEM",
      content: reviewContent.trim()
    });

    if (error) {
      setNotice(error.message);
    } else {
      setReviewingId("");
      setReviewContent("");
      setNotice("후기를 저장했습니다.");
    }

    setPendingId("");
  }

  async function handleDelete(savedProductId: string) {
    if (!supabase) {
      setNotice("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    const shouldDelete = window.confirm("이 상품을 찜 목록에서 삭제할까요?");
    if (!shouldDelete) {
      return;
    }

    setPendingId(savedProductId);
    setNotice("");

    const previousItems = items;
    const nextItems = items.filter((item) => item.id !== savedProductId);
    setItems(nextItems);

    const { error } = await supabase.from("saved_products").delete().eq("id", savedProductId);

    if (error) {
      setItems(previousItems);
      setNotice(error.message);
    } else if (nextItems.length === 0) {
      setMessage("아직 찜한 상품이 없습니다.");
    }

    setPendingId("");
  }

  return (
    <main className="saved-page">
      <section className="page-heading">
        <p className="section-label">찜 목록</p>
        <h1>저장한 상품의 현재 가격과 구매 링크를 확인합니다.</h1>
      </section>

      {message ? (
        <div className="empty-state">
          <p>{message}</p>
          <Link className="button button--primary" href={message.includes("로그인") ? "/auth?redirect=/saved" : "/products"}>
            {message.includes("로그인") ? "로그인하기" : "상품 검색하기"}
          </Link>
        </div>
      ) : null}
      {notice ? <p className="notice notice--error">{notice}</p> : null}

      <section className="saved-list">
        {items.map((item) => {
          const product = item.external_products;
          if (!product) {
            return null;
          }
          const currentPrice = product.latest_price;
          const savedPrice = item.saved_price;
          const priceDiff = currentPrice !== null && savedPrice !== null ? currentPrice - savedPrice : null;

          return (
            <article className="saved-item" key={item.id}>
              {product.image_url ? <Image src={product.image_url} alt="" width={180} height={135} /> : <div className="saved-item__image" />}
              <div className="saved-item__content">
                <span>{product.mall_name ?? "쇼핑몰 확인 필요"}</span>
                <h2>{product.title}</h2>
                <p>현재 {formatPrice(product.latest_price)}</p>
                <div className="saved-item__meta">
                  <small>저장 당시 {formatPrice(item.saved_price)}</small>
                  {priceDiff !== null ? (
                    <strong className={priceDiff <= 0 ? "saved-item__diff saved-item__diff--down" : "saved-item__diff saved-item__diff--up"}>
                      {priceDiff === 0 ? "변동 없음" : formatSignedPrice(priceDiff)}
                    </strong>
                  ) : null}
                </div>
                <label className="saved-item__status" htmlFor={`status-${item.id}`}>
                  상태
                  <select
                    id={`status-${item.id}`}
                    value={item.status}
                    onChange={(event) => handleStatusChange(item.id, event.target.value)}
                    disabled={pendingId === item.id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="saved-item__actions">
                <button className="button button--ghost" type="button" onClick={() => handleRefreshPrice(item)} disabled={pendingId === item.id}>
                  {pendingId === item.id ? "확인 중" : "현재 가격 확인"}
                </button>
                <a className="button button--secondary" href={product.product_url} target="_blank" rel="noreferrer">
                  구매 링크
                </a>
                <button className="button button--secondary" type="button" onClick={() => openReviewForm(item.id)}>
                  후기 작성
                </button>
                <button className="button button--danger" type="button" onClick={() => handleDelete(item.id)} disabled={pendingId === item.id}>
                  찜 취소
                </button>
              </div>
              {reviewingId === item.id ? (
                <form
                  className="review-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmitReview(item);
                  }}
                >
                  <label>
                    별점
                    <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                      <option value="5">5점</option>
                      <option value="4">4점</option>
                      <option value="3">3점</option>
                      <option value="2">2점</option>
                      <option value="1">1점</option>
                    </select>
                  </label>
                  <label>
                    재구매 의사
                    <select value={repurchaseIntent} onChange={(event) => setRepurchaseIntent(event.target.value)}>
                      <option value="true">있음</option>
                      <option value="false">없음</option>
                    </select>
                  </label>
                  <label className="review-form__content">
                    후기
                    <textarea value={reviewContent} onChange={(event) => setReviewContent(event.target.value)} rows={4} placeholder="써보니 어땠나요?" />
                  </label>
                  <div className="review-form__actions">
                    <button className="button button--primary" type="submit" disabled={pendingId === item.id}>
                      저장
                    </button>
                    <button className="button button--secondary" type="button" onClick={() => setReviewingId("")}>
                      취소
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
