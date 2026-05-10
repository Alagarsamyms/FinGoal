// State Management
let appState = {
    income: 0,
    expenses: 0,
    emi: 0,
    assets: [], // {id, name, value}
    liabilities: [], // {id, name, value}
    goals: [], // {id, name, target, saved, contribution, roi}
    protection: {
        termInsurance: 0,
        healthInsurance: 0,
        emergencyTarget: 0,
        emergencyCurrent: 0
    }
};

// Formatting utilities
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// DOM Elements Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to base inputs
    const inputs = ['monthly-income', 'monthly-expenses', 'monthly-emi', 
                    'term-insurance', 'health-insurance', 'emergency-fund-target', 'emergency-fund-current'];
    
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                if(id.startsWith('monthly-')) {
                    const key = id.replace('monthly-', '');
                    appState[key] = val;
                } else if(id === 'term-insurance') {
                    appState.protection.termInsurance = val;
                } else if(id === 'health-insurance') {
                    appState.protection.healthInsurance = val;
                } else if(id === 'emergency-fund-target') {
                    appState.protection.emergencyTarget = val;
                } else if(id === 'emergency-fund-current') {
                    appState.protection.emergencyCurrent = val;
                }
                updateDashboard();
                saveLocalState();
            });
        }
    });

    loadLocalState();
    updateDashboard();
});

// Update Dashboard Logic
function updateDashboard() {
    // 1. Calculate Cash Flow
    const surplus = appState.income - appState.expenses - appState.emi;
    document.getElementById('monthly-surplus').textContent = formatCurrency(surplus);
    document.getElementById('monthly-surplus').className = surplus >= 0 ? 'success' : 'danger';

    // 2. Calculate Assets and Liabilities
    const totalAssets = appState.assets.reduce((sum, a) => sum + parseFloat(a.value), 0);
    const totalLiabilities = appState.liabilities.reduce((sum, l) => sum + parseFloat(l.value), 0);
    const netWorth = totalAssets - totalLiabilities;

    document.getElementById('net-worth-display').textContent = formatCurrency(netWorth);
    document.getElementById('total-assets-display').textContent = formatCurrency(totalAssets);
    document.getElementById('total-liabilities-display').textContent = formatCurrency(totalLiabilities);

    // 3. Render Lists
    renderAssets();
    renderLiabilities();
    renderGoals();
    renderProtection();
}

