# Unofficial Facebook Messenger API

[**🇺🇸 English**](#-english-documentation) | [**🇻🇳 Tiếng Việt**](#-ti-ng-vi-t)

[![npm version](https://img.shields.io/npm/v/unofficial-fb-api.svg)](https://www.npmjs.com/package/unofficial-fb-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/unofficial-fb-api.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🇺🇸 English Documentation

> **⚠️ IMPORTANT LEGAL DISCLAIMER**: This is an UNOFFICIAL, EDUCATIONAL library for learning purposes ONLY. This library:
> - **VIOLATES Facebook's Terms of Service**
> - **MAY RESULT IN ACCOUNT SUSPENSION/BAN**
> - **IS NOT AUTHORIZED BY META/FACEBOOK**
> - **FOR EDUCATIONAL/RESEARCH USE ONLY**
> - **AUTHOR NOT RESPONSIBLE for any damages, account bans, or legal issues**
> 
> **USE AT YOUR OWN RISK!** By using this library, you acknowledge and accept all risks.

An unofficial Facebook Messenger API library written in TypeScript for educational purposes. This library demonstrates web scraping and reverse engineering concepts.

**🙏 Attribution:** This project is inspired by and based on the original concept from [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api) by Schmavery. This is a TypeScript reimplementation for educational purposes.

### 🚀 Key Features

- ✅ **Send Messages**: Text, images, file attachments
- ✅ **User Management**: Get user info, friends list
- ✅ **Thread Management**: Create groups, change names, add/remove members
- ✅ **Typing Indicator**: Show typing status
- ✅ **Mark as Read**: Mark messages as read
- ✅ **Rate Limiting**: Built-in request rate limiting
- ✅ **Error Handling**: Comprehensive error management
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Proxy Support**: HTTP/HTTPS proxy support
- ✅ **Auto Retry**: Automatic retry on failures

### 📦 Installation

```bash
npm install unofficial-fb-api
```

or with yarn:

```bash
yarn add unofficial-fb-api
```

### 🔧 System Requirements

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (if using TypeScript)

### 🔐 Getting AppState (Cookies)

To use this library, you need to extract cookies from Facebook. Here are several methods:

#### Method 1: Using c3c-appstate Extension (Recommended)

[c3c-appstate](https://github.com/c3cbot/c3c-appstate) is a browser extension specifically designed to extract Facebook AppState.

1. **Install the extension:**
   - For **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/c3c-appstate/jdkfjpnpiegadinhbpjnedioddfpdakp)
   - For **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/c3c-appstate/)

2. **Login to Facebook** in your browser with the extension installed

3. **Extract AppState:**
   - Go to any Facebook page
   - Click the c3c-appstate extension icon
   - Click "Get AppState" button
   - The extension will automatically generate the AppState in the correct format

4. **Save AppState:**

```javascript
// Copy the AppState from the extension and save to file
const appState = [
  // Paste the AppState array from c3c-appstate extension here
];

// Save to file
const fs = require('fs');
fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
console.log('AppState saved to appstate.json');
```

#### Method 2: Browser DevTools

1. Login to Facebook in your browser
2. Open Developer Tools (F12)
3. Go to Application/Storage → Cookies → facebook.com
4. Copy important cookies: `c_user`, `xs`, `fr`, `datr`, `sb`, `spin`

#### Method 3: Browser Extensions

Use extensions like "Cookie Editor" or "EditThisCookie" to export cookies easily.

### 📖 Quick Start

#### Method 1: Using Promises

```typescript
import { loginPromise } from 'unofficial-fb-api';
import fs from 'fs';

async function main() {
  try {
    // Load appState from file
    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    
    // Login
    const api = await loginPromise({ appState }, {
      showLogs: true,
      logLevel: 'info'
    });
    
    console.log('✅ Login successful!');
    console.log('User ID:', api.getCurrentUserID());
    
    // Send a message
    await api.sendMessage('Hello World!', 'THREAD_ID');
    
    // Get user info
    const userInfo = await api.getUserInfo('USER_ID');
    console.log(userInfo);
    
  } catch (error) {
    console.error('❌ Login error:', error);
  }
}

main();
```

#### Method 2: Using Callbacks

```typescript
import login from 'unofficial-fb-api';

login({ appState }, (err, api) => {
  if (err) {
    console.error('Login error:', err);
    return;
  }
  
  console.log('Login successful!');
  api.sendMessage('Hello!', 'THREAD_ID');
});
```

#### Method 3: Using Class-based Approach

```typescript
import { NVStudio } from 'unofficial-fb-api';

const studio = await NVStudio.create(appState, {
  showLogs: true,
  autoReconnect: true
});

const api = studio.getAPI();
await api.sendMessage('Hello from class!', 'THREAD_ID');
```

### 📚 Usage Examples

#### Send Different Types of Messages

```typescript
// Simple text
await api.sendMessage('Hello!', 'THREAD_ID');

// With attachments
await api.sendMessage({
  body: 'Check this out!',
  attachment: fs.createReadStream('image.jpg')
}, 'THREAD_ID');

// With mentions
await api.sendMessage({
  body: 'Hello @John!',
  mentions: [{
    tag: '@John',
    id: 'USER_ID'
  }]
}, 'THREAD_ID');

// Multiple attachments
await api.sendMessage({
  body: 'Multiple files',
  attachment: [
    fs.createReadStream('file1.jpg'),
    fs.createReadStream('file2.pdf')
  ]
}, 'THREAD_ID');
```

#### User Management

```typescript
// Get user information
const userInfo = await api.getUserInfo('USER_ID');
console.log(userInfo);

// Get multiple users
const usersInfo = await api.getUserInfo(['USER_ID1', 'USER_ID2']);

// Get friends list
const friends = await api.getFriendsList();

// Find user ID by name
const userId = await api.getUserID('John Doe');

// Get user avatar
const avatarUrl = await api.getUserAvatar('USER_ID');

// Send friend request
await api.addFriend('USER_ID');

// Unfriend user
await api.unfriend('USER_ID');
```

#### Thread Management

```typescript
// Get thread list
const threads = await api.getThreadList(20);

// Get thread info
const threadInfo = await api.getThreadInfo('THREAD_ID');

// Create new group
const groupId = await api.createNewGroup(['USER1', 'USER2'], 'Group Name');

// Change group title
await api.changeThreadTitle('THREAD_ID', 'New Title');

// Add user to group
await api.addUserToGroup('USER_ID', 'THREAD_ID');

// Remove user from group
await api.removeUserFromGroup('USER_ID', 'THREAD_ID');

// Change thread emoji
await api.changeThreadEmoji('THREAD_ID', '🎉');
```

#### Message Operations

```typescript
// Mark as read
await api.markAsRead('THREAD_ID');

// Send typing indicator
await api.sendTypingIndicator('THREAD_ID');

// Unsend message
await api.unsendMessage('MESSAGE_ID');
```

### ⚙️ Configuration Options

```typescript
const options = {
  // Logging
  showLogs: true,
  developmentLog: false,
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
  
  // Network
  timeout: 60000,
  retryAttempts: 3,
  proxy: 'http://proxy-server:port', // Optional
  userAgents: 'Mozilla/5.0 ...',
  
  // Rate limiting
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000 // 50 requests per minute
  },
  
  // Behaviors
  autoReconnect: true,
  autoMarkRead: false,
  autoMarkDelivery: true,
  selfListen: false, // Listen to own messages
  listenEvents: false, // Listen to events
  updatePresence: false,
  
  // Login
  forceLogin: false,
  online: true
};
```

### 🛠️ Error Handling

```typescript
import { FacebookAPIException, ErrorType } from 'unofficial-fb-api';

try {
  await api.sendMessage('Test', 'THREAD_ID');
} catch (error) {
  if (error instanceof FacebookAPIException) {
    console.log('Error Type:', error.type);
    console.log('Error Message:', error.message);
    console.log('Context:', error.context);
    
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.log('Need to login again');
        break;
      case ErrorType.RATE_LIMIT:
        console.log('Rate limit exceeded');
        break;
      case ErrorType.NETWORK:
        console.log('Network error, retry later');
        break;
    }
  }
}
```

### 📋 API Reference

| Function | Description | Parameters |
|----------|-------------|------------|
| `sendMessage(message, threadID)` | Send a message | `message`: string or MessageOptions, `threadID`: string |
| `getUserInfo(userID)` | Get user information | `userID`: string or string[] |
| `getFriendsList()` | Get friends list | None |
| `getThreadList(limit)` | Get conversation threads | `limit`: number (optional) |
| `createNewGroup(userIDs, title)` | Create new group chat | `userIDs`: string[], `title`: string |
| `markAsRead(threadID)` | Mark messages as read | `threadID`: string |
| `sendTypingIndicator(threadID)` | Show typing indicator | `threadID`: string |
| `unsendMessage(messageID)` | Unsend a message | `messageID`: string |

### 🚧 Troubleshooting

**Common Issues:**

- **"Login failed"**: Check your appState/cookies, ensure account isn't locked
- **"Rate limit exceeded"**: Reduce `maxRequests` in config or increase `windowMs`
- **"Network timeout"**: Increase `timeout` value, check internet connection
- **"Cannot send message"**: Verify `threadID` is correct, check permissions

### 💡 Advanced Examples

#### Complete Bot Example

```typescript
import { loginPromise } from 'unofficial-fb-api';
import fs from 'fs';

async function createBot() {
  try {
    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    
    const api = await loginPromise({ appState }, {
      showLogs: true,
      logLevel: 'info',
      autoReconnect: true
    });
    
    console.log('🤖 Bot online!');
    
    // Get thread list and send startup message
    const threads = await api.getThreadList(5);
    if (threads.length > 0) {
      await api.sendMessage('🤖 Bot is now online!', threads[0].threadID);
    }
    
    // Save updated appState
    const newAppState = api.getAppState();
    fs.writeFileSync('appstate.json', JSON.stringify(newAppState, null, 2));
    
    return api;
  } catch (error) {
    console.error('❌ Bot startup failed:', error);
    throw error;
  }
}

createBot();
```

### ⚠️ Disclaimer

This library is for educational purposes only. The author is not responsible for any issues arising from its use. Facebook may change their API at any time, potentially breaking this library.

**Use responsibly and comply with Facebook's Terms of Service!**

---

## 🇻🇳 Tiếng Việt

> **⚠️ TUYÊN BỐ PHÁP LÝ QUAN TRỌNG**: Đây là thư viện KHÔNG CHÍNH THỨC, CHỈ DÀNH CHO MỤC ĐÍCH HỌC TẬP. Thư viện này:
> - **VI PHẠM Điều khoản Dịch vụ của Facebook**
> - **CÓ THỂ DẪN ĐẾN VIỆC TÀI KHOẢN BỊ KHÓA/CẤM**
> - **KHÔNG ĐƯỢC ỦY QUYỀN BỞI META/FACEBOOK**
> - **CHỈ DÀNH CHO MỤC ĐÍCH HỌC TẬP/NGHIÊN CỨU**
> - **TÁC GIẢ KHÔNG CHỊU TRÁCH NHIỆM** về mọi thiệt hại, khóa tài khoản, hoặc vấn đề pháp lý
> 
> **SỬ DỤNG TẠI RỦI RO CỦA RIÊNG BẠN!** Bằng việc sử dụng thư viện này, bạn thừa nhận và chấp nhận mọi rủi ro.

Thư viện Facebook Messenger API không chính thức được viết bằng TypeScript cho mục đích giáo dục. Thư viện này minh họa các khái niệm web scraping và reverse engineering.

**🙏 Ghi nhận:** Dự án này được lấy cảm hứng và dựa trên ý tưởng gốc từ [facebook-chat-api](https://github.com/Schmavery/facebook-chat-api) của Schmavery. Đây là phiên bản TypeScript được viết lại cho mục đích giáo dục.

### 🚀 Tính năng chính

- ✅ **Gửi tin nhắn**: Text, hình ảnh, file đính kèm
- ✅ **Quản lý người dùng**: Lấy thông tin, danh sách bạn bè
- ✅ **Quản lý hội thoại**: Tạo nhóm, thay đổi tên, thêm/xóa thành viên
- ✅ **Typing indicator**: Hiển thị trạng thái đang gõ
- ✅ **Mark as read**: Đánh dấu đã đọc tin nhắn
- ✅ **Rate limiting**: Giới hạn tần suất request
- ✅ **Error handling**: Xử lý lỗi toàn diện
- ✅ **TypeScript**: Hỗ trợ đầy đủ types
- ✅ **Proxy support**: Hỗ trợ proxy
- ✅ **Auto retry**: Tự động thử lại khi lỗi

### 📦 Cài đặt

```bash
npm install unofficial-fb-api
```

hoặc với yarn:

```bash
yarn add unofficial-fb-api
```

### 🔧 Yêu cầu hệ thống

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (nếu sử dụng TypeScript)

### 🔐 Lấy AppState (Cookies)

Để sử dụng thư viện này, bạn cần trích xuất cookies từ Facebook. Dưới đây là các phương pháp:

#### Phương pháp 1: Sử dụng extension c3c-appstate (Khuyên dùng)

[c3c-appstate](https://github.com/c3cbot/c3c-appstate) là extension trình duyệt được thiết kế chuyên dụng để trích xuất Facebook AppState.

1. **Cài đặt extension:**
   - Cho **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/c3c-appstate/jdkfjpnpiegadinhbpjnedioddfpdakp)
   - Cho **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/c3c-appstate/)

2. **Đăng nhập Facebook** trên trình duyệt đã cài extension

3. **Trích xuất AppState:**
   - Vào bất kỳ trang Facebook nào
   - Click vào icon extension c3c-appstate
   - Nhấn nút "Get AppState"
   - Extension sẽ tự động tạo AppState với định dạng đúng

4. **Lưu AppState:**

```javascript
// Copy AppState từ extension và lưu vào file
const appState = [
  // Dán mảng AppState từ c3c-appstate extension vào đây
];

// Lưu vào file
const fs = require('fs');
fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
console.log('AppState đã được lưu vào appstate.json');
```

#### Phương pháp 2: DevTools của trình duyệt

1. Đăng nhập Facebook trên trình duyệt
2. Mở Developer Tools (F12)
3. Vào tab Application/Storage → Cookies → facebook.com
4. Copy các cookies quan trọng:
   - `c_user` (User ID)
   - `xs` (Session token)
   - `fr` (Request token)
   - `datr`, `sb`, `spin` (Security tokens)

```javascript
const appState = [
  {
    key: "c_user",
    value: "100000000000000", // ID người dùng
    domain: ".facebook.com",
    path: "/",
    hostOnly: false,
    creation: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  },
  {
    key: "xs",
    value: "74%3A...", // Session token
    domain: ".facebook.com",
    path: "/",
    hostOnly: false,
    creation: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  }
  // ... thêm các cookies khác
];
```

#### Phương pháp 3: Extension trình duyệt

Sử dụng các extension như "Cookie Editor" hoặc "EditThisCookie" để xuất cookies dễ dàng.

### 📖 Hướng dẫn sử dụng nhanh

#### Phương pháp 1: Sử dụng Promise

```typescript
import { loginPromise } from 'unofficial-fb-api';
import fs from 'fs';

async function main() {
  try {
    // Tải appState từ file
    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    
    // Đăng nhập
    const api = await loginPromise({ appState }, {
      showLogs: true,
      logLevel: 'info'
    });
    
    console.log('✅ Đăng nhập thành công!');
    console.log('User ID:', api.getCurrentUserID());
    
    // Gửi tin nhắn
    await api.sendMessage('Xin chào thế giới!', 'THREAD_ID');
    
    // Lấy thông tin người dùng
    const userInfo = await api.getUserInfo('USER_ID');
    console.log(userInfo);
    
  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
  }
}

main();
```

#### Phương pháp 2: Sử dụng Callback

```typescript
import login from 'unofficial-fb-api';

login({ appState }, (err, api) => {
  if (err) {
    console.error('Lỗi đăng nhập:', err);
    return;
  }
  
  console.log('Đăng nhập thành công!');
  api.sendMessage('Xin chào!', 'THREAD_ID');
});
```

#### Phương pháp 3: Sử dụng Class

```typescript
import { NVStudio } from 'unofficial-fb-api';

const studio = await NVStudio.create(appState, {
  showLogs: true,
  autoReconnect: true
});

const api = studio.getAPI();
await api.sendMessage('Xin chào từ class!', 'THREAD_ID');
```

### 📚 Ví dụ sử dụng

#### Gửi các loại tin nhắn khác nhau

```typescript
// Tin nhắn text đơn giản
await api.sendMessage('Xin chào!', 'THREAD_ID');

// Tin nhắn với file đính kèm
await api.sendMessage({
  body: 'Xem ảnh này!',
  attachment: fs.createReadStream('hinh-anh.jpg')
}, 'THREAD_ID');

// Tin nhắn với mention
await api.sendMessage({
  body: 'Xin chào @John!',
  mentions: [{
    tag: '@John',
    id: 'USER_ID'
  }]
}, 'THREAD_ID');

// Gửi nhiều file
await api.sendMessage({
  body: 'Nhiều file đính kèm',
  attachment: [
    fs.createReadStream('file1.jpg'),
    fs.createReadStream('file2.pdf')
  ]
}, 'THREAD_ID');
```

#### Quản lý người dùng

```typescript
// Lấy thông tin người dùng
const userInfo = await api.getUserInfo('USER_ID');
console.log(userInfo);

// Lấy thông tin nhiều người dùng
const usersInfo = await api.getUserInfo(['USER_ID1', 'USER_ID2']);

// Lấy danh sách bạn bè
const friends = await api.getFriendsList();

// Tìm ID người dùng theo tên
const userId = await api.getUserID('Tên Người Dùng');

// Lấy avatar người dùng
const avatarUrl = await api.getUserAvatar('USER_ID');

// Gửi lời mời kết bạn
await api.addFriend('USER_ID');

// Hủy kết bạn
await api.unfriend('USER_ID');
```

#### Quản lý hội thoại

```typescript
// Lấy danh sách hội thoại
const threads = await api.getThreadList(20);

// Lấy thông tin hội thoại
const threadInfo = await api.getThreadInfo('THREAD_ID');

// Tạo nhóm mới
const groupId = await api.createNewGroup(['USER1', 'USER2'], 'Tên Nhóm');

// Thay đổi tên nhóm
await api.changeThreadTitle('THREAD_ID', 'Tên Mới');

// Thêm người vào nhóm
await api.addUserToGroup('USER_ID', 'THREAD_ID');

// Xóa người khỏi nhóm
await api.removeUserFromGroup('USER_ID', 'THREAD_ID');

// Thay đổi emoji nhóm
await api.changeThreadEmoji('THREAD_ID', '🎉');
```

#### Thao tác với tin nhắn

```typescript
// Đánh dấu đã đọc
await api.markAsRead('THREAD_ID');

// Hiển thị đang gõ
await api.sendTypingIndicator('THREAD_ID');

// Xóa tin nhắn đã gửi
await api.unsendMessage('MESSAGE_ID');
```

### ⚙️ Tùy chọn cấu hình

```typescript
const options = {
  // Logging
  showLogs: true,
  developmentLog: false,
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
  
  // Mạng
  timeout: 60000, // 60 giây
  retryAttempts: 3,
  proxy: 'http://proxy-server:port', // Tùy chọn
  userAgents: 'Mozilla/5.0 ...',
  
  // Giới hạn tần suất
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000 // 50 requests trong 1 phút
  },
  
  // Hành vi
  autoReconnect: true,
  autoMarkRead: false,
  autoMarkDelivery: true,
  selfListen: false, // Nghe tin nhắn từ chính mình
  listenEvents: false, // Nghe các sự kiện
  updatePresence: false,
  
  // Đăng nhập
  forceLogin: false,
  online: true
};
```

### 🛠️ Xử lý lỗi

```typescript
import { FacebookAPIException, ErrorType } from 'unofficial-fb-api';

try {
  await api.sendMessage('Test', 'THREAD_ID');
} catch (error) {
  if (error instanceof FacebookAPIException) {
    console.log('Loại lỗi:', error.type);
    console.log('Thông báo lỗi:', error.message);
    console.log('Ngữ cảnh:', error.context);
    
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.log('Cần đăng nhập lại');
        break;
      case ErrorType.RATE_LIMIT:
        console.log('Đã vượt quá giới hạn request');
        break;
      case ErrorType.NETWORK:
        console.log('Lỗi mạng, thử lại sau');
        break;
    }
  }
}
```

### 📋 Tham khảo API (Vietnamese)

| Hàm | Mô tả | Tham số |
|-----|-------|--------|
| `sendMessage(message, threadID)` | Gửi tin nhắn | `message`: string hoặc MessageOptions, `threadID`: string |
| `getUserInfo(userID)` | Lấy thông tin người dùng | `userID`: string hoặc string[] |
| `getFriendsList()` | Lấy danh sách bạn bè | Không có |
| `getThreadList(limit)` | Lấy danh sách hội thoại | `limit`: number (tùy chọn) |
| `createNewGroup(userIDs, title)` | Tạo nhóm chat mới | `userIDs`: string[], `title`: string |
| `markAsRead(threadID)` | Đánh dấu đã đọc | `threadID`: string |
| `sendTypingIndicator(threadID)` | Hiển thị đang gõ | `threadID`: string |
| `unsendMessage(messageID)` | Xóa tin nhắn | `messageID`: string |

### 🚧 Xử lý sự cố (Vietnamese)

**Lỗi thường gặp:**

- **"Đăng nhập thất bại"**: Kiểm tra lại appState/cookies, đảm bảo tài khoản chưa bị khóa
- **"Vượt quá giới hạn rate"**: Giảm `maxRequests` trong config hoặc tăng `windowMs`
- **"Hết thời gian chờ mạng"**: Tăng giá trị `timeout`, kiểm tra kết nối internet
- **"Không thể gửi tin nhắn"**: Xác minh `threadID` đúng, kiểm tra quyền

### 💡 Ví dụ nâng cao

#### Bot hoàn chỉnh

```typescript
import { loginPromise } from 'unofficial-fb-api';
import fs from 'fs';

async function taoBot() {
  try {
    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    
    const api = await loginPromise({ appState }, {
      showLogs: true,
      logLevel: 'info',
      autoReconnect: true,
      rateLimit: {
        maxRequests: 30,
        windowMs: 60000
      }
    });
    
    console.log('🤖 Bot đã online!');
    console.log('User ID:', api.getCurrentUserID());
    
    // Lấy danh sách hội thoại và gửi thông báo khởi động
    const threads = await api.getThreadList(5);
    if (threads.length > 0) {
      await api.sendMessage('🤖 Bot đã sẵn sàng hoạt động!', threads[0].threadID);
    }
    
    // Lưu appState mới
    const newAppState = api.getAppState();
    fs.writeFileSync('appstate.json', JSON.stringify(newAppState, null, 2));
    
    return api;
  } catch (error) {
    console.error('❌ Khởi động bot thất bại:', error);
    throw error;
  }
}

taoBot();
```

#### Gửi tin nhắn hàng loạt

```typescript
const guiTinNhanHangLoat = async (message, threadIds) => {
  for (const threadId of threadIds) {
    try {
      await api.sendMessage(message, threadId);
      console.log(`✅ Đã gửi đến ${threadId}`);
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Gửi thất bại đến ${threadId}:`, error);
    }
  }
};

