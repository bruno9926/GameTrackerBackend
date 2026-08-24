import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { AppErrors } from "../errors/app-errors";
import { buildVerificationCodeEmail } from "./templates/verification-code.template";

@Injectable()
export class EmailService {
    private readonly resend: Resend;

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    }

    /** Emails a verification code to an unverified user. Rejects if the email fails to send. */
    async sendVerificationCode(email: string, code: string): Promise<void> {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        const verificationUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}`;

        const { error } = await this.resend.emails.send({
            from: this.configService.get<string>('EMAIL_FROM') ?? "onboarding@resend.dev",
            to: email,
            subject: "Verify your email",
            html: buildVerificationCodeEmail({ code, verificationUrl })
        });

        if (error) {
            throw new InternalServerErrorException(AppErrors.EMAIL_SEND_FAILED);
        }
    }
}
