"use client";

// RealMap — a proper interactive map, like Google Maps but free.
//
// Built with MapLibre GL (a free, open-source map engine) showing CARTO's
// dark map tiles, which are drawn from OpenStreetMap data and free to use
// with the attribution shown in the map's corner. No API key, no costs.
//
// What you can do with it:
//   - pinch with two fingers to zoom
//   - drag with two fingers to move around (two fingers so that one
//     finger can still scroll the page — same trick Google uses)
//   - twist with two fingers to rotate; tap the compass to reset north
//   - tap a pin to select that stop
//
// The numbered amber pins and the "H" hotel pin are the same ones from
// the list below the map.

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { HOTEL_KEY, type MapPlace } from "@/lib/map";

// The map's look: CARTO's "dark matter" tiles, which suit Atlas's dark
// theme. The attribution line is a condition of free use — never remove.
const DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

interface RealMapProps {
  hotel: { name: string; lat: number; lng: number };
  /** The unique places for the active day, in visiting order. */
  places: MapPlace[];
  selectedPlaceKey: string | null;
  onSelectPlace: (placeKey: string) => void;
}

export default function RealMap({
  hotel,
  places,
  selectedPlaceKey,
  onSelectPlace,
}: RealMapProps) {
  // The <div> the map draws into, the map itself, and the live pins.
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<
    { key: string; marker: MapLibreMarker; button: HTMLButtonElement }[]
  >([]);

  // Keep the latest select-handler in a ref so pin click handlers never
  // go stale between renders.
  const onSelectRef = useRef(onSelectPlace);
  onSelectRef.current = onSelectPlace;

  // ---- Create the map once, when the component first appears. ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [hotel.lng, hotel.lat],
      zoom: 13,
      attributionControl: { compact: true },
      // "Cooperative gestures": one finger scrolls the page, two fingers
      // move the map. Without this the map would trap every scroll.
      cooperativeGestures: true,
    });

    // The + / − / compass buttons in the corner. Tapping the compass
    // resets the rotation back to north-up.
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right"
    );

    // The map lives inside a tab that can be hidden. When the tab
    // reappears (size changes from 0 to real), tell the map to redraw.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // The hotel centre is only the STARTING view; day changes are handled
    // by the pin effect below, so this effect runs exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A trip with no hotel position yet stores 0,0 — that's the middle of
  // the Atlantic, so we simply leave the "H" pin off in that case.
  const hasHotelPosition = hotel.lat !== 0 || hotel.lng !== 0;

  // ---- (Re)place the pins whenever the day's places change. ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear the previous day's pins.
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    // A small factory: builds one tappable pin element.
    const addPin = (
      key: string,
      lat: number,
      lng: number,
      text: string,
      title: string,
      isHotel: boolean
    ) => {
      // MapLibre positions the outer element itself, so our styling goes
      // on an inner button (otherwise the two would fight over CSS).
      const wrapper = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = isHotel ? "map-pin map-pin--hotel" : "map-pin";
      button.textContent = text;
      button.title = title;
      button.setAttribute("aria-label", title);
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(key);
      });
      wrapper.appendChild(button);

      const marker = new maplibregl.Marker({ element: wrapper })
        .setLngLat([lng, lat])
        .addTo(map);
      markersRef.current.push({ key, marker, button });
    };

    if (hasHotelPosition) {
      addPin(HOTEL_KEY, hotel.lat, hotel.lng, "H", hotel.name, true);
    }
    for (const place of places) {
      addPin(
        place.placeKey,
        place.lat,
        place.lng,
        String(place.number),
        place.name,
        false
      );
    }

    // Zoom and centre the map so the whole day fits comfortably.
    const bounds = new maplibregl.LngLatBounds();
    if (hasHotelPosition) bounds.extend([hotel.lng, hotel.lat]);
    places.forEach((p) => bounds.extend([p.lng, p.lat]));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 15.5, duration: 700 });
    }
  }, [places, hotel.lat, hotel.lng, hotel.name, hasHotelPosition]);

  // ---- Highlight the selected pin, and glide over to it. ----
  useEffect(() => {
    for (const { key, button } of markersRef.current) {
      button.classList.toggle("map-pin--selected", key === selectedPlaceKey);
    }
    const selected = markersRef.current.find(
      (m) => m.key === selectedPlaceKey
    );
    if (selected && mapRef.current) {
      mapRef.current.easeTo({
        center: selected.marker.getLngLat(),
        duration: 500,
      });
    }
  }, [selectedPlaceKey, places]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-2xl border border-border bg-surface"
      aria-label="Interactive map of the day's stops"
    />
  );
}