// Sử dụng
const threadIds = ['THREAD1', 'THREAD2', 'THREAD3'];
await guiTinNhanHangLoat('Thông báo quan trọng!', threadIds);
```

### 🔧 Environment Variables

Bạn có thể sử dụng biến môi trường để cấu hình:

```bash
# .env file
NVFCA_LOG_LEVEL=debug
NODE_ENV=development
```

### 📄 Types TypeScript

```typescript
interface MessageOptions {
  body?: string;
  attachment?: any;
  mentions?: Array<{tag: string, id: string}>;
  url?: string;
  sticker?: string;
  emoji?: string;
  emojiSize?: 'small' | 'medium' | 'large';
}

interface UserInfo {
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

interface ThreadInfo {
  threadID: string;
  threadName?: string;
  participantIDs: string[];
  messageCount?: number;
  isGroup: boolean;
  isArchived?: boolean;
  emoji?: string;
  color?: string;
}
```

## 👨‍💻 Developer Guide

### Adding New Modules

To contribute and add new modules to the API, follow this structure:

#### 1. Create Base Module Class

```typescript
// module/YourModule.ts
import { BaseAPIModule } from "./BaseAPIModule.js";

export interface YourModuleOptions {
  // Define your interfaces here
}

export class YourModule extends BaseAPIModule {
  /**
   * Your main function
   */
  async yourFunction(
    param1: string,
    param2?: YourModuleOptions,
    callback?: (err: any, result?: any) => void
  ): Promise<any> {
    const promise = this.executeYourFunction(param1, param2);
    return this.handleCallback(promise, callback);
  }

