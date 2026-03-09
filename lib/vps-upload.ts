import SftpClient from "ssh2-sftp-client";

const VPS_HOST = process.env.VPS_HOST!;
const VPS_PORT = parseInt(process.env.VPS_PORT || "22", 10);
const VPS_USER = process.env.VPS_USER!;
const VPS_PASSWORD = process.env.VPS_PASSWORD!;
const VPS_UPLOAD_DIR = process.env.VPS_UPLOAD_DIR || "/var/www/uploads";
const VPS_BASE_URL = process.env.VPS_BASE_URL!; // e.g. https://72.62.227.114/uploads or a domain

export async function uploadToVPS({
  buffer,
  key,
  mimeType,
}: {
  buffer: Buffer;
  key: string;
  mimeType: string;
}) {
  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: VPS_HOST,
      port: VPS_PORT,
      username: VPS_USER,
      password: VPS_PASSWORD,
    });

    const remotePath = `${VPS_UPLOAD_DIR}/${key}`;

    // Ensure the directory exists
    const remoteDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    await sftp.mkdir(remoteDir, true);

    // Upload the file
    await sftp.put(buffer, remotePath);

    return `${VPS_BASE_URL}/${key}`;
  } finally {
    await sftp.end();
  }
}

export async function deleteFromVPS(fileUrl: string) {
  if (!fileUrl || !fileUrl.startsWith(VPS_BASE_URL)) return;

  const key = fileUrl.replace(`${VPS_BASE_URL}/`, "");
  const remotePath = `${VPS_UPLOAD_DIR}/${key}`;
  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: VPS_HOST,
      port: VPS_PORT,
      username: VPS_USER,
      password: VPS_PASSWORD,
    });

    const exists = await sftp.exists(remotePath);
    if (exists) {
      await sftp.delete(remotePath);
    }
  } finally {
    await sftp.end();
  }
}
