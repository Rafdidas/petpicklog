import type { Metadata } from "next";
import SavedProductsClient from "./saved-products-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function SavedProductsPage() {
  return <SavedProductsClient />;
}
