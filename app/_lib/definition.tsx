"use server";
import { cookies } from "next/headers";

export default async function postDriverLogin(prevState: any, formData: FormData) {
  const pincode = formData.get("pincode");

  if (!pincode) {
    return {
      success: false,
      error: "Enter pincode",
    };
  }

  const res = await fetch(
    // `${process.env.NEXT_PUBLIC_BASE_URL}/driver-login`,
    `https://laravel-jouleskitchen.cleartwo.uk/api/driver-login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ driverPincode: pincode }),
      cache: "no-store",
    }
  );

  const data = await res.json();

  console.log("data: ", data);
  
  if (!res.ok) {
    return {
      success: false,
      error: data?.message || "Invalid PIN",
    };
  }
  
  const {driver} = data?.data
  const cookieStore = await cookies()

  cookieStore.set({
    name: "driver",
    value: JSON.stringify(data?.data), // <-- stringify here
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })

  return {
    success: true,
    data: data?.data,
  }
}