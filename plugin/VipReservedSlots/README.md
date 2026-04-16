# VipReservedSlots — CounterStrikeSharp Plugin

Reserves server slots for VIP players. Polls the RETAKES website API for the active VIP list and kicks free players when a VIP needs a slot.

## Build

Requires .NET 8 SDK.

```bash
dotnet publish -c Release
```

Output: `bin/Release/net8.0/publish/`

## Install

1. Copy the **contents** of `bin/Release/net8.0/publish/` into:
   ```
   cs2/game/csgo/addons/counterstrikesharp/plugins/VipReservedSlots/
   ```
2. On first load the plugin creates a config file at:
   ```
   cs2/game/csgo/addons/counterstrikesharp/configs/plugins/VipReservedSlots/VipReservedSlots.json
   ```
3. Edit the config (see below), then restart the server or reload the plugin.

## Config

```json
{
  "ApiUrl": "https://cs2retakes.com/api/vips",
  "ApiKey": "your-secret-api-key",
  "MaxSlots": 9,
  "ReservedSlots": 2,
  "PollIntervalSeconds": 300,
  "SiteUrl": "https://cs2retakes.com"
}
```

| Key | Description |
|-----|-------------|
| `ApiUrl` | Full URL to the VIP list endpoint |
| `ApiKey` | Secret key matching the `VIP_API_KEY` env var on the Worker |
| `MaxSlots` | Total server slots (should match `-maxplayers`) |
| `ReservedSlots` | How many slots are reserved for VIPs |
| `PollIntervalSeconds` | How often to refresh the VIP list (default 5 min) |
| `SiteUrl` | Shown in kick messages |

## How it works

- Free players can fill up to `MaxSlots - ReservedSlots` (default 7) slots
- VIP players always connect regardless of player count
- If a VIP joins and the server exceeds `MaxSlots`, the most recently connected free player is kicked
- VIP list is refreshed from the API every `PollIntervalSeconds`
