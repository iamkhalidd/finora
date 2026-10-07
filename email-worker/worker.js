// Cloudflare Email Worker: receives mail sent to <token>@<your inbound domain>
// and hands the raw message to the Finora API, which reads the bank alert.
export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const url = `${env.API_URL}/api/v1/inbound/email?to=${encodeURIComponent(message.to)}`;

    let res;
    for (let attempt = 0; attempt < 3; attempt++) {
      // Render's free tier sleeps; the first request can take ~a minute to wake it
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "message/rfc822", "X-Inbound-Secret": env.INBOUND_SECRET },
        body: raw,
      }).catch(() => null);
      if (res && res.status < 500) break;
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
    }

    if (!res) {
      message.setReject("Finora is unreachable, try again later");
    } else if (res.status === 404) {
      message.setReject("Unknown Finora address");
    } else if (!res.ok) {
      message.setReject(`Finora could not accept this email (${res.status})`);
    }
  },
};
