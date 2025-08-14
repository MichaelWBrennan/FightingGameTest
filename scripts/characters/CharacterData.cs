using System.Collections.Generic;
using System.Text.Json.Serialization;

/// <summary>
/// Enhanced data structure for character information with archetype system
/// </summary>
public class CharacterData
{
    [JsonPropertyName("characterId")]
    public string CharacterId { get; set; } = "";
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("archetype")]
    public string Archetype { get; set; } = ""; // shoto, rushdown, grappler, zoner, technical
    
    [JsonPropertyName("complexity")]
    public string Complexity { get; set; } = ""; // easy, medium, hard, expert
    
    [JsonPropertyName("counterplayTags")]
    public List<string> CounterplayTags { get; set; } = new();
    
    [JsonPropertyName("meterInteractions")]
    public List<string> MeterInteractions { get; set; } = new();
    
    [JsonPropertyName("uniqueMechanics")]
    public List<string> UniqueMechanics { get; set; } = new();
    
    [JsonPropertyName("health")]
    public int Health { get; set; } = 1000;
    
    [JsonPropertyName("meter")]
    public int Meter { get; set; } = 100;
    
    [JsonPropertyName("walkSpeed")]
    public float WalkSpeed { get; set; } = 150f;
    
    [JsonPropertyName("runSpeed")]
    public float RunSpeed { get; set; } = 250f;
    
    [JsonPropertyName("jumpHeight")]
    public float JumpHeight { get; set; } = 300f;
    
    [JsonPropertyName("airDashSpeed")]
    public float AirDashSpeed { get; set; } = 200f;
    
    [JsonPropertyName("dashDistance")]
    public float DashDistance { get; set; } = 120f;
    
    [JsonPropertyName("maxAirDashes")]
    public int MaxAirDashes { get; set; } = 1;
    
    [JsonPropertyName("weight")]
    public int Weight { get; set; } = 100;
    
    [JsonPropertyName("dlcCharacter")]
    public bool DlcCharacter { get; set; } = false;
    
    [JsonPropertyName("releaseDate")]
    public string ReleaseDate { get; set; } = "";
    
    [JsonPropertyName("balancePatch")]
    public string BalancePatch { get; set; } = "";
    
    [JsonPropertyName("animations")]
    public AnimationData Animations { get; set; } = new();
    
    [JsonPropertyName("moves")]
    public MovesetData Moves { get; set; } = new();
    
    [JsonPropertyName("comboRoutes")]
    public List<ComboRoute> ComboRoutes { get; set; } = new();
    
    [JsonPropertyName("subArchetypes")]
    public List<SubArchetypeData> SubArchetypes { get; set; } = new();
}

public class AnimationData
{
    [JsonPropertyName("idle")]
    public string Idle { get; set; } = "";
    
    [JsonPropertyName("walkForward")]
    public string WalkForward { get; set; } = "";
    
    [JsonPropertyName("walkBackward")]
    public string WalkBackward { get; set; } = "";
    
    [JsonPropertyName("jump")]
    public string Jump { get; set; } = "";
    
    [JsonPropertyName("crouch")]
    public string Crouch { get; set; } = "";
    
    [JsonPropertyName("block")]
    public string Block { get; set; } = "";
    
    [JsonPropertyName("crouchBlock")]
    public string CrouchBlock { get; set; } = "";
    
    [JsonPropertyName("hit")]
    public string Hit { get; set; } = "";
    
    [JsonPropertyName("knockdown")]
    public string Knockdown { get; set; } = "";
    
    [JsonPropertyName("dash")]
    public string Dash { get; set; } = "";
    
    [JsonPropertyName("airDash")]
    public string AirDash { get; set; } = "";
    
    [JsonPropertyName("wakeup")]
    public string Wakeup { get; set; } = "";
}

public class MovesetData
{
    [JsonPropertyName("normals")]
    public Dictionary<string, MoveData> Normals { get; set; } = new();
    
    [JsonPropertyName("specials")]
    public Dictionary<string, MoveData> Specials { get; set; } = new();
    
    [JsonPropertyName("supers")]
    public Dictionary<string, MoveData> Supers { get; set; } = new();
}

public class MoveData
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    
    [JsonPropertyName("input")]
    public string Input { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("damage")]
    public int Damage { get; set; } = 0;
    
    [JsonPropertyName("startupFrames")]
    public int StartupFrames { get; set; } = 0;
    
    [JsonPropertyName("activeFrames")]
    public int ActiveFrames { get; set; } = 0;
    
    [JsonPropertyName("recoveryFrames")]
    public int RecoveryFrames { get; set; } = 0;
    
    [JsonPropertyName("blockAdvantage")]
    public int BlockAdvantage { get; set; } = 0;
    
    [JsonPropertyName("hitAdvantage")]
    public int HitAdvantage { get; set; } = 0;
    
    [JsonPropertyName("meterCost")]
    public int MeterCost { get; set; } = 0;
    
    [JsonPropertyName("comboType")]
    public string ComboType { get; set; } = ""; // opener, linker, ender
    
    [JsonPropertyName("properties")]
    public List<string> Properties { get; set; } = new();
    
    [JsonPropertyName("hitboxes")]
    public List<HitboxData> Hitboxes { get; set; } = new();
    
    [JsonPropertyName("projectile")]
    public ProjectileData Projectile { get; set; }
}

