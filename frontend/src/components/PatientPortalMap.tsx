"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Hospital } from "../lib/hospitals";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center[0], center[1], map]);
  return null;
}

export default function PatientPortalMap({ selectedHospital }: { selectedHospital: Hospital }) {
  return (
    <MapContainer 
      center={[selectedHospital.latitude, selectedHospital.longitude]} 
      zoom={15} 
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={[selectedHospital.latitude, selectedHospital.longitude]} />
      <Marker position={[selectedHospital.latitude, selectedHospital.longitude]}>
        <Popup>
          <strong>{selectedHospital.name}</strong><br/>
          {selectedHospital.province}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
