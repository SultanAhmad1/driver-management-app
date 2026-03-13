"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

type ReceiptData = {
  name?: string;
  address?: string;
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
    const result = await Tesseract.recognize(src, "eng");
    const ocrText = result.data.text;
    setText(ocrText);

    const parsedData = parseReceiptText(ocrText);
    setReceiptData(parsedData);

    setLoading(false);
  };

  const parseReceiptText = (text: string): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };

    // Simple rules to find total
    for (const line of lines) {
      // Total amount (matches £10.50 or 10.50)
      if (!data.total && /£?\d+(\.\d{2})?/.test(line)) {
        data.total = line.match(/£?\d+(\.\d{2})?/)![0];
      }

      // Name: assume first line with letters + space
      if (!data.name && /^[A-Z][a-z]+\s[A-Z]/.test(line)) {
        data.name = line;
      }

      // Address: look for street/road keywords
      if (!data.address && /(street|road|lane|ave|boulevard|blvd)/i.test(line)) {
        data.address = line;
      }

      // Items: look for lines with quantity x product pattern
      if (line.match(/\d+\s?[xX]\s?.+/)) {
        data.items?.push(line);
      }
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

      {receiptData && (
        <div className="mt-4 bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2">📝 Parsed Receipt Data</h3>
          <p><strong>Name:</strong> {receiptData.name || "Not found"}</p>
          <p><strong>Address:</strong> {receiptData.address || "Not found"}</p>
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

      {text && !receiptData && (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <h3 className="font-semibold mb-2">OCR Raw Text</h3>
          <pre className="whitespace-pre-wrap">{text}</pre>
        </div>
      )}
    </div>
  );
}