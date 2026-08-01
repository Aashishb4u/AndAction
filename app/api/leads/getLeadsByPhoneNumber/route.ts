/**
 * app/api/leads/getLeadsByPhoneNumber/route.ts
 *
 * Looks up an existing lead by phone number across the Artist and Prospect
 * tables and returns the matching record(s).
 *
 * POST /api/leads/getLeadsByPhoneNumber
 * Body: { "phoneNumber": "9876543210" }
 *
 * 409 when a lead already exists (the record is returned in the body anyway),
 * 200 when nothing matches.
 *
 * Numbers are stored inconsistently (bare 10-digit, 91-prefixed, and +91...),
 * so the 10-digit Indian national number is extracted before matching.
 * India (+91) only.
 */

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { normalizePhoneNumber } from "@/lib/phone-utils";

const PHONE_BODY_KEYS = [
  "phoneNumber",
  "phone_number",
  "phone",
  "contactNumber",
  "contact_number",
  "whatsappNumber",
  "whatsapp_number",
  "number",
  "mobile",
] as const;

const COUNTRY_CODE_BODY_KEYS = [
  "countryCode",
  "country_code",
  "dialCode",
  "dial_code",
] as const;

/** Pull a value out of the body, tolerating the usual key spellings. */
function readBodyValue(
  body: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function extractPhoneNumber(body: Record<string, unknown>): string | null {
  return readBodyValue(body, PHONE_BODY_KEYS);
}

function extractCountryCode(body: Record<string, unknown>): string | null {
  return readBodyValue(body, COUNTRY_CODE_BODY_KEYS);
}

function getProvidedSecret(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);

  return bearerMatch?.[1] ?? request.headers.get("x-cron-secret");
}

/**
 * Match a column against every shape the same Indian number might be stored
 * in ("9876543210", "919876543210", "09876543210", "+91 98765 43210").
 *
 * This is an exact-set comparison rather than a "last 10 digits" suffix match,
 * so a foreign number that happens to share its tail with an Indian one can
 * never match it.
 */
function buildPhoneMatch(
  candidates: readonly string[],
  columns: readonly string[],
): Prisma.Sql {
  const conditions = columns.map((column) => {
    const normalized = Prisma.sql`REGEXP_REPLACE(COALESCE(${Prisma.raw(
      `"${column}"`,
    )}, ''), '[^0-9]', '', 'g')`;

    return Prisma.sql`${normalized} IN (${Prisma.join(
      candidates.map((candidate) => Prisma.sql`${candidate}`),
      ",",
    )})`;
  });

  return Prisma.sql`(${Prisma.join(conditions, " OR ")})`;
}

const ARTIST_SELECT = {
  id: true,
  userId: true,
  profileOrder: true,
  stageName: true,
  artistType: true,
  subArtistType: true,
  profileImage: true,
  shortBio: true,
  achievements: true,
  yearsOfExperience: true,
  contactNumber: true,
  whatsappNumber: true,
  contactEmail: true,
  performingLanguage: true,
  performingEventType: true,
  performingStates: true,
  soloChargesFrom: true,
  soloChargesTo: true,
  chargesWithBacklineFrom: true,
  chargesWithBacklineTo: true,
  instagramId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      countryCode: true,
      phoneNumber: true,
      city: true,
      state: true,
      isAccountVerified: true,
      isArtistVerified: true,
    },
  },
} satisfies Prisma.ArtistSelect;

