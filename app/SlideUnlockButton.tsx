"use client";

import { useState, useEffect } from "react";

export default function SlideUnlockButton({ onSubmit, status }: { onSubmit: () => void, status: number }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const maxMove = 280; // max distance to slide

  const handleMove = (movement: number) => {
    setDragX((prev) => Math.max(0, Math.min(prev + movement, maxMove)));
  };

  const handleStart = () => setDragging(true);

  const handleEnd = () => {
    if (dragX >= maxMove) {
      // trigger submit
      onSubmit();

      // vibrate device (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      // stick for 500ms before resetting
      setDragX(maxMove);
      setTimeout(() => setDragX(0), 500);
    } else {
      // reset immediately if not fully slid
      setDragX(0);
    }

    setDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      handleMove(e.movementX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const touch = e.touches[0];
      handleMove(touch.clientX - dragX);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, dragX]);

  return (
    
        status === 0 ?
        <>
            <div className="relative w-full h-24 flex items-center bg-gray-200 rounded-xl px-4 overflow-hidden">
            {/* Progress fill */}
            <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-gray-400 to-indigo-600 rounded-xl transition-all duration-200"
            style={{ width: `${(dragX / maxMove) * 100}%` }}
            ></div>

            {/* Track text */}
            <span className="absolute left-1/2 transform -translate-x-1/2 text-gray-400 font-medium pointer-events-none">
                Slide to Start
            </span>

            {/* Sliding button */}
            <button
                type="button"
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                className="absolute left-0 inline-flex items-center bg-white text-black-600 px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-grab select-none transition-transform duration-200"
                style={{ transform: `translateX(${dragX}px)` }}
            >
                Start Your Journey
                <span
                className="ml-2 transition-transform duration-200"
                style={{ transform: `translateX(${dragX / maxMove * 10}px)` }}
                >
                ➔
                </span>
            </button>
            </div>
        
        </>

        : status === 1 ?
            <>
                <div className="relative w-full h-24 flex items-center bg-green-200 rounded-xl px-4 overflow-hidden">
                    {/* Progress fill */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-indigo-600 rounded-xl transition-all duration-200"
                        style={{ width: `${(dragX / maxMove) * 100}%` }}
                    ></div>

                    {/* Track text */}
                    <span className="absolute left-1/2 transform -translate-x-1/2 text-green-200 font-medium pointer-events-none">
                        Slide to Complete
                    </span>

                    {/* Sliding button */}
                    <button
                        type="button"
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                        className="absolute left-0 inline-flex items-center bg-green text-green-600 px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-grab select-none transition-transform duration-200"
                        style={{ transform: `translateX(${dragX}px)` }}
                    >
                        Complete Your Journey
                        <span
                        className="ml-2 transition-transform duration-200"
                        style={{ transform: `translateX(${dragX / maxMove * 10}px)` }}
                        >
                        ➔
                        </span>
                    </button>
                </div>
            </>
        :
         status === 2 ?
            <>
                <div className="relative w-full h-24 flex items-center bg-green-500 rounded-xl px-4 overflow-hidden">
                    {/* Progress fill */}
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-indigo-600 rounded-xl transition-all duration-200"
                        style={{ width: `${(dragX / maxMove) * 100}%` }}
                    ></div>

                    {/* Track text */}
                    <span className="absolute left-1/2 transform -translate-x-1/2 text-green-200 font-medium pointer-events-none">
                        Slide to Cancel
                    </span>

                    {/* Sliding button */}
                    <button
                        type="button"
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                        className="absolute left-0 inline-flex items-center bg-green-900 text-green-600 px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-grab select-none transition-transform duration-200"
                        style={{ transform: `translateX(${dragX}px)` }}
                    >
                        Completed
                        <span
                        className="ml-2 transition-transform duration-200"
                        style={{ transform: `translateX(${dragX / maxMove * 10}px)` }}
                        >
                        ➔
                        </span>
                    </button>
                </div>
            </>
            : status === 3 &&

            <div className="relative w-full h-24 flex items-center bg-red-200 rounded-xl px-4 overflow-hidden">
                {/* Progress fill */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-200 to-indigo-600 rounded-xl transition-all duration-200"
                    style={{ width: `${(dragX / maxMove) * 100}%` }}
                ></div>

                {/* Track text */}
                <span className="absolute left-1/2 transform -translate-x-1/2 text-red-400 font-medium pointer-events-none">
                    Slide to Start
                </span>

                {/* Sliding button */}
                <button
                    type="button"
                    onMouseDown={handleStart}
                    onTouchStart={handleStart}
                    className="absolute left-0 inline-flex items-center bg-red-900 text-red-600 px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-grab select-none transition-transform duration-200"
                    style={{ transform: `translateX(${dragX}px)` }}
                >
                    Canceled
                    <span
                    className="ml-2 transition-transform duration-200"
                    style={{ transform: `translateX(${dragX / maxMove * 10}px)` }}
                    >
                    ➔
                    </span>
                </button>
            </div>
    
    
  );
}