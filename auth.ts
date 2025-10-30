// This file will manage the NextAuth session and session details to create a proper authentication channel

import NextAuth, { type Session, type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials'; 
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password'; 

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: 'user' | 'artist';
            firstName: string | null;
            phoneNumber: string | null;
        } & DefaultSession['user'];
    }

    interface JWT {
        role: 'user' | 'artist';
    }
}

interface ExtendedUser {
    role: 'user' | 'artist';
}

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: [
        Credentials({
            name: 'Credentials', 
            credentials: {
                contact: { label: 'Email or Phone', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            
            async authorize(credentials) {
                const contactInput = credentials.contact;
                const passwordInput = credentials.password;

                if (typeof contactInput !== 'string' || typeof passwordInput !== 'string') {
                    return null;
                }
                
                const contact = contactInput.toLowerCase();
                const password = passwordInput;
                
                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: contact },
                            { phoneNumber: contact },
                        ],
                    },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isPasswordValid = await verifyPassword(password, user.password);

                if (!isPasswordValid) {
                    return null;
                }
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            },
        }),

        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }),
    ],

    session: {
        strategy: 'jwt',
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as ExtendedUser).role || 'user'; 
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = (token.role as 'user' | 'artist') || 'user';
            }
            return session;
        },
    },
    
    pages: {
        signIn: '/auth/signin',
        // signOut: '/auth/signout', // Default sign-out handler
        // error: '/auth/error', // Error page
    },
});