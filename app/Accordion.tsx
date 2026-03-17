// components/Accordion.tsx
"use client";

import { useState } from "react";

type AccordionItem = {
  title: string;
  content: string;
};

type AccordionProps = {
  items: AccordionItem[];
};

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // first open by default

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border rounded">
          <button
            className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 focus:outline-none flex justify-between items-center"
            onClick={() => toggleItem(index)}
          >
            {item.title}
            <span
              className={`transform transition-transform duration-300 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            >
              &#9650;
            </span>
          </button>

          <div
            className={`px-4 py-2 overflow-hidden transition-[max-height] duration-300 ${
              openIndex === index ? "max-h-40" : "max-h-0"
            }`}
          >
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}