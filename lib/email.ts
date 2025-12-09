import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const resendFromEmail = process.env.FROM_EMAIL

export async function sendOtpEmail(to: string, otp: string) {
  try {
    const result = await resend.emails.send({
      from: `Verify <${resendFromEmail}>`,   
      to,
      subject: "Your Verification Code",
      html: `
        <div style="font-family:Arial; padding:20px;">
          <h2>Your OTP Code</h2>
          <p style="font-size: 22px; font-weight: bold;">
            ${otp}
          </p>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });
    console.log(result)
    return { success: true, result };
  } catch (error: any) {
    console.error("Resend Email OTP Error:", error);
    return { success: false, error };
  }
}
