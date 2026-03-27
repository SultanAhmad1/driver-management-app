import { FaGoogle, FaWaze } from "react-icons/fa";

export default function NavigationButtons() {
  return (
    <div className="flex gap-4 justify-center mt-4">
      {/* Google Maps Button */}
      <button
        type="button"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition-colors duration-200"
        onClick={() => window.open("https://www.google.com/maps", "_blank")}
      >
        <FaGoogle size={20} />
        Google Maps
      </button>

      {/* Waze Button */}
      <button
        type="button"
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition-colors duration-200"
        onClick={() => window.open("https://www.waze.com", "_blank")}
      >
        <FaWaze size={20} />
        Waze
      </button>
    </div>
  );
}