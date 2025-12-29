"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input, { PasswordInput } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import PhoneInput from "@/components/ui/PhoneInput";
import OTPInput from "@/components/ui/OTPInput";
import {
  signUp,
  getRedirectUrl,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
} from "@/lib/auth";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { validatePassword } from "@/lib/validators";

type SignUpStep = "contact" | "otp" | "password" | "profile" | "terms";
type ContactType = "phone" | "email";

function SignUpContent() {
  const [step, setStep] = useState<SignUpStep>("contact");
  const [contactType, setContactType] = useState<ContactType>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile step state
  const [selectedAvatar, setSelectedAvatar] = useState<number>(3);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Terms step state
  const [noMarketing, setNoMarketing] = useState(false);
  const [shareData, setShareData] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for OAuth errors from URL
  const oauthError = useMemo(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      return "Email already in use with different Sign In method. Please sign in with your original method or use a different email.";
    } else if (errorParam === "Configuration") {
      return "There was a problem with the OAuth configuration. Please try again or contact support.";
    } else if (errorParam) {
      return "An error occurred during sign-up. Please try again.";
    }
    return "";
  }, [searchParams]);

  // Set error if OAuth error exists
  if (oauthError && !error) {
    setError(oauthError);
  }

  // Avatar and location data
  const avatars = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24,
  ];
  const states = [
    { value: "maharashtra", label: "Maharashtra" },
    { value: "delhi", label: "Delhi" },
    { value: "karnataka", label: "Karnataka" },
    { value: "tamil-nadu", label: "Tamil Nadu" },
    { value: "gujarat", label: "Gujarat" },
    { value: "rajasthan", label: "Rajasthan" },
    { value: "west-bengal", label: "West Bengal" },
    { value: "uttar-pradesh", label: "Uttar Pradesh" },
  ];

  const cities = [
    { value: "mumbai", label: "Mumbai" },
    { value: "delhi", label: "Delhi" },
    { value: "bangalore", label: "Bangalore" },
    { value: "hyderabad", label: "Hyderabad" },
    { value: "ahmedabad", label: "Ahmedabad" },
    { value: "chennai", label: "Chennai" },
    { value: "kolkata", label: "Kolkata" },
    { value: "pune", label: "Pune" },
  ];

  // Simple password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let score = 0;
    let label = "";
    let color = "";

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength level
    if (score <= 2) {
      label = "Weak";
      color = "bg-red-400";
    } else if (score <= 4) {
      label = "Medium";
      color = "bg-yellow-400";
    } else {
      label = "Strong";
      color = "bg-green-400";
    }

    return { strength: Math.min(score, 6), label, color };
  };

  const getPhoneComponents = (fullNumber: string) => {
    if (!fullNumber.startsWith("+")) {
      return { countryCode: "", phoneNumber: fullNumber };
    }
    const match = fullNumber.match(/^(\+\d{1,4})(\d+)/);
    if (match) {
      return { countryCode: match[1], phoneNumber: match[2] };
    }
    // Fallback if the regex fails
    return {
      countryCode: fullNumber.substring(0, 3),
      phoneNumber: fullNumber.substring(3),
    };
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactValue = contactType === "phone" ? phone : email;

    if (!contactValue.trim()) {
      setError("Please enter your contact information.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (contactType === "phone") {
        const cleanedPhoneNumber = phone.replace(/\D/g, "");
        const countryCodeToSend = countryCode.trim();
        if (!countryCodeToSend || !cleanedPhoneNumber) {
          throw new Error(
            "Please enter a valid phone number and select a country code."
          );
        }
        console.log(
          `Sending OTP to: ${countryCodeToSend}${cleanedPhoneNumber}`
        );
        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: countryCodeToSend,
            phoneNumber: cleanedPhoneNumber,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Failed to send verification code (Server Error)."
          );
        setStep("otp");
      } else {
        console.log(`Sending OTP to email: ${email}`);
        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to send verification email.");
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
      console.error("Send OTP error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError("");

    // IMPORTANT: identifier must match the one stored by send-otp
    const identifier =
      contactType === "phone"
        ? `${countryCode.trim()}${phone.replace(/\D/g, "")}` // include country code + raw digits
        : email.toLowerCase();

    try {
      const response = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      // verified — move to create password
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.");
      console.error("OTP verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() && confirmPassword.trim()) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(validation.message || "Invalid password.");
        return;
      }

      setError("");
      setStep("profile");
    }
  };

  const handleChangeContact = () => {
    setStep("contact");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  };
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");
    try {
      if (contactType === "phone") {
        const phoneNumber = phone.replace(/\D/g, "");
        if (!countryCode || !phoneNumber)
          throw new Error("Invalid phone number format.");

        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: countryCode.trim(),
            phoneNumber,
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Failed to resend verification code."
          );
        setError("A new verification code has been sent.");
        setOtp("");
      } else {
        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.message || "Failed to resend verification email."
          );
        setError("A new verification code has been sent to your email.");
        setOtp("");
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to resend verification code. Please try again."
      );
      console.error("Resend OTP error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && state.trim() && city.trim()) {
      setError("");
      setStep("terms");
    }
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const userData = {
      email: contactType === "email" ? email : undefined,
      phone:
        contactType === "phone"
          ? getPhoneComponents(phone).phoneNumber
          : undefined, // Ensure only the raw number is sent
      countryCode: contactType === "phone" ? countryCode.trim() : undefined, // Include country code for phone registration
      password: password,
      firstName: firstName,
      lastName: lastName,
      avatar: selectedAvatar,
      state: state,
      city: city,
      noMarketing: noMarketing,
      shareData: shareData,
    };

    try {
      const result = await signUp(userData); // calls /api/auth/signup
      await signIn("credentials", {
        contact: result.contactIdentifier,
        password: userData.password,
        redirect: false,
      });
      const redirectUrl = getRedirectUrl(searchParams);
      router.push(redirectUrl);
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to create account. Please check your inputs.";
      setError(errorMessage);
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background md:border md:border-border-color md:rounded-2xl md:shadow-2xl relative">
      {/* Close Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 right-6 p-2 text-text-gray hover:text-white transition-colors duration-200"
        aria-label="Close"
      >
        <svg
          className="w-6 h-6"
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

      <div className="md:p-8 p-5">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="ANDACTION Logo"
            className="h-8 object-contain"
            width={150}
            height={24}
          />
        </div>

        {/* Title */}
        <h1 className="h1 font-semibold text-white mb-2">
          Sign up to AndAction
        </h1>

        {/* Subtitle */}
        <p className="text-text-gray mb-8">
          Morem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {step === "contact" ? (
          /* Contact Step - Phone or Email */
          <div className="space-y-6">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              {contactType === "phone" ? (
                <PhoneInput
                  label="Mobile number"
                  placeholder="Enter mobile number"
                  value={phone}
                  onChange={setPhone}
                  onCountryChange={(country) =>
                    setCountryCode(country.dialCode)
                  }
                  required
                  disabled={isLoading}
                  variant="filled"
                />
              ) : (
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  variant="filled"
                />
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={
                  isLoading ||
                  (contactType === "phone" ? !phone.trim() : !email.trim())
                }
              >
                {isLoading ? "Sending..." : "Continue"}
              </Button>

              <div>
                <span className="text-text-gray">
                  Already have an account?{" "}
                </span>
                <Link
                  href="/auth/signin"
                  className="text-white underline hover:text-primary-pink transition-colors duration-200 btn2"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-border-color"></div>
                <span className="px-4 text-text-gray text-sm">Or</span>
                <div className="flex-1 border-t border-border-color"></div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() =>
                    setContactType(contactType === "phone" ? "email" : "phone")
                  }
                  disabled={isLoading}
                >
                  Sign up with {contactType === "phone" ? "Email" : "Phone"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => signInWithGoogle()}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  Sign up with Google
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => signInWithFacebook()}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Signup with Facebook
                </Button>

                {/*<Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => signInWithApple()}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Sign up with Apple
                </Button>*/}
              </div>
            </form>
          </div>
        ) : step === "otp" ? (
          /* OTP Verification Step */
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                OTP Verification
              </h2>
              <div className=" flex flex-col gap-2">
                <p className="text-text-gray text-sm">
                  Enter the 6-digit code sent to you at{" "}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-white">
                    {contactType === "phone"
                      ? `${phone.slice(0, 2)}******${phone.slice(-3)}`
                      : `${email.slice(0, 2)}****@${email.split("@")[1]}`}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={handleChangeContact}
                    className="text-white text-sm hover:text-primary-pink transition-colors duration-200 underline"
                  >
                    Change {contactType === "phone" ? "number" : "email"}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              />

              <div>
                <span className="text-text-gray text-sm">
                  Haven&apos;t received the OTP?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-white hover:text-primary-pink transition-colors duration-200 text-sm font-medium underline"
                >
                  Resend OTP
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </div>
        ) : step === "password" ? (
          /* Password Creation Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/3"></div>
              </div>
              <div className="flex items-center gap-3 my-3">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-text-gray">Step 1 of 3</p>
                  <h2 className="text-lg font-semibold text-white">
                    Create Password
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-gray">
                      Password Strength:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        getPasswordStrength(password).label === "Weak"
                          ? "text-red-400"
                          : getPasswordStrength(password).label === "Medium"
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                  <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                    <div
                      className={`${
                        getPasswordStrength(password).color
                      } h-1 rounded-full transition-all duration-300`}
                      style={{
                        width: `${
                          (getPasswordStrength(password).strength / 6) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <PasswordInput
                label="Confirm Password"
                placeholder="Enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={
                  isLoading || !password.trim() || !confirmPassword.trim()
                }
              >
                {isLoading ? "Creating..." : "Next"}
              </Button>
            </form>
          </div>
        ) : step === "profile" ? (
          /* Profile Setup Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-2/3"></div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("password")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-text-gray">Step 2 of 3</p>
                  <h2 className="text-lg font-semibold text-white">
                    Tell us about yourself
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Selection */}
              <div className="space-y-4">
                <h3 className="text-white text-center text-lg font-medium">
                  Choose avatar
                </h3>
                <div className="flex items-center justify-center md:gap-2 gap-1">
                  <button
                    type="button"
                    className="text-white hover:text-primary-pink transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
                    onClick={() =>
                      setSelectedAvatar(
                        selectedAvatar > 1 ? selectedAvatar - 1 : avatars.length
                      )
                    }
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Avatar Carousel - Show 5 avatars */}
                  <div className="flex items-center md:gap-2 gap-1 py-2 overflow-hidden">
                    {(() => {
                      // Calculate which avatars to show (5 total, with selected in center)
                      const getVisibleAvatars = () => {
                        const visibleAvatars = [];
                        const totalAvatars = avatars.length;

                        // Get 2 avatars before, current, and 2 avatars after
                        for (let i = -2; i <= 2; i++) {
                          let avatarIndex = selectedAvatar + i;

                          // Handle wrapping
                          if (avatarIndex < 1) {
                            avatarIndex = totalAvatars + avatarIndex;
                          } else if (avatarIndex > totalAvatars) {
                            avatarIndex = avatarIndex - totalAvatars;
                          }

                          visibleAvatars.push({
                            id: avatarIndex,
                            position: i,
                            isCenter: i === 0,
                          });
                        }

                        return visibleAvatars;
                      };

                      return getVisibleAvatars().map((avatar) => (
                        <button
                          key={`${avatar.id}-${avatar.position}`}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar.id)}
                          className={`relative shrink-0 rounded-full border-2 transition-all duration-300 ease-out ${
                            avatar.isCenter
                              ? "md:size-20 size-14 border-primary-pink scale-110"
                              : "md:size-16 size-10 border-transparent hover:border-[#404040] opacity-60 hover:opacity-80"
                          }`}
                        >
                          <Image
                            src={`/avatars/${avatar.id}.png`}
                            alt={`Avatar ${avatar.id}`}
                            width={80}
                            height={80}
                            unoptimized
                            className="w-full h-full object-cover rounded-full"
                          />
                          {avatar.isCenter && (
                            <div className="absolute -bottom-1 -right-1 md:size-6 size-5 bg-primary-pink rounded-full flex items-center justify-center border-2 border-background">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    type="button"
                    className="text-white hover:text-primary-pink transition-colors duration-200 p-2 hover:bg-white/5 rounded-full"
                    onClick={() =>
                      setSelectedAvatar(
                        selectedAvatar < avatars.length ? selectedAvatar + 1 : 1
                      )
                    }
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Avatar counter */}
                <div className="text-center">
                  <span className="text-sm text-text-gray">
                    {selectedAvatar} of {avatars.length}
                  </span>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First name*"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  variant="filled"
                />
                <Input
                  label="Last name*"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  variant="filled"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="State*"
                  placeholder="Select"
                  options={states}
                  value={state}
                  onChange={setState}
                  required
                />
                <Select
                  label="City*"
                  placeholder="Select"
                  options={cities}
                  value={city}
                  onChange={setCity}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={
                  isLoading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !state ||
                  !city
                }
              >
                Next
              </Button>
            </form>
          </div>
        ) : (
          /* Terms & Conditions Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-full"></div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-text-gray">Step 3 of 3</p>
                  <h2 className="text-lg font-semibold text-white">
                    Terms & Conditions
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleTermsSubmit} className="space-y-6">
              {/* Checkboxes */}
              <div className="space-y-4">
                <Checkbox
                  checked={noMarketing}
                  onChange={setNoMarketing}
                  label="I would prefer not to receive marketing messages from AndAction"
                  className="p-4 bg-card border border-border-color rounded-lg"
                />

                <Checkbox
                  checked={shareData}
                  onChange={setShareData}
                  label="Share my registration data with AndAction's content providers for marketing purposes."
                  className="p-4 bg-card border border-border-color rounded-lg"
                />
              </div>

              {/* Terms Text */}
              <div className="space-y-4 text-sm text-text-gray">
                <p>
                  By clicking on sign-up, you agree to AndAction&apos;s{" "}
                  <Link
                    href="/terms"
                    className="text-primary-pink hover:text-primary-orange underline"
                  >
                    Terms and Conditions of use
                  </Link>
                  .
                </p>

                <p>
                  To learn more about how AndAction collects, users, shares and
                  protects your personal data, please see{" "}
                  <Link
                    href="/privacy"
                    className="text-primary-pink hover:text-primary-orange underline"
                  >
                    AndAction&apos;s Privacy Policy
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign up"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
