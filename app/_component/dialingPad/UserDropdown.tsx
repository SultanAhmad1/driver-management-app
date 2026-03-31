"use client"
import { useState, useRef, useEffect } from "react";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";

export default function UserDropdown({ driver, handleLogout }: any) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button: Avatar + Name */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition"
      >
        <FaUser />
        <span className="font-medium">{driver?.firstName || "Driver Name"}</span>
        <span className={`ml-1 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
          <button
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition"
          >
            <FaUser /> Profile
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition"
          >
            <FaCog /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition text-red-600"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      )}
    </div>
  );
}