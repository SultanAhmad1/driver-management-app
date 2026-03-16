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

  const [scanStatus, setScanStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [distanceMessage, setDistanceMessage] = useState(
    "Place the receipt about 2–3 meters from the camera"
  );

  const processingRef = useRef(false);

  // Live frame check
  const checkFrame = async () => {
    if (!webcamRef.current || processingRef.current) return;
    const frame = webcamRef.current.getScreenshot();
    if (!frame) return;

    processingRef.current = true;

    try {
      const result = await Tesseract.recognize(frame, "eng");
      const text = result.data.text;

      // UK postcode detection
      const postcodeMatch = text.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i);

      // Name detection (first line with letters + space)
      const nameMatch = text.split("\n").find(line => /^[A-Z][a-z]+\s[A-Z]/.test(line));

      // Door/Location line (line immediately after name)
      let doorLine = null;
      if (nameMatch) {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        const nameIndex = lines.indexOf(nameMatch);
        if (lines[nameIndex + 1]) {
          doorLine = lines[nameIndex + 1];
        }
      }

      if (postcodeMatch && doorLine) {
        setScanStatus("valid");
        setDistanceMessage("✅ Perfect distance — receipt readable");
      } else {
        setScanStatus("invalid");
        setDistanceMessage(
          "❌ Move receipt closer (recommended distance: 2–3 meters)"
        );
      }

    } catch (err) {
      setScanStatus("invalid");
      setDistanceMessage("❌ Unable to detect receipt — adjust distance");
    }

    processingRef.current = false;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkFrame();
    }, 1500);
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
      const result = await Tesseract.recognize(src, "eng");
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
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };

    // UK postcode regex
    const postcodeRegex = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i;

    // Name regex (first line with letters + space)
    const nameRegex = /^[A-Z][a-z]+\s[A-Z]/;

    let nameIndex = -1;
    lines.forEach((line, i) => {
      // Name
      if (!data.name && nameRegex.test(line)) {
        data.name = line;
        nameIndex = i;
      }

      // Total
      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        data.total = line.match(/£?\d+(\.\d{2})?/)![0];
      }

      // Items
      if (line.match(/\d+\s?[xX]\s?.+/)) {
        data.items?.push(line);
      }
    });

    // Door/location = line after name
    if (nameIndex !== -1 && lines[nameIndex + 1]) {
      data.doorNumber = lines[nameIndex + 1];
    }

    // Postcode
    const postcodeLine = lines.find(l => postcodeRegex.test(l));
    if (postcodeLine) {
      data.postcode = postcodeLine.match(postcodeRegex)![0].toUpperCase();
    }

    // Address = lines between doorNumber and postcode
    if (data.doorNumber && data.postcode) {
      const doorIdx = lines.indexOf(data.doorNumber);
      const postcodeIdx = lines.indexOf(postcodeLine!);
      if (doorIdx >= 0 && postcodeIdx > doorIdx) {
        const addressLines = lines.slice(doorIdx, postcodeIdx);
        data.address = addressLines.join(", ");
      }
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

      <p className={`mt-2 text-center font-medium ${scanStatus === "valid" ? "text-green-600" : "text-red-600"}`}>
        {distanceMessage}
      </p>

      {image && (
        <div className="mt-4">
          <img src={image} className="rounded border" />
          <button
            onClick={() => {
              setImage(null);
              setText("");
              setReceiptData(null);
              setScanStatus("idle");
              setDistanceMessage("Place the receipt about 2–3 meters from the camera");
            }}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Retake
          </button>
        </div>
      )}

      {loading && <p className="mt-3">🧠 Reading receipt...</p>}

      {/* Parsed Data */}
      {receiptData && (
        <div className="mt-4 p-3 rounded border">
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