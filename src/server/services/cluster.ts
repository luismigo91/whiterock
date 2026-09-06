import Supercluster from "supercluster";
import type { MockProperty } from "@/lib/mockData";

export type ClusterFeature = {
  type: "Feature";
  properties: { cluster: boolean; cluster_id?: number; point_count?: number; price?: number; servicer?: string; id?: string };
  geometry: { type: "Point"; coordinates: [number, number] };
};

let index: Supercluster | null = null;

export function buildIndex(properties: MockProperty[]) {
  const points = properties.map((p) => ({
    type: "Feature" as const,
    properties: { price: p.price, servicer: p.servicer, id: p.id },
    geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] as [number, number] },
  }));
  index = new Supercluster({ radius: 60, maxZoom: 16 });
  index.load(points);
  return index;
}

export function getClusters(bbox: [number, number, number, number], zoom: number): ClusterFeature[] {
  if (!index) return [];
  return index.getClusters(bbox, zoom) as ClusterFeature[];
}

export function getLeaves(clusterId: number, limit = 10, offset = 0) {
  if (!index) return [];
  return index.getLeaves(clusterId, limit, offset);
}
