"use client";

import React from "react";
import { Vortex } from "./ui/vortex";
import { AnimatedButton } from "./ui/animated-button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function HeroSection() {
  const router = useRouter();

  return (
    <div className="w-full h-[calc(100vh-80px)] overflow-hidden">
      <Vortex
        backgroundColor="black"
        baseHue={240}
        className="flex items-center flex-col justify-center px-4 md:px-10 py-4 w-full h-full"
      >
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
            <AnimatedButton 
              onClick={() => router.push('/login')}
              variant="primary"
              size="lg"
            >
              Sign in with KIIT Email
            </AnimatedButton>
            
            <AnimatedButton 
              variant="outline"
              size="lg"
              onClick={() => router.push('/about')}
            >
              Learn More
            </AnimatedButton>
          </div>
        </motion.div>
        
        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full"
        >
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
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Vortex>
    </div>
  );
} 