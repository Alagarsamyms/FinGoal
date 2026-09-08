/**
 * Google Drive Integration - React Port
 */

const CLIENT_ID = '552710266090-2q6hco4vbed29iidlsgcqucgufmks78k.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let fileId = null;
let chatFileId = null; // separate file for AI chat history

const FILENAME = 'fingoal_v2_data.json';
const CHAT_FILENAME = 'fingoal_ai_chat.json';

export function initializeGoogleDriveSync() {
    // Inject scripts
    if (!document.getElementById('gapi-script')) {
        const script1 = document.createElement('script');
        script1.id = 'gapi-script';
        script1.src = 'https://apis.google.com/js/api.js';
        script1.onload = () => gapi.load('client', async () => {
            await gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });
            gapiInited = true;
            maybeEnableButtons();
        });
        document.body.appendChild(script1);
    }

    if (!document.getElementById('gis-script')) {
        const script2 = document.createElement('script');
        script2.id = 'gis-script';
        script2.src = 'https://accounts.google.com/gsi/client';
        script2.onload = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '',
            });
            gisInited = true;
            maybeEnableButtons();
        };
        document.body.appendChild(script2);
    }
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error("Auth error:", resp.error);
                updateSyncStatusUI(false, "Connection Failed");
                return;
            }
            gapi.client.setToken(resp);
            localStorage.setItem('gdrive_token', JSON.stringify({ ...resp, acquiredAt: Date.now() }));
            localStorage.setItem('gdrive_auto_sync', 'true');
            window.dispatchEvent(new Event('gdrive_sync_changed'));
            // AI Chat is still safe to auto-pull
            await loadChatFromDrive();
        };

        const isAutoSync = localStorage.getItem('gdrive_auto_sync') === 'true';
        const storedTokenStr = localStorage.getItem('gdrive_token');
        
        if (storedTokenStr && isAutoSync) {
            const storedToken = JSON.parse(storedTokenStr);
            const age = Date.now() - storedToken.acquiredAt;
            if (age < storedToken.expires_in * 1000) {
                gapi.client.setToken(storedToken);
                window.dispatchEvent(new Event('gdrive_sync_changed'));
                loadChatFromDrive();
            } else {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        }
    }
}

export function handleDriveAuthClick() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

export function disconnectDrive() {
    if (window.gapi && gapi.client) gapi.client.setToken(null);
    localStorage.removeItem('gdrive_token');
    localStorage.setItem('gdrive_auto_sync', 'false');
    window.dispatchEvent(new Event('gdrive_sync_changed'));
}

export async function fetchDriveBackup() {
    if (!window.gapi || !gapi.client || gapi.client.getToken() === null) return null;
    try {
        let response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'nextPageToken, files(id, name)',
            pageSize: 10
        });

        const files = response.result.files;
        let foundFile = files.find(f => f.name === FILENAME);

        if (foundFile) {
            fileId = foundFile.id;
            let fileResponse = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
            return fileResponse.result;
        }
    } catch (err) {
        console.error("Error fetching backup from Drive", err);
    }
    return null;
}

window.syncToDrive = async function (appState) {
    if (!window.gapi || !gapi.client || gapi.client.getToken() === null) return;


    const fileContent = JSON.stringify(appState);
    const file = new Blob([fileContent], { type: 'application/json' });
    let metadata = { 'name': FILENAME, 'parents': ['appDataFolder'] };
    let accessToken = gapi.client.getToken().access_token;
    
    let form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';
        if (fileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            method = 'PATCH';
            delete metadata.parents;
            form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
        }
        let response = await fetch(url, { method, headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), body: form });
        let data = await response.json();
        if (!fileId) fileId = data.id;

        // Record the sync time
        localStorage.setItem('fingoal_base_drive_time', Date.now());
    } catch (err) {
        console.error("Error saving to Drive", err);
    }
}

// Removed DOM-based updateSyncStatusUI. React will handle UI via state and events.

// Removed auto-pull on focus. One-way backup architecture only.

/**
 * Returns true if the user is currently authenticated with Google Drive.
 */
export function isSyncedToDrive() {
    return !!(
        window.gapi &&
        typeof gapi.client !== 'undefined' &&
        gapi.client.getToken() !== null &&
        localStorage.getItem('gdrive_auto_sync') === 'true'
    );
}

/**
 * Sync AI chat messages to a separate fingoal_ai_chat.json in Google Drive appDataFolder.
 * @param {Array} messages - Array of chat message objects
 */
export async function syncChatToDrive(messages) {
    if (!isSyncedToDrive()) return;

    const fileContent = JSON.stringify({ messages, savedAt: Date.now() });
    const file = new Blob([fileContent], { type: 'application/json' });
    const accessToken = gapi.client.getToken().access_token;

    try {
        if (chatFileId) {
            // Update existing file
            const metadata = { name: CHAT_FILENAME };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
            await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${chatFileId}?uploadType=multipart`,
                { method: 'PATCH', headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), body: form }
            );
        } else {
            // Create new file
            const metadata = { name: CHAT_FILENAME, parents: ['appDataFolder'] };
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                { method: 'POST', headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), body: form }
            );
            const data = await response.json();
            chatFileId = data.id;
        }
    } catch (err) {
        console.error('Error saving chat to Drive', err);
    }
}

/**
 * Load AI chat messages from fingoal_ai_chat.json in Google Drive.
 * Returns the messages array or null if not found.
 * Also dispatches a custom event 'chatLoadedFromDrive' with the messages.
 */
export async function loadChatFromDrive() {
    if (!isSyncedToDrive()) return null;

    try {
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'files(id, name)',
            pageSize: 20
        });
        const files = response.result.files;
        const found = files.find(f => f.name === CHAT_FILENAME);

        if (found) {
            chatFileId = found.id;
            const fileResponse = await gapi.client.drive.files.get({ fileId: chatFileId, alt: 'media' });
            const data = fileResponse.result;
            const messages = data.messages || [];
            // Notify Simulation component
            window.dispatchEvent(new CustomEvent('chatLoadedFromDrive', { detail: { messages } }));
            return messages;
        }
    } catch (err) {
        console.error('Error loading chat from Drive', err);
    }
    return null;
}
