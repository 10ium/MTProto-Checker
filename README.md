# 🛡️ MTProto Deep Checker

A powerful, pure Node.js tool to verify **Telegram MTProto Proxies** by performing real protocol handshakes. Unlike simple TCP checkers, this tool attempts to fetch the actual server configuration from Telegram via the proxy, ensuring 100% connectivity and eliminating the "Connecting..." issue.

![UI Screenshot](images/screenshot.png)

## 🌟 Features

* **Deep Inspection:** Uses `GetConfig` request to verify if the proxy can actually transfer Telegram data.
* **Pure JavaScript:** Built with **GramJS**. No need for C++ compilers, `node-gyp`, or Visual Studio Build Tools.
* **Smart Filtering:** Automatically detects and removes invalid secrets, spam links, and bad ports.
* **Modern UI:** Beautiful Dark Mode interface with real-time logs and progress bars.
* **Cross-Platform:** Works on Windows, Linux, and macOS.
* **No Auth Needed:** Uses public test keys, so you don't need to log in with your phone number.
* **Bilingual:** Supports both English and Persian (Farsi) interfaces.
* **Custom Timeout & Concurrency:** Set per-proxy timeout and number of simultaneous checks directly from UI.
* **GitHub-built Windows EXE Releases:** Tag a version and GitHub Actions will build and attach `mtproto-checker.exe` to Releases.

## 🚀 Installation

### Prerequisites
You need **Node.js** installed on your machine. [Download it here](https://nodejs.org/).

### Steps
1.  Clone this repository:
    ```bash
    git clone https://github.com/<your-username>/<your-fork-repo>.git
    cd MTProto-Checker
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the application:
    ```bash
    node app.js
    ```

4.  The browser will open automatically at `http://localhost:3000`.

## 📖 How to Use

1.  **Get Proxies:** Copy your list of mixed/dirty MTProto proxies.
    > **Tip:** You can find a huge list of free proxies in [this repository](https://github.com/SoliSpirit/mtproto).
2.  **Paste Links:** Paste them into the **"Input List"** box (formats like `tg://` or `https://t.me/proxy` are supported).
3.  **Start Check:** Click the **"Start Deep Check"** button.
4.  **Wait:** The tool will filter invalid formats first, then test connections in batches.
5.  **Copy Results:** Valid proxies will appear in the right panel. Click **"Copy"** to save them to your clipboard.
6.  **Tune Speed/Accuracy:** Use the timeout and concurrency inputs above the input box based on your network/server quality.

## 🪟 Windows EXE release via GitHub

This project now includes a GitHub Actions workflow (`.github/workflows/release-windows-exe.yml`) that builds a Windows executable and publishes it in GitHub Releases.

### How to publish an EXE release
1. Update version/files and push your commits.
2. Create and push a version tag:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```
3. GitHub Actions builds `dist/mtproto-checker.exe` on `windows-latest`.
4. The EXE is uploaded automatically to the matching Release page.

## ⚙️ How it Works

Many proxies respond to TCP pings but fail to encrypt/decrypt Telegram packets (Fake Proxies).
This tool does the following:
1.  **Parses & Sanitizes:** Cleans up broken links (e.g., `.&port` typos).
2.  **Validates Secret:** Rejects secrets that are too long (spam padding) or invalid.
3.  **Connects:** Establishes a secure MTProto connection.
4.  **Invokes API:** Sends a `help.getConfig` request to Telegram Data Centers.
5.  **Result:** If the server replies with config data, the proxy is marked as **Working**.

## 🛠 Dependencies

* [express](https://www.npmjs.com/package/express) - Web server
* [telegram](https://www.npmjs.com/package/telegram) (GramJS) - MTProto implementation
* [open](https://www.npmjs.com/package/open) - Opens browser automatically

## ☕ Support

If you found this tool useful, you can support the development:

<a href="https://nowpayments.io/donation?api_key=d824db3b-fcf7-4ebb-8e3d-297c23cfeee2" target="_blank" rel="noreferrer noopener">
    <img src="https://nowpayments.io/images/embeds/donation-button-black.svg" alt="Crypto donation button by NOWPayments">
</a>

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---
[Read in Persian (فارسی)](README_FA.md)
