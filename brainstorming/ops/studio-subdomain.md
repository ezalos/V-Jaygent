# Wiring `studio.develle.fr` (Phase 3.6 / task #17)

The private subdomain for `vjay-from-url` autonomous renders. Both
DNS and routing now landed; only Cloudflare Access gating remains
manual.

## Topology — corrected 2026-05-05

The earlier draft of this doc said "Pi nginx" for the home routing.
That was wrong. Pi (192.168.1.73) is offline / unreachable. The
actual path is:

```
Cloudflare → home router :80/:443 → TinyButMighty (192.168.1.74)
                                       ├─ nginx :80   → vjaygent.develle.fr,
                                       │                 studio.develle.fr,
                                       │                 slides.develle.fr
                                       │                 (proxy_pass to
                                       │                  TheBeast:7777, etc.)
                                       └─ Caddy  :443  → share.develle.fr
                                                          (token-gated DL)
```

TheBeast (192.168.1.96) runs the docker container `vjaygent-studio`
on port 7777. TinyButMighty's nginx terminates HTTP and proxies.
Cloudflare orange-cloud-proxies vjaygent and studio (proxied=true);
share is DNS-only (proxied=false) so Caddy can do its own TLS.

TinyButMighty is reachable from TheBeast directly at 192.168.1.74
(no jump host required). To reach Pi, ssh through TinyButMighty
(`ssh -J TinyButMighty Pi_local`) — but Pi is currently offline.

## Step 1 — DNS (DONE)

```bash
cd ~/Setup/cloudflare-dns && ./dns.sh sync
```

Added `studio.develle.fr A 77.134.130.112 proxied=true`. Source of
truth in `~/Setup/cloudflare-dns/dns.json`.

## Step 2 — TinyButMighty nginx (DONE)

```bash
ssh TinyButMighty
sudo tee /etc/nginx/conf.d/studio.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name studio.develle.fr;
    location / {
        proxy_pass http://192.168.1.96:7777;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx
```

Verify:

```bash
curl -s https://studio.develle.fr/ | head -3
# expect: <!DOCTYPE html> ... ABOUTME: Live studio page ...
```

## Step 3 — Cloudflare Access gating (TODO, dashboard-only)

Without this, `studio.develle.fr` is a public mirror of
`vjaygent.develle.fr` — same studio, same catalog, different
hostname. To make it actually private:

1. Cloudflare dashboard → Zero Trust → Access → Applications →
   Add an application.
2. Self-hosted, name "V-Jaygent studio (private)".
3. Application domain: `studio.develle.fr`, path `*`.
4. Identity provider: One-time PIN to `ezalos@gmail.com`.
5. Policy: Allow with action "PIN to email".
6. Save.

After this, hitting `studio.develle.fr` prompts for a PIN; without
auth → blocked at Cloudflare's edge before traffic reaches
TinyButMighty.

## Step 4 — Catalog filtering (deferred)

Both domains currently serve the SAME studio container, so the same
`/api/catalog` listing appears on both. Future runtime work:

- Detect `Host: studio.develle.fr` server-side and filter the
  catalog to pieces with a `private: true` flag in their
  meta.yaml.
- Or run a separate container at a different port for the private
  studio with its own pieces dir.

Not implementing today. The MVP gate is Cloudflare Access auth
(Step 3): humans go through the PIN to see the studio, but once
authed they see everything.
