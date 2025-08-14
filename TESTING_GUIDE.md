# Real-Time Sprite Generation - Testing & Validation Guide

## Overview

This guide provides comprehensive testing procedures to validate the real-time procedural sprite generation system for fighting game characters.

## Quick Start Testing

### 1. Demo Scene Testing
Run the interactive demo scene to test all features:

```
Open: res://scenes/demo/RealtimeSpriteDemo.tscn
```

**Expected Results:**
- Character sprite appears in center of screen
- All UI controls respond and update the sprite in real-time
- Performance monitor shows generation times under 16ms
- Cache hit ratio should improve to >80% after a few seconds

### 2. Character Integration Testing
Test with existing Character.cs system:

```csharp
// In any scene with a Character node
character.UseRealtimeSprites = true;
character.UseEnhancedQuality = true;
character.ToggleRealtimeSprites(true);
```

**Expected Results:**
- Character automatically switches to real-time sprite generation
- State changes trigger appropriate animations
- Performance remains at 60 FPS during gameplay

## Detailed Testing Procedures

### Performance Testing

#### Frame Rate Validation
1. Enable real-time sprites on multiple characters
2. Monitor FPS using Godot's debug overlay (Debug > Visible Collision Shapes)
3. **Expected**: Consistent 60 FPS with 2-4 characters using real-time sprites

#### Generation Time Testing
```gdscript
# Monitor generation performance
var stats = character.GetSpriteGenerationStats()
print("Average generation: ", stats["avg_generation_time_ms"], "ms")
print("Max generation: ", stats["max_generation_time_ms"], "ms")
```

**Expected Values:**
- Average: 2-5 ms for standard quality, 5-8 ms for enhanced
- Maximum: Under 12 ms (performance budget skip threshold)
- 60 FPS budget: 16.67 ms total per frame

#### Memory Usage Testing
```gdscript
# Test cache memory usage
var stats = character.GetSpriteGenerationStats()
print("Cache size: ", stats["cache_size"], " frames")
print("Cache hit ratio: ", stats["cache_hit_ratio"] * 100, "%")

# Test memory cleanup
character.ClearSpriteCache()
```

**Expected Values:**
- Cache size: 50-100 frames maximum
- Hit ratio: 85-95% during normal gameplay
- Memory usage: ~300 KB maximum per character

### Visual Quality Testing

#### Sprite Appearance Validation
1. Generate sprites for all character states (idle, walk, jump, etc.)
2. Compare visual quality to Street Fighter II reference sprites
3. Verify consistent character silhouette and proportions

**Quality Checklist:**
- [ ] Character maintains recognizable shape across all animations
- [ ] Limbs are proportional and properly connected
- [ ] Colors are consistent with selected palette
- [ ] Enhanced quality shows improved detail over standard quality

#### Animation Smoothness Testing
1. Switch between character states rapidly
2. Observe animation transitions and frame timing
3. Test looping animations (idle, walk) for seamless cycles

**Expected Results:**
- Smooth transitions between states (no jarring jumps)
- Consistent frame timing matching specified FPS
- Looping animations cycle seamlessly

#### Color Palette Testing
Test all available palettes for each character:

```csharp
string[] palettes = {"default", "ryu", "ken", "chun_li", "zangief", "sagat"};
foreach(string palette in palettes) {
    character.SetSpritePalette(palette);
    // Wait and observe visual changes
}
```

**Expected Results:**
- Instant palette changes without performance impact
- Colors remain consistent across animation frames
- No visual artifacts during palette transitions

### Character Customization Testing

#### Proportion Adjustment Testing
```csharp
// Test extreme values
character.SetCharacterProportions(2.0f, 0.5f, 1.8f);  // Max limbs, min head, wide body
character.SetCharacterProportions(0.5f, 2.0f, 0.6f);  // Min limbs, max head, thin body
character.SetCharacterProportions(1.0f, 1.0f, 1.0f);  // Reset to normal
```

