"use client";

import React, { useState, Suspense, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Input, { PasswordInput } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import PhoneInput from "@/components/ui/PhoneInput";
import OTPInput from "@/components/ui/OTPInput";
import DateInput from "@/components/ui/DateInput";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { signInWithGoogleAsArtist } from "@/lib/auth";
import { signIn } from "next-auth/react";
import { INDIAN_STATES, INDIAN_CITIES } from "@/lib/constants";

type ArtistSignUpStep = "join" | "otp" | "password" | "userInfo" | "terms";
type ContactType = "phone" | "email";

function ArtistAuthContent() {
  const [step, setStep] = useState<ArtistSignUpStep>("join");
  const [contactType, setContactType] = useState<ContactType>("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // dynamic country code
  const [otp, setOtp] = useState("");

  // Password step state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // User info step state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);

  // Terms step state
  const [noMarketing, setNoMarketing] = useState(true);
  const [shareData, setShareData] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stepParam = searchParams.get("step");
    const oauthParam = searchParams.get("oauth");

    if (stepParam === "userInfo" && oauthParam === "true") {
      setStep("userInfo");
    }
  }, [searchParams]);

  // Timer countdown effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Fetch location from PIN code
  useEffect(() => {
    const fetchLocationFromPinCode = async () => {
      // Only fetch if PIN code is exactly 6 digits and user hasn't manually entered location
      if (pinCode.length === 6 && /^\d{6}$/.test(pinCode)) {
        setIsFetchingLocation(true);
        try {
          const response = await fetch(`/api/geocode/pincode?pin=${pinCode}`);
          const data = await response.json();

          if (data.success && data.data) {
            // Normalize state to match dropdown values (lowercase with hyphens)
            const normalizedState = data.data.state
              ? data.data.state.toLowerCase().replace(/\s+/g, "-")
              : "";
            
            // Normalize city to match dropdown values (lowercase)
            const normalizedCity = (data.data.city || data.data.district || "")
              .toLowerCase();
            
            setState(normalizedState);
            setCity(normalizedCity);
            setLocationFetched(true);
            setError(""); // Clear any previous errors
          } else {
            setLocationFetched(false);
            // Don't show error, just let user enter manually
          }
        } catch (err) {
          console.error("Failed to fetch location:", err);
          setLocationFetched(false);
          // Don't show error, just let user enter manually
        } finally {
          setIsFetchingLocation(false);
        }
      } else if (pinCode.length < 6) {
        // Reset location when PIN code is incomplete
        setLocationFetched(false);
      }
    };

    fetchLocationFromPinCode();
  }, [pinCode]);

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

  // Location data from centralized constants

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  // Password strength removed — allow any password (simple non-empty + match validation)

  // Send OTP (matches user flow — no extra fields)
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (contactType === "phone") {
        const cleanedPhoneNumber = phone.replace(/\D/g, "");
        const codeToSend = countryCode.trim();

        if (!codeToSend || !cleanedPhoneNumber) {
          throw new Error(
            "Please enter a valid phone number and select a country code.",
          );
        }

        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: codeToSend,
            phoneNumber: cleanedPhoneNumber,
          }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || data.message || "Failed to send verification code.",
          );
        setStep("otp");
        setResendTimer(30); // Start 30-second countdown
      } else {
        const emailToSend = email.toLowerCase().trim();
        if (!emailToSend)
          throw new Error("Please enter a valid email address.");

        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailToSend }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || data.message || "Failed to send verification email.",
          );
        setStep("otp");
        setResendTimer(30); // Start 30-second countdown
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(
        err.message || "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const identifier =
        contactType === "phone"
          ? `${countryCode.trim()}${phone.replace(/\D/g, "")}`
          : email.toLowerCase();

      const response = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Invalid verification code.",
        );
      }

      // Move to next step based on contact type
      if (contactType === "phone") {
        // Phone signup: skip password, go directly to user info
        setStep("userInfo");
      } else {
        // Email signup: go to password creation
        setStep("password");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // No strict password validation: accept any non-empty password (matching confirm)
    setStep("userInfo");
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const isOAuthSignup = searchParams.get("oauth") === "true";

      const artistData = {
        email: contactType === "email" ? email : undefined,
        phoneNumber:
          contactType === "phone" ? phone.replace(/\D/g, "") : undefined,
        countryCode: contactType === "phone" ? countryCode : undefined,
        password: contactType === "email" ? password : undefined,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
        pinCode,
        state,
        city,
        noMarketing,
        shareData,
        isOAuthSignup, // Flag to indicate OAuth user
      };

      const apiEndpoint = isOAuthSignup
        ? "/api/auth/artist/update-profile"
        : "/api/auth/artist/signup";

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artistData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.message || "Failed to complete registration.",
        );
      }

      if (isOAuthSignup) {
        router.push("/artist/profile-setup");
        return;
      }

      let contactIdentifier: string | null = null;

      if (data?.data?.user?.email) {
        contactIdentifier = data.data.user.email;
      } else if (data?.data?.user?.phoneNumber) {
        contactIdentifier = data.data.user.phoneNumber;
      } else if (artistData.email) {
        contactIdentifier = artistData.email;
      } else if (artistData.phoneNumber) {
        contactIdentifier = artistData.phoneNumber;
      }

      console.log("📞 Auto-signin contactIdentifier:", contactIdentifier);

      // ✅ Attempt to auto Sign In via NextAuth
      if (contactIdentifier) {
        const signInPayload: any = {
          contact: contactIdentifier,
          redirect: false,
        };

        // Use appropriate authentication method based on contact type
        if (contactType === "phone") {
          signInPayload.countryCode = artistData.countryCode;
          signInPayload.isOtpVerified = "true";
        } else if (artistData.password) {
          signInPayload.password = artistData.password;
        }

        const signInResult = await signIn("credentials", signInPayload);

        console.log("🧩 signIn result:", signInResult);

        if (signInResult?.error) {
          console.error("Auto Sign In failed:", signInResult.error);
        } else {
          console.log("Auto Sign In succeeded. Session cookie created.");
        }
      } else {
        console.warn(
          "⚠️ Missing contactIdentifier for auto Sign In.",
        );
      }

      // ✅ Redirect to profile setup (session will now exist)
      router.push("/artist/profile-setup");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.message || "Failed to complete registration. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (contactType === "phone") {
        const cleanedPhone = phone.replace(/\D/g, "");
        if (!countryCode || !cleanedPhone)
          throw new Error("Invalid phone number format.");

        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode: countryCode.trim(),
            phoneNumber: cleanedPhone,
          }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error || data.message || "Failed to resend verification code.",
          );
        setError("A new verification code has been sent.");
        setOtp("");
        setResendTimer(30); // Start 30-second countdown
      } else {
        const response = await fetch("/api/users/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase() }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(
            data.error ||
              data.message ||
              "Failed to resend verification email.",
          );
        setError("A new verification code has been sent to your email.");
        setOtp("");
        setResendTimer(30); // Start 30-second countdown
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      setError(
        err.message || "Failed to resend verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeContact = () => {
    setStep("join");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSocialSignUp = async (provider: "google" | "facebook") => {
    setIsLoading(true);
    setError("");

    try {
      if (provider === "google") {
        await signInWithGoogleAsArtist();
      } else {
        throw new Error(`${provider} sign-up is not implemented yet.`);
      }
    } catch (err) {
      setError(`${provider} sign-up is not available yet.`);
      console.error(`${provider} sign-up error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background md:border md:border-border-color md:rounded-2xl md:shadow-2xl relative">
      {/* Header with Logo and Close Button */}
      <div className="flex justify-between items-center mr-4 ml-4 pt-4 md:pt-0 md:mr-12 md:ml-12 md:mt-6 md:mb-6">
        <Image
          src="/logo.png"
          alt="ANDACTION Logo"
          width={180}
          height={20}
          className="object-contain"
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
      <div className="md:p-8 p-5 overflow-visible mt-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 mb-6 md:p-0 md:mr-12 md:ml-12 md:mt-6 md:mb-8 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Contact Step - Phone or Email  */}
        {step === "join" ? (
          <>
            {/* Title */}
            <h1 className="h1 text-white mb-2">Join as an Artist</h1>

            {/* Subtitle */}
            <p className="text-text-gray mb-8">
              Create your artist profile and start getting booked
            </p>

            <div className="space-y-6">
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                {contactType === "phone" ? (
                  <div>
                    <label className="secondary-text  block mb-1">
                      Mobile number
                    </label>
                    <PhoneInput
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={setPhone}
                      onCountryChange={(country) =>
                        setCountryCode(country.dialCode)
                      }
                      required
                      disabled={isLoading}
                      variant="filled"
                      id="phoneNumber"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="secondary-text  block mb-1">Email</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      variant="filled"
                      id="email"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={
                    isLoading ||
                    (contactType === "phone" ? !phone.trim() : !email.trim())
                  }
                >
                  {isLoading ? "Sending..." : "Continue"}
                </Button>
                <div>
                  <span className="secondary-text text-text-gray">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href="/auth/signin"
                    className="text-white underline hover:text-primary-pink transition-colors duration-200 btn2"
                  >
                    Sign In
                  </Link>
                </div>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-line" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-text-gray">
                      Or
                    </span>
                  </div>
                </div>

                {/* Alternative Options */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() =>
                      setContactType(
                        contactType === "phone" ? "email" : "phone",
                      )
                    }
                    disabled={isLoading}
                  >
                    Sign up with{" "}
                    {contactType === "phone" ? "Email" : "Mobile Number"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full flex items-center justify-center gap-3 se"
                    onClick={() => handleSocialSignUp("google")}
                    disabled={isLoading}
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
                    <span className="btn2">Sign up with Google</span>
                  </Button>

                  {/* Facebook signup removed per design request */}
                </div>
              </form>
            </div>
          </>
        ) : step === "otp" ? (
          /* OTP Verification Step */
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white h1">
                OTP Verification
              </h2>
              <div className="flex flex-col gap-2">
                <p className="text-text-gray section-text">
                  Enter the 6-digit code sent to you at{" "}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-text-gray section-text">
                    {contactType === "phone"
                      ? `${countryCode.replace("+", "")}******${phone.slice(
                          -3,
                        )}`
                      : `${email.slice(0, 2)}****@${email.split("@")[1]}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleChangeContact}
                    className="text-white btn1 hover:text-primary-pink transition-colors duration-200 underline"
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
                <span className="text-text-gray section-text secondary-text">
                  Haven&apos;t received the OTP?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-white hover:text-primary-pink transition-colors duration-200 secondary-text underline"
                >
                  {resendTimer > 0
                    ? `Resend OTP (${resendTimer}s)`
                    : "Resend OTP"}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </div>
        ) : step === "password" ? (
          /* Password Creation Step (inserted) */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-linear-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/3"></div>
              </div>
              <div className="flex items-center gap-3 my-3">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
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
                <div>
                  <p className="secondary-text text-text-gray">Step 1 of 3</p>
                  <h2 className="btn1  text-white">
                    Create Password
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <PasswordInput
                label="Password*"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              {/* Password strength removed: no UI shown */}

              <PasswordInput
                label="Confirm Password*"
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
                size="md"
                className="w-full"
                disabled={
                  isLoading || !password.trim() || !confirmPassword.trim()
                }
              >
                {isLoading ? "Creating..." : "Next"}
              </Button>
            </form>
          </div>
        ) : step === "userInfo" ? (
          /* User Info Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-linear-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/2"></div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(contactType === "phone" ? "otp" : "password")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
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
                <div>
                  <p className="secondary-text text-text-gray">Step 1 of 2</p>
                  <h2 className="btn1 text-white">Tell us about yourself</h2>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep("terms");
              }}
              className="space-y-4"
            >
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

              {/* Date of Birth and Gender */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <DateInput
                  label="Date of birth*"
                  placeholder="DD / MM / YYYY"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  required
                  disabled={isLoading}
                  variant="filled"
                  maxDate={new Date()}
                  className=""
                />

                <Select
                  label="Gender*"
                  placeholder="Select gender"
                  value={gender}
                  onChange={setGender}
                  options={genderOptions}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Address with Location Picker */}
              <AddressAutocomplete
                label="Office/Home full address*"
                placeholder="Search for your address or use location"
                value={address}
                onChange={setAddress}
                onLocationSelect={(loc) => {
                  setAddress(loc.address);
                  if (loc.pinCode) setPinCode(loc.pinCode);
                  if (loc.state) setState(loc.state);
                  if (loc.city) setCity(loc.city);
                  setLocationFetched(true);
                }}
                required
                disabled={isLoading}
                variant="filled"
              />

              {/* PIN Code */}
              <Input
                label="PIN code*"
                placeholder="Enter PIN code"
                value={pinCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPinCode(value);
                }}
                required
                disabled={isLoading}
                variant="filled"
                maxLength={6}
              />
              {isFetchingLocation && (
                <p className="text-sm text-primary-pink -mt-2">
                  Fetching location...
                </p>
              )}

              {/* State and City */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Select
                  label="State*"
                  placeholder="Select"
                  value={state}
                  onChange={setState}
                  options={INDIAN_STATES}
                  required
                  disabled={isLoading || isFetchingLocation}
                />
                <Select
                  label="City*"
                  placeholder="Select"
                  value={city}
                  onChange={setCity}
                  options={INDIAN_CITIES}
                  required
                  disabled={isLoading || isFetchingLocation}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={
                  isLoading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !dateOfBirth ||
                  !gender ||
                  !address.trim() ||
                  !pinCode.trim() ||
                  !state ||
                  !city
                }
              >
                {isLoading ? "Saving..." : "Next"}
              </Button>
            </form>
          </div>
        ) : (
          /* Terms & Conditions Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-linear-to-r from-primary-pink to-primary-orange h-1 rounded-full w-full"></div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("userInfo")}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
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
                <div>
                  <p className="secondary-text text-text-gray">Step 2 of 2</p>
                  <h2 className="btn1 font-semibold text-white">
                    Terms & Conditions
                  </h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleTermsSubmit} className="space-y-4">
              {/* Checkboxes */}
              <div className="space-y-4">
                <Checkbox
                  checked={noMarketing}
                  onChange={setNoMarketing}
                  label="I would prefer not to receive marketing messages from AndAction"
                  className="p-4 secondary-text bg-card border border-border-color rounded-lg"
                />

                <Checkbox
                  checked={shareData}
                  onChange={setShareData}
                  label="Share my registration data with AndAction's content providers for marketing purposes."
                  className="p-4 secondary-text bg-card border border-border-color rounded-lg"
                />
              </div>

              {/* Terms Text */}
              <div className="space-y-4  secondary-text">
                <p>
                  By clicking on sign-up, you agree to AndAction&apos;s{" "}
                  <Link
                    href="/terms"
                    className="gradient-text gradient-underline"
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
                    className="gradient-text gradient-underline"
                  >
                    AndAction&apos;s Privacy Policy
                  </Link>
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-4"
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

export default function ArtistAuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArtistAuthContent />
    </Suspense>
  );
}
