import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, ShieldAlert, Heart, Info } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the difference between Catbox and Litterbox?',
      a: 'Catbox is for permanent file hosting—files remain available indefinitely as long as they comply with our Terms of Service. Litterbox is for temporary, disposable file sharing with automatic expiration intervals (1 hour, 12 hours, 24 hours, or 72 hours), supporting much larger individual file sizes up to 1GB.',
    },
    {
      q: 'What are the file size limits?',
      a: 'Catbox has a 200MB per file limit for standard uploads. Litterbox allows larger temporary files up to 1GB per upload. For users uploading massive datasets, videos, or archives, Litterbox is ideal.',
    },
    {
      q: 'What file formats are allowed or banned?',
      a: 'Nearly all general media, audio, images, documents, archives, and videos are accepted. Executables (.exe, .scr, .cpl, .vbs, malware, or phishing kits) and illegal content are strictly banned and purged immediately.',
    },
    {
      q: 'Do files ever expire on Catbox?',
      a: 'No! Catbox files are kept permanently unless requested to be deleted by the uploader (via userhash), or found in violation of our content rules.',
    },
    {
      q: 'How does the userhash work?',
      a: 'A userhash acts as your secret authentication token. If you provide your userhash when uploading via web or API, that file is linked to your account, allowing you to view and delete it at any time in the My Files manager.',
    },
    {
      q: 'Can I use Catbox with ShareX or other screenshot utilities?',
      a: 'Yes! Catbox is natively supported in ShareX. You can download the custom .sxcu uploader directly from our API Documentation tab or configure it manually using the /user/api.php endpoint.',
    },
  ];

  const toggle = (i: number) => {
    setOpenIdx(openIdx === i ? null : i);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions & Guidelines
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Clear rules, limits, and answers for Catbox and Litterbox
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed pl-2 border-l-2 border-sky-500">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
          <h3 className="font-bold">Content & Terms of Service</h3>
          <p className="opacity-90 leading-relaxed">
            Catbox is an unrestricted, public-serving image and media host. Do not upload malicious payloads, malware, spam campaigns, copyrighted material you do not have rights to distribute, or illegal content. Violating files will be permanently purged and IP addresses reported.
          </p>
        </div>
      </div>
    </div>
  );
};
