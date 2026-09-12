const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const net = require('net');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');

const app = express();
const PORT = process.env.PORT || 3000;

const API_ID = 6;
const API_HASH = 'eb06d4abfb49dc3eeb1aeb98ae0f581e';

// آی‌پی سرور دیتاسنتر اصلی تلگرام جهت اعتبارسنجی اتصال SOCKS5
const TELEGRAM_DC2_IP = '91.108.56.111';
const TELEGRAM_DC2_PORT = 443;

// افزایش سقف حجم بادی درخواست‌ها
app.use(bodyParser.json({ limit: '50mb' }));

// منابع پیش‌فرض اشتراک پروکسی (۱۰ منبع معتبر و تست‌شده)
const DEFAULT_SUBSCRIPTIONS = [
    { name: '10Dream Collector', url: 'https://raw.githubusercontent.com/10Dream/VpnClashFaCollector/refs/heads/main/sub/all/tg.txt', enabled: true },
    { name: '10ium Collector (1000+ Proxies)', url: 'https://raw.githubusercontent.com/10ium/VpnClashFaCollector/refs/heads/main/sub/all/tg.txt', enabled: true },
    { name: 'Argh94 List', url: 'https://raw.githubusercontent.com/Argh94/Proxy-List/refs/heads/main/MTProto.txt', enabled: true },
    { name: 'Surfboard TGProto', url: 'https://raw.githubusercontent.com/Surfboardv2ray/TGProto/refs/heads/main/proxies-tested.txt', enabled: true },
    { name: 'SoliSpirit Master', url: 'https://raw.githubusercontent.com/SoliSpirit/mtproto/refs/heads/master/all_proxies.txt', enabled: true },
    { name: 'Therealwh Verified', url: 'https://raw.githubusercontent.com/Therealwh/MTPproxyLIST/refs/heads/main/verified/proxy_all_tme_verified.txt', enabled: true },
    { name: 'MustafaBaqer VestraNet', url: 'https://raw.githubusercontent.com/MustafaBaqer/VestraNet-Nodes/refs/heads/main/protocols/mtproto.txt', enabled: true },
    { name: 'kort0881 Proxy All', url: 'https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/main/proxy_all.txt', enabled: true },
    { name: 'kort0881 SOCKS5 List', url: 'https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/main/socks5.txt', enabled: true },
    { name: 'kort0881 Proxy List (700+)', url: 'https://raw.githubusercontent.com/kort0881/telegram-proxy-collector/refs/heads/main/proxy_list.txt', enabled: true }
];

// باز کردن URL در سیستم‌عامل (ویندوز، مک، لینوکس)
function openSystemUrl(url) {
    const command = process.platform === 'win32'
        ? `start "" "${url}"`
        : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;
    exec(command, (err) => {
        if (err) console.log('Could not open system URL:', err.message);
    });
}

// پیش‌چک سریع پورت TCP جهت رد کردن فوری پروکسی‌های قطع‌شده
function quickTcpCheck(host, port, timeoutMs = 1500) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let finished = false;

        const done = (isReachable) => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                try { socket.destroy(); } catch (e) {}
                resolve(isReachable);
            }
        };

        const timer = setTimeout(() => done(false), timeoutMs);

        socket.on('connect', () => done(true));
        socket.on('error', () => done(false));

        try {
            socket.connect(port, host);
        } catch (e) {
            done(false);
        }
    });
}