  private async executeYourFunction(
    param1: string,
    param2?: YourModuleOptions
  ): Promise<any> {
    this.log('Executing your function:', param1);

    // Your implementation here
    const response = await this.makeRequest(
      'your-endpoint',
      { param1, ...param2 }
    );

    if (response.error) {
      throw new Error(`Your function failed: ${response.error}`);
    }

    return response.data;
  }
}
```

#### 2. Update APIManager

```typescript
// module/APIManager.ts
import { YourModule } from './YourModule.js';

export class APIManager {
  private yourModule: YourModule;

  // Add your function to the class
  yourFunction!: YourModule['yourFunction'];

  constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
    // Initialize your module
    this.yourModule = new YourModule(ctx, config);
    
    this.bindMethods();
  }

  private bindMethods(): void {
    // Bind your methods
    this.yourFunction = this.yourModule.yourFunction.bind(this.yourModule);
  }

  getModules() {
    return {
      // Add your module
      your: this.yourModule,
      // ... other modules
    };
  }
}
```

#### 3. Update API Interface

```typescript
// nvstudio.ts
export interface API {
  // Add your function to the interface
  yourFunction: (param1: string, param2?: YourModuleOptions, callback?) => Promise<any>;
  
  // Update getModules return type
  getModules: () => { 
    your: YourModule; 
    // ... other modules
  };
}
```

#### 4. Update Type Exports

```typescript
// nvstudio.ts or types/index.ts
export type { YourModuleOptions } from './module/YourModule.js';
```

### Module Development Guidelines

1. **Extend BaseAPIModule**: Always extend from `BaseAPIModule` for shared functionality
2. **Use TypeScript**: Full type safety with interfaces and proper typing
3. **Error Handling**: Use `handleCallback` pattern for both Promise and callback support
4. **Logging**: Use `this.log()` for consistent logging
5. **Request Method**: Use `this.makeRequest()` for Facebook API calls
6. **Validation**: Use `this.validateRequired()` for parameter validation

### Sub-Module Pattern (Advanced)

For complex modules, you can use the sub-module pattern like MessageModule:

```typescript
// module/your/SubModule.ts
export class SubModule extends BaseAPIModule {
  async subFunction(param: string): Promise<void> {
    // Implementation
  }
}

