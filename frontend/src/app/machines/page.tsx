"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { API_BASE_URL } from "@/lib/api";
import Button from "@/components/ui/button";
import Link from "next/link";
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

type Machine = {
  id: string;
  status: "vacant" | "occupied" | "washing" | "user-booked";
  floor: string;
  name: string; // e.g. "Machine 1"
  booking?: {
    startTime: Date | string;
    endTime: Date | string;
  };
};

type TimeSlot = {
  machine: string;
  slot: {
    id: number;
    startTime: Date;
    endTime: Date;
    label: string;
  };
};

type ApiBooking = {
  id: string;
  machineId: string;
  machine?: {
    machineNumber: string | number;
    status: string;
  };
  startTime: string;
  endTime: string;
  status?: string;
};

const BookingSuccess = ({ startTime, endTime, onClose }: { 
  startTime: Date; 
  endTime: Date; 
  onClose: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div className="bg-zinc-900 p-8 rounded-xl max-w-md w-full mx-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white text-center mb-4">Booking Confirmed!</h3>
          <div className="text-neutral-400 text-center mb-6">
            <p>Your machine is booked for:</p>
            <p className="text-white mt-2">
              {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={onClose}
          >
            Got it
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ScanningStatus = ({ timeLeft }: { timeLeft: number }) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <CountdownCircleTimer
        isPlaying
        duration={timeLeft}
        colors={['#22c55e', '#F7B801', '#A30000']}
        colorsTime={[timeLeft, timeLeft/2, 0]}
        size={50}
      >
        {({ remainingTime }) => (
          <div className="text-xs text-white">
            {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}
          </div>
        )}
      </CountdownCircleTimer>
      <span className="text-sm text-neutral-400">Time remaining for scan</span>
    </div>
  );
};

export default function MachinesPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMachineId, setLoadingMachineId] = useState<string | null>(null);
  const [userFloor, setUserFloor] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [booking, setBooking] = useState<{ machine: string; startTime: Date; endTime: Date } | null>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{startTime: Date; endTime: Date} | null>(null);
  const [userBookings, setUserBookings] = useState<{machineId: string; startTime: Date; endTime: Date}[]>([]);

  const mapStatusToUI = (status: string) => {
    // Map backend status to frontend status
    switch(status) {
      case 'Available': return 'vacant';
      case 'Washing': return 'washing';
      case 'Ready to Collect': return 'occupied';
      default: return status.toLowerCase();
    }
  };

  const fetchMachinesData = useCallback(async () => {
    try {
      const machinesResponse = await fetch(`${API_BASE_URL}/api/users/machines/status`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      if (!machinesResponse.ok) {
        throw new Error("Failed to fetch machines");
      }
      
      const machinesData = await machinesResponse.json();
      
      // Transform data to match expected format
      const transformedMachines = (machinesData.machines || []).map((machine: {
        id: string;
        machineNumber: number | string;
        status: string;
        booking?: {
          startTime: Date | string;
          endTime: Date | string;
        };
      }) => ({
        id: machine.id,
        status: mapStatusToUI(machine.status),
        floor: localStorage.getItem("userFloor") || userFloor,
        name: `Machine ${machine.id}`,
        booking: machine.booking
      }));
      
      setMachines(transformedMachines);
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  }, [userFloor]);

  useEffect(() => {
    // Remove the user data fetch and use localStorage directly:
    const userFloor = localStorage.getItem("userFloor");
    if (userFloor) {
      setUserFloor(userFloor);
    } else {
      router.push("/login");
      return;
    }

    // Load existing booking from localStorage and clear if expired
    const loadLocalBooking = () => {
      const bm = localStorage.getItem("bookingMachineId");
      const bs = localStorage.getItem("bookingStartTime");
      const be = localStorage.getItem("bookingEndTime");
      
      if (bm && bs && be) {
        // Compute current IST time
        const localNow = new Date();
        const utcMs = localNow.getTime() + localNow.getTimezoneOffset() * 60000;
        const nowIST = new Date(utcMs + 5.5 * 60 * 60000);
        const startDate = new Date(bs);
        const endDate = new Date(be);
        
        if (nowIST > endDate) {
          // Booking window expired, clear booking
          localStorage.removeItem("bookingMachineId");
          localStorage.removeItem("bookingStartTime");
          localStorage.removeItem("bookingEndTime");
          setBooking(null);
        } else {
          setBooking({ machine: bm, startTime: startDate, endTime: endDate });
          console.log("Loaded booking from localStorage:", { machine: bm, startTime: startDate, endTime: endDate });
        }
      }
    };
    
    const fetchUserBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/api/users/bookings/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.bookings && data.bookings.length > 0) {
            // Transform all active bookings
            const activeBookings = data.bookings.map((b: ApiBooking) => ({
              machineId: b.machineId,
              startTime: new Date(b.startTime),
              endTime: new Date(b.endTime)
            }));
            
            setUserBookings(activeBookings);
            console.log("Loaded user bookings from API:", activeBookings);
            
            // Use the most recent booking
            const latestBooking = data.bookings[0];
            const startDate = new Date(latestBooking.startTime);
            const endDate = new Date(latestBooking.endTime);
            
            // Set the booking from API data
            setBooking({ 
              machine: latestBooking.machineId, 
              startTime: startDate, 
              endTime: endDate 
            });
            
            // Also update localStorage
            localStorage.setItem("bookingMachineId", latestBooking.machineId);
            localStorage.setItem("bookingStartTime", startDate.toISOString());
            localStorage.setItem("bookingEndTime", endDate.toISOString());
          }
        } else {
          // If API fails, fall back to localStorage
          loadLocalBooking();
        }
      } catch (error) {
        console.error("Error fetching user bookings:", error);
        // Fall back to localStorage
        loadLocalBooking();
      }
    };
    
    // First fetch machines, then fetch bookings
    const fetchData = async () => {
      await fetchMachinesData();
      await fetchUserBookings();
      setLoading(false);
    };
    
    fetchData();
  }, [router, fetchMachinesData]);

  const handleBookMachine = async (machineId: string, startTime: Date, endTime: Date) => {
    if (!startTime || !endTime) {
      toast.error("Please select a time slot");
      return;
    }
    setLoadingMachineId(machineId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in again");
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ machineId, startTime: startTime.toISOString(), endTime: endTime.toISOString() }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse response:", e);
        toast.error("Server returned an invalid response");
        return;
      }
      
      if (!response.ok) {
        // Show the specific error message from the backend
        const errorMessage = data.message || "Failed to book machine";
        console.error("Booking error:", data);
        
        // Show detailed error message with any additional details
        if (data.details) {
          console.log("Error details:", data.details);
          toast.error(
            <div>
              <p>{errorMessage}</p>
              {data.details.floor && (
                <p className="text-sm mt-2">
                  Your floor: {data.details.floor}<br />
                  Allowed days: {data.details.allowedDays?.join(", ")}
                </p>
              )}
              {data.details.currentTime && (
                <p className="text-sm mt-2">
                  Current time: {new Date(data.details.currentTime).toLocaleTimeString()}<br />
                  Allowed from: {new Date(data.details.allowedStartTime).toLocaleTimeString()}
                </p>
              )}
            </div>,
            {
              duration: 5000,
              style: {
                maxWidth: '500px',
                padding: '16px',
              },
            }
          );
        } else {
          toast.error(errorMessage);
        }
        return;
      }
      
      // Persist booking locally after successful DB write
      localStorage.setItem("bookingMachineId", machineId);
      localStorage.setItem("bookingStartTime", startTime.toISOString());
      localStorage.setItem("bookingEndTime", endTime.toISOString());
      setBooking({ machine: machineId, startTime, endTime });
      setBookingDetails({ startTime, endTime });
      setShowBookingSuccess(true);
      
      // Show success message with remaining washes
      toast.success(
        <div>
          <p>Booking confirmed!</p>
          <p className="text-sm mt-2">You have {data.washesLeft} washes left</p>
          <p className="text-sm mt-1">{data.note}</p>
        </div>,
        {
          duration: 5000,
          style: {
            maxWidth: '500px',
            padding: '16px',
          },
        }
      );
      
      await fetchMachinesData();
    } catch (error) {
      console.error("Error booking machine:", error);
      toast.error(
        <div>
          <p>Network error</p>
          <p className="text-sm mt-2">Please check your connection and try again</p>
        </div>
      );
    } finally {
      setLoadingMachineId(null);
    }
  };

  const prepareDisplayMachines = useCallback(() => {
    if (!machines.length) return [];
    
    // Create a copy of machines to avoid modifying the original
    const displayMachines = [...machines];
    
    // Find machines that aren't in the list but are booked by the user
    userBookings.forEach(userBooking => {
      // Check if booked machine is already in our list
      const machineExists = displayMachines.some(m => m.id === userBooking.machineId);
      
      if (!machineExists) {
        // Add the booked machine to the display list
        displayMachines.push({
          id: userBooking.machineId,
          status: 'user-booked', // Special status for our UI logic
          floor: userFloor,
          name: `Machine ${userBooking.machineId}`,
          booking: {
            startTime: userBooking.startTime,
            endTime: userBooking.endTime
          }
        });
        console.log(`Added missing booked machine ${userBooking.machineId} to display list`);
      }
    });
    
    return displayMachines;
  }, [machines, userBookings, userFloor]);

  const availableMachines = useMemo(() => {
    const displayMachines = prepareDisplayMachines();
    
    return displayMachines.filter(machine => {
      const isAvailable = machine.status === 'vacant';
      
      // Check if machine is booked by user (from current booking)
      const isCurrentBooking = booking?.machine === machine.id;
      
      // Check if machine is in user's bookings list
      const isUserBooked = userBookings.some(b => b.machineId === machine.id);
      
      // Special status we added for missing machines
      const isUserBookedStatus = machine.status === 'user-booked';
      
      console.log(`Machine ${machine.id} status=${machine.status} isAvailable=${isAvailable} isBooked=${isCurrentBooking || isUserBooked}`);
      
      return isAvailable || isCurrentBooking || isUserBooked || isUserBookedStatus;
    });
  }, [prepareDisplayMachines, booking, userBookings]);

  // Determine if the user can book (for today or tomorrow) based on Indian Standard Time
  const canFloorBookToday = (floor: string): { canBook: boolean, isDayBefore: boolean } => {
    // Current IST time
    const localNow = new Date();
    const utcMs = localNow.getTime() + localNow.getTimezoneOffset() * 60000;
    const nowIST = new Date(utcMs + 5.5 * 60 * 60000);
    // Day names in IST
    const todayName = nowIST.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    const tomorrowIST = new Date(nowIST.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowName = tomorrowIST.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

    const allowedDays: Record<string, string[]> = {
      '4th Floor': ['Monday', 'Friday'],
      '3rd Floor': ['Thursday', 'Sunday'],
      '2nd Floor': ['Wednesday', 'Saturday'],
      '1st Floor': ['Sunday', 'Wednesday'],
      'Ground Floor': ['Sunday', 'Wednesday']
    };

    const isAllowedToday = allowedDays[floor]?.includes(todayName) || false;
    const isAllowedTomorrow = allowedDays[floor]?.includes(tomorrowName) || false;
    // After 6 PM IST?
    const sixPMIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate(), 18, 0, 0, 0);
    const isAfter6PM = nowIST >= sixPMIST;

    return {
      canBook: isAllowedToday || (isAllowedTomorrow && isAfter6PM),
      isDayBefore: !isAllowedToday && isAllowedTomorrow && isAfter6PM
    };
  };

  // Generate available slots: dynamic 45-min 'book now' and scheduled buffer slots
  const getAvailableTimeSlots = (): { id: number; startTime: Date; endTime: Date; label: string }[] => {
    const bookingStatus = canFloorBookToday(userFloor);
    if (!bookingStatus.canBook) return [];
    // Compute current IST time
    const localNow = new Date();
    const utcMs = localNow.getTime() + localNow.getTimezoneOffset() * 60000;
    const nowIST = new Date(utcMs + 5.5 * 60 * 60000);
    // Booking day in IST
    const bookingDay = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
    if (bookingStatus.isDayBefore) bookingDay.setDate(bookingDay.getDate() + 1);
    // Durations
    const washMs = 45 * 60 * 1000;       // 45 min wash
    const totalMs = 55 * 60 * 1000;      // scheduled wash + buffer
    // End-of-day limit at 18:00 IST
    const dayLimit = new Date(bookingDay);
    dayLimit.setHours(18, 0, 0, 0);
    const slots: { id: number; startTime: Date; endTime: Date; label: string }[] = [];
    // Time formatter in IST
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    // If booking for today, allow a 45-min "book now" wash starting immediately (up to 18:00)
    if (!bookingStatus.isDayBefore) {
      const earliestStart = new Date(bookingDay);
      earliestStart.setHours(10, 0, 0, 0);
      if (nowIST >= earliestStart && nowIST < dayLimit) {
        const dynamicStart = nowIST;
        const dynamicEnd = new Date(dynamicStart.getTime() + washMs);
        slots.push({ id: -1, startTime: dynamicStart, endTime: dynamicEnd, label: `${fmt(dynamicStart)} - ${fmt(dynamicEnd)}` });
      }
    }
    // Generate hourly start slots (on the hour) that don't overlap dynamic slot
    for (let hour = 10; hour < 18; hour++) {
      const startTime = new Date(bookingDay);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + totalMs);
      if (endTime > dayLimit) continue;
      // Skip slots already passed
      if (endTime <= nowIST) continue;
      // Skip overlapping dynamic slot
      const dyn = slots.find((s: { id: number; startTime: Date; endTime: Date; label: string }) => s.id === -1);
      if (dyn && startTime < dyn.endTime && endTime > dyn.startTime) continue;
      slots.push({ id: hour - 10, startTime, endTime, label: `${fmt(startTime)} - ${fmt(endTime)}` });
    }
    return slots;
  };

  const getAllowedDays = (floor: string): string => {
    const allowedDays: Record<string, string[]> = {
      '4th Floor': ['Monday', 'Friday'],
      '3rd Floor': ['Thursday', 'Sunday'],
      '2nd Floor': ['Wednesday', 'Saturday'],
      '1st Floor': ['Sunday', 'Wednesday'],
      'Ground Floor': ['Sunday', 'Wednesday']
    };
    
    return allowedDays[floor]?.join(' and ') || 'restricted days';
  };

  const getScanButtonState = (start: Date, end: Date) => {
    const localNow = new Date();
    const utcMs = localNow.getTime() + localNow.getTimezoneOffset() * 60000;
    const nowIST = new Date(utcMs + 5.5 * 60 * 60000);
    const scanWindow = new Date(start.getTime() - 10 * 60000);
    
    if (nowIST < scanWindow) {
      const diffMs = scanWindow.getTime() - nowIST.getTime();
      const diffMins = Math.ceil(diffMs / (1000 * 60));
      return {
        canScan: false,
        text: `Scanning available in ${diffMins} minutes`,
        timeLeft: diffMs / 1000
      };
    } else if (nowIST <= end) {
      const timeLeftMs = end.getTime() - nowIST.getTime();
      return {
        canScan: true,
        text: 'Scan to Start',
        timeLeft: timeLeftMs / 1000
      };
    } else {
      return {
        canScan: false,
        text: 'Booking expired',
        timeLeft: 0
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <Toaster position="top-center" />
      <AnimatePresence>
        {showBookingSuccess && bookingDetails && (
          <BookingSuccess 
            startTime={bookingDetails.startTime}
            endTime={bookingDetails.endTime}
            onClose={() => setShowBookingSuccess(false)}
          />
        )}
      </AnimatePresence>
      
      <BackgroundLines className="absolute inset-0 z-0">
        <div />
      </BackgroundLines>
      
      <div className="relative z-10 min-h-screen px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-white">
              Available Washing Machines
            </h2>
            <Link href="/dashboard">
              <Button variant="outline" size="md">
              Back to Dashboard
              </Button>
            </Link>
          </div>
          
          {availableMachines.length === 0 ? (
            <div className="bg-zinc-900/80 rounded-xl p-8 text-center">
              <p className="text-white text-lg">No vacant machines available on your floor right now.</p>
              <p className="text-neutral-400 mt-2">Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMachines.map(machine => {
                // Find if this machine is in any of the user's bookings
                const userBooking = userBookings.find(b => b.machineId === machine.id);
                
                // Use either booking from state, or from userBookings list
                const bookingToUse = 
                  (booking?.machine === machine.id) ? booking : 
                  userBooking ? { machine: userBooking.machineId, startTime: userBooking.startTime, endTime: userBooking.endTime } :
                  null;
                
                if (bookingToUse) {
                  const scanState = getScanButtonState(bookingToUse.startTime, bookingToUse.endTime);
                  return (
                    <motion.div
                      key={machine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-zinc-900/80 rounded-xl p-6 border border-blue-500/20"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <h3 className="text-white font-medium">{machine.name}</h3>
                      </div>
                      <p className="text-neutral-400 mb-4">
                        Booked for {bookingToUse.startTime.toLocaleDateString()}, 
                        {bookingToUse.startTime.toLocaleTimeString()} - {bookingToUse.endTime.toLocaleTimeString()}
                      </p>
                      
                      {scanState.timeLeft > 0 && <ScanningStatus timeLeft={scanState.timeLeft} />}
                      
                      <Button
                        variant={scanState.canScan ? "primary" : "outline"}
                        size="lg"
                        className="w-full"
                        onClick={() => scanState.canScan && router.push(`/scan/${machine.id}`)}
                        disabled={!scanState.canScan}
                      >
                        {scanState.text}
                      </Button>
                    </motion.div>
                  );
                }
                
                // Render vacant machine (same as before)
                return (
                  <div key={machine.id} className="bg-zinc-900/80 rounded-xl p-6 border border-green-500/20">
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <h3 className="text-white font-medium">{machine.name}</h3>
                    </div>
                    <p className="text-neutral-400 mb-4">Status: Available</p>
                    
                    {/* Time Slot Selection Dropdown */}
                    <div className="mb-4">
                      <label htmlFor={`timeSlot-${machine.id}`} className="text-white mb-2 block">
                        Select a time slot:
                      </label>
                      {getAvailableTimeSlots().length > 0 ? (
                        <select
                          id={`timeSlot-${machine.id}`}
                          onChange={(e) => {
                            const slotId = parseInt(e.target.value);
                            const slot = getAvailableTimeSlots().find((s: { id: number; startTime: Date; endTime: Date; label: string }) => s.id === slotId);
                            if (slot) {
                              setSelectedTimeSlot({ machine: machine.id, slot });
                            }
                          }}
                          value={selectedTimeSlot?.machine === machine.id ? selectedTimeSlot.slot.id : ""}
                          className="w-full p-2 rounded-md bg-zinc-800 text-white border-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>Choose a time</option>
                          {getAvailableTimeSlots().map((slot: { id: number; startTime: Date; endTime: Date; label: string }) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg">
                          {!canFloorBookToday(userFloor).canBook ? 
                            `Your floor (${userFloor}) can only book on ${getAllowedDays(userFloor)}` : 
                            "No time slots available for today. Slots open at 6 PM the day before."
                          }
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (selectedTimeSlot?.machine === machine.id) {
                          handleBookMachine(machine.id, selectedTimeSlot.slot.startTime, selectedTimeSlot.slot.endTime);
                        } else {
                          // No selection made
                        }
                      }}
                      disabled={loadingMachineId === machine.id}
                      className={`btn btn-secondary ${loadingMachineId === machine.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loadingMachineId === machine.id ? (
                        <div className="mx-auto h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Book Now'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-8 bg-zinc-900/60 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">All Machines Status</h3>
            {machines.length === 0 ? (
              <p className="text-white">No machines found. Check back later.</p>
            ) : (
            <div className="flex flex-wrap gap-2">
                {machines.map(machine => (
                  <div 
                    key={machine.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      machine.status === 'vacant' 
                        ? 'bg-green-500/20 text-green-400' 
                        : machine.status === 'washing' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {machine.name}: {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                  </div>
                ))}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
