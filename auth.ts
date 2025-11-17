import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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

  performingDurationFrom?: string | null;
  performingDurationTo?: string | null;
  performingMembers?: string | null;
  offStageMembers?: string | null;

  contactNumber?: string | null;
  whatsappNumber?: string | null;
  contactEmail?: string | null;

  soloChargesFrom?: string | number | null;
  soloChargesTo?: string | number | null;
  soloChargesDescription?: string | null;

  chargesWithBacklineFrom?: string | number | null;
  chargesWithBacklineTo?: string | number | null;
  chargesWithBacklineDescription?: string | null;

  youtubeChannelId?: string | null;
  instagramId?: string | null;
}

interface ExtendedUser {
  id: string;
  role: "user" | "artist" | "admin";
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
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface JWT extends ExtendedUser {}
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),

  pages: {
    signIn: "/auth/signin",
  },

  events: {
    async linkAccount({ user }) {
      // NOTE: For OAuth users we will update the isAccountVerified field and copy image to avatar
      if (!user?.id) return;

      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { image: true , name: true },
      });

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          isAccountVerified: true,
          avatar: existingUser?.image || undefined,
          firstName: user.name?.split(" ")[0],
          lastName: user.name?.split(" ")[1] || "",
        },
      });
    },
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        contact: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, any> | undefined) {
        try {
          if (!credentials?.contact || !credentials?.password) {
            throw new Error("Missing credentials");
          }
          const contactRaw = String(credentials.contact).trim();
          const passwordRaw = String(credentials.password);
          const isEmail = contactRaw.includes("@");
          let user: any | null = null;
          if (isEmail) {
            user = await prisma.user.findUnique({
              where: { email: contactRaw.toLowerCase() },
              include: { artist: true },
            });
          } else {
            const digits = contactRaw.replace(/\D/g, "");
            user = await prisma.user.findFirst({
              where: { phoneNumber: digits },
              include: { artist: true },
            });
          }

          if (!user) {
            console.error(
              "[Authorize] User not found for contact:",
              contactRaw
            );
            throw new Error("User not found");
          }
          if (!user.password) {
            console.error(
              "[Authorize] User found but password missing:",
              user.id
            );
            throw new Error("No password set");
          }

          const valid = await verifyPassword(
            passwordRaw,
            String(user.password)
          );
          // if (!valid) throw new Error('Invalid password');

          if (!valid) {
            console.error("[Authorize] Password mismatch for user:", user.id);
            throw new Error("Invalid password");
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

          if (user.role === "artist" && user.artist) {
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
          throw new Error("Invalid email / phone or password");
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

  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as "user" | "artist" | "admin";
      }

      if (session.user) {
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.avatar = (token.image || token.avatar) as string;
        session.user.phoneNumber = token.phoneNumber as string;
        session.user.countryCode = token.countryCode as string;
        session.user.city = token.city as string;
        session.user.state = token.state as string;
        session.user.address = token.address as string;
        session.user.zip = token.zip as string;
        session.user.gender = token.gender as string;
        session.user.dob = token.dob as string;
        session.user.isAccountVerified = token.isAccountVerified as boolean;
        session.user.isArtistVerified = token.isArtistVerified as boolean;
        session.user.isMarketingOptIn = token.isMarketingOptIn as boolean;
        session.user.isDataSharingOptIn = token.isDataSharingOptIn as boolean;
      }

      // Handle artist profile
      if (token.role === "artist") {
        session.user.artistProfile =
          token.artistProfile &&
          typeof token.artistProfile === "object" &&
          "id" in (token.artistProfile as object)
            ? (token.artistProfile as any)
            : null;
      } else {
        delete (session.user as any).artistProfile;
      }

      return session;
    },

    async jwt({ token, user, trigger, session }) {
      console.log("JWT callback trigger:", user, session);
      // User just logged in → merge user data into token
      if (user) {
        Object.assign(token, user);
      }

      // Session update() was called → merge updated fields into token
      if (trigger === "update" && session?.update) {
        Object.assign(token, session.update);
      }

      // Fetch fresh user data from database if token exists
      if (!user && token?.sub) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { id: String(token.sub) },
            include: { artist: true },
          });

          if (!existingUser) return token;

          token.role = existingUser.role;
          token.firstName = existingUser.firstName;
          token.lastName = existingUser.lastName;
          token.email = existingUser.email;
          token.avatar = existingUser.image || existingUser.avatar;
          token.image = existingUser.image;
          token.phoneNumber = existingUser.phoneNumber;
          token.countryCode = existingUser.countryCode;
          token.city = existingUser.city;
          token.state = existingUser.state;
          token.address = existingUser.address;
          token.zip = existingUser.zip;
          token.gender = existingUser.gender;
          token.dob = existingUser.dob ? existingUser.dob.toISOString() : null;
          token.isAccountVerified = existingUser.isAccountVerified;
          token.isArtistVerified = existingUser.isArtistVerified;
          token.isMarketingOptIn = existingUser.isMarketingOptIn;
          token.isDataSharingOptIn = existingUser.isDataSharingOptIn;

          // Load artist profile if user is an artist
          if (existingUser.role === "artist" && existingUser.artist) {
            token.artistProfile = {
              id: existingUser.artist.id,
              stageName: existingUser.artist.stageName ?? null,
              artistType: existingUser.artist.artistType ?? null,
              subArtistType: existingUser.artist.subArtistType ?? null,
              achievements: existingUser.artist.achievements ?? null,
              yearsOfExperience: existingUser.artist.yearsOfExperience ?? null,
              shortBio: existingUser.artist.shortBio ?? null,
              performingLanguage:
                existingUser.artist.performingLanguage ?? null,
              performingEventType:
                existingUser.artist.performingEventType ?? null,
              performingStates: existingUser.artist.performingStates ?? null,
              performingDurationFrom:
                existingUser.artist.performingDurationFrom ?? null,
              performingDurationTo:
                existingUser.artist.performingDurationTo ?? null,
              performingMembers: existingUser.artist.performingMembers ?? null,
              offStageMembers: existingUser.artist.offStageMembers ?? null,
              contactNumber: existingUser.artist.contactNumber ?? null,
              whatsappNumber: existingUser.artist.whatsappNumber ?? null,
              contactEmail: existingUser.artist.contactEmail ?? null,
              soloChargesFrom: existingUser.artist.soloChargesFrom ?? null,
              soloChargesTo: existingUser.artist.soloChargesTo ?? null,
              chargesWithBacklineFrom:
                existingUser.artist.chargesWithBacklineFrom ?? null,
              chargesWithBacklineTo:
                existingUser.artist.chargesWithBacklineTo ?? null,
              soloChargesDescription:
                existingUser.artist.soloChargesDescription ?? null,
              chargesWithBacklineDescription:
                existingUser.artist.chargesWithBacklineDescription ?? null,
              instagramId: existingUser.artist.instagramId ?? null,
              youtubeChannelId: existingUser.artist.youtubeChannelId ?? null,
            };
          }
        } catch (err) {
          console.error("Error refreshing JWT:", err);
        }
      }

      return token;
    },
  },

  session: { strategy: "jwt" },
});
