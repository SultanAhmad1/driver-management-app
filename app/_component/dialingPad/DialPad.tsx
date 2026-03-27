"use client";

import postDriverLogin from "@/app/_lib/definition";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

const initialState = {
  success: null,
  pin: "",
  data: null,
};

export default function DialPad() {

  const [state, formAction, pending] = useActionState(postDriverLogin, null);

  const [pin, setPin] = useState("");

  const handlePress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const renderDots = () => {
    return (
      <div className="flex justify-center gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full ${
              i < pin.length ? "bg-black" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const numbers = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  // define all useEffect here
  const router = useRouter()
  useEffect(() => {
    if (state?.success) {
      // Set cookie here if needed
      // document.cookie = `driver=${JSON.stringify(state.data?.driver)}; path=/; max-age=${60 * 60 * 8}`;
      router.push("/");
    }
  }, [state, router]);
  
  return (
    <form action={formAction} className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      
      {/* ✅ Error message */}
      {state?.error && (
        <p className="bg-red-200 px-3 text-red-500 text-center rounded-2xl shadow-lg w-[320px] m-2">
          {state.error}
        </p>
      )}

      <input type="hidden" name="pincode" value={pin} />
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[320px]">
        
        <h1 className="text-xl font-semibold text-center mb-4">
          Enter PIN
        </h1>

        {/* PIN Dots */}
        {renderDots()}

        {/* Dial Pad */}
        <div className="grid grid-cols-3 gap-4">
          {numbers.map((num, index) => (
            <button
              type="button"
              key={index}
              onClick={() => {
                if (num === "⌫") handleDelete();
                else if (num !== "") handlePress(num);
              }}
              className="h-16 text-lg font-semibold bg-gray-200 rounded-xl active:scale-95 transition"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-500"
          >
            Clear
          </button>

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-lg"
            disabled={pending}
          >
            {pending ? "Loading..." : "Login"}
          </button>
        </div>
      </div>
    </form>
  );
}