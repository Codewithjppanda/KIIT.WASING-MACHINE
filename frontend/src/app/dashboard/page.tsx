"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { 
  IconWashMachine, 
  IconHistory, 
  IconAlertCircle,
  IconLoader2,
  IconLogout,
  IconCalendarEvent,
  IconQrcode,
  IconEye
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { API_BASE_URL } from "@/lib/api";
import { DashboardButton } from "@/components/ui/dashboard-button";
import { StatusLabel } from "@/components/ui/status-label";

// Define a user type at the top of your file
type User = {
  name: string;
  email: string;
  floor: string;
  washesLeft: number;
};

// Define booking type
type Booking = {
  id: string;
  machineId: string;
  machineName: string;
  startTime: string;
  endTime: string;
  status: string;
};

// Define API response booking type
type ApiBooking = {
  id: string;
  machineId: string;
  machine?: {
    machineNumber: string | number;
  };
  startTime: string;
  endTime: string;
  status?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

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
    
    // Fetch active bookings
    const fetchActiveBookings = async () => {
      setBookingsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found");
        }
        
        const response = await fetch(`${API_BASE_URL}/api/users/bookings/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform the data to include machine names
          const transformedBookings = data.bookings.map((booking: ApiBooking) => ({
            id: booking.id,
            machineId: booking.machineId,
            machineName: `Machine ${booking.machine?.machineNumber || booking.machineId}`,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status || 'Booked'
          }));
          
          setActiveBookings(transformedBookings);
        } else {
          console.warn("Failed to fetch active bookings");
          setActiveBookings([]);
        }
      } catch (error) {
        console.error("Error fetching active bookings:", error);
        setActiveBookings([]);
      } finally {
        setBookingsLoading(false);
      }
    };
    
    fetchActiveBookings();
  }, [router]);

  // Helper function to check if a booking can be started now
  const canStartBooking = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Allow starting 10 minutes before the booking time
    const startWindow = new Date(start);
    startWindow.setMinutes(startWindow.getMinutes() - 10);
    
    return now >= startWindow && now <= end;
  };
  
  // Format the booking time for display
  const formatBookingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
    };
    
    // If same day, only show date once
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
    }
    
    return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
  };

  const handleLogout = async () => {
    // Clear the localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userFloor");
    localStorage.removeItem("washesLeft");
    
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
    <div className="min-h-screen bg-black">
      <BackgroundLines className="fixed inset-0">
        <div />
      </BackgroundLines>
      
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hello, {user?.name || "Loading..."}
              </h1>
              <p className="text-neutral-400 mt-1">{user?.email}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusLabel 
                label="Floor" 
                value={user?.floor || "Loading..."}
              />
              <StatusLabel 
                label="Washes Left" 
                value={user?.washesLeft || 0}
                valueColor="text-green-400"
              />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <IconLogout className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Active Bookings Section */}
          <div className="max-w-5xl mx-auto w-full mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <IconCalendarEvent className="h-5 w-5 text-blue-400 mr-2" />
                  Active Bookings
                </h3>
                <button 
                  onClick={() => router.push('/history')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all bookings
                </button>
              </div>
              
              {bookingsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <IconLoader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : activeBookings.length > 0 ? (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-white">{booking.machineName}</h4>
                          <p className="text-sm text-zinc-400">
                            {formatBookingTime(booking.startTime, booking.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/booking-confirmation/${booking.machineId}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full text-sm"
                          >
                            <IconEye className="h-4 w-4" />
                            <span>Details</span>
                          </button>
                          {canStartBooking(booking.startTime, booking.endTime) && (
                            <button
                              onClick={() => router.push(`/scan/${booking.machineId}`)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                            >
                              <IconQrcode className="h-4 w-4" />
                              <span>Scan to Start</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-800/30 rounded-xl p-6 text-center">
                  <p className="text-zinc-400">You don&apos;t have any active bookings.</p>
                  <button
                    onClick={() => router.push('/machines')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                  >
                    Book a Machine
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Main Content Section */}
          <div className="max-w-5xl mx-auto w-full mt-8 flex-grow flex flex-col items-center">
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
