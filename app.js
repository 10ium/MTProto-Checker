const express = require('express');
const bodyParser = require('body-parser');
const open = require('open');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');

const app = express();
const PORT = 3000;

const API_ID = 6;
const API_HASH = 'eb06d4abfb49dc3eeb1aeb98ae0f581e';

app.use(bodyParser.json({ limit: '50mb' }));

const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTProto Ultimate Checker</title>
    <style>
        :root {
            --bg: #0f172a;
            --card: #1e293b;
            --input: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --accent: #3b82f6;
            --accent-hover: #2563eb;
            --success: #10b981;
            --error: #ef4444;
            --font-fa: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            --font-en: 'Inter', system-ui, -apple-system, sans-serif;
        }

        body {
            font-family: var(--font-fa);
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
            transition: all 0.3s ease;
        }

        html[dir="ltr"] body { font-family: var(--font-en); }
        html[dir="ltr"] .debug-console { text-align: left; }
        
        .container {
            width: 100%;
            max-width: 1100px;
            background-color: var(--card);
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            gap: 20px;
            position: relative;
        }

        .header-controls {
            position: absolute;
            top: 25px;
            left: 25px;
            z-index: 10;
        }
        html[dir="ltr"] .header-controls {
            left: auto;
            right: 25px;
        }

        /* --- اصلاح استایل منوی زبان --- */
        select.lang-select {
            background-color: var(--input);
            color: var(--text);
            border: 1px solid #475569;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            outline: none;
            font-family: inherit;
            transition: 0.2s;
            appearance: none;
            -webkit-appearance: none;
            
            /* تنظیمات پیش‌فرض (فارسی - RTL) */
            /* فلش در سمت چپ قرار می‌گیرد */
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-size: 10px;
            
            background-position: left 10px center;
            padding-left: 30px; /* جای خالی برای فلش سمت چپ */
            padding-right: 12px;
        }

        /* تنظیمات انگلیسی (LTR) */
        html[dir="ltr"] select.lang-select {
            /* فلش در سمت راست قرار می‌گیرد */
            background-position: right 10px center;
            padding-right: 30px; /* جای خالی برای فلش سمت راست */
            padding-left: 12px;
        }

        select.lang-select:hover {
            border-color: var(--accent);
            background-color: #3f4a5e;
        }

        h1 { text-align: center; color: var(--accent); margin: 0; margin-top: 5px; }
        p.sub { text-align: center; color: var(--muted); margin: 5px 0 20px 0; font-size: 14px; }

        .progress-box { background: var(--input); height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), #60a5fa); transition: width 0.3s ease; }
        .status-text { text-align: center; font-size: 13px; color: var(--muted); margin-top: 5px; direction: ltr; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media(max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        @media(max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }

        label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; }
        .settings-grid label { margin-bottom: 6px; }
        .settings-grid input {
            width: 100%;
            box-sizing: border-box;
            background-color: var(--input);
            color: #e2e8f0;
            border: 1px solid #475569;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13px;
            outline: none;
        }
        .settings-grid input:focus { border-color: var(--accent); }
        
        textarea {
            width: 100%; height: 350px; background-color: var(--input); color: #e2e8f0;
            border: 1px solid #475569; border-radius: 10px; padding: 15px;
            font-family: monospace; font-size: 11px; resize: vertical; outline: none;
            line-height: 1.5; box-sizing: border-box;
        }
        textarea:focus { border-color: var(--accent); }

        button {
            width: 100%; padding: 14px; margin-top: 10px; border: none; border-radius: 10px;
            font-weight: bold; font-size: 15px; cursor: pointer; transition: 0.2s; color: white; font-family: inherit;
        }

        .btn-start { background-color: var(--accent); }
        .btn-start:hover { background-color: var(--accent-hover); }
        .btn-start:disabled { background-color: #475569; cursor: not-allowed; opacity: 0.7; }

        .btn-copy { background-color: var(--success); }
        .btn-copy:hover { background-color: #059669; }

        .debug-console {
            background: black; color: #00ff00; font-family: monospace; font-size: 11px;
            padding: 10px; height: 80px; overflow-y: auto; border-radius: 8px;
            border: 1px solid #333; direction: ltr; text-align: left; margin-top: 10px;
        }
        .error-log { color: #ff5555; }

        .toast {
            visibility: hidden; min-width: 250px; background-color: #333; color: #fff;
            text-align: center; border-radius: 8px; padding: 12px; position: fixed;
            z-index: 99; left: 50%; bottom: 30px; transform: translateX(-50%);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); opacity: 0; transition: opacity 0.3s, bottom 0.3s;
        }
        .toast.show { visibility: visible; opacity: 1; bottom: 50px; }
    </style>
</head>
<body>

<div class="container">
    <div class="header-controls">
        <select id="langSelect" class="lang-select" onchange="changeLanguage(this.value)">
            <option value="fa">🇮🇷 فارسی</option>
            <option value="en">🇺🇸 English</option>
        </select>
    </div>

    <div>
        <h1 data-i18n="title">MTProto Pro Checker</h1>
        <p class="sub" data-i18n="subtitle">تست اتصال</p>
        
        <div class="progress-box"><div class="progress-bar" id="progressBar"></div></div>
        <div class="status-text" id="statusText" data-i18n="ready">آماده...</div>
    </div>

    <div class="grid">
        <div>
            <label data-i18n="inputLabel">📥 لیست ورودی</label>
            <div class="settings-grid">
                <div>
                    <label for="timeoutSeconds" data-i18n="timeoutLabel">⏱️ تاخیر هر پروکسی (ثانیه)</label>
                    <input id="timeoutSeconds" type="number" value="10">
                </div>
                <div>
                    <label for="concurrency" data-i18n="concurrencyLabel">⚙️ تعداد بررسی همزمان</label>
                    <input id="concurrency" type="number" value="10">
                </div>
            </div>
            <textarea id="inputProxies" placeholder="..."></textarea>
            <button class="btn-start" id="startBtn" onclick="startCheck()" data-i18n="startBtn">شروع بررسی</button>
        </div>
        <div>
            <label data-i18n="outputLabel">🚀 لیست سالم</label>
            <textarea id="outputProxies" readonly placeholder="..."></textarea>
            <button class="btn-copy" onclick="copyResults()" data-i18n="copyBtn">کپی لیست سالم</button>
        </div>
    </div>

    <div class="debug-console" id="console">
        > System Ready.
    </div>
</div>

<div id="toast" class="toast"></div>

<script>
    const translations = {
        fa: {
            title: "MTProto Pro Checker",
            subtitle: "تست اتصال",
            ready: "آماده برای شروع...",
            inputLabel: "📥 لیست ورودی (کثیف و نامرتب)",
            inputPlaceholder: "لینک‌های پروکسی را اینجا وارد کنید (هر خط یک لینک)...",
            startBtn: "شروع بررسی",
            outputLabel: "🚀 لیست ۱۰۰٪ سالم",
            outputPlaceholder: "نتایج سالم اینجا نمایش داده می‌شوند...",
            timeoutLabel: "⏱️ تاخیر هر پروکسی (ثانیه)",
            concurrencyLabel: "⚙️ تعداد بررسی همزمان",
            copyBtn: "کپی کردن لیست سالم",
            processing: "در حال پردازش...",
            status: "وضعیت: {c} / {t} | سالم: {w}",
            toastCopied: "✅ کپی شد!",
            toastEmpty: "⚠️ لیست خالی است!",
            toastNoValid: "⛔ هیچ لینک معتبری یافت نشد!",
            toastNoWorking: "😔 هیچ پروکسی سالمی پیدا نشد.",
            toastFound: "🎉 {n} پروکسی سالم پیدا شد!",
            errorGeneric: "خطایی رخ داد. کنسول را چک کنید."
        },
        en: {
            title: "MTProto Pro Checker",
            subtitle: "Real connection test",
            ready: "Ready to start...",
            inputLabel: "📥 Input List (Mixed/Dirty)",
            inputPlaceholder: "Paste proxy links here (one per line)...",
            startBtn: "Start Check",
            outputLabel: "🚀 Working Proxies (100%)",
            outputPlaceholder: "Working proxies will appear here...",
            timeoutLabel: "⏱️ Per-proxy timeout (seconds)",
            concurrencyLabel: "⚙️ Concurrent checks",
            copyBtn: "Copy Working List",
            processing: "Processing...",
            status: "Status: {c} / {t} | Working: {w}",
            toastCopied: "✅ Copied to clipboard!",
            toastEmpty: "⚠️ List is empty!",
            toastNoValid: "⛔ No valid links found!",
            toastNoWorking: "😔 No working proxies found.",
            toastFound: "🎉 Found {n} working proxies!",
            errorGeneric: "An error occurred. Check console."
        }
    };

    let currentLang = localStorage.getItem('lang') || 'fa';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        
        document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.getElementById('langSelect').value = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) el.innerText = translations[lang][key];
        });

        document.getElementById('inputProxies').placeholder = translations[lang].inputPlaceholder;
        document.getElementById('outputProxies').placeholder = translations[lang].outputPlaceholder;
    }

    function changeLanguage(lang) {
        setLanguage(lang);
    }

    setLanguage(currentLang);

    // ==========================================
    // منطق اصلی
    // ==========================================
    function log(msg, isError = false) {
        const c = document.getElementById('console');
        const line = document.createElement('div');
        line.innerText = \`[\${new Date().toLocaleTimeString()}] \${msg}\`;
        if (isError) line.className = 'error-log';
        c.appendChild(line);
        c.scrollTop = c.scrollHeight;
    }

    window.onerror = function(message) {
        log(\`CRITICAL ERROR: \${message}\`, true);
    };

    let workingProxies = [];
    let skippedCount = 0;

    function parseLink(link) {
        try {
            let cleanLink = link.trim().replace('.&', '&');
            if(!cleanLink.includes('://')) return null;

            const urlObj = new URL(cleanLink);
            const params = new URLSearchParams(urlObj.search);
            
            const server = params.get('server');
            let port = parseInt(params.get('port'));
            const secret = params.get('secret');

            if (!server || !port || !secret || isNaN(port)) return null;
            if (port <= 0 || port > 65535) return null;

            if (secret.length > 170 || secret.includes('AAAAAAAAAAAAAAAAAAAA')) {
                skippedCount++;
                return null;
            }

            return { server, port, secret, original: cleanLink };
        } catch (e) { return null; }
    }

    async function startCheck() {
        try {
            const t = translations[currentLang];
            const input = document.getElementById('inputProxies').value;
            
            if (!input) return showToast(t.toastEmpty, true);

            const lines = input.split('\\n');
            skippedCount = 0;
            const validLinks = lines.map(parseLink).filter(l => l !== null);
            const timeoutSeconds = Number(document.getElementById('timeoutSeconds').value) > 0
                ? Number(document.getElementById('timeoutSeconds').value)
                : 10;
            const concurrency = Number(document.getElementById('concurrency').value) > 0
                ? Number(document.getElementById('concurrency').value)
                : 10;

            if (validLinks.length === 0) {
                showToast(t.toastNoValid, true);
                log('Error: No valid links parsed', true);
                return;
            }

            log(\`Parsed \${validLinks.length} valid links. Skipped \${skippedCount} bad links.\`);

            workingProxies = [];
            document.getElementById('outputProxies').value = '';
            
            const startBtn = document.getElementById('startBtn');
            startBtn.disabled = true;
            startBtn.innerText = t.processing;

            let completed = 0;
            const total = validLinks.length;

            const checkOne = async (proxyData) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

                    const response = await fetch('/check', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ ...proxyData, timeoutMs: timeoutSeconds * 1000 }),
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) throw new Error('Server error');
                    const result = await response.json();

                    if (result.ok) {
                        workingProxies.push({ link: proxyData.original, ping: result.ping });
                        updateOutput();
                        log(\`SUCCESS: \${proxyData.server} (\${result.ping}ms)\`);
                    }
                } catch (err) {
                    // Ignore
                } finally {
                    completed++;
                    updateUI(completed, total);
                    if (completed === total) finish();
                }
            };

            const batchSize = concurrency;
            for (let i = 0; i < validLinks.length; i += batchSize) {
                const batch = validLinks.slice(i, i + batchSize);
                await Promise.all(batch.map(p => checkOne(p)));
            }
        } catch (e) {
            log(\`MAIN ERROR: \${e.message}\`, true);
            alert(translations[currentLang].errorGeneric);
            document.getElementById('startBtn').disabled = false;
        }
    }

    function updateUI(c, t) {
        const percent = (c / t) * 100;
        document.getElementById('progressBar').style.width = percent + '%';
        let statusText = translations[currentLang].status
            .replace('{c}', c)
            .replace('{t}', t)
            .replace('{w}', workingProxies.length);
        document.getElementById('statusText').innerText = statusText;
    }

    function updateOutput() {
        workingProxies.sort((a, b) => a.ping - b.ping);
        const text = workingProxies
            .map(p => \`\${p.link} # Ping: \${p.ping}ms\`)
            .join('\\n\\n'); 
        document.getElementById('outputProxies').value = text;
    }

    function finish() {
        const t = translations[currentLang];
        const startBtn = document.getElementById('startBtn');
        startBtn.disabled = false;
        startBtn.innerText = t.startBtn;
        log('Process finished.');
        
        if (workingProxies.length > 0) {
            showToast(t.toastFound.replace('{n}', workingProxies.length));
        } else {
            showToast(t.toastNoWorking, true);
        }
    }

    function copyResults() {
        const t = translations[currentLang];
        const text = document.getElementById("outputProxies").value;
        if (!text) return showToast(t.toastEmpty, true);

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(t.toastCopied);
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const t = translations[currentLang];
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(t.toastCopied);
        } catch (err) {
            showToast('Error!', true);
        }
        document.body.removeChild(textArea);
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById("toast");
        toast.innerText = message;
        toast.style.backgroundColor = isError ? "#ef4444" : "#10b981";
        toast.className = "toast show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }
</script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/check', async (req, res) => {
    const { server, port, secret, timeoutMs } = req.body;
    const TIMEOUT = Number(timeoutMs) > 0 ? Number(timeoutMs) : 10000;

    const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
        connectionRetries: 1,
        useWSS: false,
        proxy: {
            ip: server,
            port: port,
            secret: secret,
            MTProxy: true,
            socksType: 5,
            timeout: Math.max(1, Math.round(TIMEOUT / 1000))
        }
    });

    client.setLogLevel("none");

    const checkPromise = new Promise(async (resolve, reject) => {
        const start = Date.now();
        try {
            await client.connect();
            await client.invoke(new Api.help.GetConfig());
            const ping = Date.now() - start;
            await client.disconnect();
            resolve(ping);
        } catch (err) {
            try { await client.destroy(); } catch (e) { }
            reject(err);
        }
    });

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT)
    );

    try {
        const ping = await Promise.race([checkPromise, timeoutPromise]);
        res.json({ ok: true, ping: ping });
    } catch (error) {
        res.json({ ok: false });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    try { await open(`http://localhost:${PORT}`); } catch (e) { }
});
