// app/home/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ReceiptScanner from "./ReceiptScanner";

export default async function Home() {
  // ✅ cookies() is synchronous in server components
  const cookieStore = await cookies();

  // cookieStore.get returns a Cookie object or undefined
  const driverCookie = cookieStore?.get("driver");

  // Check if cookie exists
  if (!driverCookie) {
    redirect("/login"); // redirect to your own login page
  }

  // To get the cookie value:
    // Parse JSON safely
  let driverData = null;
  try {
    driverData = JSON.parse(driverCookie.value); // convert string to object
  } catch (err) {
    console.error("Failed to parse driver cookie:", err);
    redirect("/login"); // if parsing fails, force login
  }

  return <ReceiptScanner {...{driver:driverData.driver, locationDropDown: driverData.locationsDropDown, partnerDropDown: driverData.partnerDropDown}}/>;
}