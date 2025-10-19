
"use client";

import * as React from "react";
import { BarcodeScanner as Scanner } from "react-qr-barcode-scanner";
import { LoaderCircle, CameraOff, ScanLine } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScanSuccess: (result: string) => void;
}

export default function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [lastResult, setLastResult] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        // Stop the stream immediately, the scanner will request it again
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    };
    getCameraPermission();
  }, []);

  const handleScan = (error: any, result: any) => {
    if (result && result.text !== lastResult) {
      setLastResult(result.text);
      onScanSuccess(result.text);
    }
    if (error) {
      // Errors are frequent (e.g. no code found), so we don't log them to avoid console spam
    }
  };

  if (hasCameraPermission === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <LoaderCircle className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (hasCameraPermission === false) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black p-4">
        <Alert variant="destructive" className="max-w-sm">
          <CameraOff className="h-4 w-4" />
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please enable camera permissions in your browser settings to use the scanner.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <Scanner
        onUpdate={handleScan}
        containerStyle={{ width: '100%', height: '100%' }}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-3/4 max-w-sm aspect-video">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-500/70 animate-scan"></div>
        </div>
      </div>
       <div className="absolute bottom-0 left-0 right-0 p-8 text-center text-white bg-gradient-to-t from-black/80 to-transparent">
        <ScanLine className="w-10 h-10 mx-auto mb-2"/>
        <h2 className="text-xl font-bold">Scan Barcode / QR Code</h2>
        <p className="text-muted-foreground">Position the code inside the frame to add an item to your list.</p>
      </div>
      <style jsx>{`
        .animate-scan {
          animation: scan 2.5s infinite ease-in-out;
        }
        @keyframes scan {
          0% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
          100% { transform: translateY(-80px); }
        }
      `}</style>
    </div>
  );
}
