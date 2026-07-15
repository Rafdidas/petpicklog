import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { formatDropLabel } from "@/lib/price-stats";
import type { ProductPriceStats } from "@/lib/price-stats";

export default function PriceCard({ stats }: { stats: ProductPriceStats }) {
  const dropLabel = formatDropLabel(stats.dropPct);

  return (
    <Link className="price-card" href={`/catalog/${stats.externalProductId}`}>
      {stats.imageUrl ? (
        <Image src={stats.imageUrl} alt="" width={240} height={180} />
      ) : (
        <div className="price-card__image" />
      )}
      <div className="price-card__body">
        {dropLabel ? <strong className="price-card__drop">{dropLabel}</strong> : null}
        <span className="price-card__name line-clamp-2">{stats.title}</span>
        <em className="price-card__price">{formatPrice(stats.currentPrice)}</em>
        <small className="price-card__meta">{stats.mallName ?? "쇼핑몰 확인 필요"}</small>
      </div>
    </Link>
  );
}
