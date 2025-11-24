/**
 * User Module
 * @author Nhat Vu <nhatvu10092003@gmail.com>
 */
import { BaseAPIModule } from './BaseAPIModule.js';
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
export declare class UserModule extends BaseAPIModule {
    /**
     * Get user information by ID(s)
     */
    getUserInfo(userIDs: string | string[], callback?: (err: any, data?: {
        [userID: string]: UserInfo;
    }) => void): Promise<{
        [userID: string]: UserInfo;
    }>;
    private executeGetUserInfo;
    /**
     * Get friends list
     */
    getFriendsList(callback?: (err: any, data?: FriendInfo[]) => void): Promise<FriendInfo[]>;
    private executeGetFriendsList;
    /**
     * Search for users by name
     */
    getUserID(name: string, callback?: (err: any, data?: UserInfo[]) => void): Promise<UserInfo[]>;
    private executeGetUserID;
    /**
     * Get user avatar/profile picture
     */
    getUserAvatar(userIDs: string | string[], height?: number, width?: number, callback?: (err: any, data?: {
        [userID: string]: string;
    }) => void): Promise<{
        [userID: string]: string;
    }>;
    private executeGetUserAvatar;
    /**
     * Add friend
     */
    addFriend(userID: string, callback?: (err: any) => void): Promise<void>;
    private executeAddFriend;
    /**
     * Remove/unfriend user
     */
    unfriend(userID: string, callback?: (err: any) => void): Promise<void>;
    private executeUnfriend;
    private makePostFormDataRequest;
    private makeGetRequest;
    private formatUserInfoData;
    private formatFriendsListData;
    private formatSearchResults;
    private getGenderString;
}
//# sourceMappingURL=UserModule.d.ts.map