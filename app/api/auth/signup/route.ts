import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/password';
import { ApiErrors, successResponse, ApiResponse } from '@/lib/api-response';
import { UserRole } from '@/lib/types/database';
import { signIn } from '../../../../auth'; 

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return ApiErrors.badRequest('Invalid JSON body.');
    }
    
    const { 
        email, 
        phone, 
        countryCode, 
        password, 
        firstName, 
        lastName,
        avatar, 
        state,  
        city,
        noMarketing, 
        shareData, 
    } = body;

    const lowerCaseEmail = email ? email.toLowerCase() : undefined;    
    const contactMethod = lowerCaseEmail || phone;

    if (!contactMethod || !password || !firstName || !lastName) {
        return ApiErrors.badRequest('Contact method (email or phone), password, first name, and last name are required.');
    }
    
    if (phone && !countryCode) {
        return ApiErrors.badRequest('Phone registration requires a country code.');
    }

    const strengthCheck = validatePasswordStrength(password);
    
    if (!strengthCheck.isValid) {
        return ApiErrors.badRequest(strengthCheck.message || 'Password strength requirements not met.');
    }

    try {
        let existingUser: any = null;
        if (lowerCaseEmail) {
            existingUser = await prisma.user.findUnique({ where: { email: lowerCaseEmail } });
        }
        
        if (!existingUser && phone) {
            existingUser = await prisma.user.findFirst({ 
                where: { 
                    phoneNumber: phone, 
                    countryCode: countryCode 
                } 
            });
        }

        if (existingUser) {
            const conflictField = existingUser.email === lowerCaseEmail ? 'email' : 'phone number';
            return ApiErrors.conflict(`A user with this ${conflictField} already exists.`);
        }

        const hashedPassword = await hashPassword(password);
        
        const finalIdentifier = lowerCaseEmail || (phone ? `${countryCode}${phone}` : undefined);
        
        const newUser = await prisma.user.create({
            data: {
                email: lowerCaseEmail, 
                phoneNumber: phone,          // Storing local number
                countryCode: countryCode,    // Storing country code
                password: hashedPassword,                
                firstName,
                lastName,
                city,
                state,
                avatar: avatar ? String(avatar) : null, 
                
                role: 'user' as UserRole,
                isAccountVerified: true,
                isArtistVerified: false,
                isMarketingOptIn: !noMarketing, // Opt-in is the inverse of noMarketing
                isDataSharingOptIn: shareData,  // Data sharing is direct
            },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                phoneNumber: true,
            }
        });
        
        if (finalIdentifier) {
            await prisma.verificationToken.deleteMany({
                where: { 
                    identifier: finalIdentifier,
                    expires: {
                        gte: new Date()
                    }
                }
            });
        }
        
        try {
            const contactIdentifier = lowerCaseEmail || phone; 

            await signIn('credentials', {
                contact: contactIdentifier, 
                password: password, 
                redirect: false,
            });

            return successResponse(
                { user: newUser },
                'Customer account created and session successfully established.',
                201
            );
        } catch (authError) {
            console.error('NextAuth Sign-In Error after successful Sign-Up:', authError);
            return ApiErrors.internalError('Account created, but a session could not be established. Please try logging in separately.');
        }

    } catch (error) {
        console.error('Customer Sign-up API Error:', error);
        if ((error as any).code === 'P2002') {
             return ApiErrors.conflict('A user with this contact information already exists.');
        }
        return ApiErrors.internalError('An unexpected error occurred during registration.');
    }
}
