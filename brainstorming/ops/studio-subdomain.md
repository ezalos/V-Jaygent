# Wiring `studio.develle.fr` (Phase 3.6 / task #17)

The private subdomain for `vjay-from-url` autonomous renders. DNS is
already in (Cloudflare A record proxied to `77.134.130.112` — the
home connection). The remaining work is on the Pi (nginx routing)
and optionally Cloudflare (Access gating).

DNS state — done 2026-05-05 via `/link-develle-domain`:
- `studio.develle.fr` A → 77.134.130.112, proxied=true.
- See `~/Setup/cloudflare-dns/dns.json` for the source of truth.

Status as of 2026-05-05: `curl https://studio.develle.fr/` returns
501 / a 404 page from the Pi default backend — Pi nginx has no
`server_name studio.develle.fr` block yet.

## Step 1 — Pi nginx (required)

SSH from your laptop (Pi only routes inside the home LAN; TheBeast
can't ssh to it directly):

```bash
ssh Pi_local
sudo cp /etc/nginx/sites-available/vjaygent /etc/nginx/sites-available/studio
sudoedit /etc/nginx/sites-available/studio
```

In the new file, change the single `server_name vjaygent.develle.fr;`
line to `server_name studio.develle.fr;`. Leave everything else
identical (same `proxy_pass http://thebeast:7777;` or whatever the
existing config uses).

```bash
sudo ln -s /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/studio
sudo nginx -t
sudo systemctl reload nginx
```

Verify from anywhere:

```bash
curl -sI https://studio.develle.fr/ | head -5
# expect: HTTP/2 200, content-type: text/html; charset=utf-8
```

## Step 2 — Cloudflare Access gating (recommended)

Without gating, `studio.develle.fr` is a public mirror of
`vjaygent.develle.fr` — same studio, same catalog, just a second
hostname. To make it actually private:

In the Cloudflare dashboard:
1. Zero Trust → Access → Applications → Add an application.
2. Self-hosted, Application name "V-Jaygent studio (private)".
3. Application domain: `studio.develle.fr`, path `*`.
4. Identity provider: One-time PIN to `ezalos@gmail.com` (or whatever
   IdP you prefer).
5. Policy: Allow, with action "PIN to email" or specific Google
   account.
6. Save.

After this, hitting `studio.develle.fr` prompts for a PIN/login;
without auth → blocked.

## Step 3 — catalog filtering (future)

Today both domains serve the SAME studio container, so the same
`/api/catalog` listing appears on both. To make `studio.develle.fr`
show only `vjay-from-url`-published pieces, the runtime needs to:

- Detect `Host: studio.develle.fr` server-side and filter the catalog
  to pieces with a `private: true` flag in their meta.yaml.
- Or run a separate container at a different port for the private
  studio, with its own pieces dir.

Not implementing today — requires either runtime work (preferred,
simpler) or a parallel container (more thorough). The MVP is
Cloudflare Access gating: humans go through the PIN to see the
studio, but the catalog is shared.

## Verification

After Step 1 + Step 2:

```bash
# Anonymous (should be challenged by Cloudflare Access)
curl -sI https://studio.develle.fr/
# expect: HTTP/2 302 redirecting to a CF Access login page

# Anonymous studio (works publicly, sanity)
curl -sI https://vjaygent.develle.fr/
# expect: HTTP/2 200
```
