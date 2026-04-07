import { useEffect, useRef } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapLibreMap,
  type Marker,
  type Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { Place, PlaceTag, SearchCenter, VenueCategory } from "../types";

const maptilerStyleUrl =
  "https://api.maptiler.com/maps/019d5416-0d77-78fe-81fd-6294e4529535/style.json?key=mK0X0kOgNXHBP5rR1pu9";

const searchAreaSourceId = "search-area";
const placesSourceId = "places";
const selectedPinImageUrl = `${import.meta.env.BASE_URL}map-markers/selected-pin.png`;
const defaultMapPitch = 18;
const defaultMapBearing = 0;
const defaultMapZoom = 14.6;
const mapViewportPadding = 28;
const selectedPinDisplaySize = 48;
const selectedPopupGap = 4;
const selectedPopupOffset = {
  top: [0, selectedPopupGap] as [number, number],
  bottom: [0, -(selectedPinDisplaySize + selectedPopupGap)] as [number, number],
};
const selectedFlyToOffset = [0, selectedPinDisplaySize] as [number, number];

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

function boundsFromCenter(center: SearchCenter): [[number, number], [number, number]] {
  const radiusMeters = center.radiusMeters ?? 900;
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos(toRadians(center.latitude)));

  return [
    [center.longitude - lngDelta, center.latitude - latDelta],
    [center.longitude + lngDelta, center.latitude + latDelta],
  ];
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
    coffee_stand: "コーヒースタンド",
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

function placeCollection(places: Place[], selectedPlaceId: string | null): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: places
      .filter((place) => place.id !== selectedPlaceId)
      .map((place) =>
        pointFeature(place.longitude, place.latitude, {
          placeId: place.id,
          name: place.name,
          address: place.address,
          category: place.category,
          tagLabels:
            place.matchedTags && place.matchedTags.length > 0
              ? place.matchedTags.map((tag) => tagLabel(tag)).join("|")
              : place.tags
                  .slice(0, 3)
                  .map((tag) => tagLabel(tag))
                  .join("|"),
          spatialReason: place.spatialReason ?? "",
        }),
      ),
  };
}

