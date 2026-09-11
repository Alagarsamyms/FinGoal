import React, { useState, useEffect } from 'react';
import { X, Flame, Target, Database, Bot } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

const translations = {
  en: {
    title: "Welcome to Wealth For FIRE",
    subtitle: "Your path to Financial Independence",
    sections: [
      {
        icon: Flame,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/20",
        title: "What is FIRE?",
        body: "Financial Independence, Retire Early. The goal is to accumulate 25x your annual expenses. Once you hit this FI Number, your money works for you—you work by choice, not necessity."
      },
      {
        icon: Target,
        color: "text-emerald-500",
        bg: "bg-emerald-100 dark:bg-emerald-500/20",
        title: "Your Net Worth",
        body: "Calculated simply as: Total Assets minus Total Debt. This is your true wealth score. We track this constantly to measure your real progress toward FIRE."
      },
      {
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-500/20",
        title: "Why Your Data Matters",
        body: "The FIRE Engine relies on accurate Income, Expenses, Assets, and Loans. If you don't update them, the engine cannot calculate your exact retirement age. Update your numbers regularly!"
      },
      {
        icon: Bot,
        color: "text-indigo-500",
        bg: "bg-indigo-100 dark:bg-indigo-500/20",
        title: "AI Advisor",
        body: "Your personalized financial assistant. It reads your current net worth and gives tailored advice to speed up your FIRE journey. Ask it anything!"
      }
    ],
    button: "Let's Go!"
  },
  ta: {
    title: "Wealth For FIRE-க்கு வரவேற்கிறோம்",
    subtitle: "உங்கள் நிதிச் சுதந்திரத்திற்கான பாதை",
    sections: [
      {
        icon: Flame,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/20",
        title: "FIRE என்றால் என்ன?",
        body: "நிதி சுதந்திரம், முன்கூட்டியே ஓய்வு. உங்களின் ஆண்டு செலவில் 25 மடங்கை சேமிப்பதே குறிக்கோள். இந்த FI எண்ணை அடைந்தவுடன், நீங்கள் கட்டாயத்திற்காக வேலை செய்ய வேண்டியதில்லை."
      },
      {
        icon: Target,
        color: "text-emerald-500",
        bg: "bg-emerald-100 dark:bg-emerald-500/20",
        title: "உங்கள் நிகர மதிப்பு",
        body: "மொத்த சொத்துக்கள் கழித்தல் மொத்த கடன்கள். இதுவே உங்கள் உண்மையான சொத்து. FIRE இலக்கை நோக்கி நீங்கள் அடைந்துள்ள முன்னேற்றத்தை அளவிட இதை நாங்கள் தொடர்ந்து கண்காணிக்கிறோம்."
      },
      {
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-500/20",
        title: "உங்கள் தரவின் முக்கியத்துவம்",
        body: "துல்லியமான வருமானம், செலவுகள், சொத்துக்கள் மற்றும் கடன்களை FIRE என்ஜின் நம்பியுள்ளது. இவற்றை நீங்கள் புதுப்பிக்கவில்லை என்றால், உங்கள் ஓய்வு பெறும் வயதை சரியாக கணக்கிட முடியாது. எனவே உங்கள் தரவுகளை தவறாமல் புதுப்பிக்கவும்!"
      },
      {
        icon: Bot,
        color: "text-indigo-500",
        bg: "bg-indigo-100 dark:bg-indigo-500/20",
        title: "AI வழிகாட்டி",
        body: "உங்களுக்கான தனிப்பட்ட நிதி உதவியாளர். இது உங்கள் நிகர மதிப்பை ஆராய்ந்து, உங்கள் FIRE பயணத்தை விரைவுபடுத்த தகுந்த ஆலோசனைகளை வழங்கும். நீங்கள் என்ன வேண்டுமானாலும் கேட்கலாம்!"
      }
    ],
    button: "தொடங்கலாம்!"
  },
  hi: {
    title: "Wealth For FIRE में आपका स्वागत है",
    subtitle: "वित्तीय स्वतंत्रता की ओर आपका मार्ग",
    sections: [
      {
        icon: Flame,
        color: "text-amber-500",
        bg: "bg-amber-100 dark:bg-amber-500/20",
        title: "FIRE क्या है?",
        body: "वित्तीय स्वतंत्रता, शीघ्र सेवानिवृत्ति (Financial Independence, Retire Early)। इसका लक्ष्य आपके वार्षिक खर्चों का 25 गुना जमा करना है। इस FI नंबर को प्राप्त करने के बाद, आप अपनी इच्छा से काम करेंगे, मजबूरी से नहीं।"
      },
      {
        icon: Target,
        color: "text-emerald-500",
        bg: "bg-emerald-100 dark:bg-emerald-500/20",
        title: "आपकी कुल संपत्ति (Net Worth)",
        body: "कुल संपत्ति माइनस कुल ऋण। यही आपकी वास्तविक संपत्ति का स्कोर है। FIRE की दिशा में आपकी वास्तविक प्रगति मापने के लिए हम इसे लगातार ट्रैक करते हैं।"
      },
      {
        icon: Database,
        color: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-500/20",
        title: "आपका डेटा क्यों मायने रखता है",
        body: "FIRE इंजन सटीक आय, व्यय, संपत्ति और ऋण पर निर्भर करता है। यदि आप इन्हें अपडेट नहीं करते हैं, तो इंजन आपके सटीक सेवानिवृत्ति (Retirement) की उम्र की गणना नहीं कर सकता। अपनी जानकारी नियमित रूप से अपडेट करें!"
      },
      {
        icon: Bot,
        color: "text-indigo-500",
        bg: "bg-indigo-100 dark:bg-indigo-500/20",
        title: "AI सलाहकार",
        body: "आपका व्यक्तिगत वित्तीय सहायक। यह आपकी वर्तमान संपत्ति को पढ़कर आपकी FIRE यात्रा को तेज़ करने के लिए अनुकूल सलाह देता है। आप इससे कुछ भी पूछ सकते हैं!"
      }
    ],
    button: "शुरू करें!"
  }
};

export default function FireEducationModal({ isOpen, onClose }) {
  const [lang, setLang] = useState('en');
  const [show, setShow] = useState(false);
  const { state } = useAppState();
  const isDark = state?.settings?.theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setShow(false), 300);
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const content = translations[lang];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
        
        {/* Header */}
        <div className="flex-none p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex-1 pr-2">
            <h2 className={`font-extrabold text-slate-900 dark:text-white tracking-tight ${lang === 'en' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
              {content.title}
            </h2>
            <p className={`font-medium text-slate-500 dark:text-slate-400 mt-1 ${lang === 'en' ? 'text-sm' : 'text-[13px] sm:text-sm'}`}>
              {content.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {['en', 'ta', 'hi'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${lang === l ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिंदी'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-8">
          {content.sections.map((section, idx) => (
            <div key={idx} className="flex gap-4 sm:gap-6 group">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${section.bg} ${section.color} transform transition-transform group-hover:scale-110 shadow-sm`}>
                  <section.icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 className={`font-bold text-slate-900 dark:text-white mb-2 leading-tight ${lang === 'en' ? 'text-base sm:text-lg' : 'text-[15px] sm:text-base'}`}>
                  {section.title}
                </h3>
                <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${lang === 'en' ? 'text-sm' : 'text-[13px] sm:text-sm'}`}>
                  {section.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-none p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all transform hover:-translate-y-0.5"
          >
            {content.button}
          </button>
        </div>
      </div>
    </div>
  );
}
