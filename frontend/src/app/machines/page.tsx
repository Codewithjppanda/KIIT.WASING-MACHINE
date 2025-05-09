"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";

type Machine = {
  id: string;
  status: "vacant" | "occupied" | "washing";
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

export default function MachinesPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFloor, setUserFloor] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const mapStatusToUI = (status: string) => {
    // Map backend status to frontend status
    switch(status) {
      case 'Available': return 'vacant';
      case 'Washing': return 'washing';
      case 'Ready to Collect': return 'occupied';
      default: return status.toLowerCase();
    }
  };

  useEffect(() => {
    // Remove the user data fetch and use localStorage directly:
    const userFloor = localStorage.getItem("userFloor");
    if (userFloor) {
      setUserFloor(userFloor);
    } else {
      router.push("/login");
      return;
    }

    // Fetch machines
    const fetchMachines = async () => {
      try {
        // Fetch machines
        const machinesResponse = await fetch("http://localhost:5000/api/users/machines/status", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        
        if (!machinesResponse.ok) {
          throw new Error("Failed to fetch machines");
        }
        
        const machinesData = await machinesResponse.json();
        console.log("Machine data received:", machinesData);

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
          name: `Machine ${machine.machineNumber}`,
          booking: machine.booking
        }));

        console.log("Transformed machines:", transformedMachines);
        setMachines(transformedMachines);
      } catch (error) {
        console.error("User fetch error details:", error);
        // Fall back to localStorage data if available
        const floorFromStorage = localStorage.getItem("userFloor");
        if (floorFromStorage) {
          setUserFloor(floorFromStorage);
          console.log("Using floor from localStorage:", floorFromStorage);
        } else {
          throw error; // Rethrow if we can't recover
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, [router]);

  const handleBookMachine = (machineId: string, startTime: Date, endTime: Date) => {
    if (!startTime || !endTime) {
      alert("Please select a time slot");
      return;
    }
    
    // Store booking details in localStorage or state
    localStorage.setItem("bookingMachineId", machineId);
    localStorage.setItem("bookingStartTime", startTime.toISOString());
    localStorage.setItem("bookingEndTime", endTime.toISOString());
    
    // Navigate to scan page
    router.push(`/scan/${machineId}`);
  };

  // Filter to show only vacant machines on the user's floor
  const availableMachines = machines.filter(
    machine => machine.status === 'vacant' && machine.floor === userFloor
  );

  // Modify canFloorBookToday to also check if tomorrow is a booking day
  const canFloorBookToday = (floor: string): { canBook: boolean, isDayBefore: boolean } => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const tomorrowName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
    
    const allowedDays: Record<string, string[]> = {
      '4th Floor': ['Monday', 'Friday'],
      '3rd Floor': ['Thursday', 'Sunday'],
      '2nd Floor': ['Wednesday', 'Saturday'],
      '1st Floor': ['Sunday', 'Wednesday'],
      'Ground Floor': ['Sunday', 'Wednesday']
    };

    const isAllowedToday = allowedDays[floor]?.includes(todayName) || false;
    const isAllowedTomorrow = allowedDays[floor]?.includes(tomorrowName) || false;
    
    // Check if it's after 6 PM
    const now = new Date();
    const sixPM = new Date(today);
    sixPM.setHours(18, 0, 0, 0);
    const isAfter6PM = now >= sixPM;
    
    return { 
      canBook: isAllowedToday || (isAllowedTomorrow && isAfter6PM),
      isDayBefore: !isAllowedToday && isAllowedTomorrow && isAfter6PM
    };
  };

  // Completely revise getAvailableTimeSlots to handle the correct booking window
  const getAvailableTimeSlots = () => {
    const bookingStatus = canFloorBookToday(userFloor);
    if (!bookingStatus.canBook) {
      return []; // Not allowed to book today
    }
    
    const now = new Date();
    const slots = [];
    
    // Determine which day we're booking for
    const bookingDay = new Date();
    if (bookingStatus.isDayBefore) {
      // If booking for tomorrow
      bookingDay.setDate(bookingDay.getDate() + 1);
    }
    
    // Generate slots from 10 AM to 5 PM (last slot ends at 6 PM)
    for (let hour = 10; hour < 18; hour++) {
      const startTime = new Date(bookingDay);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(bookingDay);
      endTime.setHours(hour + 1, 0, 0, 0);
      
      // Only include slots that haven't passed
      if (startTime > now) {
        slots.push({
          id: hour - 10,
          startTime,
          endTime,
          label: `${hour}:00 - ${hour + 1}:00`
        });
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundLines className="absolute inset-0 z-0">
        <div />
      </BackgroundLines>
      
      <div className="relative z-10 min-h-screen px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-white">
              Available Washing Machines
            </h2>
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-blue-400 hover:text-blue-300"
            >
              Back to Dashboard
            </button>
          </div>
          
          {availableMachines.length === 0 ? (
            <div className="bg-zinc-900/80 rounded-xl p-8 text-center">
              <p className="text-white text-lg">No vacant machines available on your floor right now.</p>
              <p className="text-neutral-400 mt-2">Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMachines.map(machine => (
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
                          const slot = getAvailableTimeSlots().find(s => s.id === slotId);
                          if (slot) {
                            setSelectedTimeSlot({ machine: machine.id, slot });
                          }
                        }}
                        value={selectedTimeSlot?.machine === machine.id ? selectedTimeSlot.slot.id : ""}
                        className="w-full p-2 rounded-md bg-zinc-800 text-white border-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>Choose a time</option>
                        {getAvailableTimeSlots().map(slot => (
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
                        alert("Please select a time slot first");
                      }
                    }}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    Book & Scan
                  </button>
                </div>
              ))}
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
