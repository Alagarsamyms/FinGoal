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

const FILENAME = 'fingoal_v2_data.json';

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
        const btn = document.getElementById('auth-btn-react');
        if (btn) btn.onclick = handleAuthClick;

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error("Auth error:", resp.error);
                updateSyncStatusUI(false, "Connection Failed");
                return;
            }
            gapi.client.setToken(resp);
            localStorage.setItem('gdrive_token', JSON.stringify({ ...resp, acquiredAt: Date.now() }));
            localStorage.setItem('gdrive_auto_sync', 'true');
            updateSyncStatusUI(true);
            await loadFromDrive();
        };

        const isAutoSync = localStorage.getItem('gdrive_auto_sync') === 'true';
        const storedTokenStr = localStorage.getItem('gdrive_token');
        
        if (storedTokenStr && isAutoSync) {
            const storedToken = JSON.parse(storedTokenStr);
            const age = Date.now() - storedToken.acquiredAt;
            if (age < storedToken.expires_in * 1000) {
                gapi.client.setToken(storedToken);
                updateSyncStatusUI(true);
                loadFromDrive();
            } else {
                updateSyncStatusUI(false, "Reconnecting...");
                tokenClient.requestAccessToken({ prompt: '' });
            }
        }
    }
}

function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

async function loadFromDrive() {
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
            let driveData = fileResponse.result;
            
            // Conflict Resolution based on base drive time vs new drive time
            let localDataStr = localStorage.getItem('fingoal_v2');
            let localData = localDataStr ? JSON.parse(localDataStr) : null;
            
            const driveTime = driveData.lastUpdated || 0;
            const localTime = localData ? (localData.lastUpdated || 0) : 0;
            const baseDriveTime = parseInt(localStorage.getItem('fingoal_base_drive_time') || '0');

            if (driveTime > baseDriveTime) {
                // Drive data is newer than what we last synced, meaning another device updated it
                console.log("Drive data is newer. Downloading to local.");
                localStorage.setItem('fingoal_base_drive_time', driveTime);
                if (window.updateAppStateFromDrive) {
                    window.updateAppStateFromDrive(driveData);
                }
            } else if (localTime > driveTime && localTime > baseDriveTime) {
                // Local data is newer and Drive hasn't been changed by another device
                console.log("Local data is newer. Uploading to Drive.");
                if (window.syncToDrive) {
                    window.syncToDrive(localData);
                }
            } else {
                console.log("Drive and Local are in sync.");
            }
        }
    } catch (err) {
        console.error("Error loading from Drive", err);
    }
}

window.syncToDrive = async function (appState) {
    if (!window.gapi || !gapi.client || gapi.client.getToken() === null) return;

    const baseDriveTime = parseInt(localStorage.getItem('fingoal_base_drive_time') || '0');
    if (appState.lastUpdated <= baseDriveTime && baseDriveTime !== 0) {
        return; // No local changes since last sync, skip upload
    }

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

        // Update base drive time to mark this version as synced
        localStorage.setItem('fingoal_base_drive_time', appState.lastUpdated);
    } catch (err) {
        console.error("Error saving to Drive", err);
    }
}

function updateSyncStatusUI(isSynced, message) {
    const statusDiv = document.getElementById('sync-status-react');
    const authBtn = document.getElementById('auth-btn-react');
    if (!statusDiv || !authBtn) return;
    
    if (isSynced) {
        statusDiv.innerHTML = '<div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-emerald-600">Synced to Drive</span>';
        
        // Change button to Disconnect
        authBtn.innerHTML = '<span class="text-emerald-600 font-medium">Disconnect</span>';
        authBtn.onclick = () => {
            gapi.client.setToken(null);
            localStorage.removeItem('gdrive_token');
            localStorage.setItem('gdrive_auto_sync', 'false');
            statusDiv.innerHTML = '<div class="w-2 h-2 rounded-full bg-amber-500"></div><span class="text-amber-600">Local Storage</span>';
            authBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Sync Drive';
            authBtn.onclick = handleAuthClick;
        };
    } else if (message) {
        statusDiv.innerHTML = `<div class="w-2 h-2 rounded-full bg-amber-500"></div><span class="text-amber-600">${message}</span>`;
    }
}

// Auto-pull changes when the user switches back to the app tab
window.addEventListener('focus', () => {
    if (window.gapi && gapi.client && localStorage.getItem('gdrive_auto_sync') === 'true') {
        const storedTokenStr = localStorage.getItem('gdrive_token');
        if (storedTokenStr) {
            const storedToken = JSON.parse(storedTokenStr);
            const age = Date.now() - storedToken.acquiredAt;
            if (age < storedToken.expires_in * 1000) {
                if (gapi.client.getToken() !== null) {
                    loadFromDrive();
                }
            } else if (typeof tokenClient !== 'undefined') {
                tokenClient.requestAccessToken({ prompt: '' });
            }
        }
    }
});
