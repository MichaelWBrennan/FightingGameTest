using System;
using System.Collections.Generic;

/// <summary>
/// Data structures for Gothic 2.5D stage system
/// </summary>
[Serializable]
public class StageData
{
    public string StageId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Theme { get; set; }
    public string Atmosphere { get; set; }
    
    public StageLightingData Lighting { get; set; }
    public CameraData Camera { get; set; }
    public GroundData Ground { get; set; }
    
    public List<LayerData> BackgroundLayers { get; set; }
    public List<LayerData> ForegroundLayers { get; set; }
    public List<ParticleEffectData> ParticleEffects { get; set; }
    
    public AudioData Audio { get; set; }
    public List<SpecialEffectData> SpecialEffects { get; set; }
    public BalancingData Balancing { get; set; }
}

[Serializable]
public class StageLightingData
{
    public float[] AmbientColor { get; set; } = { 0.2f, 0.2f, 0.3f, 1.0f };
    public float[] MainLightColor { get; set; } = { 1.0f, 1.0f, 1.0f, 1.0f };
    public float[] MainLightDirection { get; set; } = { -0.5f, -1.0f, 0.2f };
    public float ShadowIntensity { get; set; } = 0.8f;
    public bool EnableDynamicLighting { get; set; } = true;
    public bool StainedGlassLighting { get; set; } = false;
    public bool Moonlighting { get; set; } = false;
    public bool CandleLighting { get; set; } = false;
    public bool Flickering { get; set; } = false;
}

[Serializable]
public class CameraData
{
    public float BoundaryLeft { get; set; } = -800f;
    public float BoundaryRight { get; set; } = 800f;
    public float BoundaryTop { get; set; } = -400f;
    public float BoundaryBottom { get; set; } = 200f;
    public float DefaultZoom { get; set; } = 1.0f;
    public float MaxZoom { get; set; } = 1.5f;
    public float MinZoom { get; set; } = 0.6f;
    public float FollowSmoothness { get; set; } = 0.1f;
}

[Serializable]
public class GroundData
{
    public float Height { get; set; } = 0f;
    public float Friction { get; set; } = 1.0f;
    public string Material { get; set; } = "stone";
    public GroundBounds Bounds { get; set; } = new();
}

[Serializable]
public class GroundBounds
{
    public float Left { get; set; } = -600f;
    public float Right { get; set; } = 600f;
}

[Serializable]
public class LayerData
{
    public string Name { get; set; }
    public float Depth { get; set; }
    public float ParallaxMultiplier { get; set; }
    public string TexturePath { get; set; }
    public float[] Position { get; set; } = { 0f, 0f };
    public float[] Scale { get; set; } = { 1.0f, 1.0f };
    public float[] Tint { get; set; } = { 1.0f, 1.0f, 1.0f, 1.0f };
    public string Shader { get; set; }
    public string BlendMode { get; set; } = "mix";
    
    public bool AtmosphericPerspective { get; set; } = false;
    public bool EnableLighting { get; set; } = false;
    public bool ShadowCasting { get; set; } = false;
    public bool EnableAnimatedLighting { get; set; } = false;
    
    public LayerAnimationData Animation { get; set; }
    public LightingAnimationData LightingAnimation { get; set; }
}

[Serializable]
public class LayerAnimationData
{
    public string Type { get; set; } // "float", "sway", "scroll", "pulse_glow", etc.
    public float Amplitude { get; set; } = 10f;
    public float Speed { get; set; } = 1.0f;
    public float[] Direction { get; set; } = { 1f, 0f };
}

[Serializable]
public class LightingAnimationData
{
    public bool ColorShift { get; set; } = false;
    public bool IntensityPulse { get; set; } = false;
    public bool Flicker { get; set; } = false;
    public float[] Intensity { get; set; } = { 0.8f, 1.2f };
    public float Speed { get; set; } = 1.0f;
}

[Serializable]
public class ParticleEffectData
{
    public string Name { get; set; }
    public string Type { get; set; } // "ambient", "environmental", "combat"
    public float[] Position { get; set; } = { 0f, 0f };
    public string ParticleType { get; set; } // "Dust", "Smoke", "Embers", etc.
    public EmissionData Emission { get; set; } = new();
    public ParticlePropertiesData Properties { get; set; } = new();
}

[Serializable]
public class EmissionData
{
    public int Amount { get; set; } = 50;
    public float Rate { get; set; } = 1.0f;
}

[Serializable]
public class ParticlePropertiesData
{
    public float[] Scale { get; set; } = { 0.5f, 1.5f };
    public float[] Speed { get; set; } = { 10f, 30f };
    public float[] Lifetime { get; set; } = { 3.0f, 6.0f };
    public float[] Color { get; set; } = { 1.0f, 1.0f, 1.0f, 0.5f };
    public float[] Gravity { get; set; } = { 0f, 0f };
    public bool ColorVariation { get; set; } = false;
    public bool FloatingMotion { get; set; } = false;
}

[Serializable]
public class AudioData
{
    public string AmbientTrack { get; set; }
    public string MusicTrack { get; set; }
    public List<string> CombatStingers { get; set; } = new();
    public float AmbientVolume { get; set; } = 0.3f;
    public float MusicVolume { get; set; } = 0.6f;
    public ReverbData Reverb { get; set; } = new();
}

[Serializable]
public class ReverbData
{
    public float RoomSize { get; set; } = 0.8f;
    public float Damping { get; set; } = 0.3f;
    public float WetLevel { get; set; } = 0.5f;
}

[Serializable]
public class SpecialEffectData
{
    public string Name { get; set; }
    public string Trigger { get; set; } // "super_move", "combo_hit", "low_health", etc.
    public string Effect { get; set; } // Effect type
    public float Duration { get; set; } = 1.0f;
    public float[] Color { get; set; } = { 1.0f, 1.0f, 1.0f, 1.0f };
    public string FollowUp { get; set; }
    public string TargetLayer { get; set; }
    public List<string> TargetLayers { get; set; }
    public float Intensity { get; set; } = 1.0f;
    public float GlowIntensity { get; set; } = 1.5f;
    public float[] GlowColor { get; set; } = { 1.0f, 1.0f, 1.0f, 0.5f };
    public string ParticleType { get; set; }
    public float ShakeIntensity { get; set; } = 5.0f;
}

[Serializable]
public class BalancingData
{
    public bool CompetitiveViable { get; set; } = true;
    public bool Asymmetrical { get; set; } = false;
    public bool Hazards { get; set; } = false;
    public bool Interactables { get; set; } = false;
}