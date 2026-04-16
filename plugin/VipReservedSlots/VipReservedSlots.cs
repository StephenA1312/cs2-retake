using System.Net.Http.Json;
using System.Text.Json;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Timers;
using Microsoft.Extensions.Logging;

namespace VipReservedSlots;

public class PluginConfig : BasePluginConfig
{
    public string ApiUrl { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public int MaxSlots { get; set; } = 9;
    public int ReservedSlots { get; set; } = 2;
    public int PollIntervalSeconds { get; set; } = 300;
    public string SiteUrl { get; set; } = "https://cs2retakes.com";
}

public class VipReservedSlots : BasePlugin, IPluginConfig<PluginConfig>
{
    public override string ModuleName => "VipReservedSlots";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "cs2retakes";
    public override string ModuleDescription => "Reserves server slots for VIP players";

    public PluginConfig Config { get; set; } = new();

    private readonly HashSet<string> _vipSteamIds = new();
    private readonly List<(string SteamId, DateTime JoinedAt)> _connectedFreePlayers = new();
    private readonly HttpClient _httpClient = new();

    public void OnConfigParsed(PluginConfig config)
    {
        Config = config;
    }

    public override void Load(bool hotReload)
    {
        Logger.LogInformation("[VipReservedSlots] Loading...");

        // Fetch VIP list immediately on load
        _ = RefreshVipListAsync();

        // Poll for VIP list on interval
        AddTimer(Config.PollIntervalSeconds, () => _ = RefreshVipListAsync(), TimerFlags.REPEAT);

        RegisterEventHandler<EventPlayerConnectFull>(OnPlayerConnectFull);
        RegisterEventHandler<EventPlayerDisconnect>(OnPlayerDisconnect);

        Logger.LogInformation("[VipReservedSlots] Loaded. Reserved {Reserved}/{Max} slots for VIPs.",
            Config.ReservedSlots, Config.MaxSlots);
    }

    private bool IsVip(string steamId64)
    {
        return _vipSteamIds.Contains(steamId64);
    }

    private int FreePlayerLimit => Config.MaxSlots - Config.ReservedSlots;

    private HookResult OnPlayerConnectFull(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot)
            return HookResult.Continue;

        var steamId = player.SteamID.ToString();

        if (IsVip(steamId))
        {
            Logger.LogInformation("[VipReservedSlots] VIP player connected: {SteamId}", steamId);
            // VIP joined — check if we need to kick a free player to make room
            KickFreePlayerIfNeeded();
            return HookResult.Continue;
        }

        // Free player — check if they can join
        int currentFreeCount = _connectedFreePlayers.Count;
        int totalPlayers = GetPlayerCount();

        if (currentFreeCount >= FreePlayerLimit || totalPlayers > Config.MaxSlots)
        {
            // No room for free players — kick the one who just joined
            Logger.LogInformation("[VipReservedSlots] Free player rejected (slots full): {SteamId}", steamId);
            Server.NextFrame(() =>
            {
                player.Disconnect(NetworkDisconnectionReason.NETWORK_DISCONNECT_KICKED_NOSTEAMLOGIN);
                Server.PrintToChatAll($" \x02[VIP]\x01 A player was removed — server reserved for VIPs. Upgrade at {Config.SiteUrl}");
            });
            return HookResult.Continue;
        }

        _connectedFreePlayers.Add((steamId, DateTime.UtcNow));
        Logger.LogInformation("[VipReservedSlots] Free player connected: {SteamId} ({Count}/{Limit})",
            steamId, _connectedFreePlayers.Count, FreePlayerLimit);

        return HookResult.Continue;
    }

    private HookResult OnPlayerDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot)
            return HookResult.Continue;

        var steamId = player.SteamID.ToString();
        _connectedFreePlayers.RemoveAll(p => p.SteamId == steamId);

        return HookResult.Continue;
    }

    private void KickFreePlayerIfNeeded()
    {
        int totalPlayers = GetPlayerCount();
        if (totalPlayers <= Config.MaxSlots)
            return;

        // Kick the most recently joined free player
        if (_connectedFreePlayers.Count == 0)
            return;

        var newest = _connectedFreePlayers
            .OrderByDescending(p => p.JoinedAt)
            .First();

        var target = Utilities.GetPlayers()
            .FirstOrDefault(p => p is { IsValid: true, IsBot: false } && p.SteamID.ToString() == newest.SteamId);

        if (target != null)
        {
            Logger.LogInformation("[VipReservedSlots] Kicking free player {SteamId} to make room for VIP", newest.SteamId);
            _connectedFreePlayers.RemoveAll(p => p.SteamId == newest.SteamId);
            Server.NextFrame(() =>
            {
                target.PrintToChat($" \x02[VIP]\x01 A VIP player joined. Upgrade at {Config.SiteUrl}");
                AddTimer(0.5f, () =>
                {
                    target.Disconnect(NetworkDisconnectionReason.NETWORK_DISCONNECT_KICKED_NOSTEAMLOGIN);
                });
            });
        }
    }

    private int GetPlayerCount()
    {
        return Utilities.GetPlayers().Count(p => p is { IsValid: true, IsBot: false });
    }

    private async Task RefreshVipListAsync()
    {
        if (string.IsNullOrEmpty(Config.ApiUrl) || string.IsNullOrEmpty(Config.ApiKey))
        {
            Logger.LogWarning("[VipReservedSlots] API URL or key not configured, skipping VIP refresh.");
            return;
        }

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, Config.ApiUrl);
            request.Headers.Add("x-api-key", Config.ApiKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<VipResponse>();
            if (result?.Vips != null)
            {
                _vipSteamIds.Clear();
                foreach (var id in result.Vips)
                    _vipSteamIds.Add(id);

                Logger.LogInformation("[VipReservedSlots] Refreshed VIP list: {Count} VIPs loaded.", _vipSteamIds.Count);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[VipReservedSlots] Failed to refresh VIP list.");
        }
    }

    private record VipResponse
    {
        public List<string> Vips { get; init; } = new();
    }
}
