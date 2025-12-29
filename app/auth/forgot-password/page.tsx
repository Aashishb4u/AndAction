'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input, { PasswordInput } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import OTPInput from '@/components/ui/OTPInput';
import Image from 'next/image';

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  // Simple password strength calculation (reused from signup)
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let score = 0;
    let label = '';
    let color = '';

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
      label = 'Weak';
      color = 'bg-red-400';
    } else if (score <= 4) {
      label = 'Medium';
      color = 'bg-yellow-400';
    } else {
      label = 'Strong';
      color = 'bg-green-400';
    }

    return { strength: Math.min(score, 6), label, color };
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log('Forgot Password Response:', data);

        if (!res.ok) {
          throw new Error(data.message || 'Failed to send OTP.');
        }

        setStep('otp');
      } catch (err: any) {
        setError(err.message || 'Failed to send OTP. Please try again.');
        console.error('Email submit error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle OTP verification
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      setIsLoading(true);
      setError('');

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Invalid OTP.');
        }

        setStep('password');
      } catch (err: any) {
        setError(err.message || 'Invalid OTP. Please try again.');
        console.error('OTP verification error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle password reset
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() && confirmPassword.trim()) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword: password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to reset password.');
        }

        // Redirect to login
        router.push('/auth/signin');
      } catch (err: any) {
        setError(err.message || 'Failed to reset password. Please try again.');
        console.error('Password reset error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };


  // Mask email for display
  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 3) return email;
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-background flex md:items-center justify-center p-4">
      <div className="w-full md:max-w-md bg-background md:border md:border-border-color md:rounded-2xl md:p-8 md:shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Logo */}
          <Image src="/logo.png" alt="ANDACTION Logo" className="h-8 object-contain" width={150} height={24} />

          {/* Close Button */}
          <button
            onClick={() => router.push('/auth/signin')}
            className="text-white hover:text-primary-pink transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {step === 'email' ? (
          /* Email Step */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="h1 text-white mb-2">
                Reset Password
              </h1>
              <p className="text-text-gray">
                Enter the email address associated with your AndAction account.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <Input
                label="Email"
                type="email"
                placeholder="Enter email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="filled"
                required
                disabled={isLoading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!email.trim() || isLoading}
              >
                {isLoading ? 'Sending...' : 'Continue'}
              </Button>
            </form>
          </div>
        ) : step === 'otp' ? (
          /* OTP Verification Step */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="h1 text-white mb-2">
                OTP Verification
              </h1>
              <p className="text-text-gray">
                To continue, complete this verification step. We&apos;ve sent a One Time Password (OTP) to the email <br /> {maskEmail(email)}.{' '}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-white underline hover:text-primary-pink transition-colors duration-200 btn1"
                >
                  Change
                </button>
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-4">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={isLoading}
                />

                {/* Resend OTP */}
                <span className="text-text-gray text-sm">Haven&apos;t received the OTP? </span>
                <button
                  type="button"
                  className="text-white underline hover:text-primary-pink transition-colors duration-200 btn1"
                  onClick={() => {
                    // Resend OTP logic
                    console.log('Resending OTP...');
                  }}
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
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
          </div>
        ) : (
          /* Password Creation Step */
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="h1 text-white mb-2">
                Create new password
              </h1>
              <p className="text-text-gray">
                We&apos;ll ask for this password whenever you Sign In.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <PasswordInput
                  label="New Password*"
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
                    <div className="w-full bg-[#2D2D2D] rounded-full h-1">
                      <div
                        className={`${getPasswordStrength(password).color} h-1 rounded-full transition-all duration-300`}
                        style={{ width: `${(getPasswordStrength(password).strength / 6) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="footnote text-text-gray">Password Strength:</span>
                      <span className={`footnote font-medium ${getPasswordStrength(password).label === 'Weak' ? 'text-red-400' :
                        getPasswordStrength(password).label === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                        {getPasswordStrength(password).label}
                      </span>
                    </div>
                  </div>
                )}

                <PasswordInput
                  label="Confirm Password*"
                  placeholder="Enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  variant="filled"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading || !password.trim() || !confirmPassword.trim()}
              >
                {isLoading ? 'Saving...' : 'Save changes & Sign in'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
