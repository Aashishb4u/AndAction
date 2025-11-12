import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, ApiResponse, successResponse } from '@/lib/api-response';
import { sendOtpSms } from '@/lib/sms';

interface SendOtpRequestBody {
  countryCode?: string;
  phoneNumber?: string;
  email?: string;
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const { countryCode, phoneNumber, email }: SendOtpRequestBody = await request.json();

    // --- Determine contact method ---
    const isPhone = !!(countryCode && phoneNumber);
    const isEmail = !!email;

    if (!isPhone && !isEmail) {
      return ApiErrors.badRequest('Either phone number + country code or email is required.');
    }

    // --- Prevent duplicates ---
    if (isPhone) {
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });

      if (existingUser) {
        return ApiErrors.conflict('A user with this number already exists. Please sign in.');
      }
    } else if (isEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });

      if (existingUser) {
        return ApiErrors.conflict('A user with this email already exists. Please sign in.');
      }
    }

    // --- Generate OTP ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // --- Determine identifier ---
    const identifier = isPhone
      ? `${countryCode}${phoneNumber}`
      : email!.toLowerCase();

    // --- Clean up old tokens ---
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // --- Store new OTP ---
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: otp,
        expires: expiry,
      },
    });

    // --- Simulate sending ---
    if (isPhone) {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const smsResult = await sendOtpSms(countryCode!, fullPhoneNumber, otp);

      if (!smsResult.success) {
        console.error('SMS Send Failure:', smsResult.error);
        await prisma.verificationToken.deleteMany({ where: { identifier } });
        return ApiErrors.internalError('Failed to send verification SMS. Please try again.');
      }

      console.log(`📱 OTP sent to phone ${fullPhoneNumber}: ${otp}`);
    } else {
      // For now, we just log email OTPs
      console.log(`📩 OTP for email ${email}: ${otp}`);
    }

    return successResponse(
      { identifier },
      `Verification code sent successfully to ${isPhone ? 'phone' : 'email'}.`,
      200
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return ApiErrors.internalError('An unexpected error occurred while sending the OTP.');
  }
}