// تست بومی و کامل اتصال پروکسی SOCKS5 به سرور هسته مرکزی تلگرام
function checkSocks5Proxy(host, port, user, pass, timeoutMs = 8000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        let finished = false;

        const done = (ping) => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                try { socket.destroy(); } catch (e) {}
                resolve(ping);
            }
        };

        const timer = setTimeout(() => done(-1), timeoutMs);

        socket.on('error', () => done(-1));
        socket.on('timeout', () => done(-1));

        socket.connect(port, host, () => {
            // ۱. ارسال سیگنال اولیه SOCKS5
            const hasAuth = user && user.length > 0;
            if (hasAuth) {
                socket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]));
            } else {
                socket.write(Buffer.from([0x05, 0x01, 0x00]));
            }
        });

        let stage = 'greeting';
        let buffer = Buffer.alloc(0);

        socket.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);

            if (stage === 'greeting') {
                if (buffer.length < 2) return;
                if (buffer[0] !== 0x05) return done(-1);

                const method = buffer[1];
                buffer = buffer.slice(2);

                if (method === 0x02) { // نیازمند احراز هویت User/Pass
                    const uBytes = Buffer.from(user || '', 'utf-8');
                    const pBytes = Buffer.from(pass || '', 'utf-8');
                    const authReq = Buffer.concat([
                        Buffer.from([0x01, uBytes.length]),
                        uBytes,
                        Buffer.from([pBytes.length]),
                        pBytes
                    ]);
                    stage = 'auth';
                    socket.write(authReq);
                } else if (method === 0x00) { // بدون نیاز به پسورد
                    sendTelegramConnect();
                } else {
                    return done(-1);
                }
            } else if (stage === 'auth') {
                if (buffer.length < 2) return;
                if (buffer[1] !== 0x00) return done(-1); // احراز هویت ناموفق
                buffer = buffer.slice(2);
                sendTelegramConnect();
            } else if (stage === 'connect') {
                if (buffer.length < 4) return;
                if (buffer[0] !== 0x05 || buffer[1] !== 0x00) return done(-1); // اتصال تونل برقرار نشد

                // موفقیت: تونل امن SOCKS5 به سرور اصلی تلگرام متصل شد!
                const ping = Date.now() - start;
                done(ping);
            }
        });

        function sendTelegramConnect() {
            stage = 'connect';
            // ارسال دستور CONNECT به سرور دیتاسنتر ۲ تلگرام (91.108.56.111:443)
            const ipParts = TELEGRAM_DC2_IP.split('.').map(x => parseInt(x));
            const conn = Buffer.from([
                0x05, 0x01, 0x00, 0x01,
                ipParts[0], ipParts[1], ipParts[2], ipParts[3],
                (TELEGRAM_DC2_PORT >> 8) & 0xff,
                TELEGRAM_DC2_PORT & 0xff
            ]);
            socket.write(conn);
        }
    });
}

// تست بومی و کامل اتصال پروکسی HTTP/HTTPS به سرور هسته مرکزی تلگرام (HTTP CONNECT)
function checkHttpProxy(host, port, user, pass, timeoutMs = 8000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        let finished = false;

        const done = (ping) => {
            if (!finished) {
                finished = true;
                clearTimeout(timer);
                try { socket.destroy(); } catch (e) {}
                resolve(ping);
            }
        };

        const timer = setTimeout(() => done(-1), timeoutMs);

        socket.on('error', () => done(-1));
        socket.on('timeout', () => done(-1));

        socket.connect(port, host, () => {
            let req = `CONNECT ${TELEGRAM_DC2_IP}:${TELEGRAM_DC2_PORT} HTTP/1.1\r\n` +
                      `Host: ${TELEGRAM_DC2_IP}:${TELEGRAM_DC2_PORT}\r\n` +
                      `Proxy-Connection: Keep-Alive\r\n`;
            if (user) {
                const creds = Buffer.from(`${user}:${pass || ''}`).toString('base64');
                req += `Proxy-Authorization: Basic ${creds}\r\n`;
            }
            req += '\r\n';
            socket.write(req);
        });

        let responseText = '';
        socket.on('data', (chunk) => {
            responseText += chunk.toString('utf-8');
            if (responseText.includes('\r\n\r\n') || responseText.includes('\n\n')) {
                const statusLine = responseText.split('\n')[0];
                if (statusLine.includes(' 200 ') || statusLine.includes(' 200')) {
                    const ping = Date.now() - start;
                    done(ping);
                } else {
                    done(-1);
                }
            }
        });
    });
}

function cleanSecretString(str) {
    if (!str) return '';
    let s = str.split('#')[0].split('?')[0].split('&')[0].trim();
    const badChars = ' )!@#$%^&*()_+~[]{}|;:\',.<>?/\t\r\n\x60';
    let len = s.length;
    while (len > 0 && badChars.indexOf(s[len - 1]) !== -1) {
        len--;
    }
    return s.substring(0, len);
}

