"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatCheckedAt, formatPrice } from "@/lib/format";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ProductRow = {
  id: string;
  title: string;
  image_url: string | null;
  mall_name: string | null;
  latest_price: number | null;
  last_synced_at: string;
};

type SavedRow = {
  id: string;
  saved_price: number | null;
  external_products: ProductRow | ProductRow[] | null;
};

type HospitalRow = {
  id: string;
  name: string;
  status: string | null;
  phone: string | null;
  road_address: string | null;
  lot_address: string | null;
  sido: string | null;
  sigungu: string | null;
};

function normalizeProduct(value: SavedRow["external_products"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default function HomeDashboardClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [savedItems, setSavedItems] = useState<SavedRow[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductRow[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!supabase) {
        setIsReady(true);
        return;
      }

      const [{ data: authData }, { data: productData }, { data: hospitalData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("external_products")
          .select("id, title, image_url, mall_name, latest_price, last_synced_at")
          .order("last_synced_at", { ascending: false })
          .limit(4),
        supabase
          .from("animal_hospitals")
          .select("id, name, status, phone, road_address, lot_address, sido, sigungu")
          .order("sido", { ascending: true })
          .order("sigungu", { ascending: true })
          .limit(3)
      ]);

      const user = authData.user;
      setIsLoggedIn(Boolean(user));
      setRecentProducts((productData ?? []) as ProductRow[]);
      setHospitals((hospitalData ?? []) as HospitalRow[]);

      if (user) {
        const { data } = await supabase
          .from("saved_products")
          .select("id, saved_price, external_products(id, title, image_url, mall_name, latest_price, last_synced_at)")
          .order("created_at", { ascending: false });
        setSavedItems((data ?? []) as SavedRow[]);
      }

      setIsReady(true);
    }

    loadDashboard();
  }, [supabase]);

  const savedSummary = savedItems.reduce(
    (summary, item) => {
      const product = normalizeProduct(item.external_products);
      const currentPrice = product?.latest_price;
      if (currentPrice !== null && currentPrice !== undefined && item.saved_price !== null) {
        if (currentPrice < item.saved_price) summary.down += 1;
        if (currentPrice > item.saved_price) summary.up += 1;
      }

      const checkedAt = product?.last_synced_at ? new Date(product.last_synced_at).getTime() : 0;
      if (checkedAt > summary.latestCheckedAt) summary.latestCheckedAt = checkedAt;
      return summary;
    },
    { down: 0, up: 0, latestCheckedAt: 0 }
  );

  const changedSavedItems = savedItems
    .map((item) => ({ ...item, product: normalizeProduct(item.external_products) }))
    .filter((item) => item.product && item.saved_price !== null && item.product.latest_price !== null && item.saved_price !== item.product.latest_price)
    .slice(0, 2);

  return (
    <>
      <section className="platform-split">
        <article className="saved-preview">
          <div className="platform-section__heading">
            <div><h2>내 관심상품 가격 변화</h2><p>관심상품을 저장하면 가격 변화를 한눈에 확인할 수 있어요.</p></div>
            <Link href="/saved">전체 보기 <span aria-hidden="true">›</span></Link>
          </div>
          <div className="saved-preview__metrics">
            <span>관심상품<strong>{isReady && isLoggedIn ? `${savedItems.length}개` : "-"}</strong></span>
            <span>가격 하락<strong>{isReady && isLoggedIn ? `${savedSummary.down}개` : "-"}</strong></span>
            <span>가격 상승<strong>{isReady && isLoggedIn ? `${savedSummary.up}개` : "-"}</strong></span>
            <span>최근 확인<strong>{savedSummary.latestCheckedAt ? formatCheckedAt(new Date(savedSummary.latestCheckedAt).toISOString()) : "-"}</strong></span>
          </div>
          {changedSavedItems.length ? (
            <div className="dashboard-product-list">
              {changedSavedItems.map((item) => {
                const product = item.product!;
                const diff = (product.latest_price ?? 0) - (item.saved_price ?? 0);
                return (
                  <Link href={`/products/${product.id}`} key={item.id}>
                    {product.image_url ? <Image src={product.image_url} alt="" width={54} height={54} /> : <span className="dashboard-product-list__image" />}
                    <span><strong>{product.title}</strong><small>{product.mall_name || "쇼핑몰 확인 필요"}</small></span>
                    <em className={diff < 0 ? "price-diff price-diff--down" : "price-diff price-diff--up"}>
                      {formatPrice(Math.abs(diff))} {diff < 0 ? "하락" : "상승"}
                    </em>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="saved-preview__empty">
              <strong>{isLoggedIn ? "아직 가격이 변동된 관심상품이 없어요." : "로그인하고 관심상품 가격 변화를 확인하세요."}</strong>
              <p>{isLoggedIn ? "관심상품의 가격을 다시 확인하면 저장 당시 가격과 비교할 수 있어요." : "자주 사는 용품을 저장하면 나중에 가격 변화를 비교할 수 있어요."}</p>
              <Link className="button button--primary" href={isLoggedIn ? "/products" : "/auth?redirect=/saved"}>{isLoggedIn ? "용품 검색하기" : "로그인하고 시작하기"}</Link>
            </div>
          )}
        </article>

        <article className="recent-preview">
          <div className="platform-section__heading">
            <div><h2>최근 확인한 상품</h2><p>검색한 상품의 최근 확인 가격을 살펴보세요.</p></div>
            <Link href="/products">전체 보기 <span aria-hidden="true">›</span></Link>
          </div>
          {recentProducts.length ? (
            <div className="dashboard-product-list">
              {recentProducts.map((product) => (
                <Link href={`/products/${product.id}`} key={product.id}>
                  {product.image_url ? <Image src={product.image_url} alt="" width={54} height={54} /> : <span className="dashboard-product-list__image" />}
                  <span><strong>{product.title}</strong><small>{product.mall_name || "쇼핑몰 확인 필요"}</small></span>
                  <em>{formatPrice(product.latest_price)}</em>
                </Link>
              ))}
            </div>
          ) : (
            <div className="recent-preview__empty"><strong>가격을 확인한 상품이 여기에 표시됩니다.</strong><p>관심 있는 용품을 검색해보세요.</p></div>
          )}
        </article>
      </section>

      <section className="hospital-preview">
        <div>
          <p className="section-label">우리 동네 동물병원</p>
          <h2>공공데이터 기반으로 지역별<br />동물병원 정보를 확인하세요.</h2>
          <p>방문 전 운영 여부와 진료 가능 여부는 병원에 직접 확인해주세요.</p>
          <Link className="button button--primary" href="/hospitals">동물병원 찾기</Link>
        </div>
        <div>
          <form action="/hospitals" className="hospital-preview__search">
            <input name="query" aria-label="동물병원 검색어" placeholder="병원명, 주소, 시군구로 검색" />
            <button className="button button--secondary" type="submit">검색</button>
          </form>
          <div className="hospital-preview__list">
            {hospitals.map((hospital) => (
              <Link href={`/hospitals?query=${encodeURIComponent(hospital.name)}`} key={hospital.id}>
                <span><strong>{hospital.name}</strong><small>{hospital.sido ?? ""} {hospital.sigungu ?? ""}</small></span>
                <em>{hospital.status || "상태 확인 필요"}</em>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
