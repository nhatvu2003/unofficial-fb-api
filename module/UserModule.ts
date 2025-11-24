/**
 * User Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */

import { BaseAPIModule } from './BaseAPIModule.js';
import { FacebookConstants } from "../src/constants/FacebookConstants.js";

export interface UserInfo {
    userID: string;
    fullName: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    gender?: string;
    vanity?: string;
    type?: string;
    isFriend?: boolean;
    isVerified?: boolean;
}

export interface FriendInfo extends UserInfo {
    alternateName?: string;
    isBirthday?: boolean;
    profileUrl?: string;
}

/**
 * User-related API functions
 */
export class UserModule extends BaseAPIModule {

    /**
     * Get user information by ID(s)
     */
    async getUserInfo(
        userIDs: string | string[],
        callback?: (err: any, data?: { [userID: string]: UserInfo }) => void
    ): Promise<{ [userID: string]: UserInfo }> {
        const promise = this.executeGetUserInfo(userIDs);
        return this.handleCallback(promise, callback);
    }

    private async executeGetUserInfo(
        userIDs: string | string[]
    ): Promise<{ [userID: string]: UserInfo }> {
        const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
        this.log('Getting user info for:', ids);

        const form: { [key: string]: any } = {};
        ids.forEach((id, index) => {
            form[`ids[${index}]`] = this.formatID(id);
        });

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.GET_USER_INFO,
            form
        );

        if (response.error && response.error !== 3252001) {
            throw new Error(`Get user info failed: ${response.error}`);
        }

