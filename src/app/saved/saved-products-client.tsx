"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import StatTile from "@/components/ui/StatTile";

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
  source: "NAVER";
  lastSyncedAt: string;
};

type PriceHistoryRow = {
  id: string;
  price: number;
  mall_name: string | null;
  checked_at: string;
};

const statusOptions = [
  { value: "WISHLIST", label: "관심 있음" },
  { value: "WANT_TO_BUY", label: "구매 예정" },
  { value: "USING", label: "사용 중" },
  { value: "USED", label: "사용해봄" },
  { value: "REPURCHASE", label: "다시 살 예정" }
];

const getSourceLabel = (source: string) => (source === "NAVER" ? "네이버 쇼핑 기준" : "출처 확인 필요");
const getDiffLabel = (priceDiff: number | null) => {
  if (priceDiff === null) {
    return "";
  }

  if (priceDiff < 0) {
    return `${formatPrice(Math.abs(priceDiff))} 하락`;
  }

  if (priceDiff > 0) {
    return `${formatPrice(priceDiff)} 상승`;
  }

  return "가격 변동 없음";
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
  const [historyByProductId, setHistoryByProductId] = useState<Record<string, PriceHistoryRow[]>>({});
  const [expandedHistoryId, setExpandedHistoryId] = useState("");

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
        setMessage("로그인 후 관심상품을 볼 수 있습니다.");
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
      setMessage(data?.length ? "" : "아직 관심상품이 없습니다.");
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
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(product.title)}&scope=raw`);
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

    const shouldDelete = window.confirm("이 상품을 관심상품에서 삭제할까요?");
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
      setMessage("아직 관심상품이 없습니다.");
    }

    setPendingId("");
  }

  async function handleToggleHistory(item: SavedProductRow) {
    const productId = item.external_product_id;
    if (!supabase || !productId) {
      setNotice("가격 기록을 확인할 상품 정보가 없습니다.");
      return;
    }

    if (expandedHistoryId === item.id) {
      setExpandedHistoryId("");
      return;
    }

    setExpandedHistoryId(item.id);
    if (historyByProductId[productId]) {
      return;
    }

    const { data, error } = await supabase
      .from("price_histories")
      .select("id, price, mall_name, checked_at")
      .eq("external_product_id", productId)
      .order("checked_at", { ascending: false })
      .limit(3);

    if (error) {
      setNotice(error.message);
      return;
    }

    setHistoryByProductId((current) => ({ ...current, [productId]: (data ?? []) as PriceHistoryRow[] }));
  }

  const summary = items.reduce(
    (acc, item) => {
      const product = item.external_products;
      const currentPrice = product?.latest_price;
      const savedPrice = item.saved_price;
      const checkedAt = product?.last_synced_at ? new Date(product.last_synced_at).getTime() : 0;

      if (currentPrice !== null && currentPrice !== undefined && savedPrice !== null) {
        if (currentPrice < savedPrice) {
          acc.down += 1;
        } else if (currentPrice > savedPrice) {
          acc.up += 1;
        }
      }

      if (checkedAt > acc.latestCheckedAt) {
        acc.latestCheckedAt = checkedAt;
      }

      return acc;
    },
    { down: 0, up: 0, latestCheckedAt: 0 }
  );

  return (
    <main className="saved-page">
      <section className="page-heading">
        <p className="section-label">관심상품</p>
        <h1>자주 사는 상품의 가격 변화를 확인하세요.</h1>
        <p className="page-heading__copy">가격은 마지막 확인 시각 기준입니다. 최종 결제가는 쇼핑몰에서 다시 확인해주세요.</p>
      </section>

      {!message ? (
        <section className="detail-stat-grid" aria-label="관심상품 가격 요약">
          <StatTile boxed label="관심상품" value={`${items.length}개`} />
          <StatTile boxed label="가격 하락" value={`${summary.down}개`} />
          <StatTile boxed label="가격 상승" value={`${summary.up}개`} />
          <StatTile
            boxed
            label="최근 확인"
            value={summary.latestCheckedAt ? formatCheckedAt(new Date(summary.latestCheckedAt).toISOString()) : "확인 전"}
          />
        </section>
      ) : null}

      {message ? (
        <EmptyState
          action={
            <Button href={message.includes("로그인") ? "/auth?redirect=/saved" : "/products"} variant="primary">
              {message.includes("로그인") ? "로그인하기" : "가격 확인하기"}
            </Button>
          }
        >
          {message}
        </EmptyState>
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
            <article className="saved-card" key={item.id}>
              <div className="saved-card__media">
                {product.image_url ? (
                  <Image src={product.image_url} alt="" width={180} height={135} />
                ) : (
                  <span>이미지</span>
                )}
              </div>
              <div className="saved-card__body">
                <span className="saved-card__source">
                  {product.mall_name ?? "쇼핑몰 확인 필요"} · {getSourceLabel(product.source)}
                </span>
                <Link className="saved-card__title" href={`/products/${product.id}`}>
                  {product.title}
                </Link>
                <div className="saved-card__price-row">
                  <strong>{formatPrice(product.latest_price)}</strong>
                  {priceDiff !== null ? (
                    priceDiff <= 0 ? (
                      <Badge variant="state">{getDiffLabel(priceDiff) || "가격 변동 없음"}</Badge>
                    ) : (
                      <span className="ui-badge ui-badge--up">{getDiffLabel(priceDiff)}</span>
                    )
                  ) : null}
                  <small>마지막 확인 {formatCheckedAt(product.last_synced_at)}</small>
                </div>
                <label className="saved-card__status" htmlFor={`status-${item.id}`}>
                  상태
                  <select
                    id={`status-${item.id}`}
                    className="ui-input"
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
              <div className="saved-card__actions">
                <Button variant="outline" size="sm" onClick={() => handleToggleHistory(item)}>
                  {expandedHistoryId === item.id ? "가격 기록 닫기" : "가격 기록 보기"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRefreshPrice(item)} disabled={pendingId === item.id}>
                  {pendingId === item.id ? "확인 중" : "현재 가격 확인"}
                </Button>
                <Button variant="primary" size="sm" href={product.product_url} external>
                  구매하러 가기
                </Button>
                <Button variant="outline" size="sm" onClick={() => openReviewForm(item.id)}>
                  후기 작성
                </Button>
                <Button variant="danger-text" size="sm" onClick={() => handleDelete(item.id)} disabled={pendingId === item.id}>
                  관심상품 해제
                </Button>
              </div>
              {reviewingId === item.id ? (
                <div className="review-card">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSubmitReview(item);
                    }}
                  >
                    <div className="review-card__row">
                      <label>
                        별점
                        <select className="ui-input" value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
                          <option value="5">5점</option>
                          <option value="4">4점</option>
                          <option value="3">3점</option>
                          <option value="2">2점</option>
                          <option value="1">1점</option>
                        </select>
                      </label>
                      <label>
                        재구매 의사
                        <select className="ui-input" value={repurchaseIntent} onChange={(event) => setRepurchaseIntent(event.target.value)}>
                          <option value="true">있음</option>
                          <option value="false">없음</option>
                        </select>
                      </label>
                    </div>
                    <label className="review-card__content">
                      후기
                      <textarea
                        className="ui-input"
                        value={reviewContent}
                        onChange={(event) => setReviewContent(event.target.value)}
                        rows={4}
                        placeholder="써보니 어땠나요?"
                      />
                    </label>
                    <div className="review-card__actions">
                      <Button type="submit" variant="dark" disabled={pendingId === item.id}>
                        {pendingId === item.id ? "저장 중" : "저장"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setReviewingId("")}>
                        취소
                      </Button>
                    </div>
                  </form>
                </div>
              ) : null}
              {expandedHistoryId === item.id ? (
                <div className="history-card">
                  {(historyByProductId[item.external_product_id ?? ""] ?? []).length ? (
                    (historyByProductId[item.external_product_id ?? ""] ?? []).map((history) => (
                      <article className="history-card__row" key={history.id}>
                        <strong>{formatPrice(history.price)}</strong>
                        <span>{history.mall_name || "쇼핑몰 확인 필요"}</span>
                        <small>{formatCheckedAt(history.checked_at)}</small>
                      </article>
                    ))
                  ) : (
                    <p>아직 가격 기록이 없습니다.</p>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
