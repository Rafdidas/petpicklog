export const SITE_NAME = "펫픽";
export const SITE_DESCRIPTION = "반려동물 용품의 가격을 매일 기록하고, 급락 특가와 가격 추이를 확인하는 가격추적 서비스입니다.";
const fallbackSiteUrl = "http://localhost:3000";
export function getSiteUrl(rawUrl = process.env.NEXT_PUBLIC_SITE_URL): URL {
  return new URL(rawUrl?.trim() || fallbackSiteUrl);
}
export function getAbsoluteUrl(path: string, rawUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  return new URL(path, getSiteUrl(rawUrl)).toString();
}
