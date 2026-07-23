import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Typography from "@/components/ui/Typography";
import { categories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { formatDropLabel } from "@/lib/price-stats";
import type { ProductPriceStats } from "@/lib/price-stats";

export default function PriceCard({ stats }: { stats: ProductPriceStats }) {
  const dropLabel = formatDropLabel(stats.dropPct);
  const categoryLabel = categories.find((category) => category.slug === stats.categorySlug)?.label;

  return (
    <Link className="price-card" href={`/catalog/${stats.externalProductId}`}>
      <div className="price-card__media">
        {stats.imageUrl ? (
          <Image src={stats.imageUrl} alt="" width={240} height={180} />
        ) : (
          <span className="price-card__placeholder">상품 이미지</span>
        )}
        {dropLabel ? (
          <span className="price-card__drop">
            <Badge variant="drop">{dropLabel}</Badge>
          </span>
        ) : null}
      </div>
      {categoryLabel ? <Badge variant="category">{categoryLabel}</Badge> : null}
      <Typography type="body" size="md" className="price-card__name line-clamp-2">{stats.title}</Typography>
      <div className="price-card__foot">
        <Typography as="em" type="title" size="md" className="price-card__price">{formatPrice(stats.currentPrice)}</Typography>
        <Typography as="small" type="caption" size="lg" className="price-card__meta">{stats.mallName ?? "쇼핑몰 확인 필요"}</Typography>
      </div>
    </Link>
  );
}
