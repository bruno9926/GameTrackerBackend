export const AppErrors = {
    EMAIL_NOT_VERIFIED: {
        code: "EMAIL_NOT_VERIFIED",
        message: "Email has not been verified"
    },
    GAME_ALREADY_EXISTS: {
        code: "GAME_ALREADY_EXISTS",
        message: "Game already exists for this user"
    },
    EMAIL_SEND_FAILED: {
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send email"
    }
} as const;
