using Godot;
using System;

/// <summary>
/// Test script for validating procedural stage generation system
/// Tests FGC compliance and integration with existing systems
/// </summary>
public partial class ProceduralStageTest : Node2D
{
    private StageManager _stageManager;
    private ProceduralStageGenerator _proceduralGenerator;
    private Label _statusLabel;
    private VBoxContainer _testResults;
    
    public override void _Ready()
    {
        // Create UI for test results
        var ui = new CanvasLayer();
        AddChild(ui);
        
        var vbox = new VBoxContainer();
        vbox.Position = new Vector2(50, 50);
        ui.AddChild(vbox);
        
        var titleLabel = new Label();
        titleLabel.Text = "Procedural Stage Generation Tests";
        vbox.AddChild(titleLabel);
        
        _statusLabel = new Label();
        _statusLabel.Text = "Initializing...";
        vbox.AddChild(_statusLabel);
        
        _testResults = new VBoxContainer();
        vbox.AddChild(_testResults);
        
        // Wait for systems to initialize
        CallDeferred(nameof(RunTests));
    }
    
    private void RunTests()
    {
        _statusLabel.Text = "Running tests...";
        
        // Get system references
        _stageManager = StageManager.Instance;
        _proceduralGenerator = ProceduralStageGenerator.Instance;
        
        if (_stageManager == null || _proceduralGenerator == null)
        {
            AddTestResult("FAILED: Required systems not initialized", false);
            return;
        }
        
        // Run test suite
        TestFGCStageElementLibrary();
        TestProceduralGeneration();
        TestStyleConsistency();
        TestPerformance();
        TestCompetitiveViability();
        
        _statusLabel.Text = "Tests completed!";
    }
    
    private void TestFGCStageElementLibrary()
    {
        AddTestResult("=== FGC Stage Element Library Tests ===", true);
        
        try
        {
            // Test background elements
            var backgroundElements = FGCStageElements.GetElementsByCategory("background");
            AddTestResult($"Background elements loaded: {backgroundElements.Count}", backgroundElements.Count > 0);
            
            // Test SF2 precedents
            var sf2Elements = FGCStageElements.GetElementsByPrecedent("Street Fighter II");
            AddTestResult($"SF2 precedent elements: {sf2Elements.Count}", sf2Elements.Count > 0);
            
            // Test theme filtering
            var dojoElements = FGCStageElements.GetElementsByTheme("dojo");
            AddTestResult($"Dojo theme elements: {dojoElements.Count}", dojoElements.Count > 0);
            
            // Verify all elements have proper FGC precedents
            bool allHavePrecedents = true;
            foreach (var element in backgroundElements)
            {
                if (string.IsNullOrEmpty(element.FGCPrecedent))
                {
                    allHavePrecedents = false;
                    break;
                }
            }
            AddTestResult("All elements have FGC precedents", allHavePrecedents);
            
        }
        catch (Exception e)
        {
            AddTestResult($"FGC library test failed: {e.Message}", false);
        }
    }
    
    private void TestProceduralGeneration()
    {
        AddTestResult("=== Procedural Generation Tests ===", true);
        
        try
        {
            // Test classic SF2 style stage
            var classicConfig = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "classic",
                TimeOfDay = "day",
                Mood = "neutral"
            };
            
            var classicStage = _proceduralGenerator.GenerateStage(classicConfig, "test_classic");
            AddTestResult("Classic stage generation", classicStage != null);
            AddTestResult($"Classic stage name: {classicStage?.Name}", !string.IsNullOrEmpty(classicStage?.Name));
            
            // Test urban 3rd Strike style stage  
            var urbanConfig = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "urban",
                TimeOfDay = "night",
                Mood = "intense"
            };
            
            var urbanStage = _proceduralGenerator.GenerateStage(urbanConfig, "test_urban");
            AddTestResult("Urban stage generation", urbanStage != null);
            