public class HitboxData
{
    [JsonPropertyName("startFrame")]
    public int StartFrame { get; set; } = 0;
    
    [JsonPropertyName("endFrame")]
    public int EndFrame { get; set; } = 0;
    
    [JsonPropertyName("position")]
    public List<float> Position { get; set; } = new() { 0, 0 };
    
    [JsonPropertyName("size")]
    public List<float> Size { get; set; } = new() { 0, 0 };
    
    [JsonPropertyName("damage")]
    public int Damage { get; set; } = 0;
    
    [JsonPropertyName("hitstun")]
    public int Hitstun { get; set; } = 0;
    
    [JsonPropertyName("blockstun")]
    public int Blockstun { get; set; } = 0;
    
    [JsonPropertyName("knockdown")]
    public bool Knockdown { get; set; } = false;
    
    [JsonPropertyName("hits")]
    public int Hits { get; set; } = 1;
}

public class ProjectileData
{
    [JsonPropertyName("speed")]
    public float Speed { get; set; } = 300f;
    
    [JsonPropertyName("lifetime")]
    public int Lifetime { get; set; } = 120;
    
    [JsonPropertyName("size")]
    public List<float> Size { get; set; } = new() { 40, 20 };
    
    [JsonPropertyName("damage")]
    public int Damage { get; set; } = 100;
    
    [JsonPropertyName("hitstun")]
    public int Hitstun { get; set; } = 18;
    
    [JsonPropertyName("blockstun")]
    public int Blockstun { get; set; } = 12;
    
    [JsonPropertyName("hits")]
    public int Hits { get; set; } = 1;
}

public class ComboRoute
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    
    [JsonPropertyName("inputs")]
    public List<string> Inputs { get; set; } = new();
    
    [JsonPropertyName("damage")]
    public int Damage { get; set; } = 0;
    
    [JsonPropertyName("difficulty")]
    public string Difficulty { get; set; } = ""; // easy, medium, hard
}

/// <summary>
/// Represents a sub-archetype variation of a character (e.g., Traditional Shoto, Aggressive Shoto, Technical Shoto)
/// </summary>
public class SubArchetypeData
{
    [JsonPropertyName("subArchetypeId")]
    public string SubArchetypeId { get; set; } = "";
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; } = false;
    
    [JsonPropertyName("statModifiers")]
    public StatModifiers StatModifiers { get; set; } = new();
    
    [JsonPropertyName("moveModifiers")]
    public Dictionary<string, MoveModifiers> MoveModifiers { get; set; } = new();
    
    [JsonPropertyName("uniqueMechanicChanges")]
    public List<string> UniqueMechanicChanges { get; set; } = new();
    
    [JsonPropertyName("additionalMoves")]
    public Dictionary<string, MoveData> AdditionalMoves { get; set; } = new();
}

/// <summary>
/// Stat modifications for sub-archetypes (applied as multipliers or flat bonuses)
/// </summary>
public class StatModifiers
{
    [JsonPropertyName("healthMultiplier")]
    public float HealthMultiplier { get; set; } = 1.0f;
    
    [JsonPropertyName("walkSpeedMultiplier")]
    public float WalkSpeedMultiplier { get; set; } = 1.0f;
    
    [JsonPropertyName("runSpeedMultiplier")]
    public float RunSpeedMultiplier { get; set; } = 1.0f;
    
    [JsonPropertyName("jumpHeightMultiplier")]
    public float JumpHeightMultiplier { get; set; } = 1.0f;
    
    [JsonPropertyName("weightMultiplier")]
    public float WeightMultiplier { get; set; } = 1.0f;
}

/// <summary>
/// Move-specific modifications for sub-archetypes
/// </summary>
public class MoveModifiers
{
    [JsonPropertyName("damageMultiplier")]
    public float DamageMultiplier { get; set; } = 1.0f;
    
    [JsonPropertyName("startupFrameBonus")]
    public int StartupFrameBonus { get; set; } = 0; // Negative makes move faster
    
    [JsonPropertyName("recoveryFrameBonus")]
    public int RecoveryFrameBonus { get; set; } = 0; // Negative makes move safer
    
    [JsonPropertyName("blockAdvantageBonus")]
    public int BlockAdvantageBonus { get; set; } = 0;
    
    [JsonPropertyName("hitAdvantageBonus")]
    public int HitAdvantageBonus { get; set; } = 0;
    
    [JsonPropertyName("addedProperties")]
    public List<string> AddedProperties { get; set; } = new();
    
    [JsonPropertyName("removedProperties")]
    public List<string> RemovedProperties { get; set; } = new();
}