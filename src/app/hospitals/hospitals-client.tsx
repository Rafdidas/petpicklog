"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

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
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedDistrict, setSelectedDistrict] = useState("전체");
  const [keyword, setKeyword] = useState(() => searchParams.get("query") ?? "");
  const [message, setMessage] = useState("동물병원 데이터를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadHospitals("전체", "전체", searchParams.get("query") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHospitals(region: string, district: string, searchKeyword: string) {
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

    if (district !== "전체") {
      query = query.eq("sigungu", district);
    }

    if (sanitizedKeyword) {
      query = query.or(`name.ilike.%${sanitizedKeyword}%,road_address.ilike.%${sanitizedKeyword}%,lot_address.ilike.%${sanitizedKeyword}%,sigungu.ilike.%${sanitizedKeyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as HospitalRow[];
    setHospitals(rows);
    setPage(1);
    setMessage(rows.length ? "" : "동물병원 데이터가 아직 없습니다. 공공데이터를 animal_hospitals 테이블에 적재하면 이 화면에 표시됩니다.");

    if (regions.length === 0) {
      const { data: regionData } = await supabase.from("animal_hospitals").select("sido, sigungu").not("sido", "is", null).limit(1000);
      const nextRegions = Array.from(new Set((regionData ?? []).map((row) => row.sido).filter(Boolean) as string[])).sort();
      setRegions(nextRegions);
      setDistricts(Array.from(new Set((regionData ?? []).map((row) => row.sigungu).filter(Boolean) as string[])).sort());
    }

    setIsLoading(false);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadHospitals(selectedRegion, selectedDistrict, keyword);
  }

  function handleRegionChange(region: string) {
    setSelectedRegion(region);
    setSelectedDistrict("전체");
    loadHospitals(region, "전체", keyword);
  }

  function handleDistrictChange(district: string) {
    setSelectedDistrict(district);
    loadHospitals(selectedRegion, district, keyword);
  }

  return (
    <main className="hospitals-page">
      <section className="page-heading">
        <p className="section-label">동물병원</p>
        <h1>우리 동네 동물병원 정보를 확인해보세요.</h1>
        <p className="page-heading__copy">공공데이터 기반으로 병원명과 주소를 검색합니다. 방문 전 운영 여부와 진료 가능 여부는 병원에 직접 확인해주세요.</p>
      </section>

      <form className="hospitals-page__search" onSubmit={handleSearch}>
        <label htmlFor="hospital-keyword">검색어</label>
        <input
          className="ui-input"
          id="hospital-keyword"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="병원명, 주소, 시군구"
        />
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "검색 중" : "검색"}
        </Button>
      </form>

      {!message ? <p className="result-summary">현재 조건으로 {hospitals.length}개 병원을 표시 중입니다.</p> : null}

      <div className="filter-strip" aria-label="지역 필터">
        {["전체", ...regions].map((region) => (
          <Chip key={region} active={region === selectedRegion} onClick={() => handleRegionChange(region)}>
            {region}
          </Chip>
        ))}
      </div>

      <div className="filter-strip" aria-label="시군구 필터">
        {["전체", ...districts].map((district) => (
          <Chip key={district} active={district === selectedDistrict} onClick={() => handleDistrictChange(district)}>
            {district}
          </Chip>
        ))}
      </div>

      {message ? <EmptyState>{message}</EmptyState> : null}

      <section className="hospital-list">
        {hospitals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((hospital) => {
          const address = hospital.road_address || hospital.lot_address || "";
          return (
            <article className="hospital-item" key={hospital.id}>
              <div>
                <div className="hospital-item__meta">
                  <span>
                  {hospital.sido ?? "지역 확인 필요"} {hospital.sigungu ?? ""}
                  </span>
                  <em>{hospital.status || "영업상태 확인 필요"}</em>
                </div>
                <strong>{hospital.name}</strong>
                <p><small>도로명</small> {hospital.road_address || "주소 확인 필요"}</p>
                <p><small>지번</small> {hospital.lot_address || "주소 확인 필요"}</p>
                {hospital.phone ? <a className="hospital-item__phone" href={`tel:${hospital.phone}`}>{hospital.phone}</a> : <small>전화번호 확인 필요</small>}
              </div>
              <Button href={getNaverMapSearchUrl(`${hospital.name} ${address}`)} external variant="outline" size="sm">
                네이버 지도
              </Button>
            </article>
          );
        })}
      </section>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(hospitals.length / PAGE_SIZE))}
        onChange={(next) => {
          setPage(next);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
      />

      <section className="source-note">
        <h2>동물병원 정보 안내</h2>
        <p>동물병원 정보는 공공데이터를 기반으로 제공됩니다. 방문 전 운영 여부와 진료 가능 여부를 병원에 직접 확인해주세요.</p>
      </section>
    </main>
  );
}