            // Test tournament Tekken style stage
            var tournamentConfig = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "tournament",
                TimeOfDay = "dynamic",
                Mood = "dramatic",
                CrowdIntensity = 0.8f
            };
            
            var tournamentStage = _proceduralGenerator.GenerateStage(tournamentConfig, "test_tournament");
            AddTestResult("Tournament stage generation", tournamentStage != null);
            AddTestResult("Tournament stage has crowd effects", tournamentStage?.SpecialEffects?.Count > 0);
            
            // Test stage data completeness
            if (classicStage != null)
            {
                AddTestResult("Stage has lighting data", classicStage.Lighting != null);
                AddTestResult("Stage has camera data", classicStage.Camera != null);
                AddTestResult("Stage has ground data", classicStage.Ground != null);
                AddTestResult("Stage has background layers", classicStage.BackgroundLayers?.Count > 0);
                AddTestResult("Stage is competitively viable", classicStage.Balancing?.CompetitiveViable == true);
            }
            
        }
        catch (Exception e)
        {
            AddTestResult($"Procedural generation test failed: {e.Message}", false);
        }
    }
    
    private void TestStyleConsistency()
    {
        AddTestResult("=== Style Consistency Tests ===", true);
        
        try
        {
            // Test palette integration
            var ryuConfig = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "classic",
                TimeOfDay = "day",
                CharacterContext = "ryu"
            };
            ryuConfig.CustomParameters["primary_palette"] = "ryu";
            
            var ryuStage = _proceduralGenerator.GenerateStage(ryuConfig, "test_ryu_stage");
            AddTestResult("Character-specific stage generation", ryuStage != null);
            
            // Test Ken palette integration
            var kenConfig = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "classic", 
                TimeOfDay = "day",
                CharacterContext = "ken"
            };
            kenConfig.CustomParameters["primary_palette"] = "ken";
            
            var kenStage = _proceduralGenerator.GenerateStage(kenConfig, "test_ken_stage");
            AddTestResult("Ken palette stage generation", kenStage != null);
            
            // Verify stages have different characteristics but same structure
            if (ryuStage != null && kenStage != null)
            {
                bool sameStructure = ryuStage.BackgroundLayers?.Count == kenStage.BackgroundLayers?.Count;
                AddTestResult("Consistent stage structure across palettes", sameStructure);
            }
            
        }
        catch (Exception e)
        {
            AddTestResult($"Style consistency test failed: {e.Message}", false);
        }
    }
    
    private void TestPerformance()
    {
        AddTestResult("=== Performance Tests ===", true);
        
        try
        {
            var performanceStats = _proceduralGenerator.GetPerformanceStats();
            AddTestResult($"Cache system operational", performanceStats.Count > 0);
            
            if (performanceStats.ContainsKey("avg_generation_time"))
            {
                var avgTime = (float)performanceStats["avg_generation_time"];
                AddTestResult($"Average generation time: {avgTime:F3}s", avgTime < 1.0f);
            }
            
            if (performanceStats.ContainsKey("cache_hit_ratio"))
            {
                var hitRatio = (float)performanceStats["cache_hit_ratio"];
                AddTestResult($"Cache hit ratio: {hitRatio:F2}", true);
            }
            
            // Test cache functionality by generating same stage twice
            var config = new ProceduralStageGenerator.ProceduralStageConfig
            {
                Theme = "classic",
                TimeOfDay = "day"
            };
            
            var firstGeneration = _proceduralGenerator.GenerateStage(config, "cache_test");
            var secondGeneration = _proceduralGenerator.GenerateStage(config, "cache_test");
            
            AddTestResult("Cache retrieval functional", firstGeneration != null && secondGeneration != null);
            
        }
        catch (Exception e)
        {
            AddTestResult($"Performance test failed: {e.Message}", false);
        }
    }
    
    private void TestCompetitiveViability()
    {
        AddTestResult("=== Competitive Viability Tests ===", true);
        
        try
        {
            // Generate various stages and check competitive compliance
            var themes = new[] { "classic", "urban", "dojo", "tournament" };
            
            foreach (var theme in themes)
            {
                var config = new ProceduralStageGenerator.ProceduralStageConfig
                {
                    Theme = theme,
                    TimeOfDay = "day",
                    Mood = "neutral"
                };
                
                var stage = _proceduralGenerator.GenerateStage(config, $"competitive_test_{theme}");
                
                if (stage != null)
                {
                    // Check competitive viability flags
                    bool competitive = stage.Balancing?.CompetitiveViable == true;
                    bool noHazards = stage.Balancing?.Hazards == false;
                    bool balanced = stage.Balancing?.Asymmetrical == false;
                    
                    AddTestResult($"{theme} stage competitive viability", competitive);
                    AddTestResult($"{theme} stage no hazards", noHazards);
                    AddTestResult($"{theme} stage balanced design", balanced);
                    
                    // Check camera bounds are reasonable
                    bool reasonableBounds = stage.Camera != null &&
                                          Math.Abs(stage.Camera.BoundaryLeft) <= 1000f &&
                                          Math.Abs(stage.Camera.BoundaryRight) <= 1000f;
                    AddTestResult($"{theme} stage reasonable camera bounds", reasonableBounds);
                }
                else
                {
                    AddTestResult($"{theme} stage generation failed", false);
                }
            }
            
        }
        catch (Exception e)
        {
            AddTestResult($"Competitive viability test failed: {e.Message}", false);
        }
    }
    
    private void AddTestResult(string testName, bool passed)
    {
        var label = new Label();
        label.Text = $"{(passed ? "✓" : "✗")} {testName}";
        label.Modulate = passed ? Colors.Green : Colors.Red;
        _testResults.AddChild(label);
        
        GD.Print($"[TEST] {label.Text}");
    }
    
    public override void _Input(InputEvent @event)
    {
        if (@event is InputEventKey keyEvent && keyEvent.Pressed)
        {
            switch (keyEvent.Keycode)
            {
                case Key.T:
                    // Test contextual stage loading
                    if (_stageManager != null)
                    {
                        _stageManager.LoadContextualStage("ryu", "tournament");
                        GD.Print("Loaded contextual tournament stage for Ryu");
                    }
                    break;
                    
                case Key.P:
                    // Test palette-based stage loading
                    if (_stageManager != null)
                    {
                        _stageManager.LoadStageForSpriteStyle("ken");
                        GD.Print("Loaded palette-matched stage for Ken");
                    }
                    break;
                    
                case Key.C:
                    // Clear all caches
                    if (_proceduralGenerator != null)
                    {
                        // We'd need to implement cache clearing in the generator
                        GD.Print("Cache clearing would be triggered here");
                    }
                    break;
            }
        }
    }
}