"use client";

import { LoginForm } from "@/components/ui/form/LoginForm";
import { BackgroundLines } from "@/components/ui/background-lines";
import { SessionProvider } from "next-auth/react";

export default function LoginPage() {
  return (
    <SessionProvider>
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundLines className="absolute inset-0 z-0">
          <div />
        </BackgroundLines>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center flex-col px-4 py-10">
          <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-5xl font-sans mb-4 font-bold tracking-tight">
            KIIT Washing Machine
          </h2>
          <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center mb-8">
            Login to manage your washing machine bookings effortlessly
          </p>
          
          <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
            <LoginForm />
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
