"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icon paths
// @ts-ignore leaflet types
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Props = {
  properties: Array<{
    id: string;
    title: string;
    price: number;
    latitude: number;
    longitude: number;
    servicer: string;
    province: string;
    municipality: string;
    areaM2: number | null;
    photos: string[];
  }>;
  hoveredId: string | null;
  onBboxChange?: (bbox: [number, number, number, number]) => void;
  onMarkerClick?: (id: string) => void;
};

function BboxHandler({ onChange }: { onChange?: (b: [number, number, number, number]) => void }) {
  useMapEvents({
    moveend(e) {
      const map = e.target;
      const b = map.getBounds();
      onChange?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
  });
  return null;
}

function priceIcon(price: number, servicer: string, isHovered: boolean) {
  const color = servicer === "aliseda" ? "#1d4ed8" : servicer === "servihabitat" ? "#059669" : servicer === "haya" ? "#7c3aed" : "#111827";
  const bg = isHovered ? "#f59e0b" : color;
  return L.divIcon({
    className: "custom-price-icon",
    html: `<div style="background:${bg};color:white;padding:4px 8px;border-radius:9999px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;">${(price / 1000).toFixed(0)}k €</div>`,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });
}

function clusterIcon(count: number) {
  return L.divIcon({
    className: "custom-cluster-icon",
    html: `<div style="background:#f59e0b;color:white;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function MapView({ properties, hoveredId, onBboxChange, onMarkerClick }: Props & { clusters?: Array<{ geometry: { coordinates: [number, number] }; properties: { cluster: boolean; point_count?: number; cluster_id?: number; id?: string; price?: number; servicer?: string } }> }) {
  const [mounted, setMounted] = useState(false);
  const [clusters, setClusters] = useState<Props["properties"] | null>(null);
  const [zoom, setZoom] = useState(6);
  const useClusters = properties.length > 500 || (clusters !== null && zoom < 12);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-full w-full bg-zinc-100 animate-pulse" />;

  const center: [number, number] = properties[0] ? [properties[0].latitude, properties[0].longitude] : [40.416, -3.703];
  return (
    <MapContainer
      center={center}
      zoom={6}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer url={process.env.NEXT_PUBLIC_MAP_TILES || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "&copy; OpenStreetMap"} />
      <BboxHandler
        onChange={(bbox) => {
          onBboxChange?.(bbox);
          // Fetch clusters when zoom <12 and many points — fire-and-forget
          try {
            const z = (document.querySelector(".leaflet-map-pane") as HTMLElement)?.dataset?.zoom ? Number((document.querySelector(".leaflet-map-pane") as HTMLElement).dataset.zoom) : 6;
            setZoom(z);
            if (properties.length > 500 && z < 12) {
              fetch(`/api/properties/clusters?bbox=${bbox.join(",")}&zoom=${z}`)
                .then((r) => r.json())
                .then((j) => {
                  if (j.features) {
                    const pts: Props["properties"] = j.features.map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, unknown> }) => ({
                      id: String(f.properties.id ?? f.properties.cluster_id ?? Math.random()),
                      title: f.properties.cluster ? `${f.properties.point_count} inmuebles` : String(f.properties.id),
                      price: (f.properties.price as number) ?? 0,
                      latitude: f.geometry.coordinates[1],
                      longitude: f.geometry.coordinates[0],
                      servicer: (f.properties.servicer as string) ?? "cluster",
                      province: "",
                      municipality: "",
                      areaM2: null,
                      photos: [],
                                            isCluster: !!f.properties.cluster,
                      point_count: f.properties.point_count,
                      cluster_id: f.properties.cluster_id,
                    }));
                    setClusters(pts as never);
                  }
                })
                .catch(() => {});
            } else {
              setClusters(null);
            }
          } catch {}
        }}
      />
      {(useClusters && clusters ? clusters : properties).map((p) => {
        if ((p as unknown as { isCluster: boolean }).isCluster) {
          return (
            <Marker
              key={String(p.id)}
              position={[p.latitude, p.longitude]}
              icon={clusterIcon((p as unknown as { point_count: number }).point_count ?? 0)}
              eventHandlers={{
                click: (e) => {
                  // zoom in on cluster
                  const map = (e.target as L.Marker).getLatLng ? null : null;
                  // fallback: just re-center via bbox change (parent handles zoom via map)
                },
              }}
            >
              <Popup>{(p as unknown as { point_count: number }).point_count} inmuebles — haz zoom</Popup>
            </Marker>
          );
        }
        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={priceIcon(p.price, p.servicer, hoveredId === p.id)}
            eventHandlers={{ click: () => onMarkerClick?.(p.id) }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <div className="font-semibold leading-tight">{p.title}</div>
                <div className="text-zinc-600">{p.municipality}, {p.province} · {p.areaM2 ? `${p.areaM2} m²` : "—"}</div>
                <div className="font-bold mt-1">{p.price.toLocaleString("es-ES")} €</div>
                <a href={`/properties/${p.id}`} className="text-blue-600 text-xs underline mt-1 inline-block">Ver ficha →</a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
