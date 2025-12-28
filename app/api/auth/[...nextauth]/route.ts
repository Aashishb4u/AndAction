/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * The official entry point for all NextAuth (Auth.js) requests.
 * It imports the configured handlers (GET and POST) from the central 'auth.ts' file
 * and exports them as the Next.js Route Handlers.
 *
 * This completes the NextAuth setup for the App Router.
 */

// FIX: Importing GET and POST directly, as they are the final exported route handlers
// from the central NextAuth configuration file (auth.ts) using the path alias '@/auth'.
import { GET, POST } from '@/auth'; 

export { GET, POST };