// module/your/index.ts
export { SubModule } from './SubModule.js';
export type { SubModuleOptions } from './SubModule.js';

// module/YourModule.ts
import { SubModule } from './your/SubModule.js';

export class YourModule {
  private subModule: SubModule;
  
  constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
    this.subModule = new SubModule(ctx, config);
  }
  
  async subFunction(param: string): Promise<void> {
    return this.subModule.subFunction(param);
  }
}
```

---

## 🤝 Đóng góp / Contributing

Chúng tôi hoan nghênh mọi đóng góp! / We welcome all contributions!

1. Fork repository
2. Tạo branch cho tính năng mới / Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi / Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch / Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request / Create Pull Request

## 📄 Giấy phép / License

Dự án này được cấp phép theo [MIT License](LICENSE).  
This project is licensed under the [MIT License](LICENSE).

## ⚠️ Tuyên bố miễn trừ trách nhiệm / Disclaimer

**Tiếng Việt**: Thư viện này được phát triển cho mục đích học tập và nghiên cứu. Tác giả không chịu trách nhiệm cho bất kỳ vấn đề nào phát sinh từ việc sử dụng thư viện này. Facebook có thể thay đổi API bất cứ lúc nào, khiến thư viện này ngừng hoạt động. Sử dụng có trách nhiệm và tuân thủ Điều khoản Dịch vụ của Facebook!

**English**: This library is for educational purposes only. The author is not responsible for any issues arising from its use. Facebook may change their API at any time, potentially breaking this library. Use responsibly and comply with Facebook's Terms of Service!

## 📞 Liên hệ / Contact

- **Tác giả / Author**: Nhat Vu
- **Email**: nhatvu10092003@gmail.com
- **GitHub**: [nhatvu2003](https://github.com/nhatvu2003)
- **Issues**: [GitHub Issues](https://github.com/nhatvu2003/Unofficial-fb-api/issues)

---

## 🌟 Hỗ trợ dự án / Support the Project

### ⭐ Star the Project
Nếu thư viện này hữu ích cho việc học tập, hãy cho chúng tôi một ⭐ trên GitHub!  
If this library is helpful for your learning, please give us a ⭐ on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/nhatvu2003/Unofficial-fb-api.svg?style=social&label=Star)](https://github.com/nhatvu2003/Unofficial-fb-api)

### ☕ Support Educational Development

**🇺🇸 English:**
This is a free educational resource developed in personal time. If this project helped you learn about web scraping, reverse engineering, or TypeScript development, consider supporting educational content creation:

- **Buy me a coffee:** Support continued educational projects ☕
- **Share knowledge:** Help others learn by sharing this educational resource
- **Contribute:** Submit educational improvements or documentation

**🇻🇳 Tiếng Việt:**
Đây là tài liệu học tập miễn phí được phát triển trong thời gian cá nhân. Nếu dự án này giúp bạn học về web scraping, reverse engineering, hay TypeScript, hãy cân nhắc hỗ trợ việc tạo nội dung giáo dục:

- **Mua cà phê:** Hỗ trợ các dự án giáo dục tiếp theo ☕
- **Chia sẻ kiến thức:** Giúp người khác học hỏi bằng cách chia sẻ tài liệu này
- **Đóng góp:** Gửi cải tiến giáo dục hoặc tài liệu

> **⚠️ Important:** Donations are for educational content development only, not for encouraging Terms of Service violations or malicious use.

### 🚀 Tính năng chính

- ✅ **Gửi tin nhắn**: Text, hình ảnh, file đính kèm
- ✅ **Quản lý người dùng**: Lấy thông tin, danh sách bạn bè
- ✅ **Quản lý hội thoại**: Tạo nhóm, thay đổi tên, thêm/xóa thành viên
- ✅ **Typing indicator**: Hiển thị trạng thái đang gõ
- ✅ **Mark as read**: Đánh dấu đã đọc tin nhắn
- ✅ **Rate limiting**: Giới hạn tần suất request
- ✅ **Error handling**: Xử lý lỗi toàn diện
- ✅ **TypeScript**: Hỗ trợ đầy đủ types
- ✅ **Proxy support**: Hỗ trợ proxy
- ✅ **Auto retry**: Tự động thử lại khi lỗi

### 📦 Cài đặt

```bash
npm install unofficial-fb-api
```

hoặc với yarn:

```bash
yarn add unofficial-fb-api
```

### 🔧 Yêu cầu hệ thống

- Node.js >= 16.0.0
- TypeScript >= 4.5.0 (nếu sử dụng TypeScript)

### 📖 Hướng dẫn sử dụng nhanh

#### Phương pháp 1: Sử dụng Promise

```typescript
import { loginPromise } from 'unofficial-fb-api';

