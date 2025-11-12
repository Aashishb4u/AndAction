// /auth.ts
// Handles all NextAuth configuration, JWT, and session logic.

import NextAuth, { type Session, type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

/* -------------------------------------------------------------------------- */
/*                          TYPE DECLARATIONS (TS)                            */
/* -------------------------------------------------------------------------- */

interface ArtistSessionData {
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
  performingDurationFrom?: string | null;
  performingDurationTo?: string | null;
  performingMembers?: string | null;
  offStageMembers?: string | null;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  contactEmail?: string | null;
  soloChargesFrom?: string | null;
  soloChargesTo?: string | null;
  youtubeChannelId?: string | null;
  instagramId?: string | null;
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
  isAccountVerified?: boolean;
  isArtistVerified?: boolean;
  artist?: ArtistSessionData | null;
}

/* -------------------------------------------------------------------------- */
/*                          MODULE AUGMENTATION                               */
/* -------------------------------------------------------------------------- */

declare module 'next-auth' {
  interface Session {
    user: {
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
      isAccountVerified?: boolean;
      isArtistVerified?: boolean;
      artist?: ArtistSessionData | null;
    } & DefaultSession['user'];
  }

  interface JWT {
    id?: string;
    role?: 'user' | 'artist' | 'admin';
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    countryCode?: string | null;
    avatar?: string | null;
    city?: string | null;
    state?: string | null;
    isAccountVerified?: boolean;
    isArtistVerified?: boolean;
    artist?: ArtistSessionData | null;
  }
}

/* -------------------------------------------------------------------------- */
/*                         NEXTAUTH CONFIGURATION                             */
/* -------------------------------------------------------------------------- */

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    /* --------------------------- Credentials Login -------------------------- */
    Credentials({
      name: 'Credentials',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<string, any> | undefined) {
  try {
    // --- 1. Validate input --------------------------------------------
    if (!credentials?.contact || !credentials?.password) {
      throw new Error('Missing credentials');
    }

    const contactRaw = String(credentials.contact).trim();
    const passwordRaw = String(credentials.password);

    if (!contactRaw || !passwordRaw) {
      throw new Error('Empty credentials');
    }

    const contact = contactRaw.includes('@')
      ? contactRaw.toLowerCase()
      : contactRaw.replace(/\D/g, ''); // strip non-digits for phone

    // --- 2. Look up user -----------------------------------------------
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: contact }, { phoneNumber: contact }],
      },
      include: { artist: true },
    });

    if (!user) throw new Error('User not found');
    if (!user.password) throw new Error('No password set');

    // --- 3. Verify password --------------------------------------------
    const valid = await verifyPassword(passwordRaw, String(user.password));
    if (!valid) throw new Error('Invalid password');

    // --- 4. Build safe plain object (no Prisma internals) --------------
    const safeUser = {
      id: user.id,
      role: user.role as 'user' | 'artist' | 'admin',
      email: user.email ?? null,
      phoneNumber: user.phoneNumber ?? null,
      countryCode: user.countryCode ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      avatar: user.avatar ?? null,
      city: user.city ?? null,
      state: user.state ?? null,
      isAccountVerified: !!user.isAccountVerified,
      isArtistVerified: !!user.isArtistVerified,
      artist: user.artist
        ? {
            id: user.artist.id,
            stageName: user.artist.stageName ?? null,
            artistType: user.artist.artistType ?? null,
            subArtistType: user.artist.subArtistType ?? null,
            shortBio: user.artist.shortBio ?? null,
          }
        : null,
    };

    console.log('✅ authorize success:', safeUser.id, safeUser.role);
    return safeUser;
  } catch (err: any) {
    console.error('❌ authorize failed:', err.message);
    throw new Error('Invalid email / phone or password');
  }
}


    }),

    /* ------------------------------ OAuth Logins ----------------------------- */
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

  /* -------------------------------------------------------------------------- */
  /*                               CALLBACKS                                   */
  /* -------------------------------------------------------------------------- */
  callbacks: {
    async jwt({ token, user }) {
      // Attach user fields when logging in
      if (user) {
        const u = user as ExtendedUser;
        token.id = u.id;
        token.role = u.role;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.email = u.email;
        token.phoneNumber = u.phoneNumber;
        token.countryCode = u.countryCode;
        token.avatar = u.avatar;
        token.city = u.city;
        token.state = u.state;
        token.isAccountVerified = u.isAccountVerified;
        token.isArtistVerified = u.isArtistVerified;
        token.artist = u.artist ?? null;
      }

      // Refresh artist info if artist user
      if (token.role === 'artist' && token.id) {
        const artistUser = await prisma.user.findUnique({
          where: { id: String(token.id) },
          include: { artist: true },
        });
        if (artistUser?.artist) {
          token.artist = {
            id: artistUser.artist.id,
            stageName: artistUser.artist.stageName,
            artistType: artistUser.artist.artistType,
            subArtistType: artistUser.artist.subArtistType,
            yearsOfExperience: artistUser.artist.yearsOfExperience,
            shortBio: artistUser.artist.shortBio,
          };
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const user = session.user as any;
        user.id = token.id ?? '';
        user.role = token.role ?? 'user';
        user.firstName = token.firstName ?? null;
        user.lastName = token.lastName ?? null;
        user.email = token.email ?? null;
        user.phoneNumber = token.phoneNumber ?? null;
        user.countryCode = token.countryCode ?? null;
        user.avatar = token.avatar ?? null;
        user.city = token.city ?? null;
        user.state = token.state ?? null;
        user.isAccountVerified = token.isAccountVerified ?? false;
        user.isArtistVerified = token.isArtistVerified ?? false;
        user.artist = token.artist ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },
});