// Render Functions
function renderAssets() {
    const container = document.getElementById('assets-list');
    container.innerHTML = '';
    if(appState.assets.length === 0) {
        container.innerHTML = '<div class="text-muted" style="font-size:0.875rem;">No assets added yet.</div>';
    }
    appState.assets.forEach(asset => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span class="item-name">${asset.name}</span>
            <div>
                <span class="item-value success">${formatCurrency(asset.value)}</span>
                <button class="edit-btn" onclick="editItem('asset', '${asset.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteAsset('${asset.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderLiabilities() {
    const container = document.getElementById('liabilities-list');
    container.innerHTML = '';
    if(appState.liabilities.length === 0) {
        container.innerHTML = '<div class="text-muted" style="font-size:0.875rem;">No liabilities added yet.</div>';
    }
    appState.liabilities.forEach(liability => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <span class="item-name">${liability.name}</span>
            <div>
                <span class="item-value danger">${formatCurrency(liability.value)}</span>
                <button class="edit-btn" onclick="editItem('liability', '${liability.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="delete-btn" onclick="deleteLiability('${liability.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderProtection() {
    const target = appState.protection.emergencyTarget;
    const current = appState.protection.emergencyCurrent;
    let percent = target > 0 ? (current / target) * 100 : 0;
    percent = Math.min(percent, 100).toFixed(1);

    document.getElementById('emergency-fund-percent').textContent = `${percent}%`;
    document.getElementById('emergency-fund-fill').style.width = `${percent}%`;
    if(percent >= 100) {
        document.getElementById('emergency-fund-fill').className = 'progress-fill success';
    } else {
        document.getElementById('emergency-fund-fill').className = 'progress-fill warning';
    }
}

function renderGoals() {
    const container = document.getElementById('goals-list');
    container.innerHTML = '';
    if(appState.goals.length === 0) {
        container.innerHTML = '<div class="text-muted" style="font-size:0.875rem;">No goals added yet.</div>';
    }

    appState.goals.forEach(goal => {
        let percent = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
        percent = Math.min(percent, 100).toFixed(1);
        
        // Project Achievable Date based on PMT formula approximation
        // Future Value = P(1+r/n)^(nt) + PMT * [ ((1+r/n)^(nt) - 1) / (r/n) ]
        // Solving for t is complex, we will iteratively calculate months until target hit.
        let monthsToAchieve = calculateMonthsToGoal(goal.saved, goal.target, goal.contribution, goal.roi);
        
        let projectionText = "";
        if(percent >= 100) {
            projectionText = "Goal Achieved! 🎉";
        } else if (monthsToAchieve === -1) {
            projectionText = "Increase contribution to reach goal.";
        } else if (monthsToAchieve > 1200) { // 100 years
            projectionText = "Will take over 100 years. Increase savings!";
        } else {
            let years = Math.floor(monthsToAchieve / 12);
            let months = monthsToAchieve % 12;
            let date = new Date();
            date.setMonth(date.getMonth() + monthsToAchieve);
            projectionText = `Estimated completion: ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()} (${years > 0 ? years + 'y ' : ''}${months}m)`;
        }

        const div = document.createElement('div');
        div.className = 'goal-item';
        div.innerHTML = `
            <div class="goal-header">
                <div class="goal-title">
                    <h3>${goal.name}</h3>
                    <div class="goal-stats">
                        <span>Save: ${formatCurrency(goal.contribution)}/mo</span>
                        <span>ROI: ${goal.roi}%</span>
                    </div>
                </div>
                <div class="goal-amount">${formatCurrency(goal.target)}</div>
            </div>
            <div class="progress-container">
                <div class="progress-header">
                    <span>${formatCurrency(goal.saved)} saved</span>
                    <span>${percent}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
            <div class="flex-between">
                <div class="goal-projection">
                    <i class="fa-solid fa-clock"></i> ${projectionText}
                </div>
                <div>
                    <button class="edit-btn" onclick="editItem('goal', '${goal.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteGoal('${goal.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function calculateMonthsToGoal(current, target, monthly, roiAnnual) {
    if (current >= target) return 0;
    if (monthly <= 0 && roiAnnual <= 0) return -1;
    
    let monthlyRate = (roiAnnual / 100) / 12;
    let balance = current;
    let months = 0;
    
    // Safety break at 100 years (1200 months)
    while (balance < target && months <= 1200) {
        balance += (balance * monthlyRate) + monthly;
        months++;
    }
    
    if(months > 1200) return 1201;
    return months;
}

// Modal Logic
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    delete document.getElementById(id).dataset.editId;
    
    // Clear inputs
    if(id === 'asset-modal') {
        document.getElementById('new-asset-name').value = '';
        document.getElementById('new-asset-value').value = '';
    } else if (id === 'liability-modal') {
        document.getElementById('new-liability-name').value = '';
        document.getElementById('new-liability-value').value = '';
    } else if (id === 'goal-modal') {
        document.getElementById('new-goal-name').value = '';
        document.getElementById('new-goal-target').value = '';
        document.getElementById('new-goal-saved').value = '';
        document.getElementById('new-goal-contribution').value = '';
        document.getElementById('new-goal-roi').value = 12;
    }
}

function editItem(type, id) {
    if(type === 'asset') {
        const item = appState.assets.find(a => a.id === id);
        if(!item) return;
        document.getElementById('new-asset-name').value = item.name;
        document.getElementById('new-asset-value').value = item.value;
        document.getElementById('asset-modal').dataset.editId = id;
        openModal('asset-modal');
    } else if(type === 'liability') {
        const item = appState.liabilities.find(l => l.id === id);
        if(!item) return;
        document.getElementById('new-liability-name').value = item.name;
        document.getElementById('new-liability-value').value = item.value;
        document.getElementById('liability-modal').dataset.editId = id;
        openModal('liability-modal');
    } else if(type === 'goal') {
        const item = appState.goals.find(g => g.id === id);
        if(!item) return;
        document.getElementById('new-goal-name').value = item.name;
        document.getElementById('new-goal-target').value = item.target;
        document.getElementById('new-goal-saved').value = item.saved;
        document.getElementById('new-goal-contribution').value = item.contribution;
        document.getElementById('new-goal-roi').value = item.roi;
        document.getElementById('goal-modal').dataset.editId = id;
        openModal('goal-modal');
    }
}

// Add Item Logic
function addAsset() {
    const name = document.getElementById('new-asset-name').value;
    const value = parseFloat(document.getElementById('new-asset-value').value);
    const modal = document.getElementById('asset-modal');
    const editId = modal.dataset.editId;
    
    if(name && !isNaN(value)) {
        if(editId) {
            const item = appState.assets.find(a => a.id === editId);
            if(item) { item.name = name; item.value = value; }
        } else {
            appState.assets.push({ id: generateId(), name, value });
        }
        closeModal('asset-modal');
        updateDashboard();
        saveLocalState();
    }
}

function addLiability() {
    const name = document.getElementById('new-liability-name').value;
    const value = parseFloat(document.getElementById('new-liability-value').value);
    const modal = document.getElementById('liability-modal');
    const editId = modal.dataset.editId;
    
    if(name && !isNaN(value)) {
        if(editId) {
            const item = appState.liabilities.find(l => l.id === editId);
            if(item) { item.name = name; item.value = value; }
        } else {
            appState.liabilities.push({ id: generateId(), name, value });
        }
        closeModal('liability-modal');
        updateDashboard();
        saveLocalState();
    }
}

function addGoal() {
    const name = document.getElementById('new-goal-name').value;
    const target = parseFloat(document.getElementById('new-goal-target').value);
    const saved = parseFloat(document.getElementById('new-goal-saved').value) || 0;
    const contribution = parseFloat(document.getElementById('new-goal-contribution').value) || 0;
    const roi = parseFloat(document.getElementById('new-goal-roi').value) || 0;
    const modal = document.getElementById('goal-modal');
    const editId = modal.dataset.editId;
    
    if(name && !isNaN(target)) {
        if(editId) {
            const item = appState.goals.find(g => g.id === editId);
            if(item) {
                item.name = name; item.target = target; item.saved = saved;
                item.contribution = contribution; item.roi = roi;
            }
        } else {
            appState.goals.push({ id: generateId(), name, target, saved, contribution, roi });
        }
        closeModal('goal-modal');
        updateDashboard();
        saveLocalState();
    }
}

// Delete Item Logic
function deleteAsset(id) {
    appState.assets = appState.assets.filter(a => a.id !== id);
    updateDashboard();
    saveLocalState();
}

function deleteLiability(id) {
    appState.liabilities = appState.liabilities.filter(l => l.id !== id);
    updateDashboard();
    saveLocalState();
}

function deleteGoal(id) {
    appState.goals = appState.goals.filter(g => g.id !== id);
    updateDashboard();
    saveLocalState();
}

// Local Storage Sync (Fallback if GDrive not connected)
function saveLocalState() {
    localStorage.setItem('finGoalState', JSON.stringify(appState));
    // Trigger GDrive save if authorized
    if(typeof syncToDrive === 'function') {
        syncToDrive(appState);
    }
}

function loadLocalState() {
    const saved = localStorage.getItem('finGoalState');
    if(saved) {
        try {
            appState = JSON.parse(saved);
            // Populate inputs
            document.getElementById('monthly-income').value = appState.income || '';
            document.getElementById('monthly-expenses').value = appState.expenses || '';
            document.getElementById('monthly-emi').value = appState.emi || '';
            
            if(appState.protection) {
                document.getElementById('term-insurance').value = appState.protection.termInsurance || '';
                document.getElementById('health-insurance').value = appState.protection.healthInsurance || '';
                document.getElementById('emergency-fund-target').value = appState.protection.emergencyTarget || '';
                document.getElementById('emergency-fund-current').value = appState.protection.emergencyCurrent || '';
            } else {
                appState.protection = {termInsurance: 0, healthInsurance: 0, emergencyTarget: 0, emergencyCurrent: 0};
            }
        } catch(e) {
            console.error("Error loading state", e);
        }
    }
}

// Expose state update for Google Drive sync
window.updateAppStateFromDrive = (data) => {
    appState = data;
    localStorage.setItem('finGoalState', JSON.stringify(appState));
    loadLocalState(); // to populate inputs
    updateDashboard();
}
