using Godot;
using System;

/// <summary>
/// Test script to verify sprite loading system works with generated sprites
/// </summary>
public partial class SpriteLoadingTest : Node
{
    public override void _Ready()
    {
        GD.Print("=== SPRITE LOADING SYSTEM TEST ===");
        
        string[] characters = { "ryu", "ken", "chun_li", "zangief", "sagat", "lei_wulong" };
        string[] poses = { "idle", "walk", "attack", "jump" };
        
        int totalSprites = 0;
        int loadedSprites = 0;
        int enhancedSprites = 0;
        
        foreach (string character in characters)
        {
            GD.Print($"\nTesting {character}:");
            
            foreach (string pose in poses)
            {
                totalSprites++;
                
                // Test enhanced sprite loading (priority)
                string enhancedPath = $"res://assets/sprites/street_fighter_6/{character}/sprites/{character}_{pose}_enhanced.png";
                string originalPath = $"res://assets/sprites/street_fighter_6/{character}/sprites/{character}_{pose}.png";
                
                string selectedPath = ResourceLoader.Exists(enhancedPath) ? enhancedPath : originalPath;
                
                if (ResourceLoader.Exists(selectedPath))
                {
                    var texture = GD.Load<Texture2D>(selectedPath);
                    if (texture != null)
                    {
                        loadedSprites++;
                        bool isEnhanced = selectedPath.Contains("_enhanced");
                        if (isEnhanced) enhancedSprites++;
                        
                        Vector2 size = texture.GetSize();
                        string quality = isEnhanced ? "ENHANCED" : "Original";
                        GD.Print($"  ✅ {pose}: {quality} ({size.X}x{size.Y}) - {selectedPath}");
                    }
                    else
                    {
                        GD.Print($"  ❌ {pose}: Failed to load texture from {selectedPath}");
                    }
                }
                else
                {
                    GD.Print($"  ❌ {pose}: File not found - {selectedPath}");
                }
            }
        }
        
        GD.Print("\n=== TEST RESULTS ===");
        GD.Print($"Total sprites tested: {totalSprites}");
        GD.Print($"Successfully loaded: {loadedSprites}");
        GD.Print($"Enhanced quality: {enhancedSprites}");
        GD.Print($"Original quality: {loadedSprites - enhancedSprites}");
        GD.Print($"Success rate: {(float)loadedSprites / totalSprites * 100:F1}%");
        GD.Print($"Enhancement rate: {(float)enhancedSprites / totalSprites * 100:F1}%");
        
        if (loadedSprites == totalSprites && enhancedSprites == totalSprites)
        {
            GD.Print("🎉 PERFECT! All sprites loaded successfully with enhanced quality!");
        }
        else if (loadedSprites == totalSprites)
        {
            GD.Print("✅ All sprites loaded successfully!");
        }
        else
        {
            GD.Print("⚠️ Some sprites failed to load.");
        }
        
        // Test smart loading system (Character.cs style)
        GD.Print("\n=== SMART LOADING SYSTEM TEST ===");
        TestSmartLoading("ryu", "idle");
        TestSmartLoading("ken", "walk");
        TestSmartLoading("chun_li", "attack");
    }
    
    private void TestSmartLoading(string characterId, string state)
    {
        // Simulate Character.cs LoadSpriteForState method
        string spriteFileName = $"{characterId}_{state}.png";
        
        // Try enhanced version first, fallback to original
        string enhancedSpritePath = $"res://assets/sprites/street_fighter_6/{characterId}/sprites/{spriteFileName.Replace(".png", "_enhanced.png")}";
        string originalSpritePath = $"res://assets/sprites/street_fighter_6/{characterId}/sprites/{spriteFileName}";
        
        string spritePath = ResourceLoader.Exists(enhancedSpritePath) ? enhancedSpritePath : originalSpritePath;
        
        if (ResourceLoader.Exists(spritePath))
        {
            var texture = GD.Load<Texture2D>(spritePath);
            if (texture != null)
            {
                Vector2 size = texture.GetSize();
                bool isEnhanced = spritePath.Contains("_enhanced");
                string quality = isEnhanced ? "Enhanced" : "Original";
                GD.Print($"Smart Loading: {characterId} {state} -> {quality} ({size.X}x{size.Y})");
            }
        }
        else
        {
            GD.Print($"Smart Loading FAILED: {spritePath}");
        }
    }
}