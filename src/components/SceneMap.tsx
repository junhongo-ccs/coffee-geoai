import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { Place, PlaceTag, SearchCenter, VenueCategory } from "../types";

const maptilerStyleUrl =
  "https://api.maptiler.com/maps/019d5416-0d77-78fe-81fd-6294e4529535/style.json?key=mK0X0kOgNXHBP5rR1pu9";

const searchAreaSourceId = "search-area";
const centerSourceId = "search-center";
const placesSourceId = "places";
const selectedPlaceSourceId = "selected-place";
const defaultMapPitch = 18;
const defaultMapBearing = -8;
const defaultMapZoom = 15.2;

type SceneMapProps = {
  center: SearchCenter;
  places: Place[];
  selectedPlaceId: string | null;
  resetToCenterKey: number;
  onSelectPlace: (placeId: string) => void;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function pointFeature(longitude: number, latitude: number, properties: Record<string, unknown> = {}): Feature<Point> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    properties,
  };
}

function circlePolygon(center: SearchCenter): Feature<Polygon> {
  const radiusMeters = center.radiusMeters ?? 1400;
  const latitude = toRadians(center.latitude);
  const longitude = toRadians(center.longitude);
  const earthRadius = 6371000;
  const coordinates: [number, number][] = [];

  for (let step = 0; step <= 64; step += 1) {
    const bearing = (2 * Math.PI * step) / 64;
    const angularDistance = radiusMeters / earthRadius;
    const lat = Math.asin(
      Math.sin(latitude) * Math.cos(angularDistance) +
        Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lon =
      longitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
        Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(lat),
      );

    coordinates.push([toDegrees(lon), toDegrees(lat)]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
    properties: {},
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function categoryLabel(category: VenueCategory): string {
  if (category === "both") {
    return "CAFE + BEANS";
  }

  if (category === "coffee_stand") {
    return "COFFEE STAND";
  }

  if (category === "bean_store") {
    return "BEAN STORE";
  }

  return "COFFEE SHOP";
}

function tagLabel(tag: PlaceTag): string {
  const labels: Record<PlaceTag, string> = {
    quiet: "静か",
    cozy: "居心地",
    atmosphere: "雰囲気",
    study: "作業向き",
    specialty: "スペシャルティ",
    roastery: "ロースター",
    kissaten: "喫茶店",
    chain: "チェーン",
    beans_only: "豆専門",
    spacious: "広さ",
    sweet: "スイーツ",
    morning: "朝向き",
    terrace: "テラス",
  };

  return labels[tag];
}

function placeCollection(places: Place[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: places.map((place) =>
      pointFeature(place.longitude, place.latitude, {
        placeId: place.id,
        name: place.name,
        address: place.address,
        category: place.category,
        tagLabels: place.tags.slice(0, 3).map((tag) => tagLabel(tag)).join(" / "),
        description: place.description,
        spatialReason: place.spatialReason ?? "",
      }),
    ),
  };
}

function selectedPlaceCollection(places: Place[], selectedPlaceId: string | null): FeatureCollection<Point> {
  const selectedPlace = places.find((place) => place.id === selectedPlaceId);

  return {
    type: "FeatureCollection",
    features: selectedPlace
      ? [
          pointFeature(selectedPlace.longitude, selectedPlace.latitude, {
            placeId: selectedPlace.id,
          }),
        ]
      : [],
  };
}

export default function SceneMap({
  center,
  places,
  selectedPlaceId,
  resetToCenterKey,
  onSelectPlace,
}: SceneMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: maptilerStyleUrl,
      center: [center.longitude, center.latitude],
      zoom: defaultMapZoom,
      pitch: defaultMapPitch,
      bearing: defaultMapBearing,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    map.on("load", () => {
      map.addSource(searchAreaSourceId, {
        type: "geojson",
        data: circlePolygon(center),
      });
      map.addLayer({
        id: "search-area-fill",
        type: "fill",
        source: searchAreaSourceId,
        paint: {
          "fill-color": "#0f766e",
          "fill-opacity": 0.08,
        },
      });
      map.addLayer({
        id: "search-area-outline",
        type: "line",
        source: searchAreaSourceId,
        paint: {
          "line-color": "#0f766e",
          "line-width": 2,
          "line-opacity": 0.45,
        },
      });

      map.addSource(centerSourceId, {
        type: "geojson",
        data: pointFeature(center.longitude, center.latitude),
      });
      map.addLayer({
        id: "search-center-layer",
        type: "circle",
        source: centerSourceId,
        paint: {
          "circle-radius": 7,
          "circle-color": "#0f766e",
          "circle-stroke-color": "#f0fdfa",
          "circle-stroke-width": 3,
        },
      });

      map.addSource(placesSourceId, {
        type: "geojson",
        data: placeCollection(places),
      });
      map.addLayer({
        id: "places-layer",
        type: "circle",
        source: placesSourceId,
        paint: {
          "circle-radius": 9,
          "circle-color": "#996947",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.addSource(selectedPlaceSourceId, {
        type: "geojson",
        data: selectedPlaceCollection(places, selectedPlaceId),
      });
      map.addLayer({
        id: "selected-place-layer",
        type: "circle",
        source: selectedPlaceSourceId,
        paint: {
          "circle-radius": 9,
          "circle-color": "#f97316",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });

      map.on("click", "places-layer", (event) => {
        const feature = event.features?.[0];
        if (!feature) {
          return;
        }

        const properties = feature.properties ?? {};
        const placeId = properties.placeId;

        if (typeof placeId !== "string") {
          return;
        }

        onSelectPlace(placeId);

        const coordinates = (feature.geometry as Point).coordinates as [number, number];
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          offset: 14,
          className: "jiyugaoka-map-popup",
        })
          .setLngLat(coordinates)
          .setHTML(
            `
              <div style="min-width:220px">
                <div style="display:inline-flex;border:1px solid #d8c4b0;background:#f3e7d8;color:#5b3a26;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;margin-bottom:10px">
                  ${escapeHtml(categoryLabel((properties.category as VenueCategory | undefined) ?? "coffee_shop"))}
                </div>
                <div style="font-weight:700;color:#111827;margin-bottom:8px;font-size:18px;line-height:1.4">${escapeHtml(String(properties.name ?? ""))}</div>
                <div style="font-size:12px;line-height:1.7;color:#57534e">${escapeHtml(String(properties.address ?? ""))}</div>
                ${
                  properties.tagLabels
                    ? `<div style="margin-top:10px;font-size:12px;line-height:1.6;color:#57534e">${escapeHtml(String(properties.tagLabels))}</div>`
                    : ""
                }
                <div style="margin-top:10px;font-size:12px;line-height:1.6;color:#57534e">${escapeHtml(String(properties.description ?? ""))}</div>
                <div style="margin-top:10px;font-size:12px;line-height:1.6;color:#0f766e;font-weight:600">${escapeHtml(String(properties.spatialReason ?? ""))}</div>
              </div>
            `,
          )
          .addTo(map);
      });

      map.on("mouseenter", "places-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "places-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;
    resizeObserverRef.current = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      resizeObserverRef.current = null;
    };
  }, [center.latitude, center.longitude, center.radiusMeters, onSelectPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    (map.getSource(searchAreaSourceId) as GeoJSONSource | undefined)?.setData(circlePolygon(center));
    (map.getSource(centerSourceId) as GeoJSONSource | undefined)?.setData(
      pointFeature(center.longitude, center.latitude),
    );
    (map.getSource(placesSourceId) as GeoJSONSource | undefined)?.setData(placeCollection(places));
    (map.getSource(selectedPlaceSourceId) as GeoJSONSource | undefined)?.setData(
      selectedPlaceCollection(places, selectedPlaceId),
    );
  }, [center, places, selectedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    if (!map || !selectedPlace) {
      return;
    }

    map.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      zoom: Math.max(map.getZoom(), 16.6),
      pitch: defaultMapPitch,
      bearing: defaultMapBearing,
      essential: true,
      duration: 700,
    });
  }, [places, selectedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    popupRef.current?.remove();
    map.flyTo({
      center: [center.longitude, center.latitude],
      zoom: defaultMapZoom,
      pitch: defaultMapPitch,
      bearing: defaultMapBearing,
      essential: true,
      duration: 700,
    });
  }, [center.latitude, center.longitude, resetToCenterKey]);

  return <div ref={containerRef} className="h-full min-h-[440px] w-full overflow-hidden" />;
}
