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

  // NEW: scan status
  const [scanStatus, setScanStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

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

      // Validate receipt
      if (parsedData.doorNumber && parsedData.postcode) {
        setScanStatus("valid");
      } else {
        setScanStatus("invalid");
      }

    } catch (err) {
      console.error("OCR error:", err);
      setScanStatus("invalid");
      alert("Failed to read receipt. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const data: ReceiptData = { items: [] };
    let addressLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // TOTAL
      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        data.total = line.match(/£?\d+(\.\d{2})?/)![0];
      }

      // NAME
      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
        data.name = line;
      }

      // ITEMS
      if (line.match(/\d+\s?[xX]\s?.+/)) {
        data.items?.push(line);
      }

      // ADDRESS
      if (
        /(street|road|lane|ave|avenue|blvd|drive|court)/i.test(line) ||
        /^\d+/.test(line)
      ) {
        addressLines.push(line);
      }
    }

    if (addressLines.length > 0) {
      const fullAddress = addressLines.join(", ");
      data.address = fullAddress;

      const doorMatch = addressLines[0].match(/^\d+[A-Za-z]?/);
      if (doorMatch) data.doorNumber = doorMatch[0];

      const postcodeMatch = fullAddress.match(
        /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i
      );
      if (postcodeMatch) data.postcode = postcodeMatch[0].toUpperCase();
    }

    return data;
  };

  // Dynamic border color
  const borderColor =
    scanStatus === "valid"
      ? "border-green-500"
      : scanStatus === "invalid"
      ? "border-red-500"
      : "border-gray-300";

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3">Receipt Scanner</h2>

      {!image && (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            audio={false}
            width={350}
            mirrored={false}
            videoConstraints={{ facingMode: "environment" }}
          />

          {/* Scan Guide Box */}
          <div
            className={`absolute top-10 left-6 right-6 bottom-10 border-4 rounded-lg pointer-events-none ${borderColor}`}
          ></div>

          <p className="text-sm text-center mt-2">
            Place receipt inside the box so door number & postcode are visible
          </p>
        </div>
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
              setScanStatus("idle");
            }}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Retake 16
          </button>
        </div>
      )}

      {loading && <p className="mt-3">🧠 Reading receipt...</p>}

      {scanStatus === "valid" && (
        <p className="text-green-600 font-semibold mt-2">
          ✅ Receipt readable (postcode & door number detected)
        </p>
      )}

      {scanStatus === "invalid" && (
        <p className="text-red-600 font-semibold mt-2">
          ❌ Receipt not readable. Move receipt inside box.
        </p>
      )}

      {/* Parsed Data */}
      {receiptData && (
        <div className="mt-4 p-3 rounded border">
          <h3 className="font-semibold mb-2">Parsed Receipt</h3>

          <p><strong>Name:</strong> {receiptData.name || "Not found"}</p>
          <p><strong>Address:</strong> {receiptData.address || "Not found"}</p>
          <p><strong>Door Number:</strong> {receiptData.doorNumber || "Not found"}</p>
          <p><strong>Postcode:</strong> {receiptData.postcode || "Not found"}</p>
          <p><strong>Total:</strong> {receiptData.total || "Not found"}</p>

          {receiptData.items && receiptData.items.length > 0 && (
            <ul className="list-disc ml-5">
              {receiptData.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {text && (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <h3 className="font-semibold mb-2">OCR Text</h3>
          <pre className="whitespace-pre-wrap text-sm">{text}</pre>
        </div>
      )}
    </div>
  );
}