export function calculateNetWorth(assets, liabilities) {
  if (!Array.isArray(assets) || !Array.isArray(liabilities)) return 0;
  
  const totalAssets = assets.reduce((sum, a) => sum + (parseFloat(a.currentValue || a.value) || 0), 0);
  const totalDebt = liabilities.reduce((sum, l) => sum + (parseFloat(l.value) || 0), 0);
  
  return totalAssets - totalDebt;
}

export function calculateFinancialHealth(income, expenses, totalEmi, emergencyTarget, emergencyCurrent, hasData) {
  if (!hasData) return 0;

  const totalIncome = parseFloat(income) || 0;
  const totalExpenses = parseFloat(expenses) || 0;
  const emi = parseFloat(totalEmi) || 0;
  const surplus = totalIncome - totalExpenses - emi;

  const dti = totalIncome > 0 ? (emi / totalIncome) * 100 : 0;
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;

  let healthScore = 100;

  // Penalty for high DTI
  if (totalIncome > 0) {
    if (dti > 40) healthScore -= 30;
    else if (dti > 30) healthScore -= 15;
    else if (dti > 20) healthScore -= 5;
  }

  // Penalty for low savings rate
  if (totalIncome > 0) {
    if (savingsRate < 10) healthScore -= 30;
    else if (savingsRate < 20) healthScore -= 15;
  } else {
    // No income entered but has assets/liabilities – mild penalty
    healthScore -= 15;
  }

  // Penalty for no / low emergency fund
  const eTarget = parseFloat(emergencyTarget) || 0;
  const eCurrent = parseFloat(emergencyCurrent) || 0;

  if (eTarget > 0 && eCurrent < eTarget * 0.5) healthScore -= 20;
  else if (eTarget > 0 && eCurrent < eTarget) healthScore -= 10;
  else if (eTarget === 0) healthScore -= 10;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, healthScore));
}

export function calculateFireProjection(age, startCorpus, startSurplus, expenses, inflation, roi, swr, investmentStopAge) {
  const currentCorpus = parseFloat(startCorpus) || 0;
  const monthlySurplus = parseFloat(startSurplus) || 0;
  const annualExpenses = (parseFloat(expenses) || 0) * 12;
  const inf = parseFloat(inflation) || 0;
  const returnRate = parseFloat(roi) || 0;
  const withdrawalRate = parseFloat(swr) || 0;
  
  if (withdrawalRate <= 0) return { data: [], fireAge: null, fireCorpus: 0, initialTarget: 0 };

  const initialTarget = annualExpenses / (withdrawalRate / 100);
  const data = [];
  
  let corpus = currentCorpus;
  let target = initialTarget;
  let fireAge = null;
  let fireCorpus = 0;

  const annualRoi = returnRate / 100;
  const annualInf = inf / 100;

  data.push({
    age,
    corpus: Math.round(corpus),
    target: Math.round(target),
    invested: Math.round(corpus)
  });

  for (let i = 1; i <= 50; i++) {
    const currentAge = age + i;
    
    // Target grows with inflation
    target = target * (1 + annualInf);

    // Corpus grows with ROI + Annual Surplus Compounding
    const isInvesting = currentAge <= investmentStopAge;
    const yearlyContribution = isInvesting ? monthlySurplus * 12 : 0;

    if (yearlyContribution > 0) {
      corpus = (corpus * (1 + annualRoi)) + (yearlyContribution * (1 + annualRoi / 2));
    } else {
      corpus = corpus * (1 + annualRoi);
    }

    data.push({
      age: currentAge,
      corpus: Math.round(corpus),
      target: Math.round(target)
    });

    if (corpus >= target && fireAge === null) {
      fireAge = currentAge;
      fireCorpus = Math.round(corpus);
    }
  }

  return { data, fireAge, fireCorpus, initialTarget };
}

export function calculateEmi(principal, ratePercent, months) {
  const p = parseFloat(principal) || 0;
  const r = (parseFloat(ratePercent) || 0) / 12 / 100;
  const n = parseInt(months, 10) || 0;
  
  if (p <= 0 || n <= 0) return 0;
  if (r === 0) return p / n;

  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calculateFutureValue(principal, sip, annualRoiPercent, months) {
  const p = parseFloat(principal) || 0;
  const s = parseFloat(sip) || 0;
  const rate = parseFloat(annualRoiPercent) || 0;
  const m = parseInt(months, 10) || 0;

  if (m <= 0) return p;

  const monthlyRate = rate / 12 / 100;
  
  if (monthlyRate === 0) {
    return p + (s * m);
  }

  const futurePrincipal = p * Math.pow(1 + monthlyRate, m);
  const futureSip = s * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
  
  return futurePrincipal + futureSip;
}
