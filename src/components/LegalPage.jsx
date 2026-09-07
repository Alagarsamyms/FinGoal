import React, { useState } from 'react';
import { ShieldCheck, FileText, ChevronRight, ExternalLink, AlertTriangle, Lock, Database, UserCheck, Mail } from 'lucide-react';

// ─── Last Updated ─────────────────────────────────────────────────────────────
const LAST_UPDATED = 'September 7, 2026';
const APP_NAME = 'Wealth For FIRE';
const CONTACT_EMAIL = 'support@wealthforfire.app'; // Update when domain is live
const APP_URL = 'https://wealthforfire.app'; // Update when domain is live

// ─── Section Component ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2 pl-0">
        {children}
      </div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Privacy Policy Tab ───────────────────────────────────────────────────────
function PrivacyPolicy() {
  return (
    <div className="space-y-4">

      {/* Disclaimer Banner */}
      <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
        <Lock size={18} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-800 dark:text-indigo-300">
          We take your privacy seriously. {APP_NAME} is designed to keep your financial data private,
          secure, and under your control. We do not sell, rent, or share your personal financial data
          with any third parties for commercial purposes.
        </p>
      </div>

      <Section icon={UserCheck} title="1. Who We Are" color="indigo">
        <p>
          {APP_NAME} ("{APP_NAME}", "we", "us", or "our") is a personal finance planning tool
          designed to help individuals in India plan their path to Financial Independence and Early
          Retirement (FIRE). This Privacy Policy explains how we collect, use, and protect your
          information when you use our application at <strong>{APP_URL}</strong>.
        </p>
        <p className="mt-2">
          This policy complies with the <strong>Information Technology Act, 2000</strong> and the
          <strong> Information Technology (Reasonable Security Practices and Procedures and
          Sensitive Personal Data or Information) Rules, 2011</strong> of India.
        </p>
      </Section>

      <Section icon={Database} title="2. Information We Collect" color="blue">
        <p><strong>2.1 Information You Provide:</strong></p>
        <BulletList items={[
          'Email address (for account creation and authentication)',
          'Financial data you voluntarily enter: income, assets, debts, goals, insurance details',
          'Date of birth (used only for age-based FIRE retirement projections)',
          'Preferences and app settings (theme, asset categories)',
        ]} />
        <p className="mt-3"><strong>2.2 Information Collected Automatically:</strong></p>
        <BulletList items={[
          'App usage events (page views, feature interactions) via PostHog analytics — anonymized',
          'Device type and browser information for compatibility',
          'Error logs for debugging and stability improvements',
        ]} />
        <p className="mt-3"><strong>2.3 What We Do NOT Collect:</strong></p>
        <BulletList items={[
          'Bank account numbers, credit card numbers, or PAN/Aadhaar details',
          'Passwords (we use Supabase Auth — passwords are hashed and never visible to us)',
          'Your actual financial account credentials of any kind',
        ]} />
      </Section>

      <Section icon={ShieldCheck} title="3. How We Use Your Information" color="emerald">
        <BulletList items={[
          'To provide and operate the app — sync your financial data across devices',
          'To power AI-driven financial analysis in the AI Advisor Simulator',
          'To calculate FIRE projections, net worth, and goal progress',
          'To send transactional emails (account verification, password reset) — no marketing emails without consent',
          'To analyze anonymized usage patterns to improve the product',
          'To investigate and fix bugs and performance issues',
        ]} />
      </Section>

      <Section icon={Lock} title="4. Data Storage & Security" color="purple">
        <p>
          Your financial data is stored securely using <strong>Supabase</strong> — a SOC 2 Type II
          certified cloud platform hosted on AWS. All data is encrypted in transit (TLS/HTTPS) and
          at rest (AES-256).
        </p>
        <p className="mt-2">Key security practices:</p>
        <BulletList items={[
          'Row-Level Security (RLS) — your data is only accessible to your authenticated account',
          'Session tokens are stored securely in your browser\'s localStorage',
          'We use Supabase\'s Auth service — we never store raw passwords',
          'AI Advisor uses Gemini API — only your financial summary is sent, never raw credentials',
          'PostHog analytics is configured with IP masking — no PII is sent to analytics',
        ]} />
      </Section>

      <Section icon={FileText} title="5. Data Sharing" color="amber">
        <p>We do <strong>not</strong> sell, trade, or rent your personal data. We share data only in these limited cases:</p>
        <BulletList items={[
          'Supabase (database & auth infrastructure) — data processor, not a data controller',
          'Google Gemini API (AI Advisor) — receives anonymized financial summaries only, no PII',
          'PostHog (product analytics) — receives anonymized usage events, IP masked',
          'Legal requirement — if required by Indian law or court order',
        ]} />
      </Section>

      <Section icon={UserCheck} title="6. Your Rights" color="emerald">
        <p>As a user, you have the right to:</p>
        <BulletList items={[
          'Access your data — all your financial data is visible in the app at all times',
          'Export your data — use Settings → Export to Excel to download your complete data',
          'Correct your data — edit any field in the app at any time',
          'Delete your data — use Settings → Delete Account to permanently erase all your data',
          'Withdraw consent — sign out and delete your account at any time',
        ]} />
        <p className="mt-3">
          To exercise any of these rights or for privacy-related queries, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 underline">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </Section>

      <Section icon={Database} title="7. Data Retention" color="blue">
        <BulletList items={[
          'Your data is retained as long as your account is active',
          'If you delete your account, all data is permanently deleted from our systems within 30 days',
          'Anonymized analytics data (no PII) may be retained for up to 2 years for product improvement',
          'Backup retention: Supabase maintains encrypted backups for 7 days for disaster recovery',
        ]} />
      </Section>

      <Section icon={FileText} title="8. Cookies & Local Storage" color="indigo">
        <p>We use browser storage in the following ways:</p>
        <BulletList items={[
          'localStorage: Stores your authentication session token and app preferences',
          'No third-party advertising cookies are used',
          'PostHog uses a first-party cookie for anonymous session tracking only',
        ]} />
      </Section>

      <Section icon={AlertTriangle} title="9. Children's Privacy" color="rose">
        <p>
          {APP_NAME} is not intended for use by individuals under the age of 18. We do not
          knowingly collect personal information from minors. If you believe a minor has provided
          us with personal information, contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 underline">
            {CONTACT_EMAIL}
          </a>.
        </p>
      </Section>

      <Section icon={FileText} title="10. Changes to This Policy" color="amber">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes by displaying a prominent notice in the app. Continued use of the app after changes
          constitutes acceptance of the updated policy.
        </p>
        <p className="mt-2 font-medium">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section icon={Mail} title="11. Contact Us" color="indigo">
        <p>For privacy-related questions or requests:</p>
        <BulletList items={[
          `Email: ${CONTACT_EMAIL}`,
          `Website: ${APP_URL}`,
          'We aim to respond to all privacy requests within 30 days',
        ]} />
      </Section>
    </div>
  );
}