**Expected Results:**
- Visible changes in character proportions
- Proportions maintained across all animation states
- No visual breaking or disconnected limbs

#### Real-time Customization Testing
1. Use demo scene sliders to adjust proportions in real-time
2. Change palettes while animations are playing
3. Switch between quality modes during active animations

**Expected Results:**
- All changes apply instantly without stopping animations
- No frame drops or stuttering during adjustments
- Settings persist across state changes

### Integration Testing

#### Character.cs State Machine Integration
Test automatic sprite updates when character state changes:

```csharp
character.ChangeState(CharacterState.Walking);
// Should automatically generate walking animation

character.ChangeState(CharacterState.Jumping);  
// Should switch to jumping animation

character.ChangeState(CharacterState.Attacking);
// Should show attack animation
```

**Expected Results:**
- Sprite animations change immediately when state changes
- No lag between state change and visual update
- Animations match the character's current state

#### AnimatedSprite2D Compatibility Testing
1. Create scene with both traditional AnimatedSprite2D and real-time system
2. Switch between systems using ToggleRealtimeSprites()
3. Verify both systems work correctly

**Expected Results:**
- Smooth switching between sprite systems
- No memory leaks when switching modes
- Both systems maintain proper animation timing

### Stress Testing

#### Multiple Character Testing
1. Create scene with 4+ characters using real-time sprites
2. Have all characters perform different animations simultaneously
3. Monitor performance and visual quality

**Performance Targets:**
- 60 FPS maintained with 4 characters
- Generation times remain under budget
- Cache hit ratios stay above 80%

#### Rapid State Change Testing
```gdscript
# Rapidly cycle through all states
var states = ["idle", "walk", "jump", "attack", "hit", "block"]
for i in range(100):  # 100 rapid changes
    var state = states[i % states.size()]
    character.play_animation(state)
    await get_tree().process_frame
```

**Expected Results:**
- No crashes or memory leaks
- Performance remains stable
- Cache system handles rapid changes efficiently

#### Extended Runtime Testing
1. Run demo scene for 30+ minutes with continuous animation changes
2. Monitor memory usage and performance over time
3. Check for memory leaks or performance degradation

**Expected Results:**
- Memory usage remains stable (no leaks)
- Performance doesn't degrade over time
- Cache cleanup works properly

## Automated Testing

### Integration Test Script
Run the automated integration test:

```gdscript
# Load and run the integration test
var test_scene = load("res://scripts/test/RealtimeSpriteIntegrationTest.gd")
get_tree().change_scene_to_packed(test_scene)
```

**Test Coverage:**
- Character state changes
- Palette swapping
- Proportion customization
- Performance monitoring
- Memory management

### Unit Testing Functions

#### Cache Performance Test
```gdscript
func test_cache_performance():
    var generator = RealtimeProceduralSpriteGenerator.new()
    var appearance = RealtimeProceduralSpriteGenerator.CharacterAppearance.new("ryu", true)
    
    # Generate same frame multiple times
    for i in range(10):
        var texture = generator.generate_frame(appearance, "idle", true, Vector2.ZERO, 0)
    
    var stats = generator.get_performance_stats()
    assert(stats.cache_hit_ratio > 0.8, "Cache hit ratio too low")
    assert(stats.avg_generation_time_ms < 10.0, "Generation time too high")
```

#### Visual Consistency Test
```gdscript
func test_visual_consistency():
    var generator = RealtimeProceduralSpriteGenerator.new()
    var appearance = RealtimeProceduralSpriteGenerator.CharacterAppearance.new("ryu", false)
    
    # Generate frames for same state multiple times
    var texture1 = generator.generate_frame(appearance, "idle", true, Vector2.ZERO, 0)
    var texture2 = generator.generate_frame(appearance, "idle", true, Vector2.ZERO, 0)
    
    # Should be identical (from cache)
    assert(texture1 == texture2, "Generated frames not consistent")
```