// استخراج و پارس لینک پروکسی (پشتیبانی جامع از هر ۴ نوع پروکسی تلگرام)
function parseProxyString(rawLink) {
    try {
        let clean = rawLink.trim().replace('.&', '&');
        if (!clean.includes('://')) return null;

        const isWebProxy = clean.includes('/webproxy') || clean.startsWith('tg://webproxy');
        const isStandardProxy = clean.includes('/proxy') || clean.startsWith('tg://proxy');
        const isSocks = clean.includes('/socks') || clean.startsWith('tg://socks') || clean.startsWith('socks5://') || clean.startsWith('socks://');
        const isHttp = clean.includes('/http') || clean.startsWith('tg://http') || (clean.startsWith('http') && clean.includes('@'));

        if (!isWebProxy && !isStandardProxy && !isSocks && !isHttp) return null;

        // نوع ۳: پروکسی HTTP (HTTP CONNECT Tunnel)
        if (isHttp) {
            let server, port, user = null, pass = null;
            if (clean.startsWith('tg://http') || clean.includes('t.me/http')) {
                const urlObj = new URL(clean.replace('https://t.me/http', 'tg://http').replace('http://t.me/http', 'tg://http'));
                const params = new URLSearchParams(urlObj.search);
                server = params.get('server');
                port = parseInt(params.get('port')) || 8080;
                user = params.get('user') || null;
                pass = params.get('pass') || null;
            } else {
                try {
                    const urlObj = new URL(clean);
                    server = urlObj.hostname;
                    port = parseInt(urlObj.port) || 8080;
                    user = urlObj.username || null;
                    pass = urlObj.password || null;
                } catch (e) {
                    return null;
                }
            }

            if (!server || port <= 0 || port > 65535) return null;

            let canonicalUrl = `tg://http?server=${server}&port=${port}`;
            if (user) canonicalUrl += `&user=${encodeURIComponent(user)}`;
            if (pass) canonicalUrl += `&pass=${encodeURIComponent(pass)}`;

            return {
                server,
                port,
                user,
                pass,
                protocol: 'http',
                canonicalUrl,
                webUrl: canonicalUrl,
                original: clean
            };
        }

        // ۴. نوع چهارم: پروکسی SOCKS5
        if (isSocks) {
            if (clean.startsWith('socks5://') || clean.startsWith('socks://')) {
                const urlObj = new URL(clean);
                const server = urlObj.hostname;
                const port = parseInt(urlObj.port) || 1080;
                const user = urlObj.username || null;
                const pass = urlObj.password || null;
                if (!server || port <= 0 || port > 65535) return null;

                let canonicalUrl = `tg://socks?server=${server}&port=${port}`;
                if (user) canonicalUrl += `&user=${encodeURIComponent(user)}`;
                if (pass) canonicalUrl += `&pass=${encodeURIComponent(pass)}`;

                return {
                    server,
                    port,
                    user,
                    pass,
                    protocol: 'socks5',
                    canonicalUrl,
                    webUrl: canonicalUrl,
                    original: clean
                };
            } else {
                const urlObj = new URL(clean.replace('https://t.me/socks', 'tg://socks').replace('http://t.me/socks', 'tg://socks'));
                const params = new URLSearchParams(urlObj.search);
                const server = params.get('server');
                const port = parseInt(params.get('port')) || 1080;
                const user = params.get('user') || null;
                const pass = params.get('pass') || null;
                if (!server || port <= 0 || port > 65535) return null;

                let canonicalUrl = `tg://socks?server=${server}&port=${port}`;
                if (user) canonicalUrl += `&user=${encodeURIComponent(user)}`;
                if (pass) canonicalUrl += `&pass=${encodeURIComponent(pass)}`;

                return {
                    server,
                    port,
                    user,
                    pass,
                    protocol: 'socks5',
                    canonicalUrl,
                    webUrl: canonicalUrl,
                    original: clean
                };
            }
        }

        const urlObj = new URL(clean);
        const params = new URLSearchParams(urlObj.search);

        const server = params.get('server');
        // در webproxy اگر پورت ذکر نشده باشد، پیش‌فرض 443 است
        let port = parseInt(params.get('port'));
        if (isNaN(port) || port <= 0) {
            if (isWebProxy) {
                port = 443;
            } else {
                return null;
            }
        }
        if (port <= 0 || port > 65535) return null;

        let secret = params.get('secret');
        if (!server || !secret) return null;

        secret = cleanSecretString(secret);

        if (secret.length === 0 || secret.length > 200) return null;
        if (secret.includes('AAAAAAAAAAAAAAAAAAAA')) return null;

        // تفکیک پروتکل: webproxy یا mtproto
        const protocol = isWebProxy ? 'webproxy' : 'mtproto';
        const canonicalUrl = isWebProxy
            ? `tg://webproxy?server=${server}&port=${port}&secret=${secret}`
            : `tg://proxy?server=${server}&port=${port}&secret=${secret}`;

        const webUrl = isWebProxy
            ? `https://t.me/webproxy?server=${server}&port=${port}&secret=${secret}`
            : `https://t.me/proxy?server=${server}&port=${port}&secret=${secret}`;

        return {
            server,
            port,
            secret,
            protocol,
            canonicalUrl,
            webUrl,
            original: clean
        };
    } catch (e) {
        return null;
    }
}

