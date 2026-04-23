export const runtime = 'nodejs';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'icons', 'app-mark.svg');
  const svg = await readFile(filePath);

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

