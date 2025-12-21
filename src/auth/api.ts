import { UserProfile } from './store';

export async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch user profile');
    }

    const data = await res.json();

    // Map Google response to our UserProfile
    return {
        id: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture,
    };
}
