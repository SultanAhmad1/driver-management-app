"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

type ReceiptData = {
  name?: string;
  address?: string;
  doorNumber?: string;
  postcode?: string;
  total?: string;
  items?: string[];
};

export default function ReceiptScanner() {
  const webcamRef = useRef<Webcam | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const capture = async () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      alert("Camera not ready");
      return;
    }
    setImage(screenshot);
    runOCR(screenshot);
  };

  const runOCR = async (src: string) => {
    setLoading(true);
    try {
      const result = await Tesseract.recognize(src, "eng", {
        logger: (m) => console.log(m),
      });

      const ocrText = result.data.text;
      setText(ocrText);

      const parsedData = parseReceiptText(ocrText);
      setReceiptData(parsedData);
    } catch (err) {
      console.error("OCR error:", err);
      alert("Failed to read receipt. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fix common OCR mistakes in numbers/postcodes
  const fixOCRText = (str: string) => {
    if (!str) return str;
    return str
      .replace(/0L/i, "OL")  // fix postcode
      .replace(/l/g, "1")
      .replace(/I/g, "1")
      .replace(/O/g, "0")
      .trim();
  };

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };
    const addressLines: string[] = [];

    for (const line of lines) {
      const cleanedLine = fixOCRText(line);

      // Total
      if (!data.total && /£?\d+(\.\d{2})?/.test(cleanedLine)) {
        const m = cleanedLine.match(/£?\d+(\.\d{2})?/);
        if (m) data.total = m[0];
      }

      // Name
      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(cleanedLine)) {
        data.name = cleanedLine;
      }

      // Items
      if (/\d+\s?[xX]\s?.+/.test(cleanedLine)) {
        data.items?.push(cleanedLine);
      }

      // Address lines: look for street keywords or numeric line (door)
      if (
        /(street|road|lane|avenue|ave|boulevard|blvd|canal)/i.test(cleanedLine) ||
        /^\d+/.test(cleanedLine) ||
        /^[A-Za-z]+\s[A-Za-z]+/.test(cleanedLine) // e.g., "Meadow hall"
      ) {
        addressLines.push(cleanedLine);
      }

      // Postcode anywhere
      if (!data.postcode) {
        const postcodeMatch = cleanedLine.match(
          /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i
        );
        if (postcodeMatch) data.postcode = postcodeMatch[0].toUpperCase();
      }
    }

    if (addressLines.length) {
      data.address = addressLines.join(", ");

      // Door number: first numeric line or first address line
      const door = addressLines.find((l) => /^\d+/.test(l)) || addressLines[0];
      if (door) data.doorNumber = door.match(/^\d+[A-Za-z]?/)?.[0] || door;
    }

    return data;
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3">Receipt Scanner</h2>

      {!image && (
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          audio={false}
          width={350}
          mirrored={false}
          videoConstraints={{ facingMode: "environment" }}
        />
      )}

      {!image && (
        <button
          onClick={capture}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Take Photo
        </button>
      )}

      {image && (
        <div className="mt-4">
          <img src={image} className="rounded border" />
          <button
            onClick={() => {
              setImage(null);
              setText("");
              setReceiptData(null);
            }}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Retake
          </button>
        </div>
      )}

      {loading && <p className="mt-3">🧠 Reading receipt...</p>}

      {/* Parsed data */}
      {receiptData && (
        <div className="mt-4 p-3 rounded border bg-gray-50">
          <h3 className="font-semibold mb-2">📝 Parsed Receipt Data</h3>
          <p><strong>Name:</strong> {receiptData.name || "Not found"}</p>
          <p><strong>Door Number:</strong> {receiptData.doorNumber || "Not found"}</p>
          <p><strong>Address:</strong> {receiptData.address || "Not found"}</p>
          <p><strong>Postcode:</strong> {receiptData.postcode || "Not found"}</p>
          <p><strong>Total:</strong> {receiptData.total || "Not found"}</p>
          {receiptData.items && receiptData.items.length > 0 && (
            <div>
              <strong>Items:</strong>
              <ul className="list-disc ml-5">
                {receiptData.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Full OCR text */}
      {text && (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <h3 className="font-semibold mb-2">📄 Full OCR Text</h3>
          <pre className="whitespace-pre-wrap text-sm">{text}</pre>
        </div>
      )}
    </div>
  );
}