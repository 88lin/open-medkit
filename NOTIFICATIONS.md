[English](./NOTIFICATIONS.en.md) | 中文

# 通知提醒配置

Open MedKit 支持每日自动检查过期 / 即将过期药品，并通过以下渠道发送提醒：

| 渠道 | 方式 | 适用场景 |
|---|---|---|
| [Telegram](#telegram) | Bot API | 个人用户，即时推送到手机 |
| [Discord](#discord) | Webhook | 家庭群组 / 社区服务器 |
| [飞书](#飞书lark) | 自定义机器人 Webhook | 国内团队协作 |
| [Email（SMTP）](#方式一smtp) | SMTP 服务器 | 通用，支持任意邮箱 |
| [Email（Resend）](#方式二resend) | Resend HTTP API | 开发者友好，免运维 |

所有渠道均在 Web UI 的 **设置 → 通知提醒** 中配置，无需修改环境变量或配置文件。

---

## 通用说明

- 每个渠道独立开关，可同时启用多个
- 每日发送时间按**药箱业务时区**执行（在 设置 → 通用设置 → 业务时区 中配置）
- 只有存在过期或即将过期药品时才会发送提醒，没有则跳过
- "即将过期"的天数阈值可在 设置 → 通用设置 → 即将过期判定 中调整（默认 30 天）

---

## Telegram

通过 Telegram Bot 接收提醒，消息直接推送到你的 Telegram 聊天。

### 前置准备

1. 在 Telegram 中找 [@BotFather](https://t.me/BotFather)，发送 `/newbot` 创建一个 Bot
2. 记下返回的 **Bot Token**（格式如 `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

### 配置步骤

1. 打开 **设置 → 通知提醒 → Telegram**
2. 输入 Bot Token，点击 **验证 Token**
3. 验证通过后，打开 Bot 的对话页面（页面会显示链接），发送 `/start`
4. 回到设置页面，点击 **开始绑定**，等待系统检测到你的 `/start` 消息
5. 绑定成功后开启 **启用每日提醒**，设置发送时间

### 注意事项

- 一个 Bot Token 绑定一个聊天会话（个人或群组）
- 如需推送到群组，先将 Bot 添加到群组，再在群组中发送 `/start`
- 解绑后 Bot Token 不会被删除，你可以在 BotFather 中管理

---

## Discord

通过 Discord Webhook 推送提醒到指定频道。

### 前置准备

1. 打开 Discord 频道设置 → 整合 → Webhooks
2. 点击 **新建 Webhook**，复制 Webhook URL

### 配置步骤

1. 打开 **设置 → 通知提醒 → Discord**
2. 输入 Webhook URL，点击 **验证 Webhook**
3. 验证通过后点击 **保存并启用**
4. 开启 **启用每日提醒**，设置发送时间

### 注意事项

- 提醒以 Embed 卡片形式发送
- 一个 Webhook URL 对应一个频道

---

## 飞书（Lark）

通过飞书自定义机器人 Webhook 推送提醒到群聊。

### 前置准备

1. 打开飞书群聊 → 设置 → 群机器人 → 添加机器人 → 自定义机器人
2. 复制 **Webhook 地址**
3. （可选）如果开启了签名校验，记下 **签名密钥**

### 配置步骤

1. 打开 **设置 → 通知提醒 → 飞书**
2. 输入 Webhook URL 和签名密钥（可选）
3. 点击 **验证 Webhook**（会发送一条测试消息到群聊）
4. 验证通过后点击 **保存并启用**
5. 开启 **启用每日提醒**，设置发送时间

### 注意事项

- 提醒以飞书卡片消息形式发送
- 如果群聊开启了签名校验但未填写密钥，发送会失败

---

## Email

通过邮件发送每日过期提醒，支持 **SMTP** 和 **Resend** 两种方式。

### 方式一：SMTP

适用于 Gmail、QQ 邮箱、Outlook、自建邮件服务器等任何支持 SMTP 的邮箱。

#### 配置步骤

1. 打开 **设置 → 通知提醒 → Email**，发送方式选择 **SMTP**
2. 填写以下字段：

| 字段 | 说明 | 示例 |
|---|---|---|
| SMTP Host | 邮件服务器地址 | `smtp.gmail.com` |
| 端口 | 常用 465（SSL）或 587（STARTTLS） | `587` |
| Use SSL/TLS | 端口 465 时自动开启，587 时关闭 | — |
| 用户名 | 登录邮箱账号 | `you@gmail.com` |
| 密码 | 邮箱密码或应用专用密码 | — |
| 发件人 | 发件显示名和地址 | `OpenMedKit <you@gmail.com>` |
| 收件人 | 接收提醒的邮箱 | `you@example.com` |

3. 点击 **测试并保存**，系统会验证 SMTP 连接是否正常
4. 验证通过后自动启用，可设置每日发送时间

#### 常见邮箱 SMTP 参数

| 邮箱 | Host | 端口 | 备注 |
|---|---|---|---|
| Gmail | `smtp.gmail.com` | 587 | 需使用[应用专用密码](https://myaccount.google.com/apppasswords) |
| QQ 邮箱 | `smtp.qq.com` | 465 或 587 | 需在 QQ 邮箱设置中开启 SMTP 并获取授权码 |
| Outlook / Hotmail | `smtp.office365.com` | 587 | 使用账号密码登录 |
| 163 邮箱 | `smtp.163.com` | 465 或 994 | 需开启 SMTP 服务并设置客户端授权密码 |
| iCloud | `smtp.mail.me.com` | 587 | 需使用[应用专用密码](https://appleid.apple.com/account/manage) |

### 方式二：Resend

[Resend](https://resend.com) 是一个开发者友好的邮件发送 API，免费额度为每月 3000 封，适合个人使用。

#### 前置准备

1. 在 [Resend 控制台](https://resend.com) 注册账号
2. 添加并验证你的域名（Resend 不允许使用未验证域名发信）
3. 创建 API Key

#### 配置步骤

1. 打开 **设置 → 通知提醒 → Email**，发送方式选择 **Resend**
2. 填写以下字段：

| 字段 | 说明 | 示例 |
|---|---|---|
| Resend API Key | 在 Resend 控制台创建 | `re_xxxxxxxxx` |
| 发件人 | **必须是 Resend 已验证域名下的地址** | `MedKit <notify@yourdomain.com>` |
| 收件人 | 接收提醒的邮箱 | `you@example.com` |

3. 点击 **测试并保存**，系统会发送一封测试邮件到收件人邮箱
4. 收到测试邮件即表示配置成功，可设置每日发送时间

> **注意**：Resend 的发件人地址必须使用你在 Resend 中已验证的域名，不能使用未验证的域名或第三方邮箱地址（如 Gmail）。

---

## 代理配置

如果你的部署环境需要通过代理访问 Telegram / Discord / Resend 等外部服务，可在 `.env` 中配置：

```env
HTTP_PROXY=http://192.168.31.1:7890
HTTPS_PROXY=http://192.168.31.1:7890
NO_PROXY=localhost,127.0.0.1,.local
```

---

## 故障排查

| 问题 | 可能原因 |
|---|---|
| 每天没收到提醒 | 检查是否开启了「启用每日提醒」；确认业务时区和发送时间设置正确 |
| 提醒发送失败 | 点击「发送测试通知」查看具体错误；Token / Webhook / 密码可能已失效 |
| SMTP 连接超时 | 检查 Host 和端口是否正确；部署环境可能需要配置代理 |
| Resend 返回 403 | 发件人地址的域名未在 Resend 中验证 |
| 飞书提示签名错误 | 群机器人开启了签名校验但未填写或填错了签名密钥 |
| Telegram 绑定超时 | 确保在 30 秒内向 Bot 发送了 `/start`；检查 Bot Token 是否正确 |
