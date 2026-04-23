export const runtime = 'edge';

export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="31" fill="#0A0A0A"/>
  <g transform="translate(0 0)">
    <path d="M19 20 L36 32 L19 44 L19 38 L29 32 L19 26 Z" fill="#F04B23"/>
    <path d="M28 20 L45 32 L28 44 L28 38 L38 32 L28 26 Z" fill="#E10098"/>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
