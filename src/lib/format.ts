export const formatPrice = (price: number | null | undefined) => {
  if (!price) {
    return "가격 확인 필요";
  }

  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
};

export const formatSignedPrice = (price: number) => {
  if (price === 0) {
    return "변동 없음";
  }

  const prefix = price > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("ko-KR").format(price)}원`;
};

export const formatCheckedAt = (value: string | null | undefined) => {
  if (!value) {
    return "확인 시각 없음";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "확인 시각 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};
