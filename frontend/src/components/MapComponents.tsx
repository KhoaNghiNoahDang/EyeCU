<<<<<<< Updated upstream
"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
=======
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
>>>>>>> Stashed changes
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getNearestHospital, CENTRAL_HOSPITALS, getHospitalsByProvince, Hospital } from "../lib/hospitals";

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
    <div class="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-1/2">
      <span class="absolute w-full h-full bg-[#f97316] rounded-full opacity-30 animate-ping"></span>
      <img src="/img/ambulance.webp" class="relative w-10 h-10 object-cover rounded-full shadow-lg border-2 border-white" alt="Ambulance" />
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
    </div>
  `,
  iconSize: [0, 0],
});

export function LocationUpdater({ lat, lng, destination, routeCoords }: { lat: number; lng: number, destination: Hospital | null, routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (destination) {
      const bounds = L.latLngBounds([
        [lat, lng],
        [destination.latitude, destination.longitude]
      ]);
      if (routeCoords.length > 0) {
        routeCoords.forEach(c => bounds.extend(c));
      }
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, destination, routeCoords, map]);
  return null;
}

export function MapBoundsUpdater({ ambulances }: { ambulances: AmbulanceUnit[] }) {
  const map = useMap();
  useEffect(() => {
    const latLngs: [number, number][] = [
      [21.0011, 105.8418],
    ];
    ambulances.forEach((amb) => {
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

export function RealAmbulanceMap({ ambulances, selectedId, onSelect }: { ambulances: AmbulanceUnit[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={[21.0011, 105.8418]} zoom={14} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[21.0011, 105.8418]} icon={hospitalIcon} />
        {ambulances.map((amb) => {
          if (!amb.lat || !amb.lng) return null;
          return (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={ambulanceIcon} eventHandlers={{ click: () => onSelect(amb.id) }}>
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

export function EmsLeafletMap({ lat, lng, onRouteUpdate, hospitalId }: { lat: number; lng: number, onRouteUpdate?: (info: any) => void, hospitalId?: string }) {
  const [destination, setDestination] = useState<Hospital | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distanceInfo, setDistanceInfo] = useState<{dist: string, time: string} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (hospitalId) {
      const allHospitals = Object.values(getHospitalsByProvince()).flat();
      const selected = allHospitals.find(h => h.id.toString() === hospitalId);
      if (selected) {
        setDestination(selected);
        return;
      }
    }
    const nearest = getNearestHospital(lat, lng);
    setDestination(nearest);
  }, [lat, lng, hospitalId]);

  useEffect(() => {
    if (!destination) return;
    fetch(`https://router.project-osrm.org/route/v1/driving/${lng},${lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const coords = r.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
          setRoute(coords);
          
          const km = (r.distance / 1000).toFixed(1);
          const mins = Math.ceil(r.duration / 60);
          setDistanceInfo({ dist: `${km}km`, time: `${mins} phút` });
          if (onRouteUpdate) {
            onRouteUpdate({ km, mins, destName: destination.name });
          }
        }
      })
      .catch(err => console.error("OSRM Error:", err));
  }, [destination, lat, lng, onRouteUpdate]);

  const groupedHospitals = getHospitalsByProvince();

  return (
    <div className="relative w-full h-[400px] rounded-xl bg-[#e5e5e5] overflow-hidden mb-4 border border-slate-200 z-0">
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {destination && (
          <Marker position={[destination.latitude, destination.longitude]} icon={hospitalIcon}>
            <Popup>
              <p className="font-bold">{destination.name}</p>
            </Popup>
          </Marker>
        )}
        <Marker position={[lat, lng]} icon={ambulanceIcon} />
        
        {route.length > 0 && (
          <Polyline positions={route} color="#0891B2" weight={6} opacity={0.8} dashArray="10, 10" />
        )}

        <LocationUpdater lat={lat} lng={lng} destination={destination} routeCoords={route} />
      </MapContainer>

      {/* Floating Info Card */}
      {destination && distanceInfo && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[400]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đang chuyển tới</p>
              <h4 className="font-bold text-slate-900 text-sm">{destination.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Cách {distanceInfo.dist} — {distanceInfo.time}</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-semibold transition"
            >
              Thay đổi
            </button>
          </div>
        </div>
      )}

      {/* Hospital Selection Modal */}
      {showModal && (
        <div className="absolute inset-0 bg-white z-[500] flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <button onClick={() => setShowModal(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className="font-bold text-slate-900 flex-1">Chọn điểm đến mới</h3>
          </div>
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <input 
              type="text" 
              placeholder="Tìm kiếm bệnh viện..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6 bg-white">
            {Object.keys(groupedHospitals).sort().map(province => {
              const hList = groupedHospitals[province].filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));
              if (hList.length === 0) return null;
              
              return (
                <div key={province}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{province}</h4>
                  <div className="space-y-2">
                    {hList.map(h => (
                      <button 
                        key={h.id}
                        onClick={() => { setDestination(h); setShowModal(false); }}
                        className={`w-full text-left p-3 rounded-lg border ${destination?.id === h.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-100 hover:border-slate-300'} transition flex justify-between items-center`}
                      >
                        <span className="font-semibold text-slate-800 text-sm">{h.name}</span>
                        {destination?.id === h.id && <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