// Cần có appState từ cookies Facebook
const appState = [
  {
    key: "c_user",
    value: "YOUR_USER_ID",
    domain: ".facebook.com",
    path: "/",
    hostOnly: false,
    creation: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  },
  // ... thêm các cookies khác
];

try {
  const api = await loginPromise({ appState }, {
    showLogs: true,
    logLevel: 'info'
  });
  
  console.log('Đăng nhập thành công!');
  // Sử dụng api...
} catch (error) {
  console.error('Lỗi đăng nhập:', error);
}
```

#### Cách 2: Sử dụng Callback

```typescript
import login from 'unofficial-fb-api';

login({ appState }, (err, api) => {
  if (err) {
    console.error('Lỗi đăng nhập:', err);
    return;
  }
  
  console.log('Đăng nhập thành công!');
  // Sử dụng api...
});
```

#### Cách 3: Sử dụng Class

```typescript
import { NVStudio } from 'unofficial-fb-api';

const studio = await NVStudio.create(appState, {
  showLogs: true,
  autoReconnect: true
});

const api = studio.getAPI();
// Sử dụng api...
```

### 2. Cấu hình Options

```typescript
const options = {
  // Hiển thị logs
  showLogs: true,
  developmentLog: false,
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
  
  // Network settings
  timeout: 60000, // 60 giây
  retryAttempts: 3,
  proxy: 'http://proxy-server:port', // Tùy chọn
  userAgents: 'Mozilla/5.0 ...',
  
  // Rate limiting
  rateLimit: {
    maxRequests: 50,
    windowMs: 60000 // 50 requests per minute
  },
  
  // Auto behaviors
  autoReconnect: true,
  autoMarkRead: false,
  autoMarkDelivery: true,
  selfListen: false, // Nghe tin nhắn từ chính mình
  listenEvents: false, // Nghe các sự kiện (typing, read, etc.)
  updatePresence: false,
  
  // Đăng nhập
  forceLogin: false,
  online: true
};
```

### 3. Gửi tin nhắn

#### Tin nhắn văn bản đơn giản

```typescript
await api.sendMessage('Xin chào!', 'THREAD_ID');
```

#### Tin nhắn với tùy chọn nâng cao

```typescript
const messageOptions = {
  body: 'Tin nhắn với nhiều tính năng!',
  mentions: [{
    tag: '@Tên người dùng',
    id: 'USER_ID'
  }],
  attachment: fs.createReadStream('path/to/file.jpg'),
  url: 'https://example.com', // Link preview
  sticker: 'STICKER_ID',
  emoji: '👍',
  emojiSize: 'large'
};

