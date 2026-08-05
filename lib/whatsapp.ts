/**
 * WhatsApp Cloud API (Meta Graph) sender.
 *
 * Credentials live in env - never inline them here, this file is committed.
 *   WHATSAPP_PHONE_NUMBER_ID   the sender phone-number id from Meta
 *   WHATSAPP_ACCESS_TOKEN      permanent system-user token
 *   WHATSAPP_GRAPH_VERSION     optional, defaults to v20.0
 *   WHATSAPP_WELCOME_TEMPLATE  optional, defaults to welcome_message_to_artists_
 *   WHATSAPP_TEMPLATE_LANGUAGE optional, defaults to en
 */

import { normalizePhoneNumber, INDIA_CALLING_CODE } from "@/lib/phone-utils";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";
const WELCOME_TEMPLATE =
  process.env.WHATSAPP_WELCOME_TEMPLATE || "welcome_message_to_artists_";
const TEMPLATE_LANGUAGE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
const REQUEST_TIMEOUT_MS = Math.max(
  Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS || 15000),
  1000,
);

export function isWhatsappConfigured(): boolean {
  return Boolean(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

/**
 * Meta expects the full international number with no "+" or separators,
 * e.g. 919403733265. Anything that isn't a valid Indian number is rejected
 * rather than guessed at.
 */
export function toWhatsappRecipient(
  rawPhone?: string | null,
  rawCountryCode?: string | null,
): string | null {
  if (!rawPhone) return null;

  const normalized = normalizePhoneNumber(rawPhone, rawCountryCode);
  if (!normalized?.isIndian) return null;
  if (normalized.nationalNumber.length !== 10) return null;

  return `${INDIA_CALLING_CODE}${normalized.nationalNumber}`;
}

export interface WhatsappSendResult {
  success: boolean;
  messageId: string | null;
  status: number | null;
  error: string | null;
  /** True when retrying later cannot succeed (bad number, template gone). */
  isPermanentFailure: boolean;
}

/** Meta error codes that will never succeed on retry. */
const PERMANENT_ERROR_CODES = new Set([
  100, // invalid parameter / recipient
  131, // recipient not a valid WhatsApp user
  131026, // message undeliverable - not on WhatsApp
  132000, // template param count mismatch
  132001, // template does not exist
  132005, // template text too long
  132007, // template format mismatch
  132012, // template param format mismatch
  132015, // template paused
  132016, // template disabled
]);

/**
 * Base for the profile_link template variable. Falls back to the site URL so
 * dev and production each produce a working link.
 */
const PROFILE_LINK_BASE = (
  process.env.WHATSAPP_PROFILE_LINK_BASE ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://andaction.in"
).replace(/\/+$/, "");

/** Public profile URL for an artist, used as the template's profile_link. */
export function buildArtistProfileLink(artistId: string): string {
  return `${PROFILE_LINK_BASE}/artists/${artistId}`;
}

/**
 * Sends the artist welcome template. Never throws - the caller gets a result
 * object so one bad number can't abort a batch.
 *
 * The template takes TWO named body parameters and rejects anything else
 * with (#132000): artist_name and profile_link.
 */
export async function sendArtistWelcomeTemplate(params: {
  to: string;
  artistName: string;
  profileLink: string;
}): Promise<WhatsappSendResult> {
  const { to, artistName, profileLink } = params;

  if (!isWhatsappConfigured()) {
    return {
      success: false,
      messageId: null,
      status: null,
      error:
        "WhatsApp is not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN missing)",
      isPermanentFailure: true,
    };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: WELCOME_TEMPLATE,
      language: { code: TEMPLATE_LANGUAGE },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              parameter_name: "artist_name",
              text: artistName,
            },
            {
              type: "text",
              parameter_name: "profile_link",
              text: profileLink,
            },
          ],
        },
      ],
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    if (response.ok && body?.messages?.[0]?.id) {
      return {
        success: true,
        messageId: body.messages[0].id,
        status: response.status,
        error: null,
        isPermanentFailure: false,
      };
    }

    const code = Number(body?.error?.code);
    const message =
      body?.error?.message ||
      body?.error?.error_user_msg ||
      `WhatsApp API returned ${response.status}`;

    return {
      success: false,
      messageId: null,
      status: response.status,
      error: `${message}${Number.isFinite(code) ? ` (code ${code})` : ""}`,
      // 4xx other than rate limiting won't fix itself on retry.
      isPermanentFailure:
        PERMANENT_ERROR_CODES.has(code) ||
        (response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429),
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";

    return {
      success: false,
      messageId: null,
      status: null,
      error: isAbort
        ? `WhatsApp request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Unknown WhatsApp error",
      // Network/timeout problems are worth retrying.
      isPermanentFailure: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}
