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

  // test new pic
  const parseReceiptText = (text: string): ReceiptData => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const data: ReceiptData = { items: [] };
  let addressLines: string[] = [];

  // Flag to detect when address starts (after customer name)
  let foundName = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Total
    if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
      data.total = line.match(/£?\d+(\.\d{2})?/)![0];
    }

    // Name: first line with letters + space
    if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
      data.name = line;
      foundName = true;
      continue;
    }

    // After name, any line until postcode is considered address
    if (foundName) {
      // Skip phone numbers
      if (/^Tel:/.test(line)) continue;

      // Stop address collection if line contains postcode
      const postcodeMatch = line.match(
        /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i
      );
      if (postcodeMatch) {
        data.postcode = postcodeMatch[0].toUpperCase();
        break;
      }

      addressLines.push(line);
    }

    // Items: quantity x product pattern
    if (line.match(/\d+\s?[xX]\s?.+/)) {
      data.items?.push(line);
    }
  }

  if (addressLines.length > 0) {
    data.address = addressLines.join(", ");

    // Door number: first line of address (could be numeric or text)
    data.doorNumber = addressLines[0];
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