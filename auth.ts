import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

interface ArtistProfile {
  id: string;
  stageName?: string | null;
  artistType?: string | null;
  subArtistType?: string | null;
  achievements?: string | null;
  yearsOfExperience?: number | null;
  shortBio?: string | null;
  performingLanguage?: string | null;
  performingEventType?: string | null;
  performingStates?: string | null;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  contactEmail?: string | null;
  instagramId?: string | null;
  youtubeChannelId?: string | null;
}
interface ExtendedUser {
  id: string;
  role: 'user' | 'artist' | 'admin';
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  avatar?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  zip?: string | null;
  gender?: string | null;
  dob?: string | null;
  isAccountVerified?: boolean;
  isArtistVerified?: boolean;
  isMarketingOptIn?: boolean;
  isDataSharingOptIn?: boolean;
  artistProfile?: ArtistProfile | null;
}
declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }

  interface JWT extends ExtendedUser { }
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
      async authorize(credentials: Record<string, any> | undefined) {
        try {
          if (!credentials?.contact || !credentials?.password) {
            throw new Error('Missing credentials');
          }
          const contactRaw = String(credentials.contact).trim();
          const passwordRaw = String(credentials.password);
          const isEmail = contactRaw.includes('@');
          let user: any | null = null;
          if (isEmail) {
            user = await prisma.user.findUnique({
              where: { email: contactRaw.toLowerCase() },
              include: { artist: true },
            });
          } else {
            const digits = contactRaw.replace(/\D/g, '');
            user = await prisma.user.findFirst({
              where: { phoneNumber: digits },
              include: { artist: true },
            });
          }

          if (!user) {
            console.error("[Authorize] User not found for contact:", contactRaw);
            throw new Error('User not found');
          }
          if (!user.password) {
            console.error("[Authorize] User found but password missing:", user.id);
            throw new Error('No password set');
          }

          const valid = await verifyPassword(passwordRaw, String(user.password));
          // if (!valid) throw new Error('Invalid password');

          if (!valid) {
            console.error("[Authorize] Password mismatch for user:", user.id);
            throw new Error('Invalid password');
          }

          const safeUser: ExtendedUser = {
            id: user.id,
            role: user.role,
            email: user.email ?? null,
            phoneNumber: user.phoneNumber ?? null,
            countryCode: user.countryCode ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            avatar: user.avatar ? String(user.avatar) : null,
            city: user.city ?? null,
            state: user.state ?? null,
            address: user.address ?? null,
            zip: user.zip ?? null,
            gender: user.gender ?? null,
            dob: user.dob ? user.dob.toISOString() : null,
            isAccountVerified: !!user.isAccountVerified,
            isArtistVerified: !!user.isArtistVerified,
            isMarketingOptIn: !!user.isMarketingOptIn,
            isDataSharingOptIn: !!user.isDataSharingOptIn,
          };

          if (user.role === 'artist' && user.artist) {
            safeUser.artistProfile = {
              id: user.artist.id,
              stageName: user.artist.stageName ?? null,
              artistType: user.artist.artistType ?? null,
              subArtistType: user.artist.subArtistType ?? null,
              achievements: user.artist.achievements ?? null,
              yearsOfExperience: user.artist.yearsOfExperience ?? null,
              shortBio: user.artist.shortBio ?? null,
              performingLanguage: user.artist.performingLanguage ?? null,
              performingEventType: user.artist.performingEventType ?? null,
              performingStates: user.artist.performingStates ?? null,
              contactNumber: user.artist.contactNumber ?? null,
              whatsappNumber: user.artist.whatsappNumber ?? null,
              contactEmail: user.artist.contactEmail ?? null,
              instagramId: user.artist.instagramId ?? null,
              youtubeChannelId: user.artist.youtubeChannelId ?? null,
            };
          }

          return safeUser;
        } catch (err: any) {
          throw new Error('Invalid email / phone or password');
        }
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        Object.assign(token, u);
      }
      if (!user && token?.id && token.role === 'artist' && !token.artistProfile) {
        try {
          const artistUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            include: { artist: true },
          });

          if (artistUser?.artist) {
            token.artistProfile = {
              id: artistUser.artist.id,
              stageName: artistUser.artist.stageName ?? null,
              artistType: artistUser.artist.artistType ?? null,
              subArtistType: artistUser.artist.subArtistType ?? null,
              achievements: artistUser.artist.achievements ?? null,
              yearsOfExperience: artistUser.artist.yearsOfExperience ?? null,
              shortBio: artistUser.artist.shortBio ?? null,
              performingLanguage: artistUser.artist.performingLanguage ?? null,
              performingEventType: artistUser.artist.performingEventType ?? null,
              performingStates: artistUser.artist.performingStates ?? null,
              contactNumber: artistUser.artist.contactNumber ?? null,
              whatsappNumber: artistUser.artist.whatsappNumber ?? null,
              contactEmail: artistUser.artist.contactEmail ?? null,
              instagramId: artistUser.artist.instagramId ?? null,
              youtubeChannelId: artistUser.artist.youtubeChannelId ?? null,
              soloChargesFrom: artistUser.artist.soloChargesFrom ?? null,
              soloChargesTo: artistUser.artist.soloChargesTo ?? null,
              chargesWithBacklineFrom: artistUser.artist.chargesWithBacklineFrom ?? null,
              chargesWithBacklineTo: artistUser.artist.chargesWithBacklineTo ?? null,
              soloChargesDescription: artistUser.artist.soloChargesDescription ?? null,
              chargesWithBacklineDescription: artistUser.artist.chargesWithBacklineDescription ?? null,
            };
          }
        } catch (err) {
          console.error('Error refreshing artist JWT:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, token);
        if (token.role === 'user' || token.role === 'admin') {
          delete (session.user as any).artistProfile;
        }

        if (token.role === 'artist') {
          session.user.artistProfile =
            token.artistProfile &&
              typeof token.artistProfile === 'object' &&
              'id' in (token.artistProfile as object)
              ? (token.artistProfile as any)
              : null;
        }
      }

      return session;
    },
  },


  pages: {
    signIn: '/auth/signin',
  },
});
