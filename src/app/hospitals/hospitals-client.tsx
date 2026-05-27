"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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

const getNaverMapSearchUrl = (keyword: string) => `https://map.naver.com/p/search/${encodeURIComponent(keyword)}`;

export default function HospitalsClient() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("동물병원 데이터를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHospitals("전체", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHospitals(region: string, searchKeyword: string) {
    if (!supabase) {
      setMessage("Supabase 환경 변수를 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage("동물병원 데이터를 불러오는 중입니다.");
    const sanitizedKeyword = searchKeyword.trim().replace(/[%,]/g, " ");

    let query = supabase
      .from("animal_hospitals")
      .select("id, name, status, phone, road_address, lot_address, sido, sigungu")
      .order("sido", { ascending: true })
      .order("sigungu", { ascending: true })
      .order("name", { ascending: true })
      .limit(100);

    if (region !== "전체") {
      query = query.eq("sido", region);
    }

    if (sanitizedKeyword) {
      query = query.or(`name.ilike.%${sanitizedKeyword}%,road_address.ilike.%${sanitizedKeyword}%,sigungu.ilike.%${sanitizedKeyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as HospitalRow[];
    setHospitals(rows);
    setMessage(rows.length ? "" : "동물병원 데이터가 아직 없습니다. 공공데이터를 animal_hospitals 테이블에 적재하면 이 화면에 표시됩니다.");

    if (regions.length === 0) {
      const { data: regionData } = await supabase.from("animal_hospitals").select("sido").not("sido", "is", null).limit(1000);
      const nextRegions = Array.from(new Set((regionData ?? []).map((row) => row.sido).filter(Boolean) as string[])).sort();
      setRegions(nextRegions);
    }

    setIsLoading(false);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadHospitals(selectedRegion, keyword);
  }

  function handleRegionChange(region: string) {
    setSelectedRegion(region);
    loadHospitals(region, keyword);
  }

  return (
    <main className="hospitals-page">
      <section className="page-heading">
        <p className="section-label">동물병원 찾기</p>
        <h1>공공데이터 기반 동물병원 정보를 검색합니다.</h1>
        <p className="page-heading__copy">공공데이터는 갱신 주기가 있을 수 있어 방문 전 전화나 지도 링크로 한 번 더 확인하는 흐름을 전제로 합니다.</p>
      </section>

      <form className="search-bar" onSubmit={handleSearch}>
        <label htmlFor="hospital-keyword">검색어</label>
        <input
          id="hospital-keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="병원명, 주소, 시군구"
        />
        <button className="button button--primary" type="submit" disabled={isLoading}>
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      {!message ? <p className="result-summary">현재 조건으로 {hospitals.length}개 병원을 표시 중입니다.</p> : null}

      <section className="filter-strip" aria-label="지역 필터">
        {["전체", ...regions].map((region) => (
          <button
            className={region === selectedRegion ? "filter-strip__item filter-strip__item--active" : "filter-strip__item"}
            key={region}
            type="button"
            onClick={() => handleRegionChange(region)}
          >
            {region}
          </button>
        ))}
      </section>

      {message ? <div className="empty-state"><p>{message}</p></div> : null}

      <section className="hospital-list">
        {hospitals.map((hospital) => {
          const address = hospital.road_address || hospital.lot_address || "";
          return (
            <article className="hospital-item" key={hospital.id}>
              <div>
                <span>
                  {hospital.sido ?? "지역 확인 필요"} {hospital.sigungu ?? ""}
                </span>
                <strong>{hospital.name}</strong>
                <p>{address || "주소 확인 필요"}</p>
                {hospital.phone ? <a className="hospital-item__phone" href={`tel:${hospital.phone}`}>{hospital.phone}</a> : <small>전화번호 확인 필요</small>}
              </div>
              <a className="button button--secondary" href={getNaverMapSearchUrl(`${hospital.name} ${address}`)} target="_blank" rel="noreferrer">
                네이버 지도
              </a>
            </article>
          );
        })}
      </section>
    </main>
  );
}
