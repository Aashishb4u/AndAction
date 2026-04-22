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


export function mapUserForSession(apiUser: any, apiArtist: any) {
  return {
    // top-level user fields
    id: apiUser.id,
    role: apiUser.role,
    email: apiUser.email,
    phoneNumber: apiUser.phoneNumber,
    countryCode: apiUser.countryCode,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    avatar: apiUser.avatar,
    city: apiUser.city,
    state: apiUser.state,
    address: apiUser.address,
    zip: apiUser.zip,
    gender: apiUser.gender,
    dob: apiUser.dob,
    isAccountVerified: apiUser.isAccountVerified,
    isArtistVerified: apiUser.isArtistVerified,
    isMarketingOptIn: apiUser.isMarketingOptIn,
    isDataSharingOptIn: apiUser.isDataSharingOptIn,

    // nested artistProfile – FULL object
    artistProfile: {
      id: apiArtist.id,
      stageName: apiArtist.stageName,
      artistType: apiArtist.artistType,
      subArtistType: apiArtist.subArtistType,
      achievements: apiArtist.achievements,
      yearsOfExperience: apiArtist.yearsOfExperience,
      shortBio: apiArtist.shortBio,
      performingLanguage: apiArtist.performingLanguage,
      performingEventType: apiArtist.performingEventType,
      performingStates: apiArtist.performingStates,
      performingDurationFrom: apiArtist.performingDurationFrom,
      performingDurationTo: apiArtist.performingDurationTo,
      performingMembers: apiArtist.performingMembers,
      offStageMembers: apiArtist.offStageMembers,

      contactNumber: apiArtist.contactNumber,
      whatsappNumber: apiArtist.whatsappNumber,
      contactEmail: apiArtist.contactEmail,

      soloChargesFrom: apiArtist.soloChargesFrom,
      soloChargesTo: apiArtist.soloChargesTo,
      soloChargesDescription: apiArtist.soloChargesDescription,

      chargesWithBacklineFrom: apiArtist.chargesWithBacklineFrom,
      chargesWithBacklineTo: apiArtist.chargesWithBacklineTo,
      chargesWithBacklineDescription: apiArtist.chargesWithBacklineDescription,

      youtubeChannelId: apiArtist.youtubeChannelId,
      instagramId: apiArtist.instagramId,
    }
  };
}
