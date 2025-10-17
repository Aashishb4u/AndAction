'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import PhoneInput from '@/components/ui/PhoneInput';
import OTPInput from '@/components/ui/OTPInput';
import DateInput from '@/components/ui/DateInput';
import { signInWithGoogle } from '@/lib/auth';

type ArtistSignUpStep = 'join' | 'otp' | 'userInfo' | 'terms';
type ContactType = 'phone' | 'email';

function ArtistAuthContent() {
  const [step, setStep] = useState<ArtistSignUpStep>('join');
  const [contactType, setContactType] = useState<ContactType>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // User info step state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  // Terms step state
  const [noMarketing, setNoMarketing] = useState(true);
  const [shareData, setShareData] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  // Location data
  const states = [
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'uttar-pradesh', label: 'Uttar Pradesh' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'haryana', label: 'Haryana' },
  ];

  const cities = [
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'bangalore', label: 'Bangalore' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'ahmedabad', label: 'Ahmedabad' },
    { value: 'jaipur', label: 'Jaipur' },
    { value: 'lucknow', label: 'Lucknow' },
    { value: 'kolkata', label: 'Kolkata' },
    { value: 'chandigarh', label: 'Chandigarh' },
    { value: 'gurgaon', label: 'Gurgaon' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('otp');
    } catch {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for OTP verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('userInfo');
    } catch {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for user info
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('terms');
    } catch {
      setError('Failed to save user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for final signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to profile setup
      router.push('/artist/profile-setup');
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Simulate API call for resending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeContact = () => {
    setStep('join');
    setOtp('');
  };

  const handleSocialSignUp = async (provider: 'google') => {
    setIsLoading(true);
    setError('');

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      }

      // Redirect to profile setup
      router.push('/artist/profile-setup');
    } catch (err) {
      setError(`${provider} sign-up is not available yet.`);
      console.error(`${provider} sign-up error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background md:border md:border-border-color md:rounded-2xl md:shadow-2xl relative">
      {/* Close Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 right-6 p-2 text-white transition-colors duration-200"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="md:p-8 p-5">
        {/* Logo */}
        <div className="mb-8">
          <Image src="/logo.png" alt="ANDACTION Logo" className="h-8 object-contain" width={150} height={32} />
        </div>


        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Contact Step - Phone or Email  */}
        {step === 'join' ? (
          <>
            {/* Title */}
            <h1 className="h1 text-white mb-2">
              Join as a Artist
            </h1>

            {/* Subtitle */}
            <p className="text-text-gray mb-8">
              Morem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
            </p>

            <div className="space-y-6">
              <form onSubmit={handleJoinSubmit} className="space-y-6">
                {contactType === 'phone' ? (
                  <PhoneInput
                    label="Mobile number"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={setPhone}
                    required
                    disabled={isLoading}
                    variant="filled"
                    id="phoneNumber"
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
                    id="email"
                  />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={isLoading || (contactType === 'phone' ? !phone.trim() : !email.trim())}
                >
                  {isLoading ? 'Sending...' : 'Continue'}
                </Button>

                {/* Sign In Link */}
                {/* <p className="text-text-gray text-sm">
                Already have an account?{' '}
                <Link
                  href={`/auth/signin${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                  className="text-white hover:text-primary-pink transition-colors duration-200 font-medium underline"
                >
                  Signin
                </Link>
              </p> */}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border-color" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-text-gray">Or</span>
                  </div>
                </div>

                {/* Alternative Options */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => setContactType(contactType === 'phone' ? 'email' : 'phone')}
                    disabled={isLoading}
                  >
                    Sign up with {contactType === 'phone' ? 'Email' : 'Mobile'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full flex items-center justify-center gap-3"
                    onClick={() => handleSocialSignUp('google')}
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
                </div>
              </form>
            </div>
          </>

        ) : step === 'otp' ? (
          /* OTP Verification Step */
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">OTP Verification</h2>
              <div className="flex flex-col gap-2">
                <p className="text-text-gray section-text">
                  Enter the 6-digit code sent to you at{' '}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-text-gray section-text">
                    {contactType === 'phone'
                      ? `91******${phone.slice(-3)}`
                      : `${email.slice(0, 2)}****@${email.split('@')[1]}`
                    }
                  </span>
                  <button
                    type="button"
                    onClick={handleChangeContact}
                    className="text-white btn1 hover:text-primary-pink transition-colors duration-200 underline"
                  >
                    Change number
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
                <span className="text-text-gray section-text">
                  Haven&apos;t received the OTP?{' '}
                </span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-white btn1 hover:text-primary-pink transition-colors duration-200 font-medium underline"
                >
                  Resend OTP
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
          </div>
        ) : step === 'userInfo' ? (
          /* User Info Step */
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="space-y-3">
              <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                <div className="bg-gradient-to-r from-primary-pink to-primary-orange h-1 rounded-full w-1/2"></div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-text-gray">Step 1 of 2</p>
                  <h2 className="btn1 text-white">Tell us about yourself</h2>
                </div>
              </div>
            </div>

            <form onSubmit={handleUserInfoSubmit} className="space-y-4">
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
              <div className="grid md:grid-cols-2 gap-4">
                <DateInput
                  label="Date of birth*"
                  placeholder="DD / MM / YYYY"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  disabled={isLoading}
                  variant="filled"
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

              {/* Address */}
              <Input
                label="Office/Home full address*"
                placeholder="Enter your full address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              {/* PIN Code */}
              <Input
                label="PIN code*"
                placeholder="Enter PIN code"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                required
                disabled={isLoading}
                variant="filled"
              />

              {/* State and City */}
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="State*"
                  placeholder="Select"
                  value={state}
                  onChange={setState}
                  options={states}
                  required
                  disabled={isLoading}
                />
                <Select
                  label="City*"
                  placeholder="Select"
                  value={city}
                  onChange={setCity}
                  options={cities}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={isLoading || !firstName.trim() || !lastName.trim() || !dateOfBirth || !gender || !address.trim() || !pinCode.trim() || !state || !city}
              >
                {isLoading ? 'Saving...' : 'Next'}
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
                  onClick={() => setStep('userInfo')}
                  className="text-white hover:text-primary-pink transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-text-gray">Step 2 of 2</p>
                  <h2 className="text-lg font-semibold text-white">Terms & Conditions</h2>
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
              <div className="space-y-4 section-text">
                <p>
                  By clicking on sign-up, you agree to AndAction&apos;s{' '}
                  <Link href="/terms" className="gradient-text gradient-underline">
                    Terms and Conditions of use
                  </Link>
                  .
                </p>

                <p>
                  To learn more about how AndAction collects, users, shares and protects your personal data, please see{' '}
                  <Link href="/privacy" className="gradient-text gradient-underline">
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
                {isLoading ? 'Creating Account...' : 'Sign up'}
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
