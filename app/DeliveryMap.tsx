"use client";
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Location {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  postcode: string;
  doorNo: string;
  setFormData: React.Dispatch<React.SetStateAction<any[]>>; // optional, only if you want to update formData
  index?: number; // optional, index of the current formData item
  fullAddress?: string; // optional, can be updated from component
}

export default function DeliveryMap({ postcode, doorNo, setFormData, index, fullAddress }: DeliveryMapProps) {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
//   const [fullAddress, setFullAddress] = useState<string>("");

  const { isLoaded } = useJsApiLoader({
    // googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    googleMapsApiKey: "AIzaSyDxSh9nvtqw7behmbOHNC_mgeYUludCWSc"
  });

  // 1️⃣ Get driver location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
  }, []);

  // 2️⃣ Get customer full address and lat/lng using Google Geocode
  useEffect(() => {
    const fetchCustomerLocation = async () => {
      if (!postcode && !doorNo) return;

      // Combine postcode + door number
      const addressQuery = `${doorNo}, ${postcode}`;
    
     
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addressQuery
        )}&key=AIzaSyDxSh9nvtqw7behmbOHNC_mgeYUludCWSc`
      );

      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        // setFullAddress(result.formatted_address);
        const addDoor = `${doorNo} ${result.formatted_address}`
        setFormData((prevData: any) => prevData.map((data: any, indexData: number) => 
            index === indexData ? {
                ...data,
                fullAddress: addDoor || "",
            }
            :
            data
        ))
        setCustomerLocation({
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        });
      }
    };

    fetchCustomerLocation();
  }, [postcode, doorNo]);

  if (!isLoaded || !driverLocation || !customerLocation) return <p>Loading map...</p>;

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${customerLocation.lat},${customerLocation.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const openWaze = () => {
    const url = `https://www.waze.com/ul?ll=${customerLocation.lat},${customerLocation.lng}&navigate=yes`;
    window.open(url, "_blank");
  };

  return (
    <div>
      {/* <h3 className="font-bold">Customer Address:</h3>
      <p>{fullAddress}</p>
      <p><strong>Door No:</strong> {doorNo}</p>
      <p><strong>Postcode:</strong> {postcode}</p> */}

      {/* <div className="w-full h-[400px] mt-4">
        <GoogleMap
          center={driverLocation}
          zoom={14}
          mapContainerStyle={{ width: "100%", height: "100%" }}
        >
          <Marker position={driverLocation} label="Driver" />
          <Marker position={customerLocation} label="Customer" />
        </GoogleMap>
      </div> */}

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