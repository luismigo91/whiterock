"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
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

type Bbox = [number, number, number, number];

type MapItem = {
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
  isCluster?: boolean;
  point_count?: number;
  cluster_id?: number;
};

type Props = {
  properties: MapItem[];
  /** Total de resultados en el servidor (puede ser mayor que properties.length por paginación). */
  total: number;
  hoveredId: string | null;
  onBboxChange?: (bbox: Bbox) => void;
  onMarkerClick?: (id: string) => void;
};

const CLUSTER_MIN_TOTAL = 500;
const CLUSTER_MAX_ZOOM = 12;

function MapEvents({ onBbox, onZoom }: { onBbox?: (b: Bbox) => void; onZoom?: (z: number) => void }) {
  useMapEvents({
    moveend(e) {
      const b = e.target.getBounds();
      onBbox?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
    zoomend(e) {
      onZoom?.(e.target.getZoom());
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

function ClusterMarker({ item }: { item: MapItem }) {
  const map = useMap();
  const count = item.point_count ?? 0;
  return (
    <Marker
      position={[item.latitude, item.longitude]}
      icon={clusterIcon(count)}
      eventHandlers={{
        click: () => map.setView([item.latitude, item.longitude], Math.min(map.getZoom() + 2, 18)),
      }}
    >
      <Popup>{count} inmuebles — haz zoom para desagregar</Popup>
    </Marker>
  );
}

export default function MapView({ properties, total, hoveredId, onBboxChange, onMarkerClick }: Props) {
  const [mounted, setMounted] = useState(false);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [zoom, setZoom] = useState(6);
  const [clusters, setClusters] = useState<MapItem[] | null>(null);

  useEffect(() => setMounted(true), []);

  const wantClusters = total > CLUSTER_MIN_TOTAL && zoom < CLUSTER_MAX_ZOOM;

  useEffect(() => {
    if (!wantClusters || !bbox) {
      setClusters(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/properties/clusters?bbox=${bbox.join(",")}&zoom=${zoom}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.features) return;
        setClusters(
          j.features.map((f: { geometry: { coordinates: [number, number] }; properties: Record<string, unknown> }) => ({
            id: String(f.properties.id ?? `cluster-${f.properties.cluster_id}`),
            title: f.properties.cluster ? `${f.properties.point_count} inmuebles` : String(f.properties.id ?? ""),
            price: (f.properties.price as number) ?? 0,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            servicer: (f.properties.servicer as string) ?? "cluster",
            province: "",
            municipality: "",
            areaM2: null,
            photos: [],
            isCluster: !!f.properties.cluster,
            point_count: f.properties.point_count as number | undefined,
            cluster_id: f.properties.cluster_id as number | undefined,
          }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bbox, zoom, wantClusters]);

  if (!mounted) return <div className="h-full w-full bg-zinc-100 animate-pulse" />;

  const center: [number, number] = properties[0] ? [properties[0].latitude, properties[0].longitude] : [40.416, -3.703];
  const items = wantClusters && clusters ? clusters : properties;

  return (
    <MapContainer center={center} zoom={6} className="h-full w-full" scrollWheelZoom>
      <TileLayer url={process.env.NEXT_PUBLIC_MAP_TILES || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || "&copy; OpenStreetMap"} />
      <MapEvents
        onBbox={(b) => {
          setBbox(b);
          onBboxChange?.(b);
        }}
        onZoom={setZoom}
      />
      {items.map((p) =>
        p.isCluster ? (
          <ClusterMarker key={p.id} item={p} />
        ) : (
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
        )
      )}
    </MapContainer>
  );
}
