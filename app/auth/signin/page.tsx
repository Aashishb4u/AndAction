"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input, { PasswordInput } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  getRedirectUrl,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
} from "@/lib/auth";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react";
import OTPInput from "@/components/ui/OTPInput";

type SignInMethod = "phone" | "email";
type SignInStep = "input" | "otp" | "password";

function SignInContent() {
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("phone");
  const [step, setStep] = useState<SignInStep>("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors from URL
  const oauthError = useMemo(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      return "Email already in use with different Sign In method. Please use your original Sign In method.";
    } else if (errorParam === "Configuration") {
      return "There was a problem with the OAuth configuration. Please try again or contact support.";
    } else if (errorParam) {
      return "An error occurred during Sign In. Please try again.";
    }
    return "";
  }, [searchParams]);

  // Set error if OAuth error exists
  if (oauthError && !error) {
    setError(oauthError);
  }

  // Timer for OTP resend
  React.useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (resendTimer === 0 && step === "otp") {
      setCanResendOtp(true);
    }
  }, [resendTimer, step]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    setError("");

    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone) {
      setInputError("Phone number is required");
      return;
    }

    // Validate phone number (10 digits for India)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setInputError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: trimmedPhone,
          countryCode,
          purpose: "login",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.message || "Failed to send OTP");
      }

      setStep("otp");
      setResendTimer(60); // 60 seconds cooldown
      setCanResendOtp(false);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp || isLoading) return;
    
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          countryCode,
          purpose: "login",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.message || "Failed to resend OTP");
      }

      setResendTimer(60);
      setCanResendOtp(false);
      setOtp(""); // Clear OTP input
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue: string) => {
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      // Verify OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          countryCode,
          otp: otpValue,
          type: "phone",
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData?.error || verifyData?.message || "Invalid OTP");
      }

      // Sign in with credentials
      const result = await signIn("credentials", {
        contact: phoneNumber.trim(),
        countryCode,
        isOtpVerified: "true",
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);
      
      const session = await getSession();
      const userRole = session?.user?.role;
      
      if (userRole === "artist") {
        router.push("/artist/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Invalid OTP. Please try again.");
      setOtp(""); // Clear OTP on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setInputError("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setInputError("Please enter a valid email address");
      return;
    }

    if (!password.trim()) {
      setInputError("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail.toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data?.error || data?.message || "Invalid login credentials.",
        );
      }

      const result = await signIn("credentials", {
        contact: data.data.contactIdentifier,
        password,
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);
      const session = await getSession();
      const userRole = session?.user?.role;
      
      if (userRole === "artist") {
        router.push("/artist/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data?.error || data?.message || "Invalid login credentials.",
        );
      }

      const result = await signIn("credentials", {
        contact: data.data.contactIdentifier,
        password,
        redirect: false,
      });

      if (result?.error) throw new Error(result.error);
      const session = await getSession();
      const userRole = session?.user?.role;
      
      if (userRole === "artist") {
        router.push("/artist/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSignInMethod = () => {
    setSignInMethod(signInMethod === "phone" ? "email" : "phone");
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setOtp("");
    setError("");
    setInputError("");
  };

  const handleSocialSignIn = async (
    provider: "google" | "apple" | "facebook",
  ) => {
    setIsLoading(true);
    setError("");

    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else if (provider === "apple") {
        await signInWithApple();
      } else if (provider === "facebook") {
        await signInWithFacebook();
      }
      // NextAuth will handle the redirect, no need to manually navigate
    } catch (err) {
      setError(`${provider} Sign In is not available yet.`);
      console.error(`${provider} Sign In error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background md:border md:border-border-color md:rounded-2xl md:shadow-2xl relative">
      <div className="flex justify-between items-center mr-4 ml-4 pt-4 md:pt-0 md:mr-12 md:ml-12 md:mt-6 md:mb-6">
        <Image
          src="/logo.png"
          alt="ANDACTION Logo"
          className="h-5 w-[180px] object-contain"
          width={180}
          height={20}
        />

        {(step === 'input' || signInMethod === 'email') && (
          <button
            onClick={() => router.push("/")}
            className="text-white transition-colors duration-200"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="hidden md:block h-px bg-border-line " />

      <div className="p-4 md:p-0 md:mr-12 md:ml-12 md:mt-6 md:mb-6">
        <h1 className="h1 text-white mb-2">Sign In to AndAction</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Phone OTP Flow */}
        {signInMethod === "phone" && step === "input" && (
          <>
            <p className="text-text-gray mb-8">
              Enter your mobile number to sign in with OTP.
            </p>
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  className="bg-[#2D2D2D]"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ""));
                    setInputError("");
                  }}
                  variant="filled"
                  required
                  maxLength={10}
                />
                {inputError && (
                  <p className="text-red-400 text-sm mt-2">{inputError}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={!phoneNumber.trim() || isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <p className="text-text-gray secondary-text">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/auth/signup${
                    searchParams.toString() ? `?${searchParams.toString()}` : ""
                  }`}
                  className="text-[var(--color-white)] hover:text-primary-pink transition-colors duration-200 underline btn2"
                >
                  Sign up
                </Link>
              </p>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-border-line"></div>
                <span className="px-4 text-text-gray text-sm">Or</span>
                <div className="flex-1 border-t border-border-line"></div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleToggleSignInMethod}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  Sign in with Email
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={isLoading}
                  variant="secondary"
                  size="md"
                  className="w-full flex gap-3 items-center justify-center"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="btn2">Continue with Google</span>
                </Button>
              </div>
            </form>
          </>
        )}

        {/* OTP Verification Step */}
        {signInMethod === "phone" && step === "otp" && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-text-gray">
                {countryCode} {phoneNumber}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setOtp("");
                  setError("");
                }}
                className="text-white hover:text-primary-pink transition-colors duration-200 underline btn1"
              >
                Change
              </button>
            </div>

            <p className="text-text-gray mb-6">
              Enter the 6-digit OTP sent to your mobile number.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-3">
                Enter OTP
              </label>
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleVerifyOtp}
                disabled={isLoading}
                className="justify-center"
              />
            </div>

            <div className="text-center mb-6">
              {canResendOtp ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-white hover:text-primary-pink transition-colors duration-200 underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-text-gray text-sm">
                  Resend OTP in {resendTimer}s
                </p>
              )}
            </div>

            {isLoading && (
              <p className="text-center text-text-gray">Verifying OTP...</p>
            )}
          </div>
        )}

        {/* Email + Password Flow (Single Page) */}
        {signInMethod === "email" && (
          <>
            <p className="text-text-gray mb-8">
              Enter your email and password to sign in.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter email address"
                  className="bg-[#2D2D2D]"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setInputError("");
                  }}
                  variant="filled"
                  required
                />
              </div>

              <div>
                <PasswordInput
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setInputError("");
                  }}
                  variant="filled"
                  required
                />
                {inputError && (
                  <p className="text-red-400 text-sm mt-2">{inputError}</p>
                )}
              </div>

              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-blue transition-colors duration-200 underline"
                >
                  Forget password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={!email.trim() || !password.trim() || isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <p className="text-text-gray secondary-text">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/auth/signup${
                    searchParams.toString() ? `?${searchParams.toString()}` : ""
                  }`}
                  className="text-[var(--color-white)] hover:text-primary-pink transition-colors duration-200 underline btn2"
                >
                  Sign up
                </Link>
              </p>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-border-line"></div>
                <span className="px-4 text-text-gray text-sm">Or</span>
                <div className="flex-1 border-t border-border-line"></div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleToggleSignInMethod}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  Sign in with Mobile Number
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={isLoading}
                  variant="secondary"
                  size="md"
                  className="w-full flex gap-3 items-center justify-center"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="btn2">Continue with Google</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialSignIn("facebook")}
                  disabled={isLoading}
                  variant="secondary"
                  size="md"
                  className="w-full flex gap-3 items-center justify-center"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                  <span className="btn2">Continue with Facebook</span>
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
