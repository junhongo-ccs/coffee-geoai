import { useEffect, useRef } from "react";
import Basemap from "@arcgis/core/Basemap";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import OpenStreetMapLayer from "@arcgis/core/layers/OpenStreetMapLayer";
import Map from "@arcgis/core/Map";
import SceneView from "@arcgis/core/views/SceneView";
import type { Place, SearchCenter } from "../types";

type SceneMapProps = {
  center: SearchCenter;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export default function SceneMap({
  center,
  places,
  selectedPlaceId,
  onSelectPlace,
}: SceneMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<SceneView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const graphicsLayer = new GraphicsLayer();
    const map = new Map({
      basemap: new Basemap({
        baseLayers: [new OpenStreetMapLayer()],
      }),
      layers: [graphicsLayer],
    });

    const view = new SceneView({
      container: containerRef.current,
      map,
      viewingMode: "local",
      camera: {
        position: {
          latitude: center.latitude,
          longitude: center.longitude,
          z: 1800,
        },
        tilt: 62,
        heading: 20,
      },
      environment: {
        atmosphereEnabled: true,
        starsEnabled: false,
      },
      qualityProfile: "low",
    });

    view.on("click", async (event) => {
      const hit = await view.hitTest(event);
      const match = hit.results.find(
        (result) => "graphic" in result && result.graphic?.attributes?.placeId,
      );

      const placeId =
        match && "graphic" in match
          ? (match.graphic.attributes?.placeId as string | undefined)
          : undefined;
      if (placeId) {
        onSelectPlace(placeId);
      }
    });

    graphicsLayerRef.current = graphicsLayer;
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      graphicsLayerRef.current = null;
    };
  }, [center.latitude, center.longitude, onSelectPlace]);

  useEffect(() => {
    const graphicsLayer = graphicsLayerRef.current;
    if (!graphicsLayer) {
      return;
    }

    graphicsLayer.removeAll();

    const centerGraphic = new Graphic({
      geometry: new Point({
        latitude: center.latitude,
        longitude: center.longitude,
      }),
      symbol: {
        type: "point-3d",
        symbolLayers: [
          {
            type: "icon",
            resource: { primitive: "circle" },
            size: 14,
            material: { color: "#0f766e" },
            outline: { color: "#f0fdfa", size: 1.5 },
          },
        ],
      },
    });

    graphicsLayer.add(centerGraphic);

    const placeGraphics = places.map(
      (place) =>
        new Graphic({
          geometry: new Point({
            latitude: place.latitude,
            longitude: place.longitude,
          }),
          attributes: {
            placeId: place.id,
            title: place.name,
          },
          popupTemplate: {
            title: place.name,
            content: `${place.address}<br/>${place.whyThisPlace?.join(" / ") ?? ""}`,
          },
          symbol: {
            type: "point-3d",
            symbolLayers: [
              {
                type: "icon",
                resource: { primitive: "circle" },
                size: selectedPlaceId === place.id ? 18 : 12,
                material: {
                  color: selectedPlaceId === place.id ? "#f97316" : "#111827",
                },
                outline: {
                  color: "#ffffff",
                  size: 1.5,
                },
              },
            ],
          },
        }),
    );

    graphicsLayer.addMany(placeGraphics);
  }, [center, places, selectedPlaceId]);

  useEffect(() => {
    const view = viewRef.current;
    const selectedPlace = places.find((place) => place.id === selectedPlaceId);

    if (!view || !selectedPlace) {
      return;
    }

    void view.goTo(
      new Point({
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        z: 1200,
      }),
      {
        duration: 1200,
      },
    );
  }, [places, selectedPlaceId]);

  return <div ref={containerRef} className="h-full min-h-[440px] w-full" />;
}
