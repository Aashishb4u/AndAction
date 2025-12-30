import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const resendFromEmail = process.env.FROM_EMAIL

export async function sendOtpEmail(to: string, otp: string) {
  try {
    const result = await resend.emails.send({
      from: `AndAction <${resendFromEmail}>`,   
      to,
      subject: "Your AndAction Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #E8047E; margin: 0;">AndAction</h1>
            <p style="color: #666; margin-top: 5px;">Discover and Book Perfect Artists</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Account</h2>
            <p style="color: #555; line-height: 1.5;">
              Thank you for choosing AndAction! To complete your verification, please use the One-Time Password (OTP) below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #E8047E; background-color: #fff; padding: 10px 20px; border: 1px dashed #E8047E; border-radius: 4px;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #555; font-size: 14px;">
              This code is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} AndAction. All rights reserved.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
          </div>
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

export async function sendForgotPasswordEmail(to: string, otp: string) {
  try {
    const result = await resend.emails.send({
      from: `AndAction <${resendFromEmail}>`,
      to,
      subject: "Reset Your Password - AndAction",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #E8047E; margin: 0;">AndAction</h1>
            <p style="color: #666; margin-top: 5px;">Discover and Book Perfect Artists</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #555; line-height: 1.5;">
              We received a request to reset your password for your AndAction account. Use the OTP below to proceed.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #E8047E; background-color: #fff; padding: 10px 20px; border: 1px dashed #E8047E; border-radius: 4px;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #555; font-size: 14px;">
              This code is valid for <strong>10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} AndAction. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    console.log(result)
    return { success: true, result };
  } catch (error: any) {
    console.error("Resend Email Forgot Password Error:", error);
    return { success: false, error };
  }
}