// استخراج تمام لینک‌ها از یک متن بزرگ (شامل سابسکریپشن‌های نامرتب و Base64)
function extractProxiesFromRawText(text) {
    if (!text || typeof text !== 'string') return [];
    
    let content = text.trim();
    // بررسی دیکود خودکار Base64
    if (!content.includes('tg://') && !content.includes('t.me/') && !content.includes('socks') && content.length > 20) {
        try {
            const decoded = Buffer.from(content, 'base64').toString('utf-8');
            if (decoded.includes('server=') || decoded.includes('tg://') || decoded.includes('socks')) {
                content = decoded;
            }
        } catch (e) {}
    }

    const PROXY_REGEX = /(?:tg:\/\/proxy\?[^\s"'\n\r<>]+|https?:\/\/(?:t\.me|telegram\.me)\/proxy\?[^\s"'\n\r<>]+|tg:\/\/webproxy\?[^\s"'\n\r<>]+|https?:\/\/(?:t\.me|telegram\.me)\/webproxy\?[^\s"'\n\r<>]+|tg:\/\/socks\?[^\s"'\n\r<>]+|https?:\/\/(?:t\.me|telegram\.me)\/socks\?[^\s"'\n\r<>]+|socks5?:\/\/[^\s"'\n\r<>]+|tg:\/\/http\?[^\s"'\n\r<>]+|https?:\/\/(?:t\.me|telegram\.me)\/http\?[^\s"'\n\r<>]+)/gi;
    const matches = content.match(PROXY_REGEX) || [];

    const list = [];
    const seen = new Set();

    for (const match of matches) {
        const parsed = parseProxyString(match);
        if (parsed) {
            const key = `${parsed.protocol}:${parsed.server}:${parsed.port}:${parsed.secret || ''}:${parsed.user || ''}`;
            if (!seen.has(key)) {
                seen.add(key);
                list.push(parsed);
            }
        }
    }

    // همچنین پردازش خط به خط برای متونی که ممکن است ساختار متفاوت داشته باشند
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('tg://') || trimmed.includes('t.me/') || trimmed.startsWith('socks')) {
            const parsed = parseProxyString(trimmed);
            if (parsed) {
                const key = `${parsed.protocol}:${parsed.server}:${parsed.port}:${parsed.secret || ''}:${parsed.user || ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    list.push(parsed);
                }
            }
        }
    }

    return list;
}

// اندپوینت دریافت منابع پیش‌فرض
app.get('/api/default-subscriptions', (req, res) => {
    res.json({ ok: true, sources: DEFAULT_SUBSCRIPTIONS });
});

// اندپوینت دریافت موازی لینک‌های سابسکریپشن آنلاین
app.post('/api/fetch-subscriptions', async (req, res) => {
    const urls = Array.isArray(req.body.urls) && req.body.urls.length > 0
        ? req.body.urls
        : DEFAULT_SUBSCRIPTIONS.filter(s => s.enabled).map(s => s.url);

    const results = [];
    const errors = [];

    await Promise.all(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 9000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                errors.push({ url, error: `HTTP ${response.status}` });
                return;
            }

            const text = await response.text();
            const extracted = extractProxiesFromRawText(text);
            results.push(...extracted);
        } catch (err) {
            errors.push({ url, error: err.name === 'AbortError' ? 'Timeout (9s)' : err.message });
        }
    }));

    // حذف تکراری‌ها
    const uniqueMap = new Map();
    for (const p of results) {
        const key = `${p.protocol}:${p.server}:${p.port}:${p.secret || ''}:${p.user || ''}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, p);
        }
    }

    const uniqueProxies = Array.from(uniqueMap.values());
    res.json({
        ok: true,
        count: uniqueProxies.length,
        proxies: uniqueProxies,
        errors
    });
});

