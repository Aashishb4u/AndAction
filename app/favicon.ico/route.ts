export const runtime = 'nodejs';

export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="56" y="56" width="400" height="400" rx="120" fill="#0A0A0A"/><polygon points="144,144 288,256 144,368 144,312 224,256 144,200" fill="#F04B23"/><polygon points="232,144 376,256 232,368 232,312 312,256 232,200" fill="#E10098"/></svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}