## Common Issues & Solutions

### Performance Issues
**Symptom**: Frame rate drops below 60 FPS
**Solutions**:
- Reduce enhanced quality usage
- Increase cache size
- Lower max_generation_time budget
- Clear cache more frequently

**Validation**:
```gdscript
var stats = character.GetSpriteGenerationStats()
if stats["avg_generation_time_ms"] > 10.0:
    print("Performance issue detected")
    character.use_enhanced_quality = false
```

### Visual Quality Issues
**Symptom**: Characters appear distorted or incorrect
**Solutions**:
- Verify character proportions are in valid range (0.5-2.0)
- Check palette configuration
- Ensure proper character ID mapping

**Validation**:
```gdscript
# Check character proportions
assert(limb_length >= 0.5 and limb_length <= 2.0)
assert(head_size >= 0.5 and head_size <= 2.0)
assert(body_width >= 0.5 and body_width <= 2.0)
```

### Memory Issues
**Symptom**: Memory usage constantly increasing
**Solutions**:
- Enable automatic cache cleanup
- Reduce maximum cache size
- Clear cache manually during scene transitions

**Validation**:
```gdscript
# Monitor memory usage
var initial_memory = OS.get_static_memory_usage_by_type()
# ... run game for a while ...
var final_memory = OS.get_static_memory_usage_by_type()
assert(final_memory - initial_memory < 10_000_000, "Memory leak detected")
```

## Performance Benchmarks

### Target Performance Metrics
- **Frame Generation**: <5ms average, <12ms maximum
- **Cache Hit Ratio**: >85% during normal gameplay
- **Memory Usage**: <500KB total per character
- **FPS**: Solid 60 FPS with up to 4 characters

### Testing Hardware Requirements
- **Minimum**: Intel i5-4590 / AMD FX 8350, 8GB RAM
- **Recommended**: Intel i7-8700 / AMD Ryzen 5 2600, 16GB RAM
- **GPU**: Any DirectX 11 compatible graphics card

### Platform Testing
Test on multiple platforms to ensure compatibility:
- [ ] Windows 10/11 (DirectX 11/12)
- [ ] Linux (Vulkan/OpenGL)
- [ ] macOS (Metal/OpenGL)
- [ ] Android (OpenGL ES 3.0+)
- [ ] iOS (Metal)

## Reporting Issues

When reporting issues, include:
1. **Performance Statistics**: Output from GetSpriteGenerationStats()
2. **System Specifications**: CPU, GPU, RAM, OS
3. **Reproduction Steps**: Exact steps to reproduce the issue
4. **Expected vs Actual Results**: What should happen vs what actually happens
5. **Screenshots/Videos**: Visual evidence of the issue

### Performance Report Template
```
Performance Issue Report
========================
System: [CPU/GPU/RAM/OS]
Godot Version: [4.x]
Character Count: [X]
Quality Mode: [Standard/Enhanced]

Performance Stats:
- Average Generation Time: [X]ms
- Maximum Generation Time: [X]ms  
- Cache Hit Ratio: [X]%
- Cache Size: [X] frames
- FPS: [X]

Issue Description:
[Detailed description of the problem]

Reproduction Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

## Continuous Integration Testing

### Automated Test Pipeline
```yaml
# Example CI pipeline for sprite system testing
test_realtime_sprites:
  script:
    - godot --headless --script scripts/test/RealtimeSpriteIntegrationTest.gd
    - godot --headless --script scripts/test/PerformanceBenchmark.gd
  artifacts:
    reports:
      - test_results.json
      - performance_metrics.json
```

### Performance Regression Detection
Monitor key metrics across builds:
- Generation time trends
- Memory usage patterns  
- Cache performance metrics
- Visual quality consistency

Set up alerts for performance regressions:
- >20% increase in generation time
- >10% decrease in cache hit ratio
- Memory leaks detected
- Visual artifacts in generated sprites