// اندپوینت اجرای مستقیم پروکسی در تلگرام ویندوز
app.post('/api/open-telegram', (req, res) => {
    const { url } = req.body;
    if (!url || (!url.startsWith('tg://') && !url.startsWith('https://t.me/'))) {
        return res.status(400).json({ ok: false, error: 'Invalid telegram proxy url' });
    }

    const directTgUrl = url.replace('https://t.me/', 'tg://').replace('http://t.me/', 'tg://');
    openSystemUrl(directTgUrl);
    res.json({ ok: true });
});

// اندپوینت تست اتصال دقیق پروکسی (پشتیبانی از MTProto، WebProxy و SOCKS5)
app.post('/check', async (req, res) => {
    const { server, port, secret, user, pass, protocol, timeoutMs, enableTcpPrecheck } = req.body;
    const targetPort = Number(port) || (protocol === 'webproxy' ? 443 : 443);
    const TIMEOUT = Number(timeoutMs) > 0 ? Number(timeoutMs) : 10000;

    // فاز ۱ (اختیاری): پیش‌چک سریع پورت TCP
    if (enableTcpPrecheck) {
        const precheckTimeout = Math.min(1500, TIMEOUT);
        const reachable = await quickTcpCheck(server, targetPort, precheckTimeout);
        if (!reachable) {
            return res.json({ ok: false, reason: 'tcp_unreachable' });
        }
    }

    // فاز ۲: تست اختصاصی نوع پروکسی
    if (protocol === 'socks5') {
        // تست پروتکل SOCKS5 به مقصد سرور هسته تلگرام
        const ping = await checkSocks5Proxy(server, targetPort, user, pass, TIMEOUT);
        if (ping > 0) {
            return res.json({ ok: true, ping, server, port: targetPort, protocol: 'socks5' });
        } else {
            return res.json({ ok: false, reason: 'socks5_connect_failed' });
        }
    }

    if (protocol === 'http') {
        // تست پروتکل HTTP CONNECT به مقصد سرور هسته تلگرام
        const ping = await checkHttpProxy(server, targetPort, user, pass, TIMEOUT);
        if (ping > 0) {
            return res.json({ ok: true, ping, server, port: targetPort, protocol: 'http' });
        } else {
            return res.json({ ok: false, reason: 'http_connect_failed' });
        }
    }

    // تست MTProto و WebProxy با GramJS
    let client = null;
    try {
        client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
            connectionRetries: 1,
            useWSS: false,
            proxy: {
                ip: server,
                port: targetPort,
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
                try { await client.disconnect(); } catch (e) {}
                resolve(ping);
            } catch (err) {
                reject(err);
            }
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT)
        );

        const ping = await Promise.race([checkPromise, timeoutPromise]);
        res.json({ ok: true, ping, server, port: targetPort, secret, protocol: protocol || 'mtproto' });
    } catch (error) {
        res.json({ ok: false, reason: error.message });
    } finally {
        if (client) {
            try { await client.destroy(); } catch (e) {}
        }
    }
});

// ==========================================
// صفحه رابط کاربری مدرن وب
// ==========================================
const path = require('path');
const fs = require('fs');

const indexHtmlPath = path.join(__dirname, 'index.html');
let htmlContent = '';
try {
    htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
} catch (e) {
    console.error('Failed to read index.html:', e.message);
}

const faviconPath = path.join(__dirname, 'favicon.svg');
app.get(['/favicon.ico', '/favicon.svg'], (req, res) => {
    if (fs.existsSync(faviconPath)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.sendFile(faviconPath);
    } else {
        res.status(404).end();
    }
});

app.get('/', (req, res) => {
    if (htmlContent) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
    } else {
        res.sendFile(indexHtmlPath);
    }
});

app.listen(PORT, () => {
    console.log(`Telegram Proxy Checker running at http://localhost:${PORT}`);
    openSystemUrl(`http://localhost:${PORT}`);
});