function popupHtml(place: Place, popupTagLabels: string[]): string {
  return `
    <div style="min-width:220px">
      <div style="display:inline-flex;border:1px solid #d8c4b0;background:#f3e7d8;color:#5b3a26;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;margin-bottom:10px">
        ${escapeHtml(categoryLabel(place.category))}
      </div>
      <div style="font-weight:700;color:#111827;margin-bottom:8px;font-size:18px;line-height:1.4">${escapeHtml(place.name)}</div>
      ${
        popupTagLabels.length > 0
          ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${popupTagLabels
              .map(
                (label) =>
                  `<span style="display:inline-flex;align-items:center;border:1px solid #d6d3d1;background:#f5f5f4;color:#44403c;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:600;line-height:1.15">${escapeHtml(String(label))}</span>`,
              )
              .join("")}</div>`
          : ""
      }
      <div style="margin-top:8px;font-size:12px;line-height:1.5;color:#0f766e;font-weight:600">${escapeHtml(place.spatialReason ?? "")}</div>
    </div>
  `;
}

function createSelectedMarkerElement(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "jiyugaoka-selected-marker";
  wrapper.style.width = `${selectedPinDisplaySize}px`;
  wrapper.style.height = `${selectedPinDisplaySize}px`;
  wrapper.style.pointerEvents = "auto";

  const image = document.createElement("img");
  image.src = selectedPinImageUrl;
  image.alt = "";
  image.width = selectedPinDisplaySize;
  image.height = selectedPinDisplaySize;
  image.draggable = false;
  image.style.width = `${selectedPinDisplaySize}px`;
  image.style.height = `${selectedPinDisplaySize}px`;
  image.style.display = "block";
  image.style.pointerEvents = "none";

  wrapper.append(image);
  return wrapper;
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
  const selectedMarkerRef = useRef<Marker | null>(null);
  const popupPlaceIdRef = useRef<string | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  function openPlacePopup(place: Place, coordinates: [number, number]) {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const prioritizedTags = place.matchedTags && place.matchedTags.length > 0 ? place.matchedTags : [];
    const supplementalTags = place.tags.filter((tag) => !prioritizedTags.includes(tag));
    const popupTagLabels = [...prioritizedTags, ...supplementalTags]
      .map((tag) => tagLabel(tag));

    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: "bottom",
      offset: selectedPopupOffset.bottom,
      className: "jiyugaoka-map-popup",
    })
      .setLngLat(coordinates)
      .setHTML(popupHtml(place, popupTagLabels))
      .addTo(map);

    popupPlaceIdRef.current = place.id;
    popupRef.current.on("close", () => {
      popupPlaceIdRef.current = null;
    });
  }

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

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

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
          "fill-color": "#c8a27d",
          "fill-opacity": 0.12,
        },
      });
      map.addLayer({
        id: "search-area-outline",
        type: "line",
        source: searchAreaSourceId,
        paint: {
          "line-width": 2,
          "line-opacity": 0,
        },
      });

      map.addSource(placesSourceId, {
        type: "geojson",
        data: placeCollection(places, selectedPlaceId),
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

        const place = places.find((candidate) => candidate.id === placeId);
        if (!place) {
          return;
        }

        const coordinates = (feature.geometry as Point).coordinates as [number, number];
        openPlacePopup(place, coordinates);
      });

      map.on("click", (event) => {
        const hitPlace = map.queryRenderedFeatures(event.point, {
          layers: ["places-layer"],
        });
        if (hitPlace.length > 0) {
          return;
        }

        popupRef.current?.remove();
        popupRef.current = null;
        popupPlaceIdRef.current = null;
      });

      map.on("mouseenter", "places-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "places-layer", () => {
        map.getCanvas().style.cursor = "";
      });

      map.fitBounds(boundsFromCenter(center), {
        padding: mapViewportPadding,
        maxZoom: defaultMapZoom,
        duration: 0,
      });
    });

    mapRef.current = map;
    resizeObserverRef.current = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      selectedMarkerRef.current?.remove();
      popupRef.current?.remove();
      selectedMarkerRef.current = null;
      popupPlaceIdRef.current = null;
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
    (map.getSource(placesSourceId) as GeoJSONSource | undefined)?.setData(placeCollection(places, selectedPlaceId));
  }, [center, places, selectedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    if (!map) {
      return;
    }

    if (!selectedPlace) {
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      return;
    }

    selectedMarkerRef.current?.remove();
    const markerElement = createSelectedMarkerElement();
    markerElement.style.cursor = "pointer";
    markerElement.addEventListener("click", (event) => {
      event.stopPropagation();
      if (popupPlaceIdRef.current === selectedPlace.id) {
        popupRef.current?.remove();
        popupRef.current = null;
        popupPlaceIdRef.current = null;
        return;
      }

      openPlacePopup(selectedPlace, [selectedPlace.longitude, selectedPlace.latitude]);
    });

    selectedMarkerRef.current = new maplibregl.Marker({
      element: markerElement,
      anchor: "bottom",
    });

    selectedMarkerRef.current
      .setLngLat([selectedPlace.longitude, selectedPlace.latitude])
      .addTo(map);
  }, [places, selectedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    if (!map || !selectedPlace) {
      return;
    }

    if (popupPlaceIdRef.current && popupPlaceIdRef.current !== selectedPlace.id) {
      popupRef.current?.remove();
      popupRef.current = null;
      popupPlaceIdRef.current = null;
    }

    map.flyTo({
      center: [selectedPlace.longitude, selectedPlace.latitude],
      offset: selectedFlyToOffset,
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
    map.fitBounds(boundsFromCenter(center), {
      padding: mapViewportPadding,
      maxZoom: defaultMapZoom,
      duration: 700,
    });
  }, [center.latitude, center.longitude, resetToCenterKey]);

  return <div ref={containerRef} className="h-full min-h-0 w-full overflow-hidden" />;
}
