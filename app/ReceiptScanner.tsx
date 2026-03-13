"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";

export default function ReceiptScanner() {
  const webcamRef = useRef<Webcam | null>(null);

  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

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

    setText(result.data.text);
    setLoading(false);
  };

  return (
    <div className="p-4">

      <h2 className="text-xl font-bold mb-3">
        Receipt Scanner
      </h2>

      {!image && (
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          audio={false}
          width={350}
          videoConstraints={{
            facingMode: "environment"
          }}
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
            }}
            className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
          >
            Retake
          </button>
        </div>
      )}

      {loading && <p className="mt-3">Reading receipt...</p>}

      {text && (
        <pre className="mt-4 bg-gray-100 p-3 rounded">
          {text}
        </pre>
      )}
    </div>
  );
}