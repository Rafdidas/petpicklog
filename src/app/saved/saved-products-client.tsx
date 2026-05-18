"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SavedProductRow = {
  id: string;
  saved_price: number | null;
  status: string;
  created_at: string;
  external_products: {
    title: string;
    image_url: string | null;
    product_url: string;
    mall_name: string | null;
    latest_price: number | null;
    category: string | null;
    last_synced_at: string;
  } | null;
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
          "id, saved_price, status, created_at, external_products(title, image_url, product_url, mall_name, latest_price, category, last_synced_at)"
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
                <a className="button button--secondary" href={product.product_url} target="_blank" rel="noreferrer">
                  구매 링크
                </a>
                <button className="button button--danger" type="button" onClick={() => handleDelete(item.id)} disabled={pendingId === item.id}>
                  찜 취소
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
