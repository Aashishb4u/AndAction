export async function updateArtistProfile(payload: any) {
  try {
    const res = await fetch("/api/artists/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");

    return data;
  } catch (error: any) {
    console.error("Artist Update Error:", error);
    throw error;
  }
}
