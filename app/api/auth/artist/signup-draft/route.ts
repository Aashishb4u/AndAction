import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiErrors, successResponse } from "@/lib/api-response";

const CREATE_DRAFT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS artist_signup_drafts (
    id TEXT PRIMARY KEY,
    identifier TEXT UNIQUE NOT NULL,
    contact_type TEXT,
    current_step TEXT NOT NULL DEFAULT 'join',
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const UPSERT_DRAFT_SQL = `
  INSERT INTO artist_signup_drafts (
    id,
    identifier,
    contact_type,
    current_step,
    draft_data,
    updated_at
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5::jsonb,
    NOW()
  )
  ON CONFLICT (identifier)
  DO UPDATE SET
    contact_type = EXCLUDED.contact_type,
    current_step = EXCLUDED.current_step,
    draft_data = EXCLUDED.draft_data,
    updated_at = NOW();
`;

const SELECT_DRAFT_SQL = `
  SELECT identifier, contact_type, current_step, draft_data, updated_at
  FROM artist_signup_drafts
  WHERE identifier = $1
  LIMIT 1;
`;

const DELETE_DRAFT_SQL = `
  DELETE FROM artist_signup_drafts
  WHERE identifier = $1;
`;

async function ensureDraftTable() {
  await prisma.$executeRawUnsafe(CREATE_DRAFT_TABLE_SQL);
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

function generateDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { identifier, contactType, step, draftData } = body || {};

    if (!identifier || typeof identifier !== "string") {
      return ApiErrors.badRequest("A valid identifier is required to save signup draft.");
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);

    await ensureDraftTable();

    await prisma.$executeRawUnsafe(
      UPSERT_DRAFT_SQL,
      generateDraftId(),
      normalizedIdentifier,
      contactType || null,
      step || "join",
      JSON.stringify(draftData || {}),
    );

    return successResponse(
      {
        identifier: normalizedIdentifier,
        step: step || "join",
      },
      "Signup draft saved successfully.",
    );
  } catch (error) {
    console.error("Signup draft save error:", error);
    return ApiErrors.internalError("Failed to save signup draft.");
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const identifier = request.nextUrl.searchParams.get("identifier");

    if (!identifier) {
      return ApiErrors.badRequest("Identifier is required.");
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);

    await ensureDraftTable();

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        identifier: string;
        contact_type: string | null;
        current_step: string;
        draft_data: unknown;
        updated_at: Date;
      }>
    >(SELECT_DRAFT_SQL, normalizedIdentifier);

    const draft = rows[0];

    if (!draft) {
      return ApiErrors.notFound("Signup draft not found.");
    }

    return successResponse(
      {
        identifier: draft.identifier,
        contactType: draft.contact_type,
        step: draft.current_step,
        draftData: draft.draft_data,
        updatedAt: draft.updated_at,
      },
      "Signup draft fetched successfully.",
    );
  } catch (error) {
    console.error("Signup draft fetch error:", error);
    return ApiErrors.internalError("Failed to fetch signup draft.");
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const identifier = body?.identifier;

    if (!identifier || typeof identifier !== "string") {
      return ApiErrors.badRequest("A valid identifier is required to delete signup draft.");
    }

    const normalizedIdentifier = normalizeIdentifier(identifier);

    await ensureDraftTable();

    await prisma.$executeRawUnsafe(DELETE_DRAFT_SQL, normalizedIdentifier);

    return successResponse(
      {
        identifier: normalizedIdentifier,
      },
      "Signup draft cleared successfully.",
    );
  } catch (error) {
    console.error("Signup draft clear error:", error);
    return ApiErrors.internalError("Failed to clear signup draft.");
  }
}
