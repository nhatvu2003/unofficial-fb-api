/**
 * User Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from './BaseAPIModule.js';
import { FacebookConstants } from "../src/constants/FacebookConstants.js";
/**
 * User-related API functions
 */
export class UserModule extends BaseAPIModule {
    /**
     * Get user information by ID(s)
     */
    async getUserInfo(userIDs, callback) {
        const promise = this.executeGetUserInfo(userIDs);
        return this.handleCallback(promise, callback);
    }
    async executeGetUserInfo(userIDs) {
        const ids = Array.isArray(userIDs) ? userIDs : [userIDs];
        this.log('Getting user info for:', ids);
        const form = {};
        ids.forEach((id, index) => {
            form[`ids[${index}]`] = this.formatID(id);
        });
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.GET_USER_INFO, form);
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
    async getFriendsList(callback) {
        const promise = this.executeGetFriendsList();
        return this.handleCallback(promise, callback);
    }
    async executeGetFriendsList() {
        this.log('Getting friends list...');
        // Use postFormData for friends list
        let response = await this.makePostFormDataRequest(FacebookConstants.ENDPOINTS.GET_USER_INFO_ALL, {}, { viewer: this.ctx.UserID });
        let result = this.formatFriendsListData(response.payload || response);
        if (result.length === 0) {
            // Fallback attempt via GraphQL batch (best-effort, doc_id may change)
            try {
                this.log('Primary friends list empty, attempting GraphQL fallback');
                const variables = { limit: 50, scale: 1 }; // heuristic vars
                const gqlResp = await this.makeGraphQLRequest(FacebookConstants.FALLBACK_SEND_DOC_ID, variables, 'MessengerFriendsListFallback');
                result = this.formatFriendsListData(gqlResp?.payload || gqlResp);
            }
            catch (e) {
                this.log('GraphQL fallback failed');
            }
        }
        this.log(`Friends list retrieved (final): ${result.length} friends`);
        return result;
    }
    /**
     * Search for users by name
     */
    async getUserID(name, callback) {
        const promise = this.executeGetUserID(name);
        return this.handleCallback(promise, callback);
    }
    async executeGetUserID(name) {
        this.log('Searching for user:', name);
        const form = {
            value: name.toLowerCase(),
            viewer: this.ctx.UserID,
            rsp: "search",
            context: "search",
            path: "/home.php",
            request_id: this.generateRequestID()
        };
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.SEARCH_USERS, form);
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
    async getUserAvatar(userIDs, height = 150, width = 150, callback) {
        const promise = this.executeGetUserAvatar(userIDs, height, width);
        return this.handleCallback(promise, callback);
    }
    async executeGetUserAvatar(userIDs, height, width) {
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
            }
            catch (error) {
                this.log('Failed to get avatar for user:', userID);
                return {
                    userID,
                    url: `https://graph.facebook.com/${userID}/picture?height=${height}&width=${width}`
                };
            }
        });
        const results = await Promise.all(promises);
        const avatarMap = {};
        results.forEach(({ userID, url }) => {
            avatarMap[userID] = url;
        });
        this.log('Avatars retrieved successfully');
        return avatarMap;
    }
    /**
     * Add friend
     */
    async addFriend(userID, callback) {
        const promise = this.executeAddFriend(userID);
        return this.handleCallback(promise, callback);
    }
    async executeAddFriend(userID) {
        this.log('Adding friend:', userID);
        const form = {
            to_friend: userID,
            action: "add_friend",
            how_found: "friend_browser",
            ref_param: "none"
        };
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.ADD_FRIEND, form);
        if (response.error) {
            throw new Error(`Add friend failed: ${response.error}`);
        }
        this.log('Friend request sent successfully');
    }
    /**
     * Remove/unfriend user
     */
    async unfriend(userID, callback) {
        const promise = this.executeUnfriend(userID);
        return this.handleCallback(promise, callback);
    }
    async executeUnfriend(userID) {
        this.log('Unfriending user:', userID);
        const form = {
            uid: userID,
            unref: "bd_friends_tab",
            floc: "friends_tab",
            "nctr[_mod]": `pagelet_timeline_app_collection_${this.ctx.UserID}:2356318349:2`
        };
        const response = await this.makeRequest(FacebookConstants.ENDPOINTS.REMOVE_FRIEND, form);
        if (response.error) {
            throw new Error(`Unfriend failed: ${response.error}`);
        }
        this.log('User unfriended successfully');
    }
    // Helper methods
    async makePostFormDataRequest(url, formData, queryParams) {
        // Import HttpClient method for form data
        const HttpClient = (await import("../src/utils/HttpClient.js")).default;
        const response = await HttpClient.postFormData(url, this.ctx.cookieJar, formData, queryParams);
        return this.parseResponse(response.body);
    }
    async makeGetRequest(url) {
        // Import HttpClient method for GET
        const HttpClient = (await import("../src/utils/HttpClient.js")).default;
        const response = await HttpClient.get(url, this.ctx.cookieJar);
        return this.parseResponse(response.body);
    }
    formatUserInfoData(data) {
        if (!data || typeof data !== 'object')
            return {};
        const result = {};
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
    formatFriendsListData(data) {
        if (!data || typeof data !== 'object')
            return [];
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
    formatSearchResults(data) {
        if (!data || !data.entries)
            return [];
        return data.entries
            .filter((entry) => entry.type === 'user')
            .map((entry) => ({
            userID: this.formatID(entry.uid || entry.id),
            fullName: entry.text || entry.name || '',
            profilePicture: entry.photo || '',
            type: 'user',
            isVerified: !!entry.is_verified
        }));
    }
    getGenderString(gender) {
        const genders = {
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
//# sourceMappingURL=UserModule.js.map