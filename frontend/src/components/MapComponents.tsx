import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export type AmbulanceStatus = "critical" | "urgent" | "standby";
export interface AmbulanceUnit {
  id: string;
  plate: string;
  status: AmbulanceStatus;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

export const ambulanceIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2">
      <span class="absolute w-full h-full bg-[#f97316] rounded-full opacity-40 animate-ping"></span>
      <div class="relative w-4 h-4 bg-[#f97316] border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `,
  iconSize: [0, 0],
});

export const hospitalIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: `
    <div class="flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center font-black text-slate-900 border-2 border-slate-900 shadow-lg bg-[#88E8F2]">
        H
      </div>
      <span class="mt-1 text-[9px] font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded shadow">
        BV Bạch Mai
      </span>
    </div>
  `,
  iconSize: [0, 0],
});

export function LocationUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function MapBoundsUpdater({ ambulances }: { ambulances: AmbulanceUnit[] }) {
  const map = useMap();
  useEffect(() => {
    const latLngs: [number, number][] = [
      [21.0011, 105.8418] // Bach Mai Hospital
    ];
    ambulances.forEach(amb => {
      if (amb.lat && amb.lng) {
        latLngs.push([amb.lat, amb.lng]);
      }
    });
    
    if (latLngs.length > 1) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.setView([21.0011, 105.8418], 15, { animate: true });
    }
  }, [ambulances, map]);
  return null;
}

export function RealAmbulanceMap({
  ambulances,
  selectedId,
  onSelect,
}: {
  ambulances: AmbulanceUnit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={[21.0011, 105.8418]} 
        zoom={14} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[21.0011, 105.8418]} icon={hospitalIcon} />

        {ambulances.map(amb => {
          if (!amb.lat || !amb.lng) return null;
          return (
            <Marker 
              key={amb.id}
              position={[amb.lat, amb.lng]} 
              icon={ambulanceIcon}
              eventHandlers={{
                click: () => onSelect(amb.id)
              }}
            >
              <Popup>
                <div className="text-center font-geist">
                  <p className="font-bold text-slate-900 mb-1">{amb.plate}</p>
                  <p className="text-xs text-slate-500 uppercase">{amb.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapBoundsUpdater ambulances={ambulances} />
      </MapContainer>
    </div>
  );
}

export function EmsLeafletMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <div className="relative w-full h-[240px] rounded-xl bg-[#e5e5e5] overflow-hidden mb-4 border border-slate-200 z-0">
      <MapContainer 
        center={[lat, lng]} 
        zoom={15} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[21.0011, 105.8418]} icon={hospitalIcon} />
        <Marker position={[lat, lng]} icon={ambulanceIcon} />
        <LocationUpdater lat={lat} lng={lng} />
      </MapContainer>

      <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 text-[9px] font-bold px-2 py-1 rounded shadow-sm">
        GPS Live Map
      </div>
    </div>
  );
}
