"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Fully client-side dynamic imports
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

interface Location {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  postcode: string;
  doorNo: string;
  setFormData: React.Dispatch<React.SetStateAction<any[]>>;
  index?: number;
}

export default function DeliveryMap({ postcode, doorNo, setFormData, index }: DeliveryMapProps) {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet client-side only
  useEffect(() => {
    if (typeof window === "undefined") return;
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    setLeafletLoaded(true);
  }, []);

  // Driver location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error(err);
        setDriverLocation({ lat: 51.5074, lng: -0.1278 }); // fallback: London
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Customer location
  useEffect(() => {
    if (!postcode || !doorNo) return;

    const fetchLocation = async () => {
      try {
        const query = encodeURIComponent(`${doorNo}, ${postcode}, UK`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
          const loc = data[0];
          const lat = parseFloat(loc.lat);
          const lng = parseFloat(loc.lon);

          setCustomerLocation({ lat, lng });
          setCustomerAddress(loc.display_name);

          if (index !== undefined) {
            setFormData(prev =>
              prev.map((item, i) => (i === index ? { ...item, fullAddress: loc.display_name } : item))
            );
          }
        } else {
          console.warn("No location found for query:", query);
        }
      } catch (err) {
        console.error("Failed to fetch customer location:", err);
      }
    };

    fetchLocation();
  }, [postcode, doorNo, index, setFormData]);

  // Only render when everything is ready
  if (!leafletLoaded || !driverLocation || !customerLocation) return <p>Loading map...</p>;

  // Use bounds to auto-center and zoom
  const bounds: [number, number][] = [
    [driverLocation.lat, driverLocation.lng],
    [customerLocation.lat, customerLocation.lng],
  ];

  const openGoogleMaps = () =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=driving`,
      "_blank"
    );

  const openWaze = () =>
    window.open(`https://www.waze.com/ul?ll=${customerLocation.lat},${customerLocation.lng}&navigate=yes`, "_blank");

  return (
    <div>
      <div className="w-full h-[400px]">
        <MapContainer bounds={bounds} style={{ width: "100%", height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={driverLocation}>
            <Popup>Driver Location</Popup>
          </Marker>
          <Marker position={customerLocation}>
            <Popup>Customer Location <br /> {customerAddress}</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openGoogleMaps}>
          Open in Google Maps
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={openWaze}>
          Open in Waze
        </button>
      </div>
    </div>
  );
}