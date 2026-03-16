"use client";

import { useEffect, useRef, useState } from "react";
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

   const [scanStatus, setScanStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
    const processingRef = useRef(false);

    const checkFrame = async () => {
    if (!webcamRef.current || processingRef.current) return;

    const frame = webcamRef.current.getScreenshot();

    if (!frame) return;

    processingRef.current = true;

    try {
      const result = await Tesseract.recognize(frame, "eng");

      const text = result.data.text;

      const doorMatch = text.match(/^\d+[A-Za-z]?/m);

      const postcodeMatch = text.match(
        /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i
      );

      if (doorMatch && postcodeMatch) {
        setScanStatus("valid");
      } else {
        setScanStatus("invalid");
      }
    } catch (err) {
      setScanStatus("invalid");
    }

    processingRef.current = false;
  };
  
  // LIVE SCAN LOOP

  useEffect(() => {
    const interval = setInterval(() => {
      checkFrame();
    }, 1500); // scan every 1.5 sec

    return () => clearInterval(interval);
  }, []);

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
        logger: (m) => console.log(m), // logs progress
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

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };
    let addressLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Total
      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        data.total = line.match(/£?\d+(\.\d{2})?/)![0];
      }

      // Name: first line with letters + space
      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
        data.name = line;
      }

      // Items: quantity x product pattern
      if (line.match(/\d+\s?[xX]\s?.+/)) {
        data.items?.push(line);
      }

      // Address lines: street keywords or starts with number
      if (/(street|road|lane|ave|boulevard|blvd)/i.test(line) || /^\d+/.test(line)) {
        addressLines.push(line);
      }
    }

    if (addressLines.length > 0) {
      const fullAddress = addressLines.join(", ");
      data.address = fullAddress;

      // Door number: first number at start of first address line
      const doorMatch = addressLines[0].match(/^\d+[A-Za-z]?/);
      if (doorMatch) data.doorNumber = doorMatch[0];

      // Postcode: try to find anywhere in full address
      const postcodeMatch = fullAddress.match(
        /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i
      );
      if (postcodeMatch) data.postcode = postcodeMatch[0].toUpperCase();
    }

    return data;
  };

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

          {/* Live Scan Box */}
          <div
            className={`absolute top-10 left-6 right-6 bottom-10 border-4 rounded-lg pointer-events-none ${borderColor}`}
          ></div>

          <p className="text-center mt-2 text-sm">
            Keep receipt inside box until it turns green
          </p>
        </div>
      )}


         {!image && (
        <button
          onClick={capture}
          disabled={scanStatus !== "valid"}
          className={`mt-3 px-4 py-2 rounded text-white ${
            scanStatus === "valid" ? "bg-green-600" : "bg-gray-400"
          }`}
        >
          Take Photo
        </button>
      )}

         {scanStatus === "valid" && (
        <p className="text-green-600 font-semibold mt-2">
          ✅ Receipt readable
        </p>
      )}

      {scanStatus === "invalid" && (
        <p className="text-red-600 font-semibold mt-2">
          ❌ Move receipt closer or improve lighting
        </p>
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
        <div className="mt-4 p-3 rounded border">
          <h3 className="font-semibold mb-2">📝 Parsed Receipt Data</h3>
          <p><strong>Name:</strong> {receiptData.name || "Not found"}</p>
          <p><strong>Address:</strong> {receiptData.address || "Not found"}</p>
          <p><strong>Door Number:</strong> {receiptData.doorNumber || "Not found"}</p>
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