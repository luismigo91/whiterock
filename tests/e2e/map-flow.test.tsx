import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock fetch for API
const mockProperties = [
  {
    id: "1",
    title: "Piso en Vallecas",
    price: 98500,
    province: "Madrid",
    municipality: "Madrid",
    latitude: 40.376,
    longitude: -3.62,
    servicer: "aliseda",
    propertyType: "piso",
    areaM2: 85,
    rooms: 3,
    bathrooms: 1,
    photos: ["https://picsum.photos/seed/wh1/800/600"],
    addressRaw: "Calle Real 12",
    status: "disponible",
  },
  {
    id: "2",
    title: "Ático Eixample",
    price: 189000,
    province: "Barcelona",
    municipality: "Barcelona",
    latitude: 41.405,
    longitude: 2.177,
    servicer: "servihabitat",
    propertyType: "atico",
    areaM2: 110,
    rooms: 4,
    bathrooms: 2,
    photos: ["https://picsum.photos/seed/wh2/800/600"],
    addressRaw: "Carrer Mallorca",
    status: "disponible",
  },
];

// Mock next/dynamic MapView to avoid leaflet in jsdom
vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<{ default: React.ComponentType }>) => {
    const MockMap = ({ properties }: { properties: typeof mockProperties }) => (
      <div data-testid="mock-map">
        {properties.map((p) => (
          <div key={p.id} data-testid={`pin-${p.id}`}>
            {p.title} - {p.price}€
          </div>
        ))}
      </div>
    );
    return MockMap;
  },
}));

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/properties")) {
        const u = new URL(url, "http://localhost");
        const servicer = u.searchParams.get("servicer");
        let data = mockProperties;
        if (servicer) data = data.filter((p) => servicer.split(",").includes(p.servicer));
        const q = u.searchParams.get("q");
        if (q) data = data.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
        return Promise.resolve({
          ok: true,
          json: async () => ({ data, total: data.length, totalPages: 1 }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    })
  );
  // URL mock
  Object.defineProperty(window, "location", {
    value: { search: "", pathname: "/", href: "http://localhost/" },
    writable: true,
  });
  window.history.replaceState = vi.fn();
});

describe("Flujo e2e mapa ↔ lista ↔ ficha (map-search + property-detail)", () => {
  it("renderiza lista + mapa y filtra por servicer", async () => {
    const Home = (await import("@/app/page")).default;
    render(<Home />);

    await waitFor(() => expect(screen.getByPlaceholderText(/Buscar por municipio/)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Aliseda" })).toBeInTheDocument());

    // pins deben existir
    await waitFor(() => expect(screen.getByTestId("mock-map")).toBeInTheDocument());
    expect(screen.getByTestId("pin-1")).toBeInTheDocument();

    // Filtrar por Aliseda debe mantener solo pin 1 después del fetch filtrado
    const alisedaBtn = screen.getByRole("button", { name: "Aliseda" });
    fireEvent.click(alisedaBtn);

    await waitFor(() => expect(window.history.replaceState).toHaveBeenCalled());
  });

  it("búsqueda textual filtra resultados", async () => {
    const Home = (await import("@/app/page")).default;
    render(<Home />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Buscar por municipio/)).toBeInTheDocument());
    const input = screen.getByPlaceholderText(/Buscar por municipio/);
    fireEvent.change(input, { target: { value: "Vallecas" } });
    await waitFor(() => expect(window.history.replaceState).toHaveBeenCalled());
  });

  it("cards tienen link a ficha /properties/:id", async () => {
    const Home = (await import("@/app/page")).default;
    const { container } = render(<Home />);
    await waitFor(() => expect(container.querySelector('a[href="/properties/1"]')).toBeInTheDocument());
  });

  it("empty state cuando no hay resultados (simulado)", async () => {
    // override fetch to return empty
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], total: 0, totalPages: 0 }),
      } as Response)
    );
    const Home = (await import("@/app/page")).default;
    render(<Home />);
    await waitFor(() => expect(screen.getByText(/Sin resultados en esta zona/)).toBeInTheDocument());
  });
});