await api.sendMessage(messageOptions, 'THREAD_ID');
```

#### Gửi file đính kèm

```typescript
// Gửi hình ảnh
await api.sendMessage({
  body: 'Gửi hình ảnh',
  attachment: fs.createReadStream('image.jpg')
}, 'THREAD_ID');

// Gửi nhiều file
await api.sendMessage({
  body: 'Gửi nhiều file',
  attachment: [
    fs.createReadStream('file1.jpg'),
    fs.createReadStream('file2.pdf')
  ]
}, 'THREAD_ID');

// Gửi từ URL
await api.sendMessage({
  body: 'Gửi từ URL',
  url: 'https://example.com/image.jpg'
}, 'THREAD_ID');
```

### 4. Quản lý tin nhắn

```typescript
// Xóa tin nhắn (unsend)
await api.unsendMessage('MESSAGE_ID');

// Đánh dấu đã đọc
await api.markAsRead('THREAD_ID');

// Gửi typing indicator
await api.sendTypingIndicator('THREAD_ID');
```

### 5. Quản lý người dùng

```typescript
// Lấy thông tin người dùng
const userInfo = await api.getUserInfo('USER_ID');
console.log(userInfo);

// Lấy thông tin nhiều người dùng
const usersInfo = await api.getUserInfo(['USER_ID1', 'USER_ID2']);

// Lấy danh sách bạn bè
const friends = await api.getFriendsList();

// Tìm ID người dùng theo tên
const userId = await api.getUserID('Tên người dùng');

// Lấy avatar
const avatarUrl = await api.getUserAvatar('USER_ID');

// Gửi lời mời kết bạn
await api.addFriend('USER_ID');

// Hủy kết bạn
await api.unfriend('USER_ID');
```

### 6. Quản lý hội thoại (Threads)

```typescript
// Lấy danh sách hội thoại
const threads = await api.getThreadList(20); // Lấy 20 thread đầu

// Lấy thông tin chi tiết thread
const threadInfo = await api.getThreadInfo('THREAD_ID');

// Tạo nhóm chat mới
const newGroupId = await api.createNewGroup(['USER_ID1', 'USER_ID2'], 'Tên nhóm');

// Thay đổi tên nhóm
await api.changeThreadTitle('THREAD_ID', 'Tên mới');

// Thêm thành viên vào nhóm
await api.addUserToGroup('USER_ID', 'THREAD_ID');

// Xóa thành viên khỏi nhóm
await api.removeUserFromGroup('USER_ID', 'THREAD_ID');

// Thay đổi emoji nhóm
await api.changeThreadEmoji('THREAD_ID', '🎉');
```

### 7. Lấy thông tin tài khoản

```typescript
// Lấy ID người dùng hiện tại
const currentUserId = api.getCurrentUserID();

// Lấy app state (cookies) để lưu trữ
const appState = api.getAppState();
// Lưu appState để sử dụng lần sau
fs.writeFileSync('appstate.json', JSON.stringify(appState));
```

## 🔐 Lấy AppState (Cookies)

Để sử dụng thư viện, bạn cần lấy cookies từ Facebook:

### Cách 1: Sử dụng Extension c3c-appstate (Khuyến nghị)

[c3c-appstate](https://github.com/c3cbot/c3c-appstate) là extension trình duyệt được thiết kế chuyên để lấy Facebook AppState.

1. **Cài đặt extension:**
   - Cho **Chrome/Edge**: [Chrome Web Store](https://chrome.google.com/webstore/detail/c3c-appstate/jdkfjpnpiegadinhbpjnedioddfpdakp)
   - Cho **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/c3c-appstate/)

2. **Đăng nhập Facebook** trên trình duyệt đã cài extension

3. **Lấy AppState:**
   - Vào bất kỳ trang Facebook nào
   - Click vào icon extension c3c-appstate
   - Click nút "Get AppState"
   - Extension sẽ tự động tạo AppState đúng định dạng

4. **Lưu AppState:**

```typescript
// Copy AppState từ extension và lưu vào file
const appState = [
  // Dán mảng AppState từ extension c3c-appstate vào đây
];

