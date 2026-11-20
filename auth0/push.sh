#!/usr/bin/env bash
# Pushes the Universal Login page template + brand colors to the tenant.
# Prereqs: Auth0 CLI (https://github.com/auth0/auth0-cli), jq, and a custom domain
# verified on the tenant (page templates require one).
#   auth0 login --domain yumm-pizzza.cic-demo-platform.auth0app.com   # tenant domain, not the custom one
set -euo pipefail
cd "$(dirname "$0")"

# Page template (sent as JSON: {"template": "<html...>"})
auth0 api put "branding/templates/universal-login" \
  --data "$(jq -Rs '{template: .}' page-template.liquid)"

# Brand colors
auth0 api patch "branding" --data "$(cat branding.json)"

echo "Done. Test with Dashboard > Branding > Universal Login > Try, or log in from the app."
