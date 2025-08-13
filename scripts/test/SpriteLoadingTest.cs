using Godot;

/// <summary>
/// Simple test to verify sprite loading functionality without running the full game
/// </summary>
public partial class SpriteLoadingTestStatic : GodotObject
{
    public static void RunTest()
    {
        GD.Print("=== Sprite Loading Test ===");
        
        string[] characters = { "ryu", "ken", "chun_li", "zangief", "lei_wulong", "sagat" };
        string[] poses = { "idle", "walk", "attack", "jump" };
        
        int successCount = 0;
        int totalTests = 0;
        
        foreach (string character in characters)
        {
            GD.Print($"\nTesting sprites for {character}:");
            
            foreach (string pose in poses)
            {
                totalTests++;
                string spritePath = $"res://assets/sprites/street_fighter_6/{character}/sprites/{character}_{pose}.png";
                
                if (ResourceLoader.Exists(spritePath))
                {
                    var texture = GD.Load<Texture2D>(spritePath);
                    if (texture != null)
                    {
                        GD.Print($"  ✓ {character}_{pose}.png loaded successfully");
                        successCount++;
                    }
                    else
                    {
                        GD.Print($"  ✗ Failed to load texture: {character}_{pose}.png");
                    }
                }
                else
                {
                    GD.Print($"  ✗ Sprite file not found: {spritePath}");
                }
            }
        }
        
        GD.Print($"\n=== Test Results ===");
        GD.Print($"Passed: {successCount}/{totalTests}");
        GD.Print($"Success Rate: {(float)successCount / totalTests * 100:F1}%");
        
        if (successCount == totalTests)
        {
            GD.Print("🎉 ALL SPRITE LOADING TESTS PASSED!");
        }
        else
        {
            GD.Print("❌ Some sprite loading tests failed");
        }
    }
}