// Lưu vào file
const fs = require('fs');
fs.writeFileSync('appstate.json', JSON.stringify(appState, null, 2));
console.log('AppState đã được lưu vào appstate.json');
```

### Cách 2: Sử dụng Browser DevTools

1. Đăng nhập Facebook trên trình duyệt
2. Mở DevTools (F12)
3. Vào tab Application/Storage → Cookies → https://facebook.com
4. Copy tất cả cookies quan trọng:
   - `c_user` (User ID)
   - `xs` (Session token)
   - `fr` (Request token)
   - `datr`, `sb`, `spin` (Security tokens)

```typescript
const appState = [
  {
    key: "c_user",
    value: "100000000000000",
    domain: ".facebook.com",
    path: "/",
    hostOnly: false,
    creation: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  },
  {
    key: "xs", 
    value: "74%3A...",
    domain: ".facebook.com",
    path: "/",
    hostOnly: false,
    creation: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  }
  // ... thêm các cookies khác
];
```

## ⚡ Ví dụ hoàn chỉnh

```typescript
import { loginPromise } from 'unofficial-fb-api';
import fs from 'fs';

async function main() {
  try {
    // Load appState từ file
    const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    
    // Đăng nhập
    const api = await loginPromise({ appState }, {
      showLogs: true,
      logLevel: 'info',
      autoReconnect: true,
      rateLimit: {
        maxRequests: 30,
        windowMs: 60000
      }
    });
    
    console.log('✅ Đăng nhập thành công!');
    console.log('User ID:', api.getCurrentUserID());
    
    // Lấy danh sách thread
    const threads = await api.getThreadList(10);
    console.log(`📱 Có ${threads.length} hội thoại`);
    
    // Gửi tin nhắn đầu tiên
    const firstThread = threads[0];
    if (firstThread) {
      await api.sendMessage('🤖 Bot đã online!', firstThread.threadID);
      console.log('✅ Đã gửi tin nhắn thông báo');
    }
    
    // Lấy thông tin bạn bè
    const friends = await api.getFriendsList();
    console.log(`👥 Có ${friends.length} bạn bè`);
    
    // Lưu lại appState mới
    const newAppState = api.getAppState();
    fs.writeFileSync('appstate.json', JSON.stringify(newAppState, null, 2));
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

main();
```

## 🛠️ Xử lý lỗi

```typescript
import { FacebookAPIException, ErrorType } from 'unofficial-fb-api';

try {
  await api.sendMessage('Test', 'INVALID_THREAD_ID');
} catch (error) {
  if (error instanceof FacebookAPIException) {
    console.log('Error Type:', error.type);
    console.log('Error Message:', error.message);
    console.log('Context:', error.context);
    
    // Xử lý theo loại lỗi
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        console.log('Cần đăng nhập lại');
        break;
      case ErrorType.RATE_LIMIT:
        console.log('Đã vượt quá giới hạn request');
        break;
      case ErrorType.NETWORK:
        console.log('Lỗi mạng, thử lại sau');
        break;
      default:
        console.log('Lỗi không xác định');
    }
  }
}
```

## 🔧 Environment Variables

Bạn có thể sử dụng biến môi trường để cấu hình:

```bash
# .env file
NVFCA_LOG_LEVEL=debug
NODE_ENV=development
```

```typescript
// Thư viện tự động đọc các biến môi trường này
process.env.NVFCA_LOG_LEVEL = 'debug'; // error, warn, info, debug
process.env.NODE_ENV = 'development';
```

## ⚙️ Cấu hình TypeScript

Nếu sử dụng TypeScript, thêm vào `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## 📋 API Reference

### Main Functions

| Function | Description |
|----------|-------------|
| `sendMessage(message, threadID)` | Gửi tin nhắn |
| `unsendMessage(messageID)` | Xóa tin nhắn đã gửi |
| `markAsRead(threadID)` | Đánh dấu đã đọc |
| `sendTypingIndicator(threadID)` | Hiển thị đang gõ |
| `getUserInfo(userID)` | Lấy thông tin người dùng |
| `getFriendsList()` | Lấy danh sách bạn bè |
| `getThreadList(limit)` | Lấy danh sách hội thoại |
| `getThreadInfo(threadID)` | Lấy thông tin hội thoại |
| `createNewGroup(userIDs, title)` | Tạo nhóm chat mới |
| `changeThreadTitle(threadID, title)` | Thay đổi tên nhóm |
| `addUserToGroup(userID, threadID)` | Thêm thành viên |
| `removeUserFromGroup(userID, threadID)` | Xóa thành viên |

### Types

```typescript
interface MessageOptions {
  body?: string;
  attachment?: any;
  mentions?: Array<{tag: string, id: string}>;
  url?: string;
  sticker?: string;
  emoji?: string;
  emojiSize?: 'small' | 'medium' | 'large';
}

interface UserInfo {
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

interface ThreadInfo {
  threadID: string;
  threadName?: string;
  participantIDs: string[];
  messageCount?: number;
  isGroup: boolean;
  isArchived?: boolean;
  isCanReply?: boolean;
  emoji?: string;
  color?: string;
}
```

## 🚧 Troubleshooting

### Lỗi thường gặp

**1. "Login failed" / "Invalid credentials"**
- Kiểm tra lại appState/cookies
- Đảm bảo account chưa bị khóa
- Thử đăng nhập lại trên browser

**2. "Rate limit exceeded"**
- Giảm `maxRequests` trong cấu hình
- Tăng `windowMs` để kéo dài thời gian giới hạn
- Thêm delay giữa các request

**3. "Network timeout"**
- Tăng `timeout` trong options
- Kiểm tra kết nối internet
- Sử dụng proxy nếu bị chặn IP

**4. "Cannot send message"**
- Kiểm tra `threadID` có đúng không
- Đảm bảo có quyền gửi tin nhắn trong thread đó
- Kiểm tra kích thước file đính kèm

### Debug

```typescript
// Bật debug mode
const api = await loginPromise({ appState }, {
  showLogs: true,
  logLevel: 'debug',
  developmentLog: true
});

// Hoặc sử dụng environment variable
process.env.NVFCA_LOG_LEVEL = 'debug';
```

## 📚 Ví dụ nâng cao

### Bot tự động trả lời

```typescript
import { loginPromise } from 'unofficial-fb-api';

const api = await loginPromise({ appState }, {
  showLogs: true,
  listenEvents: true
});

// Lắng nghe tin nhắn mới (cần implement listen function)
// api.listen((err, message) => {
//   if (message && message.body) {
//     if (message.body.toLowerCase() === 'hello') {
//       api.sendMessage('Xin chào! Tôi là bot.', message.threadID);
//     }
//   }
// });
```

### Upload file lớn

```typescript
const uploadLargeFile = async (filePath, threadID) => {
  try {
    // Kiểm tra kích thước file
    const stats = fs.statSync(filePath);
    if (stats.size > 25 * 1024 * 1024) { // 25MB
      throw new Error('File quá lớn (>25MB)');
    }
    
    await api.sendMessage({
      body: 'Đang gửi file...',
      attachment: fs.createReadStream(filePath)
    }, threadID);
    
    console.log('✅ Upload thành công');
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
};
```

### Gửi tin nhắn hàng loạt

```typescript
const broadcastMessage = async (message, threadIds) => {
  for (const threadId of threadIds) {
    try {
      await api.sendMessage(message, threadId);
      console.log(`✅ Sent to ${threadId}`);
      
      // Delay để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to send to ${threadId}:`, error);
    }
  }
};

