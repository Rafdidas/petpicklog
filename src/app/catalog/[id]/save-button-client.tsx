"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SaveButtonClient({ externalProductId, currentPrice }: { externalProductId: string; currentPrice: number }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function checkSaved() {
      if (!supabase) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("saved_products")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_product_id", externalProductId)
        .maybeSingle();

      setIsSaved(Boolean(data));
    }

    checkSaved();
  }, [externalProductId, supabase]);

  async function handleSave() {
    if (!supabase) {
      setNotice("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth?redirect=${encodeURIComponent(`/catalog/${externalProductId}`)}`;
      return;
    }

    setIsSaving(true);
    setNotice("");

    const { error } = await supabase.from("saved_products").insert({
      user_id: user.id,
      external_product_id: externalProductId,
      status: "WISHLIST",
      saved_price: currentPrice
    });

    setIsSaving(false);

    if (error) {
      setNotice(error.code === "23505" ? "이미 관심상품으로 저장한 상품입니다." : error.message);
      return;
    }

    setIsSaved(true);
  }

  if (isSaved) {
    return <Link className="button button--secondary" href="/saved">관심상품 보기</Link>;
  }

  return (
    <>
      <button className="button button--secondary" type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "저장 중" : "관심상품 저장"}
      </button>
      {notice ? <p className="notice notice--error">{notice}</p> : null}
    </>
  );
}
