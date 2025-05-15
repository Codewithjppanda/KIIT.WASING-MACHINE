"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { IconScan, IconLoader2 } from "@tabler/icons-react";
import { Html5Qrcode } from 'html5-qrcode';
import { API_BASE_URL } from "@/lib/api";

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.machineId as string;
  
  const [scanning, setScanning] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Wrap startMachine in useCallback to prevent recreation on each render
  const startMachine = useCallback(async () => {
    setBookingStatus("loading");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/users/start/${machineId}`, {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setBookingStatus("success");
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setBookingStatus("error");
        setErrorMessage(data.message || "Failed to start machine");
      }
    } catch (error) {
      console.error("Error starting machine:", error);
      setBookingStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }, [machineId, router]);

  useEffect(() => {
    if (scannerRef.current) {
      const scanner = new Html5Qrcode("reader");
      
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        () => {
          // QR code detected successfully, no need to use the text
          setScanning(false);
          startMachine();
          scanner.stop();
        },
        (errorMessage) => {
          console.warn(`QR error: ${errorMessage}`);
        }
      );
      
      return () => {
        scanner.stop().catch(console.error);
      };
    }
  }, [startMachine]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundLines className="absolute inset-0 z-0">
        <div />
      </BackgroundLines>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Scan Machine QR Code
          </h2>
          
          {!scanning && bookingStatus === "idle" && (
            <div className="text-center py-8">
              <IconScan className="mx-auto h-20 w-20 text-blue-500 mb-4" />
              <p className="text-neutral-300 mb-6">
                Press the button below to scan the QR code on the washing machine
              </p>
              <button
                onClick={() => setScanning(true)}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Start Scanning
              </button>
            </div>
          )}
          
          {scanning && (
            <div className="mb-4">
              <div id="reader" ref={scannerRef} style={{ width: '100%', maxWidth: '500px' }} />
              <button
                onClick={() => setScanning(false)}
                className="mt-4 w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md"
              >
                Cancel Scan
              </button>
            </div>
          )}
          
          {bookingStatus === "loading" && (
            <div className="text-center py-8">
              <IconLoader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-white mt-4">Starting machine...</p>
            </div>
          )}
          
          {bookingStatus === "success" && (
            <div className="text-center py-8 bg-green-900/20 rounded-xl border border-green-500/30 px-4">
              <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-xl font-medium text-white mt-4">Success!</h3>
              <p className="text-green-300 mt-2">Machine started successfully</p>
              <p className="text-neutral-400 mt-4">Redirecting to dashboard...</p>
            </div>
          )}
          
          {bookingStatus === "error" && (
            <div className="text-center py-8 bg-red-900/20 rounded-xl border border-red-500/30 px-4">
              <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <h3 className="text-xl font-medium text-white mt-4">Error</h3>
              <p className="text-red-300 mt-2">{errorMessage}</p>
              <button
                onClick={() => {
                  setBookingStatus("idle");
                  setErrorMessage("");
                }}
                className="mt-6 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => router.push("/machines")}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md"
            >
              Back to Machines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