// Sử dụng
const threadIds = ['THREAD1', 'THREAD2', 'THREAD3'];
await broadcastMessage('Thông báo quan trọng!', threadIds);
```

## 👨‍💻 Hướng dẫn Developer

### Thêm Module mới

Để đóng góp và thêm module mới vào API, hãy làm theo cấu trúc này:

#### 1. Tạo Base Module Class

```typescript
// module/YourModule.ts
import { BaseAPIModule } from "./BaseAPIModule.js";

export interface YourModuleOptions {
  // Định nghĩa interface của bạn ở đây
}

export class YourModule extends BaseAPIModule {
  /**
   * Function chính của bạn
   */
  async yourFunction(
    param1: string,
    param2?: YourModuleOptions,
    callback?: (err: any, result?: any) => void
  ): Promise<any> {
    const promise = this.executeYourFunction(param1, param2);
    return this.handleCallback(promise, callback);
  }

  private async executeYourFunction(
    param1: string,
    param2?: YourModuleOptions
  ): Promise<any> {
    this.log('Thực thi function của bạn:', param1);

    // Implementation của bạn ở đây
    const response = await this.makeRequest(
      'your-endpoint',
      { param1, ...param2 }
    );

    if (response.error) {
      throw new Error(`Function thất bại: ${response.error}`);
    }

    return response.data;
  }
}
```

#### 2. Cập nhật APIManager

```typescript
// module/APIManager.ts
import { YourModule } from './YourModule.js';

export class APIManager {
  private yourModule: YourModule;

  // Thêm function của bạn vào class
  yourFunction!: YourModule['yourFunction'];

  constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
    // Khởi tạo module của bạn
    this.yourModule = new YourModule(ctx, config);
    
    this.bindMethods();
  }

  private bindMethods(): void {
    // Bind methods của bạn
    this.yourFunction = this.yourModule.yourFunction.bind(this.yourModule);
  }

  getModules() {
    return {
      // Thêm module của bạn
      your: this.yourModule,
      // ... các module khác
    };
  }
}
```

#### 3. Cập nhật API Interface

```typescript
// nvstudio.ts
export interface API {
  // Thêm function của bạn vào interface
  yourFunction: (param1: string, param2?: YourModuleOptions, callback?) => Promise<any>;
  
  // Cập nhật return type của getModules
  getModules: () => { 
    your: YourModule; 
    // ... các module khác
  };
}
```

#### 4. Cập nhật Type Exports

```typescript
// nvstudio.ts hoặc types/index.ts
export type { YourModuleOptions } from './module/YourModule.js';
```

### Nguyên tắc phát triển Module

1. **Extend BaseAPIModule**: Luôn extend từ `BaseAPIModule` để có shared functionality
2. **Sử dụng TypeScript**: Full type safety với interfaces và typing đúng
3. **Error Handling**: Sử dụng pattern `handleCallback` để hỗ trợ cả Promise và callback
4. **Logging**: Sử dụng `this.log()` để logging nhất quán
5. **Request Method**: Sử dụng `this.makeRequest()` cho Facebook API calls
6. **Validation**: Sử dụng `this.validateRequired()` để validate parameters

### Sub-Module Pattern (Nâng cao)

Đối với module phức tạp, bạn có thể sử dụng sub-module pattern như MessageModule:

```typescript
// module/your/SubModule.ts
export class SubModule extends BaseAPIModule {
  async subFunction(param: string): Promise<void> {
    // Implementation
  }
}

// module/your/index.ts
export { SubModule } from './SubModule.js';
export type { SubModuleOptions } from './SubModule.js';

// module/YourModule.ts
import { SubModule } from './your/SubModule.js';

export class YourModule {
  private subModule: SubModule;
  
  constructor(ctx: BuildApiContext, config: Required<ConfigTypes>) {
    this.subModule = new SubModule(ctx, config);
  }
  
  async subFunction(param: string): Promise<void> {
    return this.subModule.subFunction(param);
  }
}
```

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch cho tính năng mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

Đối với đóng góp module, vui lòng tuân theo Hướng dẫn Developer ở trên để đảm bảo tính nhất quán.

## 📄 Giấy phép

Dự án này được cấp phép theo [MIT License](LICENSE).

## ⚠️ Tuyên bố miễn trừ trách nhiệm

Thư viện này được phát triển cho mục đích học tập và nghiên cứu. Tác giả không chịu trách nhiệm cho bất kỳ vấn đề nào phát sinh từ việc sử dụng thư viện này. Facebook có thể thay đổi API bất cứ lúc nào, khiến thư viện này ngừng hoạt động.

**Sử dụng có trách nhiệm và tuân thủ Điều khoản Dịch vụ của Facebook!**

## 📞 Liên hệ

- **Tác giả**: Nhat Vu
-
- **Email**: nhatvu10092003@gmail.com
- **GitHub**: [nhatvu2003](https://github.com/nhatvu2003)
- **Issues**: [GitHub Issues](https://github.com/nhatvu2003/Unofficial-fb-api/issues)

---

## 🌟 Hỗ trợ dự án

Nếu thư viện này hữu ích với bạn, hãy cho chúng tôi một ⭐ trên GitHub!

[![GitHub stars](https://img.shields.io/github/stars/nhatvu2003/Unofficial-fb-api.svg?style=social&label=Star)](https://github.com/nhatvu2003/Unofficial-fb-api)