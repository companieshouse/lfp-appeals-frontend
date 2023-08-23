import { Attachment } from "app/models/Attachment";

export interface OtherReason {
    title: string;
    description: string;
    attachments?: Attachment[];
}
