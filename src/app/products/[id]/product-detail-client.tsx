"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ExternalProductRow = {
  id: string;
  source: string;
  external_id: string;
  title: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  product_url: string;
  mall_name: string | null;
  latest_price: number | null;
  last_synced_at: string | null;
};

type PriceHistoryRow = {
  id: string;
  source: string;
  mall_name: string | null;
  price: number;
  product_url: string;
  checked_at: string;
};

type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  repurchase_intent: boolean | null;
  content: string;
  created_at: string;
};

const getSourceLabel = (source: string) => (source === "NAVER" ? "네이버 쇼핑 기준" : "출처 확인 필요");

export default function ProductDetailClient({ productId }: { productId: string }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [product, setProduct] = useState<ExternalProductRow | null>(null);
  const [histories, setHistories] = useState<PriceHistoryRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [message, setMessage] = useState("상품 정보를 불러오는 중입니다.");
  const [notice, setNotice] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [repurchaseIntent, setRepurchaseIntent] = useState("true");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    async function loadProductDetail() {
      if (!supabase) {
        setMessage("Supabase 환경 변수를 확인해주세요.");
        return;
      }

      const { data: productData, error: productError } = await supabase
        .from("external_products")
        .select("id, source, external_id, title, brand, category, image_url, product_url, mall_name, latest_price, last_synced_at")
        .eq("id", productId)
        .maybeSingle();

      if (productError) {
        setMessage(productError.message);
        return;
      }

      if (!productData) {
        setMessage("상품 정보를 찾지 못했습니다.");
        return;
      }

      const [{ data: historyData }, { data: reviewData }, { data: authData }] = await Promise.all([
        supabase
          .from("price_histories")
          .select("id, source, mall_name, price, product_url, checked_at")
          .eq("external_product_id", productId)
          .order("checked_at", { ascending: false })
          .limit(20),
        supabase
          .from("product_reviews")
          .select("id, user_id, rating, repurchase_intent, content, created_at")
          .eq("external_product_id", productId)
          .order("created_at", { ascending: false }),
        supabase.auth.getUser()
      ]);

      setProduct(productData as ExternalProductRow);
      setHistories((historyData ?? []) as PriceHistoryRow[]);
      setReviews((reviewData ?? []) as ReviewRow[]);
      const userId = authData.user?.id ?? "";
      setCurrentUserId(userId);
      if (userId) {
        const { data: savedData } = await supabase
          .from("saved_products")
          .select("id")
          .eq("user_id", userId)
          .eq("external_product_id", productId)
          .maybeSingle();
        setIsSaved(Boolean(savedData));
      }
      setMessage("");
    }

    loadProductDetail();
  }, [productId, supabase]);

  async function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !product) {
      setNotice("상품 정보를 확인한 뒤 후기를 작성할 수 있습니다.");
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

    setIsSubmitting(true);
    setNotice("");

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        user_id: user.id,
        external_product_id: product.id,
        rating: Number(reviewRating),
        repurchase_intent: repurchaseIntent === "true",
        review_type: "ITEM",
        content: reviewContent.trim()
      })
      .select("id, user_id, rating, repurchase_intent, content, created_at")
      .single();

    setIsSubmitting(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    setReviews((currentReviews) => [data as ReviewRow, ...currentReviews]);
    setReviewContent("");
    setNotice("후기를 저장했습니다.");
  }

  async function handleSaveProduct() {
    if (!supabase || !product) {
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setNotice("로그인 후 관심상품으로 저장할 수 있습니다.");
      return;
    }

    setIsSaving(true);
    setNotice("");
    const { error } = await supabase.from("saved_products").insert({
      user_id: user.id,
      external_product_id: product.id,
      status: "WISHLIST",
      saved_price: product.latest_price
    });
    setIsSaving(false);

    if (error) {
      setNotice(error.code === "23505" ? "이미 관심상품으로 저장한 상품입니다." : error.message);
      return;
    }

    setIsSaved(true);
    setNotice("관심상품으로 저장했습니다.");
  }

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const repurchaseReviews = reviews.filter((review) => review.repurchase_intent).length;
  const repurchaseRate = reviews.length ? Math.round((repurchaseReviews / reviews.length) * 100) : 0;

  if (message) {
    return (
      <main className="product-detail-page">
        <div className="empty-state">
          <p>{message}</p>
          <Link className="button button--primary" href="/products">
            가격 확인하기
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <main className="product-detail-page">
      <section className="product-detail">
        {product.image_url ? <Image src={product.image_url} alt="" width={520} height={390} /> : <div className="product-detail__image" />}
        <div className="product-detail__content">
          <p className="section-label">{getSourceLabel(product.source)}</p>
          <h1>{product.title}</h1>
          <p className="product-detail__price">{formatPrice(product.latest_price)}</p>
          <dl className="detail-list">
            <div>
              <dt>카테고리</dt>
              <dd>{product.category || "카테고리 확인 필요"}</dd>
            </div>
            <div>
              <dt>쇼핑몰</dt>
              <dd>{product.mall_name || "쇼핑몰 확인 필요"}</dd>
            </div>
            <div>
              <dt>마지막 가격 확인</dt>
              <dd>{formatCheckedAt(product.last_synced_at)}</dd>
            </div>
          </dl>
          <div className="product-detail__actions">
            {isSaved ? (
              <Link className="button button--secondary" href="/saved">관심상품 보기</Link>
            ) : (
              <button className="button button--secondary" type="button" onClick={handleSaveProduct} disabled={isSaving}>
                {isSaving ? "저장 중" : "관심상품 저장"}
              </button>
            )}
            <a className="button button--primary" href={product.product_url} target="_blank" rel="noreferrer">
              구매하러 가기
            </a>
          </div>
          <p className="product-detail__notice">표시된 가격은 최근 확인된 가격이며, 실제 구매 가격은 쇼핑몰에서 달라질 수 있습니다.</p>
        </div>
      </section>

      <section className="detail-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">가격 기록</p>
            <h2>최근 확인된 가격 기록</h2>
          </div>
        </div>
        <div className="history-list">
          {histories.length ? (
            histories.map((history) => (
              <article className="history-item" key={history.id}>
                <div>
                  <strong>{formatPrice(history.price)}</strong>
                  <span>{history.mall_name || getSourceLabel(history.source)}</span>
                </div>
                <small>{formatCheckedAt(history.checked_at)}</small>
                <a href={history.product_url} target="_blank" rel="noreferrer">
                  상품 링크
                </a>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <p>아직 가격 기록이 없습니다.</p>
            </div>
          )}
        </div>
      </section>

      <section className="detail-section">
        <div className="dashboard-section__heading">
          <div>
            <p className="section-label">후기</p>
            <h2>저장 상품과 연결된 후기</h2>
          </div>
        </div>
        <section className="metric-grid" aria-label="후기 요약">
          <article>
            <span>후기</span>
            <strong>{reviews.length}개</strong>
          </article>
          <article>
            <span>평균 별점</span>
            <strong>{averageRating ? averageRating.toFixed(1) : "없음"}</strong>
          </article>
          <article>
            <span>재구매 의사</span>
            <strong>{reviews.length ? `${repurchaseRate}%` : "없음"}</strong>
          </article>
          <article>
            <span>내 후기</span>
            <strong>{currentUserId && reviews.some((review) => review.user_id === currentUserId) ? "작성함" : "작성 전"}</strong>
          </article>
        </section>

        <form className="review-form review-form--detail" onSubmit={handleSubmitReview}>
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
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중" : "후기 저장"}
            </button>
          </div>
        </form>
        {notice ? <p className="notice notice--error">{notice}</p> : null}

        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div>
                <strong>{review.rating}점</strong>
                <span>{review.repurchase_intent ? "재구매 의사 있음" : "재구매 의사 없음"}</span>
              </div>
              <p>{review.content}</p>
              <small>{formatCheckedAt(review.created_at)}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
