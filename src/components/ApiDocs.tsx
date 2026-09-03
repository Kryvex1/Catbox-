import React, { useState } from 'react';
import { 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Loader2, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ApiDocsProps {
  userhash: string;
}

export const ApiDocs: React.FC<ApiDocsProps> = ({ userhash }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Interactive tester state
  const [testEndpoint, setTestEndpoint] = useState<'catbox_file' | 'catbox_url' | 'litterbox_file'>('catbox_file');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [testTime, setTestTime] = useState('24h');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const origin = window.location.origin;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const runApiTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      if (testEndpoint === 'catbox_file') {
        if (!testFile) throw new Error('Please select a file to test');
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', testFile);
        if (userhash) formData.append('userhash', userhash);

        const res = await fetch('/user/api.php', {
          method: 'POST',
          body: formData,
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        setTestResult(text);
      } else if (testEndpoint === 'catbox_url') {
        if (!testUrl) throw new Error('Please enter a URL to mirror');
        const formData = new FormData();
        formData.append('reqtype', 'urlupload');
        formData.append('url', testUrl);
        if (userhash) formData.append('userhash', userhash);

        const res = await fetch('/user/api.php', {
          method: 'POST',
          body: formData,
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        setTestResult(text);
      } else if (testEndpoint === 'litterbox_file') {
        if (!testFile) throw new Error('Please select a file to test');
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('time', testTime);
        formData.append('fileToUpload', testFile);

        const res = await fetch('/resources/internals/api.php', {
          method: 'POST',
          body: formData,
        });
        const text = await res.text();
        if (!res.ok) throw new Error(text);
        setTestResult(text);
      }
    } catch (err: any) {
      setTestError(err.message || 'API request failed');
    } finally {
      setTesting(false);
    }
  };

  const curlCatboxFile = `curl -F "reqtype=fileupload" \\
     -F "userhash=${userhash || 'YOUR_USERHASH'}" \\
     -F "fileToUpload=@/path/to/image.png" \\
     ${origin}/user/api.php`;

  const curlCatboxUrl = `curl -F "reqtype=urlupload" \\
     -F "userhash=${userhash || 'YOUR_USERHASH'}" \\
     -F "url=https://example.com/picture.jpg" \\
     ${origin}/user/api.php`;

  const curlLitterbox = `curl -F "reqtype=fileupload" \\
     -F "time=24h" \\
     -F "fileToUpload=@/path/to/video.mp4" \\
     ${origin}/resources/internals/api.php`;

  const pythonExample = `import requests

# 1. Catbox Permanent File Upload
with open("photo.jpg", "rb") as f:
    resp = requests.post(
        "${origin}/user/api.php",
        data={
            "reqtype": "fileupload",
            "userhash": "${userhash || 'YOUR_USERHASH'}"
        },
        files={"fileToUpload": f}
    )
print("File URL:", resp.text)

# 2. Litterbox Temporary Upload (Expires in 24h)
with open("temp_doc.pdf", "rb") as f:
    resp = requests.post(
        "${origin}/resources/internals/api.php",
        data={
            "reqtype": "fileupload",
            "time": "24h"
        },
        files={"fileToUpload": f}
    )
print("Temporary URL:", resp.text)`;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Official Catbox & Litterbox API Documentation
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              100% compatible with existing scripts, ShareX, Telegram bots, Discord bots, and cURL commands.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Plain-text URL returns
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> No API Rate Limit
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-purple-50 dark:purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            CORS Enabled
          </span>
        </div>
      </div>

      {/* ShareX Integration One-Click Download */}
      <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-200 dark:border-sky-900/60 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              ShareX Custom Uploader (.sxcu)
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-sky-500 text-white">
              Recommended
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xl">
            Download the pre-configured ShareX custom destination file. Double-click to automatically import into ShareX on Windows for instant screenshot uploads!
          </p>
        </div>

        <a
          href={`/api/sharex?userhash=${userhash}`}
          download="Catbox.sxcu"
          className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 shadow-xs transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Catbox.sxcu
        </a>
      </div>

      {/* Interactive API Tester */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-500" />
            Live In-Browser API Tester
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">
            Directly test HTTP POST requests
          </span>
        </div>

        <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <button
            type="button"
            onClick={() => setTestEndpoint('catbox_file')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              testEndpoint === 'catbox_file'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Catbox File Upload
          </button>
          <button
            type="button"
            onClick={() => setTestEndpoint('catbox_url')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              testEndpoint === 'catbox_url'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Catbox URL Upload
          </button>
          <button
            type="button"
            onClick={() => setTestEndpoint('litterbox_file')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              testEndpoint === 'litterbox_file'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Litterbox Temporary
          </button>
        </div>

        <form onSubmit={runApiTest} className="space-y-4">
          {testEndpoint === 'catbox_file' || testEndpoint === 'litterbox_file' ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Test File:
              </label>
              <input
                type="file"
                required
                onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-gray-800 dark:file:text-sky-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL to mirror:
              </label>
              <input
                type="url"
                required
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono"
              />
            </div>
          )}

          {testEndpoint === 'litterbox_file' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Retention duration:
              </label>
              <select
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              >
                <option value="1h">1 Hour</option>
                <option value="12h">12 Hours</option>
                <option value="24h">24 Hours</option>
                <option value="72h">72 Hours</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-gray-500">
              Target: {testEndpoint === 'litterbox_file' ? '/resources/internals/api.php' : '/user/api.php'}
            </span>
            <button
              type="submit"
              disabled={testing}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white flex items-center gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testing ? 'Sending Request...' : 'Send Test Request'}</span>
            </button>
          </div>
        </form>

        {testResult && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              HTTP 200 OK Response (Direct URL):
            </span>
            <div className="flex items-center justify-between gap-2">
              <a
                href={testResult}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-emerald-700 dark:text-emerald-400 underline truncate hover:opacity-80 flex items-center gap-1"
              >
                {testResult}
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => copyText(testResult, 'test_res')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {copiedCode === 'test_res' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {testError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
            Error: {testError}
          </div>
        )}
      </div>

      {/* Catbox Endpoints Reference */}
      <div className="bg-white dark:bg-[#1e2327] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Catbox API Endpoints Reference
        </h3>

        {/* Endpoint 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono">
              POST
            </span>
            <code className="text-xs font-mono text-gray-800 dark:text-gray-200 font-bold">
              /user/api.php
            </code>
            <span className="text-xs text-gray-500">— Catbox Permanent Upload</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
                  <th className="py-2 pr-4 font-semibold">Parameter</th>
                  <th className="py-2 pr-4 font-semibold">Type</th>
                  <th className="py-2 pr-4 font-semibold">Required</th>
                  <th className="py-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
                <tr>
                  <td className="py-2 pr-4 text-sky-600 dark:text-sky-400">reqtype</td>
                  <td className="py-2 pr-4 text-gray-500">string</td>
                  <td className="py-2 pr-4 text-amber-500 font-bold">Yes</td>
                  <td className="py-2 font-sans text-gray-600 dark:text-gray-300">Must be "fileupload" or "urlupload"</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-sky-600 dark:text-sky-400">fileToUpload</td>
                  <td className="py-2 pr-4 text-gray-500">File</td>
                  <td className="py-2 pr-4 text-amber-500 font-bold">For fileupload</td>
                  <td className="py-2 font-sans text-gray-600 dark:text-gray-300">The multipart file binary to store</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-sky-600 dark:text-sky-400">url</td>
                  <td className="py-2 pr-4 text-gray-500">string</td>
                  <td className="py-2 pr-4 text-amber-500 font-bold">For urlupload</td>
                  <td className="py-2 font-sans text-gray-600 dark:text-gray-300">Direct external URL to download and save</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-sky-600 dark:text-sky-400">userhash</td>
                  <td className="py-2 pr-4 text-gray-500">string</td>
                  <td className="py-2 pr-4 text-gray-400">Optional</td>
                  <td className="py-2 font-sans text-gray-600 dark:text-gray-300">Tie upload to your user account</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>cURL Example:</span>
              <button
                type="button"
                onClick={() => copyText(curlCatboxFile, 'curl_cb')}
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                {copiedCode === 'curl_cb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'curl_cb' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
              {curlCatboxFile}
            </pre>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
              POST
            </span>
            <code className="text-xs font-mono text-gray-800 dark:text-gray-200 font-bold">
              /resources/internals/api.php
            </code>
            <span className="text-xs text-gray-500">— Litterbox Ephemeral Storage</span>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>cURL Example:</span>
              <button
                type="button"
                onClick={() => copyText(curlLitterbox, 'curl_lb')}
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                {copiedCode === 'curl_lb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'curl_lb' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
              {curlLitterbox}
            </pre>
          </div>
        </div>

        {/* Python integration */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Python requests Example:</span>
            <button
              type="button"
              onClick={() => copyText(pythonExample, 'py_code')}
              className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              {copiedCode === 'py_code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'py_code' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
            {pythonExample}
          </pre>
        </div>
      </div>
    </div>
  );
};
