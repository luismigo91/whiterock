import { notFound } from "next/navigation";
import Link from "next/link";
import { getPropertyById } from "@/server/repositories/property";
import CopyLinkButton from "@/components/property/CopyLinkButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPropertyById(id);
  if (!p) return { title: "No encontrado — Whiterock" };
  return {
    title: `${p.title} — ${p.price.toLocaleString("es-ES")} € — Whiterock`,
    description: p.description.slice(0, 160),
    openGraph: {
      title: `${p.title} — ${p.price.toLocaleString("es-ES")} €`,
      description: `${p.municipality}, ${p.province} · ${p.areaM2 ?? "—"} m²`,
      images: p.photos[0] ? [p.photos[0]] : [],
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPropertyById(id);
  if (!p) notFound();

  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const canonical = `/properties/${p.id}/${slug}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">← Volver al mapa</Link>

      <div className="mt-4 bg-white rounded-2xl border overflow-hidden">
        {/* Galería */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 bg-zinc-100">
          <div className="lg:col-span-2 h-[420px] bg-white rounded-xl overflow-hidden">
            {p.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/image?url=${encodeURIComponent(p.photos[0])}`} alt={p.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-zinc-400">Sin imágenes</div>
            )}
          </div>
          <div className="hidden lg:grid grid-rows-2 gap-2 h-[420px]">
            {[1, 2].map((i) =>
              p.photos[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={`/api/image?url=${encodeURIComponent(p.photos[i])}`} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div key={i} className="bg-white rounded-xl grid place-items-center text-zinc-400 text-sm">Sin imagen</div>
              )
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-black text-white text-xs font-semibold capitalize">{p.servicer}</span>
                <span className="px-2.5 py-1 rounded-full border text-xs capitalize">{p.propertyType.replace("_", " ")}</span>
                <span className="px-2.5 py-1 rounded-full border text-xs capitalize">{p.status}</span>
                {p.approximateLocation && <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs border border-amber-200">Ubicación aproximada</span>}
              </div>
              <h1 className="text-2xl font-bold mt-3">{p.title}</h1>
              <p className="text-zinc-600">{p.addressNormalized || p.addressRaw} · {p.municipality}, {p.province} {p.postalCode}</p>
              <div className="flex items-baseline gap-3 mt-2">
                <div className="text-3xl font-bold">{p.price.toLocaleString("es-ES")} €</div>
                {(p as unknown as { pricePerM2: number | null }).pricePerM2 ? <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">{Math.round((p as unknown as { pricePerM2: number }).pricePerM2).toLocaleString("es-ES")} €/m²</span> : null}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Actualizado {new Date(p.lastSeenAt).toLocaleString("es-ES")} · Ref {p.externalId}</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-50 rounded-xl p-3 text-center border">
                <div className="text-xs text-zinc-500">Superficie</div>
                <div className="font-bold">{p.areaM2 ? `${p.areaM2} m²` : "No disponible"}</div>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center border">
                <div className="text-xs text-zinc-500">Habitaciones</div>
                <div className="font-bold">{p.rooms ?? "No disponible"}</div>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center border">
                <div className="text-xs text-zinc-500">Baños</div>
                <div className="font-bold">{p.bathrooms ?? "No disponible"}</div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Características</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Año: <span className="font-medium">{p.yearBuilt ?? "No disponible"}</span></div>
                <div>Cert. energético: <span className="font-medium">{p.energyCert ?? "No disponible"}</span></div>
                <div>Provincia: <span className="font-medium">{p.province || "No disponible"}</span></div>
                <div>Municipio: <span className="font-medium">{p.municipality || "No disponible"}</span></div>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-2">Descripción</h2>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{p.description || "Sin descripción."}</p>
            </div>
          </div>

          <div className="space-y-4">
            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-black text-white rounded-xl py-3 font-semibold hover:bg-zinc-800">
              Ver en {p.servicer} →
            </a>
            <CopyLinkButton />
            <div className="text-xs text-zinc-500 break-all">URL canónica: {canonical}</div>

            {/* Mini mapa placeholder */}
            <div className="rounded-xl border overflow-hidden">
              <div className="h-48 bg-zinc-100 grid place-items-center text-sm text-zinc-500 relative">
                <div>Mapa: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</div>
                {p.approximateLocation && <div className="absolute bottom-2 left-2 right-2 bg-amber-100 border border-amber-200 text-amber-800 text-xs rounded-lg px-2 py-1 text-center">Ubicación aproximada</div>}
              </div>
              <div className="p-3 text-xs text-zinc-600">
                Confianza geocoding: <span className="font-medium capitalize">{p.geocodeConfidence}</span>
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              Fuente: <a href={p.sourceUrl} target="_blank" className="underline">{p.sourceUrl}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
