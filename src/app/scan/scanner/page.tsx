"use client";

export default function ScannerPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-green-400 font-bold text-2xl mb-6">GROC_AI</h1>

      <div className="border-4 border-gray-500 rounded-3xl p-10 text-center">
        <div className="text-white text-lg font-semibold">
          Scan Barcode / QR Code
        </div>
        <p className="text-gray-400 text-sm mt-2">
          Position the code inside the frame to add an item to your list.
        </p>
      </div>
    </div>
  );
}
