"use client";

import { RegisterForm } from "@/components/ui/form/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <RegisterForm />
      </div>
    </div>
  );
}
