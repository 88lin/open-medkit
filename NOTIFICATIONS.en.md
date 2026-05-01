English | [中文](./NOTIFICATIONS.md)

# Notification Configuration

Open MedKit automatically checks for expired / expiring medicines daily and sends reminders through the following channels:

| Channel | Method | Best For |
|---|---|---|
| [Telegram](#telegram) | Bot API | Personal use, instant push to phone |
| [Discord](#discord) | Webhook | Family group / community server |
| [Lark (Feishu)](#lark-feishu) | Custom Bot Webhook | Team collaboration |
| [Email (SMTP)](#option-1-smtp) | SMTP server | Universal, works with any email provider |
| [Email (Resend)](#option-2-resend) | Resend HTTP API | Developer-friendly, no infrastructure needed |

All channels are configured in the Web UI under **Settings → Notifications** — no environment variables or config files needed.

---

## General Notes

- Each channel has an independent toggle and can be enabled simultaneously
- Daily send time follows the **business timezone** (configured in Settings → General → Business Timezone)
- Reminders are only sent when expired or expiring medicines exist; otherwise skipped
- The "expiring soon" threshold is configurable in Settings → General → Expiring Threshold (default 30 days)

---

## Telegram

Receive reminders via a Telegram Bot — messages push directly to your Telegram chat.

### Prerequisites

1. Find [@BotFather](https://t.me/BotFather) on Telegram and send `/newbot` to create a bot
2. Save the returned **Bot Token** (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Setup Steps

1. Open **Settings → Notifications → Telegram**
2. Enter the Bot Token and click **Verify Token**
3. After verification, open the bot's chat page (the link is displayed on screen) and send `/start`
4. Return to the settings page and click **Start Binding** — wait for the system to detect your `/start` message
5. Once bound, enable **Daily Reminder** and set the send time

### Notes

- One Bot Token binds to one chat session (personal or group)
- To push to a group, add the bot to the group first, then send `/start` in the group
- Unbinding does not delete the Bot Token — you can manage it in BotFather

---

## Discord

Push reminders to a specific channel via Discord Webhook.

### Prerequisites

1. Open Discord channel settings → Integrations → Webhooks
2. Click **New Webhook** and copy the Webhook URL

### Setup Steps

1. Open **Settings → Notifications → Discord**
2. Enter the Webhook URL and click **Verify Webhook**
3. After verification, click **Save & Enable**
4. Enable **Daily Reminder** and set the send time

### Notes

- Reminders are sent as Embed cards
- One Webhook URL corresponds to one channel

---

## Lark (Feishu)

Push reminders to a group chat via Lark Custom Bot Webhook.

### Prerequisites

1. Open a Lark group chat → Settings → Group Bots → Add Bot → Custom Bot
2. Copy the **Webhook URL**
3. (Optional) If signature verification is enabled, save the **Signing Key**

### Setup Steps

1. Open **Settings → Notifications → Lark**
2. Enter the Webhook URL and Signing Key (optional)
3. Click **Verify Webhook** (sends a test message to the group)
4. After verification, click **Save & Enable**
5. Enable **Daily Reminder** and set the send time

### Notes

- Reminders are sent as Lark card messages
- If group signature verification is enabled but the key is missing or incorrect, delivery will fail

---

## Email

Send daily expiry reminders via email. Supports **SMTP** and **Resend**.

### Option 1: SMTP

Works with Gmail, QQ Mail, Outlook, self-hosted mail servers, or any SMTP-capable provider.

#### Setup Steps

1. Open **Settings → Notifications → Email**, select **SMTP** as the send method
2. Fill in the following fields:

| Field | Description | Example |
|---|---|---|
| SMTP Host | Mail server address | `smtp.gmail.com` |
| Port | Common: 465 (SSL) or 587 (STARTTLS) | `587` |
| Use SSL/TLS | Auto-enabled for port 465, off for 587 | — |
| Username | Email account login | `you@gmail.com` |
| Password | Email password or app-specific password | — |
| From | Sender display name and address | `OpenMedKit <you@gmail.com>` |
| To | Recipient email for reminders | `you@example.com` |

3. Click **Test & Save** — the system verifies SMTP connectivity
4. On success, the channel is auto-enabled. Set the daily send time

#### Common SMTP Parameters

| Provider | Host | Port | Notes |
|---|---|---|---|
| Gmail | `smtp.gmail.com` | 587 | Requires [App Password](https://myaccount.google.com/apppasswords) |
| QQ Mail | `smtp.qq.com` | 465 or 587 | Enable SMTP in QQ Mail settings and obtain an authorization code |
| Outlook / Hotmail | `smtp.office365.com` | 587 | Use account credentials |
| 163 Mail | `smtp.163.com` | 465 or 994 | Enable SMTP service and set a client authorization password |
| iCloud | `smtp.mail.me.com` | 587 | Requires [App Password](https://appleid.apple.com/account/manage) |

### Option 2: Resend

[Resend](https://resend.com) is a developer-friendly email API with a free tier of 3,000 emails/month — suitable for personal use.

#### Prerequisites

1. Register at [Resend Console](https://resend.com)
2. Add and verify your domain (Resend does not allow sending from unverified domains)
3. Create an API Key

#### Setup Steps

1. Open **Settings → Notifications → Email**, select **Resend** as the send method
2. Fill in the following fields:

| Field | Description | Example |
|---|---|---|
| Resend API Key | Created in Resend Console | `re_xxxxxxxxx` |
| From | **Must be an address under a Resend-verified domain** | `MedKit <notify@yourdomain.com>` |
| To | Recipient email for reminders | `you@example.com` |

3. Click **Test & Save** — the system sends a test email to the recipient
4. Receiving the test email confirms the setup is complete. Set the daily send time

> **Note**: The "From" address must use a domain verified in Resend. You cannot use an unverified domain or a third-party email address (e.g. Gmail).

---

## Proxy Configuration

If your deployment environment requires a proxy to reach external services (Telegram / Discord / Resend, etc.), configure it in `.env`:

```env
HTTP_PROXY=http://192.168.31.1:7890
HTTPS_PROXY=http://192.168.31.1:7890
NO_PROXY=localhost,127.0.0.1,.local
```

---

## Troubleshooting

| Issue | Possible Cause |
|---|---|
| No daily reminders received | Check that "Daily Reminder" is enabled; verify business timezone and send time are correct |
| Reminder delivery failed | Click "Send Test Notification" to see the specific error; Token / Webhook / password may have expired |
| SMTP connection timeout | Check Host and Port; your deployment may need proxy configuration |
| Resend returns 403 | The sender domain is not verified in Resend |
| Lark reports signature error | Group bot has signature verification enabled but the key is missing or incorrect |
| Telegram binding timeout | Make sure you sent `/start` to the bot within 30 seconds; verify the Bot Token is correct |
