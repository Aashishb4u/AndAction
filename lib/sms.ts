export async function sendOtpSms(
  countryCode: string,
  phoneNumber: string,
  otp: string
) {
  try {
    const url = "https://smsapi.edumarcsms.com/api/v1/sendsms";

    const body = {
      number: [phoneNumber],
      message: `Your OTP for verification is: ${otp}. OTP is confidential.`,
      senderId: process.env.EDUMARC_SENDER_ID!,
      templateId: process.env.EDUMARC_TEMPLATE_ID!,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EDUMARC_API_KEY!,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 🔥 Correct success condition based on REAL response structure
    const isSuccess =
      response.ok &&
      data?.success === true &&
      data?.data?.transactionId;

    if (isSuccess) {
      return { success: true, data };
    }

    // failure
    return { success: false, error: data };

  } catch (error) {
    return { success: false, error };
  }
}
