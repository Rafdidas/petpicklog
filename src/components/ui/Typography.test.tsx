import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Typography from "./Typography";

describe("Typography", () => {
  it("renders a span with deterministic role and size classes", () => {
    const html = renderToStaticMarkup(
      <Typography type="bodyBold" size="xl">타이포그래피</Typography>,
    );

    expect(html).toBe(
      '<span class="ui-typography ui-typography--body-bold ui-typography--xl">타이포그래피</span>',
    );
  });

  it("preserves a semantic element, custom class, and native attributes", () => {
    const html = renderToStaticMarkup(
      <Typography
        as="a"
        type="label"
        size="md"
        className="product-link"
        href="/catalog"
        aria-label="카탈로그 열기"
      >
        카탈로그
      </Typography>,
    );

    expect(html).toContain("<a");
    expect(html).toContain('href="/catalog"');
    expect(html).toContain('aria-label="카탈로그 열기"');
    expect(html).toContain(
      'class="ui-typography ui-typography--label ui-typography--md product-link"',
    );
  });

  it("renders representative valid role and size pairs", () => {
    const html = renderToStaticMarkup(
      <>
        <Typography type="display" size="xs">디스플레이</Typography>
        <Typography type="headline" size="md">헤드라인</Typography>
        <Typography type="title" size="lg">타이틀</Typography>
        <Typography type="body" size="sm">본문</Typography>
        <Typography type="caption" size="sm">캡션</Typography>
      </>,
    );

    expect(html).toContain("ui-typography--display ui-typography--xs");
    expect(html).toContain("ui-typography--headline ui-typography--md");
    expect(html).toContain("ui-typography--title ui-typography--lg");
    expect(html).toContain("ui-typography--body ui-typography--sm");
    expect(html).toContain("ui-typography--caption ui-typography--sm");
  });
});
