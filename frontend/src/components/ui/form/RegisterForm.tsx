"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconBrandGoogle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { AnimatedButton } from "@/components/ui/animated-button";

const schema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  email: z.string()
    .email("Invalid email format")
    .endsWith("@kiit.ac.in", "Only KIIT email addresses (@kiit.ac.in) are allowed"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobileNumber: z.string().min(10, "Mobile number is required"),
  floor: z.string().min(1, "Floor is required")
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      floor: "3rd Floor"
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${data.firstname} ${data.lastname}`,
          email: data.email,
          password: data.password,
          mobileNumber: data.mobileNumber,
          floor: data.floor
        }),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        console.log("Registration successful");
        window.location.href = "/login";
      } else {
        // Check if the error is "User already exists"
        if (responseData.message && responseData.message.includes("already exists")) {
          console.log("User already exists, redirecting to login...");
          
          // Set a user-friendly message
          setErrorMessage("Account already exists! Redirecting to login...");
          
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          // Handle other errors
          console.error("Registration failed:", responseData.message || "Unknown error");
          // Display the error message from the backend
          setErrorMessage(responseData.message || "Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to KIIT Washing Machine
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Register to book washing machines in your hostel
      </p>

      <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <Input id="firstname" placeholder="Your first name" {...register("firstname")} />
            {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname.message}</p>}
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input id="lastname" placeholder="Your last name" {...register("lastname")} />
            {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname.message}</p>}
          </LabelInputContainer>
        </div>
        
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" placeholder="your.name@kiit.ac.in" type="email" {...register("email")} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </LabelInputContainer>
        
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input id="password" placeholder="••••••••" type="password" {...register("password")} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </LabelInputContainer>
        
        <LabelInputContainer className="mb-4">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input id="mobileNumber" placeholder="+91 9876543210" {...register("mobileNumber")} />
          {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
        </LabelInputContainer>
        
        <LabelInputContainer className="mb-8">
          <Label htmlFor="floor">Floor</Label>
          <select
            id="floor"
            className="group/btn relative block h-10 w-full rounded-full bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]"
            {...register("floor")}
          >
            <option value="4th Floor">4th Floor</option>
            <option value="3rd Floor">3rd Floor</option>
            <option value="2nd Floor">2nd Floor</option>
            <option value="1st Floor">1st Floor</option>
            <option value="Ground Floor">Ground Floor</option>
          </select>
          {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor.message}</p>}
        </LabelInputContainer>

        {errorMessage && (
          <div className="mt-2 mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-md dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <AnimatedButton
          type="submit"
          variant="primary"
          className="w-full"
        >
          Sign up &rarr;
        </AnimatedButton>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <div className="flex flex-col">
          <AnimatedButton
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              console.log("Google Sign In clicked");
            }}
          >
            <IconBrandGoogle className="h-4 w-4" />
            <span>Sign up with KIIT Email</span>
          </AnimatedButton>
          
          <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Only @kiit.ac.in email addresses are allowed
          </p>
        </div>
      </form>
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
