#!/usr/bin/env bash
# =============================================================================
# CS2 Retake Server — Full VPS Setup Script
# Tested on Ubuntu 22.04 / 24.04 (fresh install)
# Run as root: sudo bash setup.sh
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Parameters — set these before running or pass as environment variables
# ---------------------------------------------------------------------------
GSLT="${GSLT:?'Set GSLT (Game Server Login Token) — get one at https://steamcommunity.com/dev/managegameservers'}"
SERVER_HOSTNAME="${SERVER_HOSTNAME:-RETAKES — The Fastest CS2 Retake Server}"
VIP_API_URL="${VIP_API_URL:?'Set VIP_API_URL (e.g. https://cs2retakes.com/api/vips)'}"
VIP_API_KEY="${VIP_API_KEY:?'Set VIP_API_KEY (must match your Worker secret)'}"

CS2_USER="cs2server"
CS2_DIR="/home/${CS2_USER}/cs2"
STEAMCMD_DIR="/home/${CS2_USER}/steamcmd"
CS2_APP_ID=730

echo "============================================="
echo " CS2 Retake Server Setup"
echo "============================================="

# ---------------------------------------------------------------------------
# 1. System packages
# ---------------------------------------------------------------------------
echo "[1/8] Installing system dependencies..."
dpkg --add-architecture i386
apt-get update -y
apt-get install -y \
  lib32gcc-s1 lib32stdc++6 libc6-i386 \
  curl wget tar unzip software-properties-common \
  ca-certificates ufw

# ---------------------------------------------------------------------------
# 2. Create dedicated user
# ---------------------------------------------------------------------------
echo "[2/8] Creating cs2server user..."
if ! id -u "${CS2_USER}" &>/dev/null; then
  useradd -m -s /bin/bash "${CS2_USER}"
fi

# ---------------------------------------------------------------------------
# 3. Install SteamCMD
# ---------------------------------------------------------------------------
echo "[3/8] Installing SteamCMD..."
sudo -u "${CS2_USER}" mkdir -p "${STEAMCMD_DIR}"
sudo -u "${CS2_USER}" bash -c "
  cd ${STEAMCMD_DIR}
  if [ ! -f steamcmd.sh ]; then
    curl -sSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz | tar xz
  fi
"

# ---------------------------------------------------------------------------
# 4. Install / update CS2 dedicated server
# ---------------------------------------------------------------------------
echo "[4/8] Installing CS2 dedicated server (app ${CS2_APP_ID})..."
sudo -u "${CS2_USER}" "${STEAMCMD_DIR}/steamcmd.sh" \
  +force_install_dir "${CS2_DIR}" \
  +login anonymous \
  +app_update ${CS2_APP_ID} validate \
  +quit

# ---------------------------------------------------------------------------
# 5. Install CounterStrikeSharp (latest release with runtime)
# ---------------------------------------------------------------------------
echo "[5/8] Installing CounterStrikeSharp..."
CSS_RELEASE_URL=$(curl -s https://api.github.com/repos/roflmuffin/CounterStrikeSharp/releases/latest \
  | grep -oP '"browser_download_url":\s*"\K[^"]*with-runtime[^"]*linux[^"]*\.zip')

sudo -u "${CS2_USER}" bash -c "
  cd /tmp
  curl -sSL -o counterstrikesharp.zip '${CSS_RELEASE_URL}'
  unzip -o counterstrikesharp.zip -d '${CS2_DIR}/game/csgo/'
  rm counterstrikesharp.zip
"

# ---------------------------------------------------------------------------
# 6. Install cs2-retakes plugin by B3none (latest release)
# ---------------------------------------------------------------------------
echo "[6/8] Installing cs2-retakes plugin..."
RETAKES_RELEASE_URL=$(curl -s https://api.github.com/repos/B3none/cs2-retakes/releases/latest \
  | grep -oP '"browser_download_url":\s*"\K[^"]*\.zip')

sudo -u "${CS2_USER}" bash -c "
  cd /tmp
  curl -sSL -o cs2-retakes.zip '${RETAKES_RELEASE_URL}'
  unzip -o cs2-retakes.zip -d '${CS2_DIR}/game/csgo/'
  rm cs2-retakes.zip
"

