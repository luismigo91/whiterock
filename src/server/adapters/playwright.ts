export async function fetchWithPlaywright(url: string): Promise<string> {
  // Lazy import to avoid loading playwright when not needed
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: "Whiterock/1.0" });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Wait for listings or timeout
    await page.waitForTimeout(1500);
    const html = await page.content();
    await browser.close();
    if (html.includes("captcha") || html.includes("cf-challenge")) throw new Error("WAF captcha");
    return html;
  } catch (e) {
    console.warn("[playwright] fallback failed", e);
    return "";
  }
}

export function isWafBlocked(status: number, body: string): boolean {
  return status === 403 || body.includes("captcha") || body.includes("cf-challenge") || body.includes("Attention Required");
}