        const result = this.formatUserInfoData(response.payload || response);
        this.log('User info retrieved successfully:', Object.keys(result));
        return result;
    }

    /**
     * Get friends list
     */
    async getFriendsList(
        callback?: (err: any, data?: FriendInfo[]) => void
    ): Promise<FriendInfo[]> {
        const promise = this.executeGetFriendsList();
        return this.handleCallback(promise, callback);
    }

    private async executeGetFriendsList(): Promise<FriendInfo[]> {
        this.log('Getting friends list...');

        // Use postFormData for friends list
        let response = await this.makePostFormDataRequest(
            FacebookConstants.ENDPOINTS.GET_USER_INFO_ALL,
            {},
            { viewer: this.ctx.UserID }
        );

        let result = this.formatFriendsListData(response.payload || response);
        if (result.length === 0) {
            // Fallback attempt via GraphQL batch (best-effort, doc_id may change)
            try {
                this.log('Primary friends list empty, attempting GraphQL fallback');
                const variables = { limit: 50, scale: 1 }; // heuristic vars
                const gqlResp = await this.makeGraphQLRequest(
                    FacebookConstants.FALLBACK_SEND_DOC_ID,
                    variables,
                    'MessengerFriendsListFallback'
                );
                result = this.formatFriendsListData(gqlResp?.payload || gqlResp);
            } catch (e) {
                this.log('GraphQL fallback failed');
            }
        }

        this.log(`Friends list retrieved (final): ${result.length} friends`);
        return result;
    }

    /**
     * Search for users by name
     */
    async getUserID(
        name: string,
        callback?: (err: any, data?: UserInfo[]) => void
    ): Promise<UserInfo[]> {
        const promise = this.executeGetUserID(name);
        return this.handleCallback(promise, callback);
    }

    private async executeGetUserID(name: string): Promise<UserInfo[]> {
        this.log('Searching for user:', name);

        const form = {
            value: name.toLowerCase(),
            viewer: this.ctx.UserID,
            rsp: "search",
            context: "search",
            path: "/home.php",
            request_id: this.generateRequestID()
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.SEARCH_USERS,
            form
        );

        if (response.error) {
            throw new Error(`Search user failed: ${response.error}`);
        }

        const result = this.formatSearchResults(response.payload || response);
        this.log(`Search results: ${result.length} users found`);
        return result;
    }

    /**
     * Get user avatar/profile picture
     */
    async getUserAvatar(
        userIDs: string | string[],
        height: number = 150,
        width: number = 150,
        callback?: (err: any, data?: { [userID: string]: string }) => void
    ): Promise<{ [userID: string]: string }> {
        const promise = this.executeGetUserAvatar(userIDs, height, width);
        return this.handleCallback(promise, callback);
    }

    private async executeGetUserAvatar(
        userIDs: string | string[],
        height: number,
        width: number
    ): Promise<{ [userID: string]: string }> {
        const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
        this.log('Getting avatars for:', ids);

        const promises = ids.map(async (userID) => {
            const url = `https://graph.facebook.com/${userID}/picture?height=${height}&width=${width}&redirect=false&access_token=${this.ctx.access_token || 'NONE'}`;
            
            try {
                const response = await this.makeGetRequest(url);
                return {
                    userID,
                    url: response.data?.url || `https://graph.facebook.com/${userID}/picture?height=${height}&width=${width}`
                };
            } catch (error) {
                this.log('Failed to get avatar for user:', userID);
                return {
                    userID,
                    url: `https://graph.facebook.com/${userID}/picture?height=${height}&width=${width}`
                };
            }
        });

        const results = await Promise.all(promises);
        const avatarMap: { [userID: string]: string } = {};
        
        results.forEach(({ userID, url }) => {
            avatarMap[userID] = url;
        });

        this.log('Avatars retrieved successfully');
        return avatarMap;
    }

    /**
     * Add friend
     */
    async addFriend(
        userID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeAddFriend(userID);
        return this.handleCallback(promise, callback);
    }

    private async executeAddFriend(userID: string): Promise<void> {
        this.log('Adding friend:', userID);

        const form = {
            to_friend: userID,
            action: "add_friend",
            how_found: "friend_browser",
            ref_param: "none"
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.ADD_FRIEND,
            form
        );

        if (response.error) {
            throw new Error(`Add friend failed: ${response.error}`);
        }

        this.log('Friend request sent successfully');
    }

    /**
     * Remove/unfriend user
     */
    async unfriend(
        userID: string,
        callback?: (err: any) => void
    ): Promise<void> {
        const promise = this.executeUnfriend(userID);
        return this.handleCallback(promise, callback);
    }

    private async executeUnfriend(userID: string): Promise<void> {
        this.log('Unfriending user:', userID);

        const form = {
            uid: userID,
            unref: "bd_friends_tab",
            floc: "friends_tab",
            "nctr[_mod]": `pagelet_timeline_app_collection_${this.ctx.UserID}:2356318349:2`
        };

        const response = await this.makeRequest(
            FacebookConstants.ENDPOINTS.REMOVE_FRIEND,
            form
        );

        if (response.error) {
            throw new Error(`Unfriend failed: ${response.error}`);
        }

        this.log('User unfriended successfully');
    }

    // Helper methods

    private async makePostFormDataRequest(
        url: string,
        formData: Record<string, any>,
        queryParams: Record<string, any>
    ): Promise<any> {
        // Import HttpClient method for form data
        const HttpClient = (await import("../src/utils/HttpClient.js")).default;
        const response = await HttpClient.postFormData(
            url,
            this.ctx.cookieJar,
            formData,
            queryParams
        );
        return this.parseResponse(response.body);
    }

    private async makeGetRequest(url: string): Promise<any> {
        // Import HttpClient method for GET
        const HttpClient = (await import("../src/utils/HttpClient.js")).default;
        const response = await HttpClient.get(url, this.ctx.cookieJar);
        return this.parseResponse(response.body);
    }

    private formatUserInfoData(data: any): { [userID: string]: UserInfo } {
        if (!data || typeof data !== 'object') return {};

        const result: { [userID: string]: UserInfo } = {};

        Object.keys(data).forEach(userID => {
            const user = data[userID];
            // Filter out non-numeric or obviously non-user keys (e.g., 'profiles', 'payload')
            const isNumericId = /^\d{5,}$/.test(userID);
            if (user && isNumericId) {
                result[userID] = {
                    userID: this.formatID(userID),
                    fullName: user.name || '',
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    profilePicture: user.thumbSrc || user.photo || '',
                    gender: this.getGenderString(user.gender),
                    vanity: user.vanity || '',
                    type: user.type || 'user',
                    isFriend: user.is_friend === true,
                    isVerified: user.is_verified === true
                };
            }
        });

        return result;
    }

    private formatFriendsListData(data: any): FriendInfo[] {
        if (!data || typeof data !== 'object') return [];
        return Object.keys(data)
            .filter(id => /^\d{5,}$/.test(id))
            .map(userID => {
                const user = data[userID] || {};
                return {
                    userID: this.formatID(userID),
                    fullName: user.name || '',
                    firstName: user.firstName || '',
                    alternateName: user.alternateName || '',
                    profilePicture: user.thumbSrc || '',
                    gender: this.getGenderString(user.gender),
                    vanity: user.vanity || '',
                    type: user.type || 'user',
                    isFriend: user.is_friend !== false,
                    isBirthday: !!user.is_birthday,
                    profileUrl: user.uri || ''
                };
            });
    }

    private formatSearchResults(data: any): UserInfo[] {
        if (!data || !data.entries) return [];

        return data.entries
            .filter((entry: any) => entry.type === 'user')
            .map((entry: any) => ({
                userID: this.formatID(entry.uid || entry.id),
                fullName: entry.text || entry.name || '',
                profilePicture: entry.photo || '',
                type: 'user',
                isVerified: !!entry.is_verified
            }));
    }

    private getGenderString(gender: number | string): string {
        const genders: { [key: number]: string } = {
            0: "unknown",
            1: "female_singular",
            2: "male_singular",
            3: "female_singular_guess",
            4: "male_singular_guess",
            5: "mixed",
            6: "neuter_singular",
            7: "unknown_singular",
            8: "female_plural",
            9: "male_plural",
            10: "neuter_plural",
            11: "unknown_plural"
        };
        
        const genderNum = typeof gender === 'string' ? parseInt(gender) : gender;
        return genders[genderNum] || "unknown";
    }
}
