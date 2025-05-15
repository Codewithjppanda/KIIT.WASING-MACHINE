"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { 
  IconWashMachine, 
  IconHistory, 
  IconAlertCircle,
  IconLoader2,
  IconLogout 
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { API_BASE_URL } from "@/lib/api";
import { DashboardButton } from "@/components/ui/dashboard-button";

// Define a user type at the top of your file
type User = {
  name: string;
  email: string;
  floor: string;
  washesLeft: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Get user data from localStorage first
    const userName = localStorage.getItem("userName") || "Student";
    const userEmail = localStorage.getItem("userEmail") || "student@kiit.ac.in";
    const userFloor = localStorage.getItem("userFloor") || "3rd Floor";
    
    // Set initial user data without washes
    setUser({
      name: userName,
      email: userEmail,
      floor: userFloor,
      washesLeft: 0 // Will be updated after API call
    });
    
    // Fetch washes left from API
    const fetchWashesLeft = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users/washes-left`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          // If token expired or server error, try to get washes left from localStorage
          console.warn("Failed to fetch washes left, using stored value");
          const storedWashesLeft = localStorage.getItem("washesLeft");
          if (storedWashesLeft) {
            return setUser(prev => prev ? { ...prev, washesLeft: parseInt(storedWashesLeft) } : null);
          }
          throw new Error(`Failed to fetch washes left, status: ${response.status}`);
        }
        
        const data = await response.json();
        // Store the latest value in localStorage for future fallback
        localStorage.setItem("washesLeft", data.washesLeft.toString());
        setUser(prev => prev ? { 
          ...prev, 
          washesLeft: data.washesLeft 
        } : null);
      } catch (error) {
        console.error(error);
        // Set a default value if all else fails
        setUser(prev => prev ? { ...prev, washesLeft: prev.washesLeft || 0 } : null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWashesLeft();
  }, [router]);

  const handleLogout = async () => {
    // Clear the localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userFloor");
    
    // Sign out from NextAuth session
    await signOut({ redirect: false });
    
    // Redirect to login page
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <IconLoader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundLines className="absolute inset-0 z-0">
        <div />
      </BackgroundLines>
      
      <div className="relative z-10 min-h-screen flex flex-col px-4 py-10">
        {/* Header/Profile Section */}
        <div className="max-w-5xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl p-6 border border-zinc-800"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Hello, {user?.name || "Student"}
                </h2>
                <p className="text-zinc-400">
                  {user?.email || "student@kiit.ac.in"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-zinc-800 rounded-lg">
                  <p className="text-zinc-400 text-sm">Floor</p>
                  <p className="text-white font-medium">{user?.floor || "Not specified"}</p>
                </div>
                <div className="px-4 py-2 bg-zinc-800 rounded-lg">
                  <p className="text-zinc-400 text-sm">Washes Left</p>
                  <p className="text-green-400 font-medium">{user?.washesLeft || 20}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                >
                  <IconLogout className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Main Content Section */}
        <div className="max-w-5xl mx-auto w-full mt-8 flex-grow flex flex-col items-center justify-center">
          <h1 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-200 to-neutral-600 text-4xl md:text-6xl font-bold mb-12">
            KIIT Washing Machine
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            <CardHoverEffect onClick={() => router.push('/machines')}>
              <div className="bg-zinc-900 p-6 rounded-xl h-full flex flex-col items-center justify-center text-center">
                <IconWashMachine className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Book Washing Machine</h3>
                <p className="text-zinc-400">View available machines and book a slot</p>
              </div>
            </CardHoverEffect>
            
            <CardHoverEffect onClick={() => router.push('/history')}>
              <div className="bg-zinc-900 p-6 rounded-xl h-full flex flex-col items-center justify-center text-center">
                <IconHistory className="h-16 w-16 text-purple-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Booking History</h3>
                <p className="text-zinc-400">View your past and upcoming bookings</p>
              </div>
            </CardHoverEffect>
          </div>
          
          <div className="mt-10 w-full max-w-3xl">
            <CardHoverEffect>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-amber-500/20 p-2 rounded-full">
                  <IconAlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-white font-medium">Remember</h4>
                  <p className="text-zinc-400 text-sm">After booking, you need to scan the QR code at the machine to start it.</p>
                </div>
              </div>
            </CardHoverEffect>
          </div>
          
          {/* Add the Explore Now and Contact Support buttons */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
            <DashboardButton 
              variant="primary" 
              onClick={() => router.push('/machines')}
            >
              Explore Now
            </DashboardButton>
            <DashboardButton 
              variant="secondary" 
              onClick={() => router.push('/contact')}
            >
              Contact Support
            </DashboardButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Aceternity UI Card Hover Effect component
function CardHoverEffect({ 
  children, 
  onClick,
  className 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div 
      onClick={onClick}
      className={`group relative w-full ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 blur transition duration-300 group-hover:opacity-50" />
      <div className="relative rounded-xl">
        {children}
      </div>
    </div>
  );
}
