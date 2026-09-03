import React, { useState } from 'react';
import { 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface ApiToolsProps {
  userhash: string;
}

export const ApiTools: React.FC<ApiToolsProps> = ({ userhash }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testReqType, setTestReqType] = useState<'fileupload' | 'urlupload'>('urlupload');
  const [testUrl, setTestUrl] = useState('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const baseUrl = window.location.origin;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlFileUpload = `curl -F "reqtype=fileupload" \\
     -F "fileToUpload=@/path/to/picture.png" \\
     ${userhash ? `-F "userhash=${userhash}" \\\n     ` : ''}${baseUrl}/user/api.php`;

  const curlUrlUpload = `curl -F "reqtype=urlupload" \\
     -F "url=https://example.com/image.jpg" \\
     ${userhash ? `-F "userhash=${userhash}" \\\n     ` : ''}${baseUrl}/user/api.php`;

  const curlLitterbox = `curl -F "reqtype=fileupload" \\
     -F "time=24h" \\
     -F "fileToUpload=@/path/to/large_video.mp4" \\
     ${baseUrl}/resources/internals/api.php`;

  const pythonExample = `import requests

url = "${baseUrl}/user/api.php"
payload = {
    "reqtype": "fileupload",
    "userhash": "${userhash || 'YOUR_USERHASH'}"
}
files = [
    ('fileToUpload', ('my_photo.png', open('my_photo.png', 'rb'), 'image/png'))
]

response = requests.post(url, data=payload, files=files)
print("Uploaded direct link:", response.text)`;

  const handleTestApi = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      const formData = new FormData();
      formData.append('reqtype', testReqType);
      formData.append('url', testUrl);
      if (userhash) formData.append('userhash', userhash);

      const res = await fetch('/user/api.php', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      setTestResponse(text);
    } catch (err: any) {
      setTestResponse(`Error: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              API & Automation Tools
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              100% compatible with official Catbox.moe endpoints & ShareX custom uploaders
            </p>
          </div>
        </div>

        {/* ShareX Download button */}
        <a
          href={`/api/sharex?userhash=${encodeURIComponent(userhash)}`}
          download="Catbox.sxcu"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download ShareX (.sxcu)</span>
        </a>
      </div>

      {/* Interactive API Tester */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Live API Endpoint Tester (/user/api.php)
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            POST /user/api.php
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Direct URL to test..."
            className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={handleTestApi}
            disabled={testLoading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testLoading ? 'Calling...' : 'Send Request'}</span>
          </button>
        </div>

        {testResponse && (
          <div className="p-3 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs border border-gray-700 flex items-center justify-between">
            <span className="truncate pr-2">{testResponse}</span>
            <button
              onClick={() => copyCode(testResponse, 'test-res')}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 flex-shrink-0"
            >
              {copiedSection === 'test-res' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'test-res' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Code Snippets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Catbox File Upload */}
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-sky-500" />
              Catbox Permanent (cURL)
            </h4>
            <button
              onClick={() => copyCode(curlFileUpload, 'curl-file')}
              className="text-xs text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
            >
              {copiedSection === 'curl-file' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'curl-file' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {curlFileUpload}
          </pre>
        </div>

        {/* Catbox URL Upload */}
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" />
              URL Mirror Upload (cURL)
            </h4>
            <button
              onClick={() => copyCode(curlUrlUpload, 'curl-url')}
              className="text-xs text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
            >
              {copiedSection === 'curl-url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'curl-url' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {curlUrlUpload}
          </pre>
        </div>

        {/* Litterbox Temporary Upload */}
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-500" />
              Litterbox Ephemeral (cURL)
            </h4>
            <button
              onClick={() => copyCode(curlLitterbox, 'curl-litter')}
              className="text-xs text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
            >
              {copiedSection === 'curl-litter' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'curl-litter' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {curlLitterbox}
          </pre>
        </div>

        {/* Python Requests Example */}
        <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-500" />
              Python (requests)
            </h4>
            <button
              onClick={() => copyCode(pythonExample, 'py-ex')}
              className="text-xs text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
            >
              {copiedSection === 'py-ex' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSection === 'py-ex' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {pythonExample}
          </pre>
        </div>
      </div>
    </div>
  );
};
