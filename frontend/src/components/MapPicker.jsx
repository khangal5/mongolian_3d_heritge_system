import { useMemo, useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MONGOLIA_CENTER = [46.8625, 103.8467];

function ClickHandler({ onChange }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

function CenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, Math.max(map.getZoom(), 8));
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const position = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return [lat, lng];
  }, [latitude, longitude]);

  return (
    <div className="map-picker">
      <MapContainer
        center={position || MONGOLIA_CENTER}
        zoom={position ? 8 : 5}
        scrollWheelZoom
        className="map-picker-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} icon={markerIcon} />}
        <ClickHandler onChange={onChange} />
        <CenterUpdater center={position} />
      </MapContainer>
      <p className="map-picker-hint">
        Газрын зураг дээр товшиж олдворын координатыг сонгоно уу.
      </p>
    </div>
  );
}
