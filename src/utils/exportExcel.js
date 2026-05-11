import * as XLSX from 'xlsx';

export const exportToExcel = (state) => {
  const inrFormat = '"₹"#,##0.00';

  // Helper to format cells with INR
  const formatRange = (ws, colIndexes) => {
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (const C of colIndexes) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) continue;
        ws[cellRef].z = inrFormat;
      }
    }
  };

  // 1. Overview Sheet
  let totalAssets = 0;
  state.assets.forEach(a => totalAssets += parseFloat(a.currentValue || a.value || 0));
  
  let totalDebt = 0;
  let totalEmi = parseFloat(state.emi) || 0;
  state.liabilities.forEach(l => {
    totalDebt += parseFloat(l.value || 0);
    if (l.emi) totalEmi += parseFloat(l.emi);
  });

  const netWorth = totalAssets - totalDebt;
  const income = parseFloat(state.income) || 0;
  const expenses = parseFloat(state.expenses) || 0;
  
  let totalSip = 0;
  state.assets.forEach(a => { if(a.sip) totalSip += parseFloat(a.sip); });
  
  const idleCash = income - expenses - totalEmi - totalSip;
  const fiNumber = (expenses * 12) * 25;

  const overviewData = [
    { Metric: "Total Assets", Value: totalAssets },
    { Metric: "Total Debt", Value: totalDebt },
    { Metric: "Net Worth", Value: netWorth },
    { Metric: "", Value: null },
    { Metric: "Monthly Income", Value: income },
    { Metric: "Monthly Expenses", Value: expenses },
    { Metric: "Monthly Loan EMIs", Value: totalEmi },
    { Metric: "Monthly Investment SIPs", Value: totalSip },
    { Metric: "Idle Cash (Surplus)", Value: idleCash },
    { Metric: "", Value: null },
    { Metric: "Target FI Number (25x)", Value: fiNumber }
  ];

  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  formatRange(wsOverview, [1]); // Format Value column as INR
  wsOverview['!cols'] = [{ wch: 30 }, { wch: 20 }];

  // 2. Assets Sheet
  const assetsData = state.assets.map(a => ({
    "Asset Name": a.name,
    "Type": a.type,
    "Invested Amount": parseFloat(a.invested || 0),
    "Current Value": parseFloat(a.currentValue || a.value || 0),
    "Monthly SIP": parseFloat(a.sip || 0),
    "Expected ROI (%)": parseFloat(a.roi || 0)
  }));
  const wsAssets = XLSX.utils.json_to_sheet(assetsData);
  formatRange(wsAssets, [2, 3, 4]); // Invested, Current Value, SIP
  wsAssets['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];

  // 3. Liabilities Sheet
  const liabData = state.liabilities.map(l => ({
    "Loan Name": l.name,
    "Outstanding Principal": parseFloat(l.value || 0),
    "Monthly EMI": parseFloat(l.emi || 0),
    "Interest Rate (%)": parseFloat(l.interest || 0)
  }));
  const wsLiabilities = XLSX.utils.json_to_sheet(liabData);
  formatRange(wsLiabilities, [1, 2]); // Outstanding, EMI
  wsLiabilities['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];

  // 4. Goals Sheet
  const goalsData = state.goals.map(g => {
    // Calculate progress if linked assets exist
    let saved = parseFloat(g.saved || 0);
    let linkedAssetsStr = "None";

    if (g.linkedAssets && g.linkedAssets.length > 0) {
      let linkedVal = 0;
      const linkedNames = [];
      g.linkedAssets.forEach(link => {
        const asset = state.assets.find(a => a.id === link.assetId);
        if (asset) {
          linkedVal += parseFloat(asset.currentValue || asset.value || 0) * (link.allocation / 100);
          linkedNames.push(`${asset.name} (${link.allocation}%)`);
        }
      });
      saved = linkedVal;
      linkedAssetsStr = linkedNames.join(", ");
    }

    return {
      "Goal Name": g.name,
      "Target Amount": parseFloat(g.target || 0),
      "Target Date": g.targetDate || "Not Set",
      "Current Saved": saved,
      "Monthly Contribution": parseFloat(g.contribution || 0),
      "ROI (%)": parseFloat(g.roi || 0),
      "Linked Assets": linkedAssetsStr
    };
  });
  const wsGoals = XLSX.utils.json_to_sheet(goalsData);
  formatRange(wsGoals, [1, 3, 4]); // Target Amount, Current Saved, Monthly Contribution
  wsGoals['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 40 }];

  // Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");
  XLSX.utils.book_append_sheet(wb, wsAssets, "Assets Manager");
  XLSX.utils.book_append_sheet(wb, wsLiabilities, "Debt Manager");
  XLSX.utils.book_append_sheet(wb, wsGoals, "Goals Matrix");

  // Generate File
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `FinGoal_Backup_${dateStr}.xlsx`;
  
  XLSX.writeFile(wb, fileName);
};
