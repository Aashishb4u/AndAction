const VPS_UPLOAD_URL = process.env.VPS_UPLOAD_URL!; // e.g. http://72.62.227.114/api
const VPS_BASE_URL = process.env.VPS_BASE_URL!; // e.g. http://72.62.227.114/uploads
const VPS_UPLOAD_SECRET = process.env.VPS_UPLOAD_SECRET!;

export async function uploadToVPS({
  buffer,
  key,
  mimeType,
}: {
  buffer: Buffer;
  key: string;
  mimeType: string;
}) {
  const res = await fetch(`${VPS_UPLOAD_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      "x-upload-secret": VPS_UPLOAD_SECRET,
      "x-file-key": key,
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "VPS upload failed");
  }

  return `${VPS_BASE_URL}/${key}`;
}

export async function deleteFromVPS(fileUrl: string) {
  if (!fileUrl || !fileUrl.startsWith(VPS_BASE_URL)) return;

  const key = fileUrl.replace(`${VPS_BASE_URL}/`, "");

  await fetch(`${VPS_UPLOAD_URL}/delete`, {
    method: "DELETE",
    headers: {
      "x-upload-secret": VPS_UPLOAD_SECRET,
      "x-file-key": key,
    },
  });
}
