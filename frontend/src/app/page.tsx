"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/hero-section";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-zinc-800 backdrop-blur-lg bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              KIIT Wash
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <AnimatedButton 
              onClick={() => router.push('/login')}
              variant="primary"
              size="default"
            >
              Sign in with KIIT Email
            </AnimatedButton>
          </div>
        </div>
      </nav>
      
      {/* Hero Section with Vortex Background */}
      <HeroSection />
    </div>
  );
}
