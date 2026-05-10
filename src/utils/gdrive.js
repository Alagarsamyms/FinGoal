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
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error("Auth error:", resp.error);
            return;
        }
        gapi.client.setToken(resp);
        updateSyncStatusUI(true);
        await loadFromDrive();
    };

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
            if (window.updateAppStateFromDrive) {
                window.updateAppStateFromDrive(fileResponse.result);
            }
        }
    } catch (err) {
        console.error("Error loading from Drive", err);
    }
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
    } catch (err) {
        console.error("Error saving to Drive", err);
    }
}

function updateSyncStatusUI(isSynced) {
    const statusDiv = document.getElementById('sync-status-react');
    const authBtn = document.getElementById('auth-btn-react');
    if (!statusDiv || !authBtn) return;
    
    if (isSynced) {
        statusDiv.innerHTML = '<div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-emerald-600">Synced to Drive</span>';
        authBtn.innerHTML = '<span class="text-emerald-600 font-medium">Connected</span>';
        authBtn.disabled = true;
    }
}
