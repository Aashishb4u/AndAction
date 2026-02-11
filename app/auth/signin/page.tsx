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

type SignInStep = "email" | "password";

function SignInContent() {
  const [step, setStep] = useState<SignInStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email or phone number is required");
      return;
    }

    // Check if it's an email or phone number
    const isEmail = trimmedEmail.includes("@");

    if (isEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError("Please enter a valid email address");
        return;
      }
    } else {
      // Validate phone number (should contain at least 10 digits)
      const phoneDigits = trimmedEmail.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        setEmailError("Please enter a valid phone number (at least 10 digits)");
        return;
      }
    }

    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const contactIdentifier = email.includes("@")
        ? email.toLowerCase().trim()
        : email.replace(/\D/g, "").trim();

      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          contactIdentifier.includes("@")
            ? { email: contactIdentifier, password }
            : { phone: contactIdentifier, countryCode: "+91", password },
        ),
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
      console.log("userROle: ", userRole);
      if (userRole === "artist") {
        router.push("/artist/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Invalid email/phone or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setPassword("");
    setError("");
    setEmailError("");
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
          className="h-8 w-[150px] md:w-[215px] object-contain"
          width={215}
          height={24}
        />

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
      </div>
      <div className="hidden md:block h-px bg-border-line " />

      <div className="p-4 md:p-0 md:mr-12 md:ml-12 md:mt-6 md:mb-6">
        {/* Header: Logo and Close Button */}
        <h1 className="h1 text-white mb-2">Sign In to AndAction</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {step === "email" ? (
          <>
            <p className="text-text-gray mb-8">
              Enter your email or mobile number to sign in.
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email or Mobile number"
                  type="text"
                  placeholder="Enter email ID or mobile number"
                  className="bg-[#2D2D2D]"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  variant="filled"
                  required
                />
                {emailError && (
                  <p className="text-red-400 text-sm mt-2">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={!email.trim() || isLoading}
              >
                Continue
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

              {/* ✅ Social Sign In Buttons (unchanged UI) */}
              <div className="space-y-3">
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
        ) : (
          /* Password Step */
          <form onSubmit={handlePasswordSubmit}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-text-gray">
                {email}
              </span>
              <button
                type="button"
                onClick={handleChangeEmail}
                className="text-white hover:text-primary-pink transition-colors duration-200 underline btn1"
              >
                Change
              </button>
            </div>

            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="filled"
              required
            />

            <div className="text-right mb-4 mt-2">
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
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
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
