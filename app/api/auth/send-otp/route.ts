/**
 * POST /api/auth/send-otp
 * Sends OTP to mobile number for authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpSms } from "@/lib/sms";
import { ApiErrors, successResponse } from "@/lib/api-response";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { phoneNumber, countryCode = "+91", purpose = "login" } = body;

    if (!phoneNumber) {
      return ApiErrors.badRequest("Phone number is required");
    }

    // Validate phone number format (10 digits for India)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return ApiErrors.badRequest("Invalid phone number format");
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // For signup, check if user already exists
    if (purpose === "signup") {
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          countryCode,
        },
      });

      if (existingUser) {
        return ApiErrors.conflict("User with this phone number already exists");
      }
    }

    // For login, check if user exists
    if (purpose === "login") {
      const existingUser = await prisma.user.findFirst({
        where: {
          phoneNumber,
          countryCode,
        },
      });

      if (!existingUser) {
        return ApiErrors.notFound("No account found with this phone number");
      }
    }

    // Store OTP in database using VerificationToken
    const identifier = `${countryCode}${phoneNumber}`; // e.g., +918438877682
    
    // Delete any existing tokens for this identifier
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });
    
    const otpRecord = await prisma.verificationToken.create({
      data: {
        identifier,
        token: otp,
        expires: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(countryCode, phoneNumber, otp);

    if (!smsResult.success) {
      // Delete OTP record if SMS fails
      await prisma.verificationToken.delete({ where: { id: otpRecord.id } });
      
      if (smsResult.invalidPhone) {
        return ApiErrors.badRequest("Invalid phone number");
      }
      
      return ApiErrors.internalError("Failed to send OTP. Please try again.");
    }

    return successResponse(
      {
        message: "OTP sent successfully",
        expiresAt,
      },
      "OTP sent to your mobile number"
    );
  } catch (error) {
    console.error("Send OTP Error:", error);
    return ApiErrors.internalError("Failed to send OTP");
  }
}
