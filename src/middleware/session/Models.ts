export interface AccessToken {
    token: string;
    expiresIn: number;
    refreshToken: string;
    tokenType: string;
}

export interface SignInInfo {
    accessToken: AccessToken;
    adminPermissions: boolean;
    companyNumber: string;
    signedIn: boolean;
    userProfile: UserProfile;
}

export interface UserProfile {
    email: string;
    forename: string;
    id: string;
    locale: string;
    scope: string;
    permissions: Record<string, boolean>;
    surname: string;
}