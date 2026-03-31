"use client";
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Location {
  lat: number;
  lng: number;
}

interface DeliveryMapProps {
  token: string; // new prop for token from ReceiptScanner
  postcode: string;
  doorNo: string;
  setFormData: React.Dispatch<React.SetStateAction<any[]>>; // optional, only if you want to update formData
  index?: number; // optional, index of the current formData item
  fullAddress?: string; // optional, can be updated from component
  locationLatLong: Location | null; // new prop for lat/lng from ReceiptScanner
  isSearchButtonClicked: boolean; // to trigger useEffect when search button is clicked
  setOptionSelected: React.Dispatch<React.SetStateAction<number>>; // to update the selected option
  customerLat: number | null; // new prop for customer latitude
  customerLng: number | null; // new prop for customer longitude
}

export default function DeliveryMap({customerLat, customerLng,setOptionSelected, isSearchButtonClicked, token, postcode, doorNo, setFormData, index, fullAddress, locationLatLong }: DeliveryMapProps) {

  const { isLoaded } = useJsApiLoader({
    // googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    googleMapsApiKey: "AIzaSyDxSh9nvtqw7behmbOHNC_mgeYUludCWSc"
  });

  // 1️⃣ Get driver location

  console.log("delivery map token:", token);
  
  // 2️⃣ Get customer full address and lat/lng using Google Geocode
  useEffect(() => {
    if(isSearchButtonClicked)
    {
      const fetchCustomerLocation = async () => {
        if (!postcode && !doorNo) return;
  
        // Combine postcode + door number
        // const addressQuery = `${doorNo}, ${postcode}`;
        const addressQuery = `${postcode}`;
      
       console.log("address query:", addressQuery);
       
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
  
          // now here mention driver location and customer location in form data
          try {
              const res = await fetch(`https://laravel-jouleskitchen.cleartwo.uk/api/driver-distance`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  Authorization: `Bearer ${token}`, // if needed
                },
                body: JSON.stringify({
                  driverLatLng: {
                    latitude: locationLatLong?.lat || null,
                    longitude: locationLatLong?.lng || null,
                  },
                  customerLatLng: {
                    latitude: result.geometry.location.lat,
                    longitude: result.geometry.location.lng,
                  },
                }),
              });
  
              const dataDiscatnce = await res.json();
  
              console.log("destination data:", dataDiscatnce);
  
              setFormData((prevData: any) => prevData.map((data: any, indexData: number) => 
                index === indexData ? {
                    ...data,
                    fullAddress: addDoor || "",
                    estimatedDeliveryTime: dataDiscatnce?.estimateData?.deliveryDuration,
                    isSearchButtonClicked: false,
                    doorNoError: false,
                    postcodeError: false,
                    customerLat: result.geometry.location.lat,
                    customerLng: result.geometry.location.lng,
                }
                :
                data
            ))
            setOptionSelected(5)
          } catch (error) {
            console.log("error fetching the details:",error);
          }
        }
      };
  
      fetchCustomerLocation();
    }
  }, [postcode, doorNo, isSearchButtonClicked]); // add isSearchButtonClicked as dependency to trigger when search button is clicked

  if (!isLoaded || !locationLatLong || !customerLat || !customerLng) return <p>Loading map...</p>;

  // const openGoogleMaps = (e: any) => {
  //   e.preventDefault();
  //   const url = `https://www.google.com/maps/dir/?api=1&origin=${locationLatLong.lat},${locationLatLong.lng}&destination=${customerLat},${customerLng}&travelmode=driving`;
  //   window.open(url, "_blank");
  // };

  const openGoogleMaps = (e: any) => {
    e.preventDefault();

    const destination = encodeURIComponent(fullAddress || "");

    const url = `https://www.google.com/maps/dir/?api=1&origin=${locationLatLong.lat},${locationLatLong.lng}&destination=${destination}&travelmode=driving`;

    window.open(url, "_blank");
  };

  // const openWaze = (e: any) => {
  //   e.preventDefault();
  //   const url = `https://www.waze.com/ul?ll=${customerLat},${customerLng}&navigate=yes`;
  //   window.open(url, "_blank");
  // };

  const openWaze = (e: any) => {
    e.preventDefault();

    const address = encodeURIComponent(fullAddress || "");
    const url = `https://www.waze.com/ul?ll=${customerLat},${customerLng}&q=${address}&navigate=yes`;
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
          center={locationLatLong}
          zoom={14}
          mapContainerStyle={{ width: "100%", height: "100%" }}
        >
          <Marker position={locationLatLong} label="Driver" />
          <Marker position={customerLocation} label="Customer" />
        </GoogleMap>
      </div> */}

      <div className="flex justify-center gap-2 mt-4 items-center">
        <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={openGoogleMaps}>
          Google Maps
        </button>
        <button type="button" className="px-4 py-2 bg-green-600 text-white rounded" onClick={openWaze}>
          Waze
        </button>
      </div>
    </div>
  );
}