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

   const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };
    let addressLines: string[] = [];

    const streetKeywords = /(street|road|lane|ave|boulevard|blvd|drive|close|court|st|rd|ln|dr|cl)/i;
    const postcodeRegex = /([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Total
      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        const totalMatch = line.match(/£?\d+(\.\d{2})?/);
        if (totalMatch) data.total = totalMatch[0];
      }

      // 2. Name (Title Case logic)
      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
        data.name = line;
      }

      // 3. Items
      if (line.match(/\d+\s?[xX]\s?.+/)) {
        data.items?.push(line);
      }

      // 4. Postcode (Found early to help locate door info)
      const pcMatch = line.match(postcodeRegex);
      if (!data.postcode && pcMatch) {
        data.postcode = pcMatch[0].toUpperCase();
      }

      // 5. Build Address List
      if (streetKeywords.test(line) || /^\d+/.test(line) || pcMatch) {
        addressLines.push(line);
      }
    }

    if (addressLines.length > 0) {
      data.address = addressLines.join(", ");

      /* --- UPDATED DOOR NUMBER LOGIC --- */
      // Look for Type 1: Starts with a number (133)
      // OR Type 2: Two Capitalized Words (Meadow Hall) that aren't the street name
      const firstLine = addressLines[0];
      const numericMatch = firstLine.match(/^\d+[A-Za-z]?/);
      const namedMatch = firstLine.match(/^[A-Z][a-z]+\s[A-Z][a-z]+/);

      if (numericMatch) {
        data.doorNumber = numericMatch[0];
      } else if (namedMatch && !streetKeywords.test(firstLine)) {
        // Only take the name if it's not actually the street (e.g., "Meadow Road")
        data.doorNumber = namedMatch[0];
      }
    }

    return data;
  };



  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-3">Receipt Scanner old check</h2>

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