// ─── Terms of Service Tab ─────────────────────────────────────────────────────
function TermsOfService() {
  return (
    <div className="space-y-4">

      {/* Critical Financial Disclaimer Banner */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
        <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
            ⚠️ Important Financial Disclaimer
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {APP_NAME} is a <strong>personal finance planning tool only</strong>. It is{' '}
            <strong>not</strong> a registered financial advisor, investment advisor, or
            wealth management service under SEBI (Securities and Exchange Board of India)
            regulations. Nothing in this app constitutes professional financial, tax, legal,
            or investment advice. Always consult a qualified financial professional before
            making investment decisions.
          </p>
        </div>
      </div>

      <Section icon={FileText} title="1. Acceptance of Terms" color="indigo">
        <p>
          By accessing or using {APP_NAME} (the "Service"), you agree to be bound by these Terms
          of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
        </p>
        <p className="mt-2">
          These Terms constitute a legally binding agreement between you ("User") and {APP_NAME}.
          These Terms are governed by the laws of India.
        </p>
      </Section>

      <Section icon={UserCheck} title="2. Eligibility" color="blue">
        <BulletList items={[
          'You must be at least 18 years of age to use this Service',
          'You must be legally capable of entering into a binding agreement under Indian law',
          'The Service is primarily designed for users residing in India',
          'By using the Service, you represent that you meet these requirements',
        ]} />
      </Section>

      <Section icon={Database} title="3. Your Account" color="emerald">
        <p><strong>3.1 Account Registration:</strong></p>
        <BulletList items={[
          'You may use the app as a Guest (local storage only) or create a free account',
          'You are responsible for maintaining the confidentiality of your account credentials',
          'You must provide accurate and current information during registration',
          'You are responsible for all activities that occur under your account',
        ]} />
        <p className="mt-3"><strong>3.2 Account Termination:</strong></p>
        <BulletList items={[
          'You may delete your account at any time via Settings → Delete Account',
          'We reserve the right to suspend accounts that violate these Terms',
          'Upon deletion, all your data is permanently erased within 30 days',
        ]} />
      </Section>

      <Section icon={AlertTriangle} title="4. Financial Disclaimer (Critical)" color="amber">
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          {APP_NAME} is NOT a registered investment advisor or financial planner.
        </p>
        <BulletList items={[
          'All projections, calculations, and AI-generated analysis are for informational and illustrative purposes only',
          'FIRE projections are mathematical estimates based on assumptions you provide — actual results may vary significantly',
          'AI Advisor responses are generated by an AI model and do not constitute SEBI-registered investment advice',
          'Past performance of investments shown in projections is not indicative of future results',
          'We are not liable for any investment decisions made based on information in this app',
          'Insurance coverage analysis is illustrative only — consult a licensed insurance advisor for actual policy advice',
          'Tax calculations and implications should be verified with a qualified CA or tax advisor',
        ]} />
      </Section>

      <Section icon={ShieldCheck} title="5. Acceptable Use" color="purple">
        <p>You agree NOT to:</p>
        <BulletList items={[
          'Use the Service for any unlawful purpose or in violation of Indian laws',
          'Attempt to reverse engineer, decompile, or extract the source code of the app',
          'Share your account credentials or allow others to use your account',
          'Use automated bots or scripts to access the Service',
          'Attempt to gain unauthorized access to other users\' data or our systems',
          'Upload malicious code, viruses, or any harmful content',
          'Use the AI Advisor to generate financial advice for redistribution or commercial purposes',
        ]} />
      </Section>

      <Section icon={Lock} title="6. Intellectual Property" color="indigo">
        <BulletList items={[
          `The ${APP_NAME} name, logo, design, and source code are the intellectual property of ${APP_NAME}`,
          'You retain ownership of all financial data you enter into the app',
          'You grant us a limited license to process your data solely to provide the Service to you',
          'You may not reproduce, distribute, or create derivative works from the app without written permission',
        ]} />
      </Section>

      <Section icon={AlertTriangle} title="7. Limitation of Liability" color="rose">
        <p>
          To the fullest extent permitted by applicable Indian law:
        </p>
        <BulletList items={[
          `${APP_NAME} is provided "AS IS" without warranties of any kind, express or implied`,
          'We do not guarantee the accuracy, completeness, or timeliness of any financial projections',
          'We are not liable for any financial losses arising from your use of or reliance on this app',
          'Our total liability to you for any claims arising from your use of the Service shall not exceed ₹1,000 (Indian Rupees One Thousand)',
          'We are not liable for any service interruptions, data loss due to technical failures, or third-party service outages (Supabase, Google Cloud)',
        ]} />
      </Section>

      <Section icon={FileText} title="8. Service Availability" color="blue">
        <BulletList items={[
          'We aim to maintain 99% uptime but do not guarantee uninterrupted availability',
          'Scheduled maintenance may cause temporary service interruptions — we will provide notice where possible',
          'We reserve the right to modify, suspend, or discontinue any part of the Service at any time',
          'We are not liable for data loss if you use the Guest mode (local storage only)',
        ]} />
      </Section>

      <Section icon={Database} title="9. Data & Privacy" color="emerald">
        <p>
          Your use of the Service is also governed by our <strong>Privacy Policy</strong>, which is
          incorporated into these Terms by reference. By using the Service, you consent to the
          collection and use of your information as described in the Privacy Policy.
        </p>
      </Section>

      <Section icon={FileText} title="10. Governing Law & Dispute Resolution" color="indigo">
        <BulletList items={[
          'These Terms are governed by the laws of India',
          'Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of India',
          'We encourage you to contact us first to resolve any disputes amicably before seeking legal action',
          `Dispute contact: ${CONTACT_EMAIL}`,
        ]} />
      </Section>

      <Section icon={FileText} title="11. Changes to Terms" color="amber">
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by displaying a notice in the app. Your continued use of the Service after
          notification constitutes acceptance of the updated Terms.
        </p>
        <p className="mt-2 font-medium">Last updated: {LAST_UPDATED}</p>
      </Section>

      <Section icon={Mail} title="12. Contact" color="indigo">
        <p>For questions about these Terms:</p>
        <BulletList items={[
          `Email: ${CONTACT_EMAIL}`,
          `Website: ${APP_URL}`,
        ]} />
      </Section>
    </div>
  );
}

// ─── Main Legal Page Component ────────────────────────────────────────────────
export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('privacy');

  const tabs = [
    { id: 'privacy', label: 'Privacy Policy', icon: Lock },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={28} />
          Legal
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
          Privacy Policy and Terms of Service for {APP_NAME}.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Last Updated Badge */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          <FileText size={12} />
          Last updated: {LAST_UPDATED}
        </span>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Mail size={12} /> Contact
        </a>
      </div>

      {/* Tab Content */}
      <div className="transition-all">
        {activeTab === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
      </div>

      {/* Bottom cross-link */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400 pb-4">
        {activeTab === 'privacy' ? (
          <p>
            Also read our{' '}
            <button
              onClick={() => setActiveTab('terms')}
              className="text-indigo-600 dark:text-indigo-400 underline"
            >
              Terms of Service
            </button>
          </p>
        ) : (
          <p>
            Also read our{' '}
            <button
              onClick={() => setActiveTab('privacy')}
              className="text-indigo-600 dark:text-indigo-400 underline"
            >
              Privacy Policy
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
