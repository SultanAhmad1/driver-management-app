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

type FormData = {
  locationId: string | null,
  partnerId: string | null,
  postcode: string,
  doorNo: string,
  fullAddress: string,
  orderNo: string,
}

export default function ReceiptScanner() {
  const webcamRef = useRef<Webcam | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const [optionSelected, setOptionSelected] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    locationId: null,
    partnerId: null,
    doorNo: "",
    postcode: "",
    fullAddress: "",
    orderNo: "",
  })
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

      // setFormData((prevData) => ({
      //   ...prevData,
      //   doorNo: parsedData.doorNumber,
      //   postcode: parsedData.postcode,
      // }))

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
    <>
      <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Driver Delivery Management System</h1>

        <form className="space-y-6">

          {/* Location Group */}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select Location</option>
              <option>Location 1</option>
              <option>Location 2</option>
              <option>Location 3</option>
            </select>
          </div>

          {/* Partner Group */}
          <div>
            <label className="block text-sm font-medium mb-2">Partner</label>
            <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select Partner</option>
              <option>Partner A</option>
              <option>Partner B</option>
              <option>Partner C</option>
            </select>
          </div>

          {/* Option Buttons */}
          <div className="flex gap-4">
            <button type="button" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => setOptionSelected(1)}>
              Take Snap
            </button>
            <button type="button" className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setOptionSelected(2)}>
              Manual
            </button>
          </div>

          {
            optionSelected === 2 &&
            <>
              {/* Door Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Door Number</label>
                <input
                  type="text"
                  placeholder="Enter Door Number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.doorNo}
                  onChange={(e) => setFormData((prevData) => ({...prevData, doorNo: e.target.value}))}
                />
              </div>

              {/* Postcode with Search */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Postcode</label>
                  <input
                    type="text"
                    placeholder="Enter Postcode"
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.postcode}
                    onChange={(e) => setFormData((prevData) => ({...prevData, postcode: e.target.value}))}
                  />
                </div>
                <button type="button" className="self-end bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Search
                </button>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Address</label>
                <input
                  type="text"
                  placeholder="Full Address"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.fullAddress}
                  onChange={(e) => setFormData((prevData) => ({...prevData, postcode: e.target.value}))}
                />
              </div>
            </>
          }

          {
            optionSelected === 1 &&
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b px-4 py-3">
                  <h3 className="text-lg font-semibold">Modal Title</h3>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setOptionSelected(0)}>
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4">
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
                {/* {text && (
                  <div className="mt-4 bg-gray-50 p-3 rounded">
                    <h3 className="font-semibold mb-2">📄 Full OCR Text</h3>
                    <pre className="whitespace-pre-wrap text-sm">{text}</pre>
                  </div>
                )} */}
              </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 border-t px-4 py-3">
                  <button
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    onClick={() => setOptionSelected(0)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setOptionSelected(2)}
                  >
                    Save
                  </button>
                </div>

              </div>
            </div>
             
          }

          {/* Order Number */}
          <div>
            <label className="block text-sm font-medium mb-2">Order No</label>
            <input
              type="text"
              placeholder="Enter Order Number"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>

        </form>
      </div>

     
    </>
  );
}