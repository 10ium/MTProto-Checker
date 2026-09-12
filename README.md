# 🛡️ Telegram Proxy Checker (MTProto, SOCKS5, HTTP & WebProxy)

A powerful, pure Node.js tool to verify **all 4 official Telegram proxy protocols** with real protocol handshakes and encrypted data exchanges. Unlike simple TCP checkers, this tool verifies true end-to-end data transmission to Telegram core servers, ensuring 100% real connectivity and eliminating the "Connecting..." freeze issue in Telegram.

📢 **Official Telegram Channel:** [@vpnclashfa](https://t.me/vpnclashfa)

![UI Screenshot](images/screenshot.png)

## 🌟 Comprehensive 4-Protocol Support

1. **MTPROTO:** Classic standard 16-byte hex secret, `dd`-prefixed secrets, and anti-censorship **Fake-TLS** (`ee`-prefixed secrets with SNI domain spoofing).
2. **SOCKS5:** Native RFC1928 SOCKS5 tunnel verification with optional username/password (`tg://socks` and `socks5://`).
3. **HTTP:** HTTP/HTTPS CONNECT tunneling to Telegram core servers with optional authentication (`tg://http` and `http://user:pass@host:port`).
4. **WEB (WebProxy):** Telegram's modern WebProxy protocol running over TLS/WebSockets on port 443 (`tg://webproxy` and `https://t.me/webproxy`).

## 🚀 Key Features

* **📊 Real-time Stats & Analytics Dashboard:** Live breakdown of total extracted proxies, duplicate removal counts, filtering of spam/fake secrets, individual protocol counts, and lowest/average latency stats.
* **📥 Live Subscription Downloader:** Fetch fresh proxies directly from 10 public curated sources with a single click.
* **⚙️ Complete Subscription Manager:** Toggle built-in sources, add custom subscription URLs, remove, or reset sources with automatic browser storage persistence.
* **🎯 Intelligent Speed & Network Presets (Smart Presets):**
  * 🚀 **Turbo Scan:** Timeout 3s | Concurrency 30 | TCP Pre-check ON (fastest filter for high-volume lists).
  * ⚖️ **Smart Balanced (Default):** Timeout 8s | Concurrency 15 | TCP Pre-check ON (ideal everyday efficiency).
  * 🛡️ **Anti-Censorship / Intranet:** Timeout 25s | Concurrency 8 | No Pre-check (deep tunnel verification through strict firewalls).
  * 🐢 **Deep Recovery:** Timeout 45s | Concurrency 5 | No Pre-check (recover slow but working proxies).
  * 🛠️ **Custom:** Set any custom timeout and concurrency.
* **🚀 Direct 1-Click Launch into Telegram Desktop:** Sends the lowest ping working proxy directly to Telegram Desktop with full Windows OS integration.
* **📋 Configurable Top N Copy:** Copy the top 5, 10, 20, or custom N working proxies sorted by lowest ping.
* **💾 Clean Export Formats:** Dedicated buttons for "Download Text File" and "Download JSON".
* **⏹️ Instant Stop Button:** Pause or cancel checks at any point.
* **🎨 Custom Vector Favicon & Modern Theme:** Custom Telegram airplane badge with verified green checkmark.
* **Pure JavaScript (No C++ Build Tools):** Built with **GramJS** and native Node.js sockets. No compile issues or Visual Studio required.
* **Automated Multi-Version Release Workflow:** GitHub Actions release workflow prompting for custom version tags.

## 🚀 Installation & Running

### Prerequisites
You need **Node.js** installed on your machine. [Download it here](https://nodejs.org/).

### Steps
1. Navigate to the project directory:
   ```bash
   cd MTProto-Checker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   node app.js
   ```
4. The browser will open automatically at `http://localhost:3000`.

## 📖 How to Use

1. **Load Proxies:**
   * Click **"Fetch From Subscriptions"** to download fresh proxies from online GitHub sources.
   * Or paste dirty proxy links directly into the Input box.
2. **Select Preset:**
   * Choose **Fast**, **Balanced**, or **National Net / Throttling** depending on your current connection.
3. **Start Check:**
   * Click **"Start Deep Check"**. Stop anytime with **"Stop"**.
4. **Use & Export:**
   * Click **"Connect Best in Telegram"** to open the fastest proxy in your Telegram app.
   * Or click **"Copy Top 10"**, **"Copy All"**, or download TXT/JSON files.

## 🪟 Windows Standalone EXE

To build a standalone `.exe` that runs without Node.js installed:

```bash
npm run build:win
```
The output file will be created in `dist/mtproto-checker.exe`.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---
[مشاهده مستندات به زبان فارسی](README_FA.md)
