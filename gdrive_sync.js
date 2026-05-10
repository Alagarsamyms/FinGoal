/**
 * Google Drive Integration for FinGoal
 * Requires Google Cloud Project, OAuth Client ID, and Drive API enabled.
 * NOTE: Replace the CLIENT_ID below with your actual Client ID.
 */

const CLIENT_ID = '552710266090-2q6hco4vbed29iidlsgcqucgufmks78k.apps.googleusercontent.com'; // Replace this
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'; // AppData folder is invisible to user, perfect for app config

let tokenClient;
let gapiInited = false;
let gisInited = false;
let fileId = null;

const FILENAME = 'fingoal_data.json';

// Called when Google API library is loaded
function gapiLoaded() {
    gapi.load('client', intializeGapiClient);
}

async function intializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
    maybeEnableButtons();
}

// Called when Google Identity Services library is loaded
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('auth-btn').onclick = handleAuthClick;
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error("Auth error:", resp.error);
            return;
        }

        // Store the token for gapi to use
        gapi.client.setToken(resp);

        // Authenticated successfully
        updateSyncStatus(true);
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
        // Search for the file in appDataFolder
        let response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder',
            fields: 'nextPageToken, files(id, name)',
            pageSize: 10
        });

        const files = response.result.files;
        let foundFile = files.find(f => f.name === FILENAME);

        if (foundFile) {
            fileId = foundFile.id;
            // Read content
            let fileResponse = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const driveData = fileResponse.result;
            // Merge or overwrite local state
            if (window.updateAppStateFromDrive) {
                window.updateAppStateFromDrive(driveData);
            }
            console.log("Loaded data from Google Drive");
        } else {
            console.log("No data found in Drive, creating new.");
            // We will create the file on the next save
        }
    } catch (err) {
        console.error("Error loading from Drive", err);
    }
}

// This function is exposed to be called from app.js whenever state changes
window.syncToDrive = async function (appState) {
    if (!gapi.client || gapi.client.getToken() === null) {
        return; // Not authenticated
    }

    const fileContent = JSON.stringify(appState);
    const file = new Blob([fileContent], { type: 'application/json' });

    let metadata = {
        'name': FILENAME,
        'parents': ['appDataFolder']
    };

    let accessToken = gapi.client.getToken().access_token;

    // Create form data
    let form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        // If fileId exists, we update (PATCH) instead of POST
        if (fileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            method = 'PATCH';
            // We don't need parents when updating
            delete metadata.parents;
            form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);
        }

        let response = await fetch(url, {
            method: method,
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });

        let data = await response.json();
        if (!fileId) {
            fileId = data.id; // Save the newly created file ID
        }
        console.log("Successfully synced to Drive");
    } catch (err) {
        console.error("Error saving to Drive", err);
    }
}

function updateSyncStatus(isSynced) {
    const statusDiv = document.getElementById('sync-status');
    const authBtn = document.getElementById('auth-btn');

    if (isSynced) {
        statusDiv.className = 'status-indicator synced';
        statusDiv.querySelector('.status-text').textContent = 'Synced with Google Drive';
        authBtn.innerHTML = '<i class="fa-solid fa-check"></i> Connected';
        authBtn.disabled = true;
    } else {
        statusDiv.className = 'status-indicator not-synced';
        statusDiv.querySelector('.status-text').textContent = 'Local Storage Only';
    }
}

// Inject the Google APIs manually to handle callbacks
const script1 = document.createElement('script');
script1.src = 'https://apis.google.com/js/api.js';
script1.onload = gapiLoaded;
document.body.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://accounts.google.com/gsi/client';
script2.onload = gisLoaded;
document.body.appendChild(script2);
