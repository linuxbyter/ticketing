# Kippo🌸 Setup

## Telegram Bot Setup

1. Open Telegram, search for your bot, send `hello`
2. Click this link to get your chat ID:
   https://api.telegram.org/bot8958785002:AAGkHiZWeQi3ybF8IPGujvRjCJwNj58Ln2s/getUpdates
3. Look for `"chat":{"id":` followed by a number
4. Add that number to `.env.local` as `TELEGRAM_CHAT_ID`

## Environment Variables

```
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
NVIDIA_API_KEY=nvapi-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GMAIL_USER=Kippoticket@gmail.com
GMAIL_PASS=fqtrlwieeyljwvmx
TELEGRAM_BOT_TOKEN=8958785002:AAGkHiZWeQi3ybF8IPGujvRjCJwNj58Ln2s
TELEGRAM_CHAT_ID=your-chat-id-here
```

## Admin Route

Hidden at: `/kicheleboyz`
