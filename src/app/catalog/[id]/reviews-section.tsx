"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatCheckedAt } from "@/lib/format";
import { computeReviewAggregate } from "@/lib/product-detail";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ReviewRow } from "@/lib/catalog";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";
import StatTile from "@/components/ui/StatTile";

export default function ReviewsSection({
  externalProductId,
  initialReviews
}: {
  externalProductId: string;
  initialReviews: ReviewRow[];
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [reviews, setReviews] = useState<ReviewRow[]>(initialReviews);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [repurchaseIntent, setRepurchaseIntent] = useState("true");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    async function loadUser() {
      if (!supabase) {
        return;
      }
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? "");
    }
    loadUser();
  }, [supabase]);

  async function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

    setIsSubmitting(true);
    setNotice("");

    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        user_id: user.id,
        external_product_id: externalProductId,
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

    setReviews((current) => [data as ReviewRow, ...current]);
    setReviewContent("");
    setNotice("후기를 저장했습니다.");
  }

  const aggregate = computeReviewAggregate(reviews);
  const hasMyReview = Boolean(currentUserId) && reviews.some((review) => review.user_id === currentUserId);

  return (
    <section className="detail-section">
      <SectionHeading eyebrow="후기" title="저장 상품과 연결된 후기" />
      <div className="detail-stat-grid">
        <StatTile boxed label="후기" value={`${aggregate.count}개`} />
        <StatTile boxed label="평균 별점" value={aggregate.count ? aggregate.averageRating.toFixed(1) : "없음"} />
        <StatTile boxed label="재구매 의사" value={aggregate.count ? `${aggregate.repurchaseRate}%` : "없음"} />
        <StatTile boxed label="내 후기" value={hasMyReview ? "작성함" : "작성 전"} />
      </div>

      <div className="review-card">
        <form onSubmit={handleSubmitReview}>
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
              placeholder="써보니 어땠나요?"
            />
          </label>
          <Button type="submit" variant="dark" disabled={isSubmitting}>
            {isSubmitting ? "저장 중" : "후기 저장"}
          </Button>
        </form>
        {notice ? <p className="notice notice--error">{notice}</p> : null}
      </div>

      {reviews.length ? (
        <div className="review-card">
          {reviews.map((review) => (
            <article className="review-card__item" key={review.id}>
              <strong>{review.rating}점</strong>
              <span>{review.repurchase_intent ? "재구매 의사 있음" : "재구매 의사 없음"}</span>
              <p>{review.content}</p>
              <small>{formatCheckedAt(review.created_at)}</small>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
