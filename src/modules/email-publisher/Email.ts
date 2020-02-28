export interface Email {
    to: string;
    subject: string;
    body: EmailBody;
}

export interface EmailBody {
    templateName: string;
    templateData?: Record<string, any>;
}
