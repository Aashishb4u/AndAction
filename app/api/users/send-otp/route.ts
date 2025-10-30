import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiErrors, ApiResponse, successResponse } from '@/lib/api-response';
import { sendOtpSms } from '@/lib/sms';

interface SendOtpRequestBody {
    countryCode: string;
    phoneNumber: string;
}

// NOTE: The return type must be a Promise that resolves to a NextResponse.
export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
    try {
        const { countryCode, phoneNumber }: SendOtpRequestBody = await request.json();

        if (!countryCode || !phoneNumber) {
            return ApiErrors.badRequest('Country code and phone number are required.');
        }

        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: phoneNumber },
            select: { id: true },
        });

        if (existingUser) {
            return ApiErrors.conflict('A user with this number already exists. Please sign in.');
        }
        
        // 2. Generate OTP and Expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 5);

        await prisma.verificationToken.deleteMany({
            where: { identifier: phoneNumber }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: phoneNumber,
                token: otp,
                expires: expiry,
            }
        });
        
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const smsResult = await sendOtpSms(countryCode, fullPhoneNumber, otp);
        
        if (!smsResult.success) {
            console.error('SMS Send Failure:', smsResult.error);
            
            await prisma.verificationToken.deleteMany({
                 where: { identifier: phoneNumber }
            });
            return ApiErrors.internalError('Failed to send verification SMS. Please try again.');
        }

        // 5. Return success. The `identifier` is needed for the next verification step.
        return successResponse(
            { identifier: phoneNumber },
            'Verification code sent successfully.',
            200
        );

    } catch (error) {
        console.error('Error sending OTP:', error);
        return ApiErrors.internalError('An unexpected error occurred while sending the OTP.');
    }
}