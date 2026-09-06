"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Filters, { FilterState } from "@/components/map/Filters";
import Link from "next/link";
import SignInButton from "@/components/auth/SignInButton";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

type Property = {
  id: string;
  title: string;
  price: number;
  province: string;
  municipality: string;
  latitude: number;
  longitude: number;
  servicer: string;
  propertyType: string;
  areaM2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  photos: string[];
  addressRaw: string;
  status: string;
};

function useUrlFilters(): [FilterState, (s: FilterState) => void, string] {
  const getInitial = (): FilterState => {
    if (typeof window === "undefined") return { q: "", servicer: [], propertyType: [], sort: "newest" };
    const p = new URLSearchParams(window.location.search);
    return {
      q: p.get("q") ?? "",
      priceMin: p.get("priceMin") ?? undefined,
      priceMax: p.get("priceMax") ?? undefined,
      areaMin: p.get("areaMin") ?? undefined,
      roomsMin: p.get("roomsMin") ?? undefined,
      servicer: p.get("servicer") ? p.get("servicer")!.split(",") : [],
      propertyType: p.get("propertyType") ? p.get("propertyType")!.split(",") : [],
      province: p.get("province") ?? undefined,
      sort: (p.get("sort") as never) ?? "newest",
    };
  };
  const [filters, setFilters] = useState<FilterState>(getInitial);
  const apply = useCallback((next: FilterState) => {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.priceMin) params.set("priceMin", next.priceMin);
    if (next.priceMax) params.set("priceMax", next.priceMax);
    if (next.areaMin) params.set("areaMin", next.areaMin);
    if (next.roomsMin) params.set("roomsMin", next.roomsMin);
    if (next.servicer.length) params.set("servicer", next.servicer.join(","));
    if (next.propertyType.length) params.set("propertyType", next.propertyType.join(","));
    if (next.sort !== "newest") params.set("sort", next.sort);
    const url = params.toString() ? `?${params}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, []);
  useEffect(() => setFilters(getInitial()), []);
  const qs = (() => {
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.priceMin) p.set("priceMin", filters.priceMin);
    if (filters.priceMax) p.set("priceMax", filters.priceMax);
    if (filters.areaMin) p.set("areaMin", filters.areaMin);
    if (filters.roomsMin) p.set("roomsMin", filters.roomsMin);
    if (filters.servicer.length) p.set("servicer", filters.servicer.join(","));
    if (filters.propertyType.length) p.set("propertyType", filters.propertyType.join(","));
    if (filters.sort !== "newest") p.set("sort", filters.sort);
    return p.toString();
  })();
  return [filters, apply, qs];
}

export default function HomePage() {
  const [filters, setFilters, qs] = useUrlFilters();
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"lista" | "mapa">("lista");
  const [alerts, setAlerts] = useState<Array<{ id: string }>>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(qs);
      if (bbox) params.set("bbox", bbox.join(","));
      params.set("pageSize", "50");
      const res = await fetch(`/api/properties?${params.toString()}`);
      const json = await res.json();
      setProperties(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [qs, bbox]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((j) => setAlerts(Array.isArray(j) ? j.filter((a: { isRead: boolean }) => !a.isRead) : []))
      .catch(() => {});
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((j) => {
        if (Array.isArray(j)) setFavorites(new Set(j.map((f: { propertyId: string; id: string }) => f.propertyId ?? f.id)));
      })
      .catch(() => {});
  }, []);

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isFav = favorites.has(id);
    if (isFav) {
      await fetch(`/api/favorites?propertyId=${id}`, { method: "DELETE" });
      setFavorites((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    } else {
      await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: id }) });
      setFavorites((prev) => new Set(prev).add(id));
    }
  };

  const saveSearch = async () => {
    const name = prompt("Nombre para esta búsqueda:", `Búsqueda ${filters.province ?? filters.q ?? "Whiterock"}`);
    if (!name) return;
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, filters }),
    });
    if (res.ok) alert("Búsqueda guardada. Te avisaremos si hay nuevas altas o bajadas >5%.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black text-white grid place-items-center font-bold text-sm">W</div>
            <div>
              <div className="font-bold leading-none">Whiterock</div>
              <div className="text-xs text-zinc-500">Solo inmobiliarias de bancos</div>
            </div>
            <span className="hidden sm:inline-flex ml-3 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
              Aliseda · Servihabitat · Haya · Altamira · Solvia · +3 más
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-sm text-zinc-600">{total} inmuebles</span>
            <Link href="/saved-searches" className="hidden sm:inline text-sm text-zinc-700 hover:underline">
              Mis búsquedas
            </Link>
            <Link href="/admin/ingest" className="hidden sm:inline text-xs border rounded-full px-2.5 py-1">
              Admin
            </Link>
            <SignInButton />
            <Link href="/saved-searches" className="relative p-2 rounded-full hover:bg-zinc-100">
              <span className="text-lg">🔔</span>
              {alerts.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 grid place-items-center rounded-full">{alerts.length}</span>}
            </Link>
            <a href="/api/health" className="text-xs text-zinc-400 hidden md:inline">health</a>
          </div>
        </div>
      </header>

      <div className="md:hidden sticky top-[57px] z-20 bg-white border-b px-4 py-2 flex gap-2">
        <button onClick={() => setMobileTab("lista")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${mobileTab === "lista" ? "bg-black text-white" : "bg-zinc-100"}`}>Lista ({total})</button>
        <button onClick={() => setMobileTab("mapa")} className={`flex-1 py-2 rounded-lg text-sm font-medium ${mobileTab === "mapa" ? "bg-black text-white" : "bg-zinc-100"}`}>Mapa</button>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row min-h-[calc(100vh-57px)]">
        <div className={`${mobileTab === "mapa" ? "hidden md:flex" : "flex"} w-full md:w-[420px] lg:w-[440px] flex-col border-r bg-zinc-50 overflow-hidden`}>
          <div className="p-4 space-y-3 overflow-auto">
            <Filters value={filters} onChange={setFilters} />
            <button onClick={saveSearch} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2 text-sm font-semibold">
              🔔 Alertar de esta búsqueda
            </button>
            <div className="text-xs text-zinc-500">
              {loading ? "Cargando…" : `${total} resultados${bbox ? " en el mapa visible" : ""}`}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 pb-4 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-3 animate-pulse">
                  <div className="h-32 bg-zinc-100 rounded-lg mb-3" />
                  <div className="h-4 bg-zinc-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-100 rounded w-1/2" />
                </div>
              ))
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-semibold">Sin resultados en esta zona</div>
                <p className="text-sm text-zinc-500 mt-1">Prueba a ampliar el mapa o relajar filtros.</p>
                {bbox && <button onClick={() => setBbox(null)} className="mt-3 text-sm text-blue-600 underline">Limpiar bbox</button>}
              </div>
            ) : (
              properties.map((p) => (
                <Link
                  href={`/properties/${p.id}`}
                  key={p.id}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`block bg-white rounded-xl border overflow-hidden hover:shadow-md transition ${hovered === p.id ? "ring-2 ring-amber-400" : ""}`}
                >
                  <div className="h-40 bg-zinc-100 relative overflow-hidden">
                    {p.photos[0] ? <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-zinc-400 text-sm">Sin imágenes</div>}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/80 text-white text-xs font-semibold capitalize">{p.servicer}</div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white text-zinc-900 text-xs font-bold">{p.price.toLocaleString("es-ES")} €</div>
                    <button onClick={(e) => toggleFav(p.id, e)} className={`absolute bottom-2 right-2 w-8 h-8 rounded-full grid place-items-center text-sm ${favorites.has(p.id) ? "bg-red-500 text-white" : "bg-white/90 text-zinc-600"}`}>
                      {favorites.has(p.id) ? "♥" : "♡"}
                    </button>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold leading-tight line-clamp-1">{p.title}</div>
                    <div className="text-xs text-zinc-500">{p.municipality}, {p.province} · {p.areaM2 ? `${p.areaM2} m²` : "—"} {p.rooms ? `· ${p.rooms} hab` : ""}</div>
                    <div className="text-xs text-zinc-600 mt-1 capitalize">{p.propertyType.replace("_", " ")} · {p.status}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className={`${mobileTab === "lista" ? "hidden md:block" : "block"} flex-1 relative min-h-[50vh] md:min-h-0`}>
          <div className="absolute inset-0">
            <MapView properties={properties} hoveredId={hovered} onBboxChange={setBbox} onMarkerClick={(id) => (window.location.href = `/properties/${id}`)} />
          </div>
          {bbox && (
            <button onClick={() => setBbox(null)} className="absolute top-3 left-3 z-[400] bg-white border rounded-full px-3 py-1.5 text-xs font-medium shadow">
              ✕ Quitar filtro mapa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
