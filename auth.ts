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

// ---- Correct module augmentation for Auth.js v5 ----
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface JWT extends ExtendedUser {
    sub?: string;
  }
}

// Helper: make sure we only ever put JSON-serializable stuff into the token
const toPlain = <T>(obj: T): T =>
  obj ? (JSON.parse(JSON.stringify(obj)) as T) : obj;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
  },

  events: {
    async linkAccount({ user }) {
      if (!user?.id) return;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isAccountVerified: true,
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

          if (!user) throw new Error("User not found");
          if (!user.password) throw new Error("No password set");

          const valid = await verifyPassword(passwordRaw, String(user.password));
          if (!valid) throw new Error("Invalid password");

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
        } catch (err) {
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
      // FIX: satisfy AdapterUser typing
      if (!session.user) {
        session.user = {
          id: "",
          email: null,
          emailVerified: null,
          image: null,
        } as any;
      }

      const user = session.user;

      user.id = (token.sub as string) ?? (token.id as string);
      user.role = (token.role as ExtendedUser["role"]) || user.role || "user";

      user.email = (token.email as string) ?? null;
      user.firstName = (token.firstName as string) ?? null;
      user.lastName = (token.lastName as string) ?? null;
      user.avatar = (token.avatar as string) ?? null;
      user.phoneNumber = (token.phoneNumber as string) ?? null;
      user.countryCode = (token.countryCode as string) ?? null;
      user.city = (token.city as string) ?? null;
      user.state = (token.state as string) ?? null;
      user.address = (token.address as string) ?? null;
      user.zip = (token.zip as string) ?? null;
      user.gender = (token.gender as string) ?? null;
      user.dob = (token.dob as string) ?? null;
      user.isAccountVerified = !!token.isAccountVerified;
      user.isArtistVerified = !!token.isArtistVerified;
      user.isMarketingOptIn = !!token.isMarketingOptIn;
      user.isDataSharingOptIn = !!token.isDataSharingOptIn;

      if (token.role === "artist" && token.artistProfile) {
        user.artistProfile = toPlain(token.artistProfile as ArtistProfile);
      } else {
        user.artistProfile = null;
      }

      return session;
    },

    async jwt({ token, user, trigger, session }) {
      // 1️⃣ On initial login (credentials or OAuth) – copy from `user` into token
      if (user) {
        const u = user as ExtendedUser;

        token.id = u.id;
        token.role = u.role;
        token.email = u.email;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.avatar = u.avatar;
        token.phoneNumber = u.phoneNumber;
        token.countryCode = u.countryCode;
        token.city = u.city;
        token.state = u.state;
        token.address = u.address;
        token.zip = u.zip;
        token.gender = u.gender;
        token.dob = u.dob;
        token.isAccountVerified = u.isAccountVerified;
        token.isArtistVerified = u.isArtistVerified;
        token.isMarketingOptIn = u.isMarketingOptIn;
        token.isDataSharingOptIn = u.isDataSharingOptIn;

        if (u.artistProfile) {
          token.artistProfile = toPlain(u.artistProfile);
        }
      }

      // 2️⃣ When you explicitly call `session.update(...)` on client
      if (trigger === "update" && session) {
        const rawUpdate: any = (session as any).update ?? session;
        const update = toPlain(rawUpdate) as Partial<ExtendedUser>;

        const scalarKeys: (keyof ExtendedUser)[] = [
          "firstName",
          "lastName",
          "avatar",
          "phoneNumber",
          "countryCode",
          "city",
          "state",
          "address",
          "zip",
          "gender",
          "dob",
          "isAccountVerified",
          "isArtistVerified",
          "isMarketingOptIn",
          "isDataSharingOptIn",
          "email",
          "role",
        ];

        scalarKeys.forEach((key) => {
          if (key in update && typeof update[key] !== "undefined") {
            (token as any)[key] = update[key];
          }
        });

        if (typeof update.artistProfile !== "undefined") {
          token.artistProfile = update.artistProfile
            ? toPlain(update.artistProfile)
            : null;
        }
      }

      // 3️⃣ 🔥 ALWAYS sync role from DB when there is no `user` object (normal requests)
      if (!user && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.sub) },
            include: { artist: true },
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.firstName = dbUser.firstName;
            token.lastName = dbUser.lastName;
            token.email = dbUser.email;
            token.avatar = dbUser.avatar;
            token.phoneNumber = dbUser.phoneNumber;
            token.countryCode = dbUser.countryCode;
            token.city = dbUser.city;
            token.state = dbUser.state;
            token.address = dbUser.address;
            token.zip = dbUser.zip;
            token.gender = dbUser.gender;
            token.dob = dbUser.dob ? dbUser.dob.toISOString() : null;
            token.isAccountVerified = dbUser.isAccountVerified;
            token.isArtistVerified = dbUser.isArtistVerified;
            token.isMarketingOptIn = dbUser.isMarketingOptIn;
            token.isDataSharingOptIn = dbUser.isDataSharingOptIn;

            if (dbUser.role === "artist" && dbUser.artist) {
              token.artistProfile = toPlain({
                id: dbUser.artist.id,
                stageName: dbUser.artist.stageName ?? null,
                artistType: dbUser.artist.artistType ?? null,
                subArtistType: dbUser.artist.subArtistType ?? null,
                achievements: dbUser.artist.achievements ?? null,
                yearsOfExperience: dbUser.artist.yearsOfExperience ?? null,
                shortBio: dbUser.artist.shortBio ?? null,
                performingLanguage: dbUser.artist.performingLanguage ?? null,
                performingEventType: dbUser.artist.performingEventType ?? null,
                performingStates: dbUser.artist.performingStates ?? null,
                performingDurationFrom: dbUser.artist.performingDurationFrom ?? null,
                performingDurationTo: dbUser.artist.performingDurationTo ?? null,
                performingMembers: dbUser.artist.performingMembers ?? null,
                offStageMembers: dbUser.artist.offStageMembers ?? null,
                contactNumber: dbUser.artist.contactNumber ?? null,
                whatsappNumber: dbUser.artist.whatsappNumber ?? null,
                contactEmail: dbUser.artist.contactEmail ?? null,
                soloChargesFrom:
                  dbUser.artist.soloChargesFrom?.toString() ?? null,
                soloChargesTo: dbUser.artist.soloChargesTo?.toString() ?? null,
                chargesWithBacklineFrom:
                  dbUser.artist.chargesWithBacklineFrom?.toString() ?? null,
                chargesWithBacklineTo:
                  dbUser.artist.chargesWithBacklineTo?.toString() ?? null,
                soloChargesDescription:
                  dbUser.artist.soloChargesDescription ?? null,
                chargesWithBacklineDescription:
                  dbUser.artist.chargesWithBacklineDescription ?? null,
                instagramId: dbUser.artist.instagramId ?? null,
                youtubeChannelId: dbUser.artist.youtubeChannelId ?? null,
              } satisfies ArtistProfile);
            } else {
              token.artistProfile = null;
            }
          }
        } catch (err) {
          console.error("Error refreshing JWT:", err);
        }
      }

      return token;
    }
    ,
  },

  session: { strategy: "jwt" },
});
