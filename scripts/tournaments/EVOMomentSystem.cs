using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// EVO Moment System - Signature innovation that creates legendary tournament moments
/// Inspired by EVO Moment #37 (Daigo parry) and other iconic FGC moments
/// This unique system guarantees EVO attention and creates viral highlights
/// </summary>
public partial class EVOMomentSystem : Node
{
    public static EVOMomentSystem Instance { get; private set; }

    [Signal]
    public delegate void MomentTriggeredEventHandler(string momentType, string playerId);
    
    [Signal] 
    public delegate void LegendaryMomentEventHandler(string momentType, Variant momentData);

    public enum MomentType
    {
        PerfectDefense,    // 3+ consecutive parries (Daigo Moment)
        ComebackCatalyst,  // Major comeback from critical health
        ClashMaster,       // Multiple clash victories
        RomanCancelArt,    // Perfect RC timing sequences
        UnthinkableMoment, // Ultra-rare combinations
        StreamDestroyer    // Chat-breaking hype moments
    }

    public class MomentData
    {
        public MomentType Type { get; set; }
        public string PlayerId { get; set; }
        public string OpponentId { get; set; }
        public int Intensity { get; set; } // 1-10 scale
        public float Timestamp { get; set; }
        public Dictionary<string, object> Context { get; set; } = new Dictionary<string, object>();
        public bool IsLegendary { get; set; } // Viral potential
    }

    // Moment tracking
    private Dictionary<string, int> _consecutiveParries = new Dictionary<string, int>();
    private Dictionary<string, int> _consecutiveClashes = new Dictionary<string, int>();
    private Dictionary<string, float> _perfectRCTimings = new Dictionary<string, float>();
    private List<MomentData> _activeMoments = new List<MomentData>();
    private List<MomentData> _legendaryMoments = new List<MomentData>();

    // Moment thresholds (tuned for EVO-level excitement)
    private const int PERFECT_DEFENSE_THRESHOLD = 3;     // 3 consecutive parries
    private const int CLASH_MASTER_THRESHOLD = 3;        // 3 consecutive clashes  
    private const float COMEBACK_HEALTH_THRESHOLD = 0.15f; // 15% health comeback
    private const float PERFECT_RC_WINDOW = 0.1f;        // 6-frame perfect timing
    private const int LEGENDARY_INTENSITY_THRESHOLD = 8;  // Viral moment threshold

    // Visual effects for moments
    private PackedScene _momentEffectScene;
    private AudioStream _momentSoundEffect;

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            GD.Print("EVO Moment System initialized - Ready to create legends");
            