# ---------------------------------------------------------------------------
# 7. Deploy VipReservedSlots plugin config
# ---------------------------------------------------------------------------
echo "[7/8] Configuring VipReservedSlots plugin..."
VRS_CONFIG_DIR="${CS2_DIR}/game/csgo/addons/counterstrikesharp/configs/plugins/VipReservedSlots"
sudo -u "${CS2_USER}" mkdir -p "${VRS_CONFIG_DIR}"
sudo -u "${CS2_USER}" tee "${VRS_CONFIG_DIR}/VipReservedSlots.json" > /dev/null <<CFGEOF
{
  "ApiUrl": "${VIP_API_URL}",
  "ApiKey": "${VIP_API_KEY}",
  "MaxSlots": 9,
  "ReservedSlots": 2,
  "PollIntervalSeconds": 300,
  "SiteUrl": "https://cs2retakes.com"
}
CFGEOF

# NOTE: The VipReservedSlots plugin DLL must be built separately and placed in:
#   ${CS2_DIR}/game/csgo/addons/counterstrikesharp/plugins/VipReservedSlots/
# See the plugin README for build instructions.

# ---------------------------------------------------------------------------
# 8. Deploy server.cfg
# ---------------------------------------------------------------------------
echo "[8/8] Writing server.cfg..."
sudo -u "${CS2_USER}" mkdir -p "${CS2_DIR}/game/csgo/cfg"
sudo -u "${CS2_USER}" tee "${CS2_DIR}/game/csgo/cfg/server.cfg" > /dev/null <<SRVCFG
// =============================================================================
// RETAKES — CS2 Retake Server Configuration
// =============================================================================

hostname "${SERVER_HOSTNAME}"
sv_cheats 0
sv_lan 0

// Authentication
sv_setsteamaccount "${GSLT}"

// Slots
sv_maxrate 0
sv_minrate 128000
sv_maxplayers_override 9

// Game mode: Casual (retakes plugin handles round logic)
game_type 0
game_mode 0

// Retake-friendly settings
mp_buy_anywhere 0
mp_buytime 0
mp_maxmoney 0
mp_startmoney 0
mp_free_armor 1
mp_defuser_allocation 2
mp_ct_default_primary ""
mp_t_default_primary ""

// Round settings
mp_roundtime 25
mp_roundtime_defuse 25
mp_round_restart_delay 3
mp_freezetime 0
mp_warmuptime 30
mp_warmup_pausetimer 0

// Team settings
mp_autoteambalance 1
mp_limitteams 0
mp_teammates_are_enemies 0

// Misc
sv_alltalk 1
sv_deadtalk 1
sv_full_alltalk 1
mp_match_end_restart 1
tv_enable 0
sv_hibernate_when_empty 1

// Logging
log on
sv_logbans 1

// Execute any additional overrides
exec retakes.cfg
SRVCFG

# ---------------------------------------------------------------------------
# Firewall (UFW)
# ---------------------------------------------------------------------------
echo "Configuring UFW firewall..."
ufw allow 22/tcp    comment "SSH"
ufw allow 27015/tcp comment "CS2 server TCP"
ufw allow 27015/udp comment "CS2 server UDP"
ufw --force enable

# ---------------------------------------------------------------------------
# Systemd service
# ---------------------------------------------------------------------------
echo "Creating systemd service..."
cat > /etc/systemd/system/cs2server.service <<SVCEOF
[Unit]
Description=CS2 Retake Dedicated Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${CS2_USER}
WorkingDirectory=${CS2_DIR}
ExecStart=${CS2_DIR}/game/bin/linuxsteamrt64/cs2 \\
    -dedicated \\
    -console \\
    -usercon \\
    -maxplayers 9 \\
    +game_type 0 \\
    +game_mode 0 \\
    +mapgroup mg_active \\
    +map de_dust2 \\
    +exec server.cfg
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal
LimitNOFILE=100000

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable cs2server.service

echo ""
echo "============================================="
echo " Setup complete!"
echo "============================================="
echo ""
echo " Start the server:   systemctl start cs2server"
echo " View logs:          journalctl -u cs2server -f"
echo " Server status:      systemctl status cs2server"
echo ""
echo " IMPORTANT: Build and deploy the VipReservedSlots plugin DLL to:"
echo "   ${CS2_DIR}/game/csgo/addons/counterstrikesharp/plugins/VipReservedSlots/"
echo ""
