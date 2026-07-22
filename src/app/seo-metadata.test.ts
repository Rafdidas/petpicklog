import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import * as authPageModule from "./auth/page";
import * as catalogPageModule from "./catalog/page";
import * as guidePageModule from "./guide/page";
import * as hospitalsPageModule from "./hospitals/page";
import * as rootLayoutModule from "./layout";
import * as productDetailPageModule from "./products/[id]/page";
import * as productsPageModule from "./products/page";
import * as savedPageModule from "./saved/page";

type StaticMetadataModule = { metadata?: Metadata };
type DynamicMetadataModule = {
  generateMetadata?: (props: { params: Promise<{ id: string }> }) => Promise<Metadata>;
};

describe("public route canonical metadata", () => {
  const staticRoutes = [
    ["/catalog", catalogPageModule],
    ["/products", productsPageModule],
    ["/hospitals", hospitalsPageModule],
    ["/guide", guidePageModule]
  ] as const;

  it("does not define a root canonical that child routes can inherit", () => {
    const { metadata } = rootLayoutModule as StaticMetadataModule;

    expect(metadata?.alternates?.canonical).toBeUndefined();
  });

  it.each(staticRoutes)("defines a self-canonical URL for %s", (path, pageModule) => {
    const { metadata } = pageModule as StaticMetadataModule;

    expect(metadata?.alternates?.canonical).toBe(path);
  });

  it("defines a self-canonical URL for real-time product details", async () => {
    const { generateMetadata } = productDetailPageModule as DynamicMetadataModule;

    expect(generateMetadata).toBeTypeOf("function");
    const metadata = await generateMetadata?.({ params: Promise.resolve({ id: "product-123" }) });
    expect(metadata?.alternates?.canonical).toBe("/products/product-123");
  });
});

describe("private route robots metadata", () => {
  it.each([
    ["/auth", authPageModule],
    ["/saved", savedPageModule]
  ] as const)("marks %s as noindex", (_path, pageModule) => {
    const { metadata } = pageModule as StaticMetadataModule;

    expect(metadata?.robots).toMatchObject({ index: false, follow: false });
  });
});
