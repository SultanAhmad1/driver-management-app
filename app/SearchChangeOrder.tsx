"use client"
import { useState } from "react";
import { FaSearch, FaExchangeAlt } from "react-icons/fa";

export default function SearchChangeOrder() {
    
    const [openIndex, setOpenIndex] = useState<boolean | false>(false); // first open by default

    const toggleItem = () => {
        setOpenIndex(!openIndex)
    };

  return (
      <div className="rounded">
            <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleItem()}
            >
                {/* Left: Order Info */}
                <div className="flex flex-row">
                    <span className="text-gray-500">Search & Change Order</span>
                </div>

                {/* Right: Actions + Arrow */}
                <div className="flex items-center gap-3">
                {/* Arrow */}
                <span
                    className={`text-gray-500 transition-transform duration-300 ${
                    openIndex ? "rotate-180" : ""
                    }`}
                >
                    ▲
                </span>
                </div>
            </div>
            </div>
            
            <div
            className={`px-4 overflow-hidden transition-[max-height] duration-300 ${
                openIndex ? "max-h-auto py-2 " : "max-h-0 py-0"
            }`}
            >
                <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                
                {/* Title */}
                <div className="mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                    Search & Change Order
                    </h2>
                    <p className="text-sm text-gray-500">
                    Quickly find and update an order
                    </p>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                    type="text"
                    placeholder="Search by Order No, Postcode..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {/* Search Button */}
                    <button
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
                    >
                    <FaSearch />
                    Search
                    </button>

                    {/* Change Order Button */}
                    <button
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
                    >
                    <FaExchangeAlt />
                    Change Order
                    </button>
                </div>
                </div>

            </div>
        </div>
  );
}