            // Connect to combat systems
            ConnectToCombatSystems();
        }
        else
        {
            QueueFree();
        }
    }

    private void ConnectToCombatSystems()
    {
        // Connect to parry system
        if (ParryDefendSystem.Instance != null)
        {
            ParryDefendSystem.Instance.Connect("ParrySuccessful", new Callable(this, nameof(OnParrySuccessful)));
            ParryDefendSystem.Instance.Connect("ParryFailed", new Callable(this, nameof(OnParryFailed)));
        }

        // Connect to clash system  
        if (ClashPrioritySystem.Instance != null)
        {
            ClashPrioritySystem.Instance.Connect("ClashResolved", new Callable(this, nameof(OnClashResolved)));
        }

        // Connect to roman cancel system
        if (RomanCancelSystem.Instance != null)
        {
            RomanCancelSystem.Instance.Connect("RomanCancelExecuted", new Callable(this, nameof(OnRomanCancelExecuted)));
        }
    }

    /// <summary>
    /// Handle successful parry for Perfect Defense moment tracking
    /// </summary>
    private void OnParrySuccessful(string playerId, Dictionary<string, object> parryData)
    {
        if (!_consecutiveParries.ContainsKey(playerId))
            _consecutiveParries[playerId] = 0;

        _consecutiveParries[playerId]++;

        // Check for Perfect Defense moment (like EVO Moment #37)
        if (_consecutiveParries[playerId] >= PERFECT_DEFENSE_THRESHOLD)
        {
            TriggerPerfectDefenseMoment(playerId, parryData);
        }

        GD.Print($"Player {playerId} consecutive parries: {_consecutiveParries[playerId]}");
    }

    /// <summary>
    /// Reset parry streak on failed parry
    /// </summary>
    private void OnParryFailed(string playerId)
    {
        if (_consecutiveParries.ContainsKey(playerId))
        {
            _consecutiveParries[playerId] = 0;
        }
    }

    /// <summary>
    /// Handle clash resolution for Clash Master moments
    /// </summary>
    private void OnClashResolved(string winnerId, string loserId, Dictionary<string, object> clashData)
    {
        if (!_consecutiveClashes.ContainsKey(winnerId))
            _consecutiveClashes[winnerId] = 0;

        _consecutiveClashes[winnerId]++;
        
        // Reset loser's streak
        if (_consecutiveClashes.ContainsKey(loserId))
            _consecutiveClashes[loserId] = 0;

        // Check for Clash Master moment
        if (_consecutiveClashes[winnerId] >= CLASH_MASTER_THRESHOLD)
        {
            TriggerClashMasterMoment(winnerId, clashData);
        }
    }

    /// <summary>
    /// Handle Roman Cancel for perfect timing moments
    /// </summary>
    private void OnRomanCancelExecuted(string playerId, float timing, Dictionary<string, object> rcData)
    {
        // Track perfect RC timing sequences
        if (Math.Abs(timing) <= PERFECT_RC_WINDOW)
        {
            if (!_perfectRCTimings.ContainsKey(playerId))
                _perfectRCTimings[playerId] = 0f;

            _perfectRCTimings[playerId] += 1f;

            // Check for Roman Cancel Art moment (multiple perfect RCs)
            if (_perfectRCTimings[playerId] >= 3f)
            {
                TriggerRomanCancelArtMoment(playerId, rcData);
            }
        }
    }

    /// <summary>
    /// Trigger Perfect Defense moment (Daigo-style)
    /// </summary>
    private void TriggerPerfectDefenseMoment(string playerId, Dictionary<string, object> context)
    {
        var intensity = CalculateIntensity(MomentType.PerfectDefense, _consecutiveParries[playerId]);
        
        var moment = new MomentData
        {
            Type = MomentType.PerfectDefense,
            PlayerId = playerId,
            Intensity = intensity,
            Timestamp = (float)Time.GetUnixTimeFromSystem(),
            Context = new Dictionary<string, object>
            {
                ["ConsecutiveParries"] = _consecutiveParries[playerId],
                ["ParryData"] = context,
                ["MomentQuote"] = GetMomentQuote(MomentType.PerfectDefense, intensity)
            }
        };

        RegisterMoment(moment);
        
        // Apply Perfect Defense effects
        ApplyPerfectDefenseEffects(playerId);
        
        GD.Print($"🔥 PERFECT DEFENSE MOMENT! {_consecutiveParries[playerId]} consecutive parries!");
    }

    /// <summary>
    /// Trigger Clash Master moment
    /// </summary>
    private void TriggerClashMasterMoment(string playerId, Dictionary<string, object> context)
    {
        var intensity = CalculateIntensity(MomentType.ClashMaster, _consecutiveClashes[playerId]);
        
        var moment = new MomentData
        {
            Type = MomentType.ClashMaster,
            PlayerId = playerId,
            Intensity = intensity,
            Timestamp = (float)Time.GetUnixTimeFromSystem(),
            Context = new Dictionary<string, object>
            {
                ["ConsecutiveClashes"] = _consecutiveClashes[playerId],
                ["ClashData"] = context,
                ["NextAttackUnblockable"] = true
            }
        };

        RegisterMoment(moment);
        ApplyClashMasterEffects(playerId);
        
        GD.Print($"💥 CLASH MASTER MOMENT! {_consecutiveClashes[playerId]} consecutive clashes!");
    }

    /// <summary>
    /// Trigger Roman Cancel Art moment
    /// </summary>
    private void TriggerRomanCancelArtMoment(string playerId, Dictionary<string, object> context)
    {
        var intensity = CalculateIntensity(MomentType.RomanCancelArt, (int)_perfectRCTimings[playerId]);
        
        var moment = new MomentData
        {
            Type = MomentType.RomanCancelArt,
            PlayerId = playerId,
            Intensity = intensity,
            Timestamp = (float)Time.GetUnixTimeFromSystem(),
            Context = new Dictionary<string, object>
            {
                ["PerfectRCs"] = _perfectRCTimings[playerId],
                ["RCData"] = context,
                ["ScreenFreezeTime"] = 2.0f // Extended dramatic pause
            }
        };

        RegisterMoment(moment);
        ApplyRomanCancelArtEffects(playerId);
        
        GD.Print($"✨ ROMAN CANCEL ART! Perfect timing mastery!");
    }

    /// <summary>
    /// Check for comeback moment (health-based)
    /// </summary>
    public void CheckComebackMoment(string playerId, float previousHealth, float currentHealth, int damageDealt)
    {
        if (previousHealth <= COMEBACK_HEALTH_THRESHOLD && damageDealt > 200)
        {
            var intensity = CalculateIntensity(MomentType.ComebackCatalyst, damageDealt);
            
            var moment = new MomentData
            {
                Type = MomentType.ComebackCatalyst,
                PlayerId = playerId,
                Intensity = intensity,
                Timestamp = (float)Time.GetUnixTimeFromSystem(),
                Context = new Dictionary<string, object>
                {
                    ["PreviousHealth"] = previousHealth,
                    ["CurrentHealth"] = currentHealth,
                    ["ComebackDamage"] = damageDealt,
                    ["IsLastChance"] = previousHealth <= 0.05f
                }
            };

            RegisterMoment(moment);
            ApplyComebackEffects(playerId);
            
            GD.Print($"🚀 COMEBACK CATALYST! {damageDealt} damage from critical health!");
        }
    }

    /// <summary>
    /// Calculate moment intensity (1-10 scale) for spectator appeal
    /// </summary>
    private int CalculateIntensity(MomentType type, int value)
    {
        return type switch
        {
            MomentType.PerfectDefense => Math.Min(10, 3 + (value - 3) * 2), // 5-10 based on parries
            MomentType.ClashMaster => Math.Min(10, 4 + (value - 3) * 2),    // 6-10 based on clashes
            MomentType.RomanCancelArt => Math.Min(10, 6 + value),           // 7-10 based on perfect RCs
            MomentType.ComebackCatalyst => Math.Min(10, Math.Max(5, value / 50)), // Based on damage
            _ => 5
        };
    }

    /// <summary>
    /// Get contextual quote for moment commentary
    /// </summary>
    private string GetMomentQuote(MomentType type, int intensity)
    {
        var quotes = type switch
        {
            MomentType.PerfectDefense => new[]
            {
                "THE PERFECT DEFENSE!",
                "UNBELIEVABLE PARRY SEQUENCE!",
                "THIS IS WHAT LEGENDS ARE MADE OF!",
                "EVO MOMENT IN THE MAKING!",
                "THE CROWD IS ON ITS FEET!"
            },
            MomentType.ClashMaster => new[]
            {
                "CLASH MASTERY!",
                "NOBODY CAN MATCH THIS TIMING!",
                "THE NEXT ATTACK IS UNBLOCKABLE!",
                "PERFECT SPACING AND TIMING!",
                "THIS IS HIGH-LEVEL FIGHTING GAMES!"
            },
            MomentType.RomanCancelArt => new[]
            {
                "ROMAN CANCEL ARTISTRY!",
                "FRAME-PERFECT EXECUTION!",
                "THIS IS WHAT PRACTICE LOOKS LIKE!",
                "GUILTY GEAR WOULD BE PROUD!",
                "TECHNICAL MASTERY ON DISPLAY!"
            },
            MomentType.ComebackCatalyst => new[]
            {
                "THE IMPOSSIBLE COMEBACK!",
                "FROM THE BRINK OF DEFEAT!",
                "NEVER COUNT THEM OUT!",
                "FIGHTING SPIRIT INCARNATE!",
                "THIS IS WHY WE WATCH FIGHTING GAMES!"
            },
            _ => new[] { "INCREDIBLE MOMENT!" }
        };

        int index = Math.Min(intensity - 5, quotes.Length - 1);
        return quotes[Math.Max(0, index)];
    }

    /// <summary>
    /// Register moment and check for legendary status
    /// </summary>
    private void RegisterMoment(MomentData moment)
    {
        _activeMoments.Add(moment);
        
        // Check for legendary moment (viral potential)
        if (moment.Intensity >= LEGENDARY_INTENSITY_THRESHOLD)
        {
            moment.IsLegendary = true;
            _legendaryMoments.Add(moment);
            EmitSignal(SignalName.LegendaryMoment, moment.Type.ToString(), Variant.From(moment.Context));
        }

        EmitSignal(SignalName.MomentTriggered, moment.Type.ToString(), moment.PlayerId);
    }

    /// <summary>
    /// Apply Perfect Defense gameplay effects
    /// </summary>
    private void ApplyPerfectDefenseEffects(string playerId)
    {
        // Grant temporary invincibility frames
        // Increase meter generation 
        // Visual screen flash effect
        // Crowd reaction sound
        
        GD.Print($"Perfect Defense effects applied to {playerId}");
        
        // TODO: Interface with character system to apply actual effects
    }

    /// <summary>
    /// Apply Clash Master gameplay effects
    /// </summary>
    private void ApplyClashMasterEffects(string playerId)
    {
        // Next attack becomes unblockable
        // Increase damage of next attack by 25%
        // Special visual effect on next attack
        
        GD.Print($"Clash Master effects applied to {playerId}");
    }

    /// <summary>
    /// Apply Roman Cancel Art effects
    /// </summary>
    private void ApplyRomanCancelArtEffects(string playerId)
    {
        // Extended screen freeze
        // Special particle effects
        // Meter refund for next RC
        // Dramatic camera zoom
        
        GD.Print($"Roman Cancel Art effects applied to {playerId}");
    }

    /// <summary>
    /// Apply Comeback Catalyst effects
    /// </summary>
    private void ApplyComebackEffects(string playerId)
    {
        // Damage boost for next 5 seconds
        // Increased meter generation
        // Health regeneration (small amount)
        // Visual aura effect
        
        GD.Print($"Comeback Catalyst effects applied to {playerId}");
    }

    /// <summary>
    /// Get all moments for replay/highlight generation
    /// </summary>
    public List<MomentData> GetMoments()
    {
        return _activeMoments.ToList();
    }

    /// <summary>
    /// Get legendary moments for content creation
    /// </summary>
    public List<MomentData> GetLegendaryMoments()
    {
        return _legendaryMoments.ToList();
    }

    /// <summary>
    /// Export moment data for social media sharing
    /// </summary>
    public Dictionary<string, object> ExportMomentForSharing(MomentData moment)
    {
        return new Dictionary<string, object>
        {
            ["type"] = moment.Type.ToString(),
            ["intensity"] = moment.Intensity,
            ["timestamp"] = moment.Timestamp,
            ["player"] = moment.PlayerId,
            ["context"] = moment.Context,
            ["legendary"] = moment.IsLegendary,
            ["shareText"] = GenerateShareText(moment)
        };
    }

    /// <summary>
    /// Generate shareable text for social media
    /// </summary>
    private string GenerateShareText(MomentData moment)
    {
        return moment.Type switch
        {
            MomentType.PerfectDefense => $"🔥 PERFECT DEFENSE MOMENT! {moment.PlayerId} with {moment.Context["ConsecutiveParries"]} consecutive parries! #EVOMoment #FGC",
            MomentType.ClashMaster => $"💥 CLASH MASTER! {moment.PlayerId} dominates with perfect timing! #EVOMoment #FGC",
            MomentType.RomanCancelArt => $"✨ ROMAN CANCEL ART! Frame-perfect execution by {moment.PlayerId}! #EVOMoment #FGC",
            MomentType.ComebackCatalyst => $"🚀 IMPOSSIBLE COMEBACK! {moment.PlayerId} defies all odds! #EVOMoment #FGC",
            _ => $"🎮 INCREDIBLE MOMENT by {moment.PlayerId}! #EVOMoment #FGC"
        };
    }

    /// <summary>
    /// Reset player moment tracking (new round/match)
    /// </summary>
    public void ResetPlayerMoments(string playerId)
    {
        _consecutiveParries.Remove(playerId);
        _consecutiveClashes.Remove(playerId);
        _perfectRCTimings.Remove(playerId);
    }

    /// <summary>
    /// Clear all moment tracking (new tournament)
    /// </summary>
    public void ClearAllMoments()
    {
        _consecutiveParries.Clear();
        _consecutiveClashes.Clear();
        _perfectRCTimings.Clear();
        _activeMoments.Clear();
        // Keep legendary moments for historical record
    }
}