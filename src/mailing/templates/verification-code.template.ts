type VerificationCodeEmailProps = {
    code: string;
    verificationUrl: string;
};

const LOGO_URL = "https://gjvpupnpxlcvmbcnlvqn.supabase.co/storage/v1/object/public/assets/robot.png";

export const buildVerificationCodeEmail = (props: VerificationCodeEmailProps): string => {
    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #eeeeee; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border: 1px solid #c4c4c4; border-radius: 10px;">
                        <tr>
                            <td style="padding: 32px; text-align: center;">
                                <img src="${LOGO_URL}" alt="GameTracker" width="56" height="56" style="display: block; margin: 0 auto 0 auto; border-radius: 12px;" />
                                <span style="font-size: 20px; font-weight: bold; color: #cc4e45;">GameTracker</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 32px; text-align: center;">
                                <h1 style="margin: 0 0 8px 0; font-size: 22px; color: #333333;">Verify your email</h1>
                                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #666666;">
                                    Enter the code below in the app, or use the button to go straight to the verification page.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 28px 32px 8px 32px; text-align: center;">
                                <span style="display: inline-block; padding: 14px 28px; background-color: #f5eae9; border-radius: 10px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #cc4e45;">
                                    ${props.code}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 24px 32px 8px 32px; text-align: center;">
                                <a
                                    href="${props.verificationUrl}"
                                    style="display: inline-block; padding: 12px 28px; background-color: #cc4e45; color: #ffffff; text-decoration: none; border-radius: 32px; font-weight: bold; font-size: 15px;"
                                >
                                    Verify email
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 24px 32px 32px 32px; text-align: center;">
                                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #999999;">
                                    This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `;
};
