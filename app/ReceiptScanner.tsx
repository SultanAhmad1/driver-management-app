"use client";

import { useEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp, FaCamera, FaExchangeAlt, FaMinus, FaPlus, FaStackExchange, FaTrash } from "react-icons/fa";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import SlideUnlockButton from "./SlideUnlockButton";
import SearchChangeOrder from "./SearchChangeOrder";
import NavigationButtons from "./NavigationButtons";
import UserDropdown from "./_component/dialingPad/UserDropdown";

type ReceiptData = {
  name?: string;
  address?: string;
  doorNumber?: string;
  postcode?: string;
  total?: string;
  items?: string[];
  orderNumber?: string;
};

type FormData = {
  id: number ,
  locationId: string | null,
  partnerId: string | null,
  postcode: string,
  doorNo: string,
  fullAddress: string,
  orderNo: string,
  status: number,
}

export default function ReceiptScanner({driver, locationDropDown, partnerDropDown}: any) {
  const webcamRef = useRef<Webcam | null>(null);

  /*
    1 = start
    2 = Complete
    3 = Cancel
  */
  const addData = {
    id: 0,
    locationId: null,
    partnerId: null,
    doorNo: "",
    postcode: "",
    fullAddress: "",
    orderNo: "",
    status: 0,
  }

  const [image, setImage] = useState<string | null>(null);
  const [orderImage, setOrderImage] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const [optionSelected, setOptionSelected] = useState(1)
  const [formData, setFormData] = useState<FormData[]>([addData]);

  const cleanImage = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        // 🔥 Increase resolution (important)
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray =
            data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;

          // 🔥 Strong threshold (play with 150–200)
          const value = gray > 170 ? 255 : 0;

          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  const capture = async (isOrderNumber = false, index = 0) => {
    const screenshot = webcamRef.current?.getScreenshot();
    
    if (!screenshot) {
      // alert("Camera not ready");
      return;
    }

    const cleanedImage = await cleanImage(screenshot)

    console.log("screen hot:", cleanedImage);
    
    if (!screenshot) {
      alert("Camera not ready");
      return;
    }

    if(isOrderNumber)
    {
      setOrderImage(cleanedImage)
    }
    else
    {
      setImage(cleanedImage);
    }

    await runOCR(cleanedImage, isOrderNumber, index);
  };

  const runOCR = async (src: string, isOrderNumber: boolean, index: number) => {
    setLoading(true);
    try {
      // const result = await Tesseract.recognize(src, "eng", {
      //   logger: (m) => console.log(m), // logs progress
      // });

      const result = await Tesseract.recognize(src, "eng", {
        logger: (m) => console.log(m),
        // --- ADD THESE CONFIGURATIONS ---
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
      });

      const ocrText = result.data.text;

      const lines = ocrText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

      setText(ocrText);
      setNewText(JSON.stringify(lines))

      const parsedData = parseReceiptText(ocrText, isOrderNumber);
      setReceiptData(parsedData);

      if(isOrderNumber)
      {
        setFormData((prevData) => prevData.map((data, indexData) => 
          index === indexData ? {
            ...data,
            orderNo: parsedData?.orderNumber || "Not Found",
          }
          :
          data
        ))
      }
      else
      {

        // for direct orders
        let telIndex = lines.findIndex((line) => line.startsWith("Tel"))
        let orderIndex = lines.findIndex((line) => line.startsWith("Order Placed"))
        
        let startWithTel = telIndex === -1 ? 0 : telIndex + 2
        let endWithPlaceOrder = orderIndex === -1 ? lines.length : orderIndex - 1

        setFormData((prevData) => prevData.map((data, indexData) => 
          index === indexData ? {
            ...data,
            doorNo: lines[startWithTel] || "Not Found",
            postcode: lines[endWithPlaceOrder] || "Not Found"
          }
          :
          data
        ))

        setOptionSelected(2)
      }
    } catch (err) {
      console.error("OCR error:", err);
      alert("Failed to read receipt. Try again.");
    } finally {
      setLoading(false);
    }
  };

  console.log("text data:", text);
  
  const parseReceiptText = (text: string, isOrderNumber: boolean): ReceiptData => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const data: ReceiptData = { items: [] };
    let addressLines: string[] = [];

    // Flag to detect when address starts (after customer name)
    let foundName = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isOrderNumber) {
        // Match: "Order No: 12345" OR "#12345"
        const orderMatch = line.match(
          /(Order\s*No[:\s]*|#)\s*([A-Z0-9-]+)/i
        );

        if (orderMatch) {
          data.orderNumber = orderMatch[2]; // actual number
          return data;
        }
        else {
          const hashOrderMatch = line.match(/#\s*([A-Z0-9\s-]+)/i);
          if (hashOrderMatch) {
            // safely access the capture group
            data.orderNumber = hashOrderMatch[1].replace(/\s+/g, ""); // remove spaces if needed
            return data;
          }
        }
      }
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

  const [openIndex, setOpenIndex] = useState<number | null>(0); // first open by default

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleRemove = () => {
    setFormData([addData])
  }

  const handleIndividualRemove = (id: number) => {

    if(id === 0)
    {
      setFormData([addData])
      return
    }
    const updateForm = formData.filter((_, index) => (id !== index))
    setFormData(updateForm)
  }

  const handleAdd = () => {
    setFormData((prev) => [addData, ...prev]);
  };

  const handleInputs = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {

    const {value, name} = event.target;

    setFormData((prev) => {
      const newData = [...prev];
      newData[index] = {
        ...newData[index],
        [name]: value,
      };
      return newData;
    })
  }

 const handleSubmit = (index: number) => {
  window.alert("on submit the data is here:");

  setFormData((prev) => {
    const newData = [...prev];

    let currentStatus = newData[index].status;
    
    switch (newData[index].status) {
      case 0:
          currentStatus = 1
        break;
      case 1:
          currentStatus = 2
        break;

      case 2:
          currentStatus = 3
        break;

      default:
        currentStatus = 0
        break;
    }
    newData[index] = {
      ...newData[index],
      status: currentStatus,
    };

    return newData;
  });
};

  const handleSorting = () => {
    const reversed = [...formData].reverse();

    setFormData(reversed);
  };

  console.log("form data:", formData);
  
  const handleLogout  = () => {

  }

  return (
    // new changes live
    <>
      {/* // Add this above your <h1> in return() */}
      <div className="bg-white-200 text-dark px-6 py-4 rounded-lg shadow-md flex items-center justify-between mb-6">
        {/* Left: Driver Info */}
        <div className="flex items-center gap-4">
          <img
            src={"/logo-sm.png"}
            alt="Driver Avatar"
            className="w-12 h-12 rounded-full border-2 border-white object-cover"
          />
        </div>

        {/* Right: Stats or Actions */}
        <div className="flex items-center gap-4">
          <UserDropdown {...{
            driver: driver,
            handleLogout
          }}/>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold mb-6 text-center">Driver Delivery Management System </h1>

        {/* <SearchChangeOrder /> */}
        <div className="flex justify-center gap-2">
          <button
            type="button"
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            onClick={handleRemove}
          >
            <FaTrash className="mr-1" /> Clear All
          </button>

          <button
            type="button"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            onClick={handleAdd}
          >
            <FaPlus className="mr-1" /> Add
          </button>

          <button
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            onClick={handleSorting}
          >
            <FaArrowUp className="text-xs " />
            <FaArrowDown className="text-xs" />
          </button>
        </div>

        {/* show data in ascending and descending order */}

        {
          formData?.map((formData, index) => {
            return(
              <div key={index} className="rounded">
                <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleItem(index)}
                  >
                    {/* Left: Order Info */}
                    <div className="flex flex-row">
                      <span className="text-gray-500">Order No:&nbsp;</span>
                      <span className="font-semibold text-gray-800">
                        {formData?.orderNo || "N/A"}
                      </span>
                    </div>

                    {/* Right: Actions + Arrow */}
                    <div className="flex items-center gap-3">
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent accordion toggle
                          handleIndividualRemove(index)
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition"
                      >
                        <FaMinus size={12} />
                      </button>

                      {/* Arrow */}
                      <span
                        className={`text-gray-500 transition-transform duration-300 ${
                          openIndex === index ? "rotate-180" : ""
                        }`}
                      >
                        ▲
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`px-4 overflow-hidden transition-[max-height] duration-300 ${
                    openIndex === index ? "max-h-auto py-2 " : "max-h-0 py-0"
                  }`}
                >
                  <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-md">
                    <form className="space-y-6">

                      {/* Location Group */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Location</label>
                        <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {
                            locationDropDown?.map((location: any) => {
                              return(
                                <option key={location?.value}>{location?.label}</option>
                              )
                            })
                          }
                        </select>
                      </div>

                      {/* Partner Group */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Partner</label>
                        <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {
                            partnerDropDown?.map((partner: any) => {
                              return(
                                <option key={partner?.value}>{partner?.label}</option>
                              )
                            })
                          }
                        </select>
                      </div>
                      
                      {/* Take Snap */}
                      {
                        optionSelected === 1 &&
                        <div className="p-4 overflow-y-auto flex-1">
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
                              onClick={() => capture(false, index)}
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
                                  setNewText("")
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
                              {/* <p><strong>Total:</strong> {receiptData.total || "Not found"}</p> */}
                              {/* {receiptData.items && receiptData.items.length > 0 && (
                                <div>
                                  <strong>Items:</strong>
                                  <ul className="list-disc ml-5">
                                    {receiptData.items.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )} */}
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
                      }
                      {/* Option Buttons */}
                      <div className="flex gap-4">
                        {
                          optionSelected === 2 &&
                          <button type="button" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => setOptionSelected(1)}>
                            Take Snap
                          </button>
                        }

                        {
                          optionSelected === 1 &&
                          <button type="button" className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setOptionSelected(2)}>
                            Manual
                          </button>
                        }
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
                              name="doorNo"
                              onChange={(e) => handleInputs(index, e)}
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
                                name="postcode"
                                onChange={(e) => handleInputs(index, e)}
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
                              name="fullAddress"
                              onChange={(e) => handleInputs(index, e)}
                            />
                          </div>
                        </>
                      }

                      <h1>{text}</h1>

                      <p>{newText}</p>
                      {
                        // optionSelected === 1 &&
                        // <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" >
                        //   <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
                            
                        //     {/* Modal Header */}
                        //     <div className="flex justify-between items-center border-b px-4 py-3">
                        //       <h3 className="text-lg font-semibold">Postcode and door number snap modal</h3>
                        //       <button className="text-gray-500 hover:text-gray-700" onClick={() => setOptionSelected(0)}>
                        //         ✕
                        //       </button>
                        //     </div>

                        //     {/* Modal Body */}
                        //     <div className="p-4 overflow-y-auto flex-1">
                        //       <h2 className="text-xl font-bold mb-3">Receipt Scanner</h2>
                        
                        //       {!image && (
                        //         <Webcam
                        //           ref={webcamRef}
                        //           screenshotFormat="image/jpeg"
                        //           audio={false}
                        //           width={350}
                        //           mirrored={false}
                        //           videoConstraints={{ facingMode: "environment" }}
                        //         />
                        //       )}
                        
                        //       {!image && (
                        //         <button
                        //           onClick={() => capture(false)}
                        //           className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                        //         >
                        //           Take Photo
                        //         </button>
                        //       )}
                        
                        //       {image && (
                        //         <div className="mt-4">
                        //           <img src={image} className="rounded border" />
                        //           <button
                        //             onClick={() => {
                        //               setImage(null);
                        //               setText("");
                        //               setReceiptData(null);
                        //             }}
                        //             className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                        //           >
                        //             Retake
                        //           </button>
                        //         </div>
                        //       )}
                        
                        //       {loading && <p className="mt-3">🧠 Reading receipt...</p>}
                        
                        //       {/* Parsed data */}
                        //       {receiptData && (
                        //         <div className="mt-4 p-3 rounded border">
                        //           <h3 className="font-semibold mb-2">📝 Parsed Receipt Data</h3>
                        //           <p><strong>Name:</strong> {receiptData.name || "Not found"}</p>
                        //           <p><strong>Address:</strong> {receiptData.address || "Not found"}</p>
                        //           <p><strong>Door Number:</strong> {receiptData.doorNumber || "Not found"}</p>
                        //           <p><strong>Postcode:</strong> {receiptData.postcode || "Not found"}</p>
                        //           {/* <p><strong>Total:</strong> {receiptData.total || "Not found"}</p> */}
                        //           {/* {receiptData.items && receiptData.items.length > 0 && (
                        //             <div>
                        //               <strong>Items:</strong>
                        //               <ul className="list-disc ml-5">
                        //                 {receiptData.items.map((item, i) => (
                        //                   <li key={i}>{item}</li>
                        //                 ))}
                        //               </ul>
                        //             </div>
                        //           )} */}
                        //         </div>
                        //       )}
                        
                        //       {/* Full OCR text */}
                        //       {/* {text && (
                        //         <div className="mt-4 bg-gray-50 p-3 rounded">
                        //           <h3 className="font-semibold mb-2">📄 Full OCR Text</h3>
                        //           <pre className="whitespace-pre-wrap text-sm">{text}</pre>
                        //         </div>
                        //       )} */}
                        //     </div>

                        //     {/* Modal Footer */}
                        //     <div className="flex justify-end gap-2 border-t px-4 py-3">
                        //       <button
                        //         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        //         onClick={() => setOptionSelected(0)}
                        //       >
                        //         Cancel
                        //       </button>
                        //       <button
                        //         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        //         onClick={() => setOptionSelected(2)}
                        //       >
                        //         Save
                        //       </button>
                        //     </div>

                        //   </div>
                        // </div>
                      }

                      {
                        // order number snap
                        // optionSelected === 3 &&
                        // <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" >
                        //   <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
                            
                        //     {/* Modal Header */}
                        //     <div className="flex justify-between items-center border-b px-4 py-3">
                        //       <h3 className="text-lg font-semibold">Scan Order Number</h3>
                        //       <button className="text-gray-500 hover:text-gray-700" onClick={() => setOptionSelected(0)}>
                        //         ✕
                        //       </button>
                        //     </div>

                        //     {/* Modal Body */}
                        //     <div className="p-4 overflow-y-auto flex-1">
                        //       <h2 className="text-xl font-bold mb-3">Receipt Scanner</h2>
                        
                        //       {!orderImage && (
                        //         <Webcam
                        //           ref={webcamRef}
                        //           screenshotFormat="image/jpeg"
                        //           audio={false}
                        //           width={350}
                        //           mirrored={false}
                        //           videoConstraints={{ facingMode: "environment" }}
                        //         />
                        //       )}
                        
                        //       {!orderImage && (
                        //         <button
                        //           onClick={() => capture(true, index)}
                        //           className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                        //         >
                        //           Take Photo
                        //         </button>
                        //       )}
                        
                        //       {orderImage && (
                        //         <div className="mt-4">
                        //           <img src={orderImage} className="rounded border" />
                        //           <button
                        //             onClick={() => {
                        //               setOrderImage(null);
                        //               setText("");
                        //               setReceiptData(null);
                        //             }}
                        //             className="mt-2 bg-gray-500 text-white px-3 py-1 rounded"
                        //           >
                        //             Retake
                        //           </button>
                        //         </div>
                        //       )}
                        
                        //       {loading && <p className="mt-3">🧠 Reading receipt...</p>}
                        
                        //       {/* Parsed data */}
                        //       {receiptData && (
                        //         <div className="mt-4 p-3 rounded border">
                        //           <h3 className="font-semibold mb-2">📝 Parsed Receipt Data</h3>
                        //           <p><strong>Order Number:</strong> {receiptData.orderNumber || "Not found"}</p>
                        //         </div>
                        //       )}
                        //     </div>

                        //     {/* Modal Footer */}
                        //     <div className="flex justify-end gap-2 border-t px-4 py-3">
                        //       <button
                        //         className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        //         onClick={() => setOptionSelected(0)}
                        //       >
                        //         Cancel
                        //       </button>
                        //       <button
                        //         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        //         onClick={() => setOptionSelected(4)}
                        //       >
                        //         Save
                        //       </button>
                        //     </div>

                        //   </div>
                        // </div>
                      }

                      {/* Order Number */}
                      {/* <div className="flex gap-4">
                        <div className="w-3/4">
                          <label className="block text-sm font-medium mb-2">
                            Order No
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Order Number"
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.orderNo}
                            name="orderNo"
                            onChange={(e) => handleInputs(index, e)}
                          />
                        </div>

                      
                        <div className="w-1/4 flex items-end">
                          <button type="button" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2" onClick={() => setOptionSelected(3)}>
                            <FaCamera />
                          </button>
                        </div>
                      </div> */}

                      {/* Submit Button */}
                      <SlideUnlockButton 
                      
                        {
                          ...{
                            onSubmit: () => handleSubmit(index),
                            status: formData.status
                          }
                        }
                      />

                      {/* Display maps button */}

                      <NavigationButtons />
                    </form>
                  </div>
                </div>
              </div>
            )
          })
        }
      </div>
    </>
  );
}