/** Decimal columns don't serialise predictably — hand back plain numbers. */
function toNumber(value: Prisma.Decimal | number | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // This endpoint returns contact details, so it is protected the same way
    // as /api/admin/prospects: shared secret, or an admin session.
    const isOpenAccess = process.env.NODE_ENV !== "production";
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = getProvidedSecret(request);
    const hasValidSecret = Boolean(
      cronSecret && providedSecret && providedSecret === cronSecret,
    );

    if (!isOpenAccess && !hasValidSecret) {
      const session = await auth();
      if (!session?.user?.id) return ApiErrors.unauthorized();
      if (session.user.role !== "admin") return ApiErrors.forbidden();
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return ApiErrors.badRequest(
        "Request body must be an object containing a phoneNumber.",
      );
    }

    const rawPhoneNumber = extractPhoneNumber(body as Record<string, unknown>);

    if (!rawPhoneNumber) {
      return ApiErrors.badRequest("phoneNumber is required.");
    }

    const rawCountryCode = extractCountryCode(body as Record<string, unknown>);
    const normalized = normalizePhoneNumber(rawPhoneNumber, rawCountryCode);

    if (!normalized || normalized.digits.length < 6) {
      return ApiErrors.badRequest(
        "phoneNumber must contain at least 6 digits.",
      );
    }

    // Only +91 is supported, so a foreign number simply has no lead here.
    // Reported as a normal empty result so callers can branch on `found`.
    if (!normalized.isIndian) {
      return successResponse(
        {
          found: false,
          phoneNumber: rawPhoneNumber,
          matchedOn: null,
          callingCode: normalized.callingCode,
          source: null,
          artist: null,
          prospect: null,
          artists: [],
          prospects: [],
        },
        "Only Indian (+91) numbers are supported; no lead looked up.",
      );
    }

    const columns = ["contactNumber", "whatsappNumber"] as const;
    const artistMatch = buildPhoneMatch(normalized.candidates, columns);
    const prospectMatch = buildPhoneMatch(normalized.candidates, columns);

    // Raw SQL only resolves the ids; the records themselves come back through
    // Prisma so the selected fields stay explicit.
    const [artistRows, prospectRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "artists" WHERE ${artistMatch} ORDER BY "createdAt" ASC
      `,
      prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "prospects" WHERE ${prospectMatch} ORDER BY "discoveredAt" ASC
      `,
    ]);

    const artistIds = artistRows.map((row) => row.id);
    const prospectIds = prospectRows.map((row) => row.id);

    const [artists, prospects] = await Promise.all([
      artistIds.length
        ? prisma.artist.findMany({
            where: { id: { in: artistIds } },
            select: ARTIST_SELECT,
            orderBy: [{ profileOrder: "asc" }, { createdAt: "asc" }],
          })
        : Promise.resolve([]),
      prospectIds.length
        ? prisma.prospect.findMany({
            where: { id: { in: prospectIds } },
            orderBy: { discoveredAt: "asc" },
          })
        : Promise.resolve([]),
    ]);

    const artistRecords = artists.map((artist) => ({
      ...artist,
      soloChargesFrom: toNumber(artist.soloChargesFrom),
      soloChargesTo: toNumber(artist.soloChargesTo),
      chargesWithBacklineFrom: toNumber(artist.chargesWithBacklineFrom),
      chargesWithBacklineTo: toNumber(artist.chargesWithBacklineTo),
    }));

    const prospectRecords = prospects.map((prospect) => ({
      ...prospect,
      soloChargesFrom: toNumber(prospect.soloChargesFrom),
      soloChargesTo: toNumber(prospect.soloChargesTo),
      chargesWithBacklineFrom: toNumber(prospect.chargesWithBacklineFrom),
      chargesWithBacklineTo: toNumber(prospect.chargesWithBacklineTo),
    }));

    const found = artistRecords.length > 0 || prospectRecords.length > 0;

    if (!found) {
      return successResponse(
        {
          found: false,
          phoneNumber: rawPhoneNumber,
          matchedOn: normalized.nationalNumber,
          callingCode: normalized.callingCode,
          source: null,
          artist: null,
          prospect: null,
          artists: [],
          prospects: [],
        },
        "No lead found for this phone number.",
      );
    }

    // A number can exist in both tables (e.g. an accepted prospect that was
    // converted into an artist), so both are reported.
    const source =
      artistRecords.length && prospectRecords.length
        ? "both"
        : artistRecords.length
          ? "artist"
          : "prospect";

    // 409: the lead already exists. The record is still returned in the body so
    // callers can use it without a second request.
    return successResponse(
      {
        found: true,
        phoneNumber: rawPhoneNumber,
        matchedOn: normalized.nationalNumber,
        callingCode: normalized.callingCode,
        source,
        artist: artistRecords[0] ?? null,
        prospect: prospectRecords[0] ?? null,
        artists: artistRecords,
        prospects: prospectRecords,
      },
      "Lead already exists for this phone number.",
      409,
    );
  } catch (error) {
    console.error("POST /api/leads/getLeadsByPhoneNumber API Error:", error);
    return ApiErrors.internalError(
      "An unexpected error occurred while looking up the lead.",
    );
  }
}
