# Email import

Bank alerts you forward to your private Finora address (shown in the app under
**Profile → Import from email**) show up in **To review**, ready to approve.

```
Gmail filter ──forward──▶ abc123@in.yourdomain.com ──▶ Cloudflare Email Worker
                                                         │ POST raw email + secret
                                                         ▼
                                            /api/v1/inbound/email ──▶ To review
```

## One-time setup (≈15 minutes)

You need a domain on Cloudflare (a cheap `.com.ng` or `.xyz` works). A subdomain
such as `in.yourdomain.com` keeps it separate from your normal email.

1. **Backend (Render → Environment)**
   - `INBOUND_EMAIL_DOMAIN=in.yourdomain.com`
   - `INBOUND_EMAIL_SECRET=<long random string>` (e.g. `openssl rand -hex 32`)
2. **Worker**
   ```bash
   cd email-worker
   # edit API_URL in wrangler.toml
   npx wrangler deploy
   npx wrangler secret put INBOUND_SECRET   # paste the same secret
   ```
3. **Cloudflare dashboard → your domain → Email → Email Routing**
   - Enable Email Routing for `in.yourdomain.com` (Cloudflare adds the MX records).
   - Routing rules → **Catch-all** → action **Send to a Worker** → `finora-email`.
4. **Test it:** send any email to your address from the app. The setup screen
   should show "Last email received" within a minute.
5. **Gmail:** follow the steps on the in-app setup screen. Gmail emails your Finora
   address a confirmation code first; the app shows that code for you to enter.

## Notes

- Nothing is added to your transactions until you approve it.
- The same alert forwarded twice is only stored once (matched by bank reference).
- Alerts the reader can't understand appear as "Couldn't read". Send a redacted
  copy so the reader can be taught that bank's format (`backend/app/core/alerts.py`).
- Anyone who learns your address could send fake alerts; they still need your
  approval. Rotate the address in the app if it leaks.
