import { test, expect } from "@playwright/test";

test.describe("Whiterock e2e real (Playwright) — mapa → ficha", () => {
  test("carga home, muestra mapa y lista, filtros y navegación a ficha", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Whiterock")).toBeVisible();
    await expect(page.getByText(/Solo inmobiliarias de bancos/)).toBeVisible();

    // Lista carga
    await expect(page.getByPlaceholder("Buscar por municipio, provincia…")).toBeVisible();
    // Al menos 1 card
    await expect(page.locator('a[href^="/properties/"]').first()).toBeVisible({ timeout: 10000 });

    // Filtro servicer Aliseda debe actualizar URL
    const aliseda = page.getByRole("button", { name: "Aliseda" });
    await aliseda.click();
    await expect(page).toHaveURL(/servicer=aliseda/);

    // Reset
    await page.getByRole("button", { name: "Limpiar" }).click();
    await expect(page).not.toHaveURL(/servicer=/);

    // Q search
    const q = page.getByPlaceholder("Buscar por municipio, provincia…");
    await q.fill("Valencia");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/q=Valencia/);

    // Click primera card → ficha
    await q.fill("");
    await page.waitForTimeout(300);
    const firstCard = page.locator('a[href^="/properties/"]').first();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/\/properties\//);
    await firstCard.click();

    // Ficha
    await expect(page.getByText(/Volver al mapa/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver en/ })).toBeVisible();
    // API directa también
    const id = href!.split("/")[2];
    const apiRes = await page.request.get(`/api/properties/${id}`);
    expect(apiRes.ok()).toBeTruthy();
    const json = await apiRes.json();
    expect(json.id).toBe(id);
    expect(json).toHaveProperty("sourceUrl");
  });

  test("API bbox y paginación", async ({ request }) => {
    const r1 = await request.get("/api/properties?bbox=-0.5,39.3,-0.2,39.6&pageSize=10");
    expect(r1.ok()).toBeTruthy();
    const j1 = await r1.json();
    expect(j1.total).toBe(3);
    expect(r1.headers()["x-total-count"]).toBe(String(j1.total));

    const r2 = await request.get("/api/properties?page=999&pageSize=10");
    const j2 = await r2.json();
    expect(j2.data).toEqual([]);
    expect(j2.total).toBeGreaterThan(0);

    const r3 = await request.get("/api/servicers");
    const j3 = await r3.json();
    expect(j3.length).toBe(8);
    expect(j3[0]).toHaveProperty("totalListings");
  });

  test("empty state y deep-link", async ({ page }) => {
    // Deep-link con q que no existe -> empty state
    await page.goto("/?q=zzzz_no_existe_123");
    await expect(page.getByText(/Sin resultados en esta zona/)).toBeVisible({ timeout: 10000 });

    // API bbox vacío debe devolver 0 (UI bbox deep-link no soportado, se verifica vía API)
    const res = await page.request.get("/api/properties?bbox=10,10,11,11&pageSize=10");
    const json = await res.json();
    expect(json.total).toBe(0);
    expect(json.data).toEqual([]);
  });
});
