"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const signUpSchema = z.object({
  firstname: z.string().min(2, "First name must be at least 2 characters long"),
  lastname: z.string().min(2, "Last name must be at least 2 characters long"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type signInDataType = z.infer<typeof signInSchema>;
type signUpDataType = z.infer<typeof signUpSchema>;

export const useAuth = () => {
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm<signInDataType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<signUpDataType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: signInDataType) => {
    setIsLoading(true);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });
      router.push("/client/");
    } catch (error) {
      signInForm.setError("root", { message: "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: signUpDataType) => {
    setIsLoading(true);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        fname: `${data.firstname} ${data.lastname}`,
        flow: "signUp",
      });
      router.push("/client/");
    } catch (error) {
      signUpForm.setError("root", {
        message: "Something went wrong. Email may already exist.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.log(error);
    }
  };

  return {
    handleSignIn,
    handleSignUp,
    handleSignOut,
    isLoading,
    signInForm,
    signUpForm,
  };
};
