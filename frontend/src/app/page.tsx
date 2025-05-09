"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { motion } from "motion/react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <BackgroundLines className="absolute inset-0 z-0">
        <div />
      </BackgroundLines>
      
      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-zinc-800 backdrop-blur-lg bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              KIIT Wash
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-zinc-300 hover:text-white transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white hover:opacity-90 transition-opacity"
            >
              Register
            </button>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            Hostel Laundry <br/>Made Simple
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Book washing machines, manage your laundry schedule, and never wait in line again. Exclusive for KIIT University students.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <HoverButton 
              onClick={() => router.push('/register')}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Get Started
            </HoverButton>
            <HoverButton 
              onClick={() => router.push('/login')}
              className="bg-zinc-800 text-zinc-300 hover:text-white"
            >
              Already a User? Login
            </HoverButton>
          </div>
        </motion.div>
        
        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {[
            {
              title: "Easy Booking",
              description: "Book washing machines from your phone anytime, anywhere."
            },
            {
              title: "Real-time Availability",
              description: "See which machines are available on your floor in real-time."
            },
            {
              title: "QR Code Access",
              description: "Scan and start your laundry cycle with a simple QR code."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hover Button Component
function HoverButton({ 
  children, 
  onClick, 
  className 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  className?: string; 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative px-6 py-3 rounded-xl overflow-hidden group ${className}`}
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur"></span>
      <span className="relative">{children}</span>
    </motion.button>
  );
}
