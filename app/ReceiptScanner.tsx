"use client";

import { useRef, useState, useEffect } from "react";
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

  const [distanceMessage, setDistanceMessage] = useState(
    "Place receipt inside the box"
  );
  const [scanStatus, setScanStatus] = useState<"valid" | "invalid" | "idle">(
    "idle"
  );

  /* ----------------------------
     Camera distance guidance
  -----------------------------*/

  useEffect(() => {
    const interval = setInterval(() => {
      const video = webcamRef.current?.video;

      if (!video) return;

      const width = video.videoWidth;
      const height = video.videoHeight;

      const area = width * height;

      if (area < 200000) {
        setDistanceMessage("⬇️ Move receipt closer");
        setScanStatus("invalid");
      } else if (area > 900000) {
        setDistanceMessage("⬆️ Move receipt slightly away");
        setScanStatus("invalid");
      } else {
        setDistanceMessage("✅ Perfect distance");
        setScanStatus("valid");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ----------------------------
     Capture photo
  -----------------------------*/

  const capture = async () => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot) {
      alert("Camera not ready");
      return;
    }

    setImage(screenshot);
    runOCR(screenshot);
  };

  /* ----------------------------
     OCR processing
  -----------------------------*/

  const runOCR = async (src: string) => {
    setLoading(true);

    try {
      const result = await Tesseract.recognize(src, "eng", {
        logger: (m) => console.log(m),
      });

      const ocrText = result.data.text;

      setText(ocrText);

      const parsed = parseReceiptText(ocrText);

      setReceiptData(parsed);
    } catch (err) {
      console.error(err);
      alert("OCR failed");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------
     Receipt parser
  -----------------------------*/

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const data: ReceiptData = { items: [] };

    const postcodeRegex =
      /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}\b/i;

    const streetRegex =
      /(street|road|lane|avenue|drive|way|close|court)/i;

    let postcodeIndex = -1;

    /* find postcode */

    for (let i = 0; i < lines.length; i++) {
      const fixed = lines[i].replace(/^0L/i, "OL");

      const match = fixed.match(postcodeRegex);

      if (match) {
        data.postcode = match[0].toUpperCase();
        postcodeIndex = i;
        break;
      }
    }

    /* find door number or building */

    if (postcodeIndex > 0) {
      const candidates = [
        lines[postcodeIndex - 1],
        lines[postcodeIndex - 2],
        lines[postcodeIndex - 3],
      ];

      for (const c of candidates) {
        if (!c) continue;

        if (/^\d+[A-Za-z]?$/.test(c)) {
          data.doorNumber = c;
          break;
        }

        if (/^[A-Za-z]+\s?[A-Za-z]+$/.test(c)) {
          data.doorNumber = c;
          break;
        }
      }
    }

    const addressLines: string[] = [];

    for (const line of lines) {
      if (streetRegex.test(line)) {
        addressLines.push(line);
      }

      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
        data.name = line;
      }

      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        data.total = line.match(/£?\d+(\.\d{2})?/)![0];
      }

      if (/\d+\s?[xX]\s?.+/.test(line)) {
        data.items?.push(line);
      }
    }

    if (addressLines.length > 0) {
      data.address = addressLines.join(", ");
    }

    return data;
  };

  /* ----------------------------
     UI
  -----------------------------*/

  return (
    <div className="max-w-md mx-auto p-4">

      <h2 className="text-xl font-bold mb-4">
        Driver Receipt Scanner
      </h2>

      {!image && (
        <div className="relative">

          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            audio={false}
            width={350}
            mirrored={false}
            videoConstraints={{
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }}
          />

          {/* Scanner box */}

          <div
            className={`absolute top-12 left-6 right-6 bottom-12 border-4 rounded-lg flex items-center justify-center
            ${
              scanStatus === "valid"
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            <p className="bg-black/60 text-white px-3 py-1 rounded text-sm">
              {distanceMessage}
            </p>
          </div>
        </div>
      )}

      {!image && (
        <button
          onClick={capture}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
        >
          Take Snapshot
        </button>
      )}

      {image && (
        <div className="mt-4">

          <img
            src={image}
            className="rounded border"
          />

          <button
            onClick={() => {
              setImage(null);
              setText("");
              setReceiptData(null);
            }}
            className="mt-3 w-full bg-gray-500 text-white py-2 rounded"
          >
            Retake
          </button>
        </div>
      )}

      {loading && (
        <p className="mt-3 text-center">
          🧠 Reading receipt...
        </p>
      )}

      {/* Parsed data */}

      {receiptData && (
        <div className="mt-5 border rounded p-3 bg-gray-50">

          <h3 className="font-semibold mb-2">
            Parsed Receipt
          </h3>

          <p>
            <strong>Name:</strong>{" "}
            {receiptData.name || "Not found"}
          </p>

          <p>
            <strong>Door Number:</strong>{" "}
            {receiptData.doorNumber || "Not found"}
          </p>

          <p>
            <strong>Postcode:</strong>{" "}
            {receiptData.postcode || "Not found"}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {receiptData.address || "Not found"}
          </p>

          <p>
            <strong>Total:</strong>{" "}
            {receiptData.total || "Not found"}
          </p>

          {receiptData.items &&
            receiptData.items.length > 0 && (
              <ul className="list-disc ml-5 mt-2">
                {receiptData.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
        </div>
      )}

      {/* Full OCR text */}

      {text && (
        <div className="mt-5 bg-gray-100 p-3 rounded text-sm">

          <h3 className="font-semibold mb-2">
            Full OCR Text
          </h3>

          <pre className="whitespace-pre-wrap">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}