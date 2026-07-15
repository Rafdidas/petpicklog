import type { ExternalProduct } from "@/types/product";

export function findMatchingProduct(candidates: ExternalProduct[], externalId: string): ExternalProduct | null {
  return candidates.find((candidate) => candidate.externalId === externalId) ?? null;
}
