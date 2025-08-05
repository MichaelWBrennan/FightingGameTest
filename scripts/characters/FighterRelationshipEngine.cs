using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Fighter Relationship Engine (Lore-Tied Systems)
/// Rewards engagement with narrative and character pairings without adding power creep
/// Tracks relationships, unlocks story content, and creates contextual match experiences
/// </summary>
public partial class FighterRelationshipEngine : Node
{
    public static FighterRelationshipEngine Instance { get; private set; }
    
    // Relationship data
    private Dictionary<string, Dictionary<string, FighterRelationship>> _fighterRelationships = new();
    private Dictionary<string, FighterLore> _fighterLore = new();
    private Dictionary<string, List<StoryUnlock>> _playerStoryProgress = new();
    private Dictionary<string, SeasonalArc> _currentSeasonalArcs = new();
    
    // Match context tracking
    private Dictionary<string, List<MatchContext>> _recentMatchContexts = new();
    
    // Configuration
    private const int MATCHES_FOR_RELATIONSHIP_UNLOCK = 3;
    private const int MATCHES_FOR_DEEP_LORE = 10;
    private const int MAX_STORY_UNLOCKS_PER_SEASON = 50;
    
    [Signal]
    public delegate void RelationshipUnlockedEventHandler(string fighterId1, string fighterId2, RelationshipType type);
    
    [Signal]
    public delegate void StoryContentUnlockedEventHandler(string playerId, string storyId, string description);
    
    [Signal]
    public delegate void ContextualInteractionEventHandler(string fighterId1, string fighterId2, ContextType context);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            InitializeRelationships();
            InitializeFighterLore();
            LoadPlayerProgress();
            SetupSeasonalArcs();
        }
        else
        {
            QueueFree();
            return;
        }
        
        GD.Print("FighterRelationshipEngine initialized");
    }
    
    private void InitializeRelationships()
    {
        // Define canonical fighter relationships - in a full game, this would be data-driven
        var relationships = new Dictionary<(string, string), (RelationshipType, string)>
        {
            // Rivalries
            [("ryu", "ken")] = (RelationshipType.Rival, "Eternal rivals and best friends since childhood training"),
            [("ryu", "akuma")] = (RelationshipType.Enemy, "Master vs. the Dark Hado's corruption"),
            [("chun_li", "bison")] = (RelationshipType.Enemy, "Justice vs. Tyranny - her father's killer"),
            
            // Friendships  
            [("ryu", "sakura")] = (RelationshipType.Mentor, "Master teaching the next generation"),
            [("ken", "sean")] = (RelationshipType.Mentor, "Passing on the flame to a new student"),
            
            // Family
            [("ryu", "gouken")] = (RelationshipType.Family, "Master who raised him as a son"),
            [("ken", "eliza")] = (RelationshipType.Family, "Devoted husband protecting his family"),
            
            // Allies
            [("chun_li", "cammy")] = (RelationshipType.Ally, "Law enforcement officers working together"),
            [("guile", "chun_li")] = (RelationshipType.Ally, "Military and police cooperation"),
            
            // Complicated
            [("cammy", "bison")] = (RelationshipType.Complicated, "Former brainwashed soldier vs. her controller"),
            [("ryu", "sagat")] = (RelationshipType.Complicated, "Respect born from battle and mutual growth")
        };
        
        foreach (var kvp in relationships)
        {
            var (fighter1, fighter2) = kvp.Key;
            var (relType, description) = kvp.Value;
            
            // Ensure both fighters have relationship dictionaries
            if (!_fighterRelationships.ContainsKey(fighter1))
                _fighterRelationships[fighter1] = new Dictionary<string, FighterRelationship>();
            if (!_fighterRelationships.ContainsKey(fighter2))
                _fighterRelationships[fighter2] = new Dictionary<string, FighterRelationship>();
            
            // Create bidirectional relationships
            _fighterRelationships[fighter1][fighter2] = new FighterRelationship
            {
                TargetFighter = fighter2,
                Type = relType,
                Description = description,
                IsUnlocked = false, // Players must discover relationships through play
                MatchesPlayed = 0,
                LastEncounter = DateTime.MinValue
            };
            
            _fighterRelationships[fighter2][fighter1] = new FighterRelationship
            {
                TargetFighter = fighter1,
                Type = relType,
                Description = description,
                IsUnlocked = false,
                MatchesPlayed = 0,
                LastEncounter = DateTime.MinValue
            };
        }
    }
    
    private void InitializeFighterLore()
    {
        // Fighter lore data - in a full game, this would be comprehensive
        _fighterLore = new Dictionary<string, FighterLore>
        {
            ["ryu"] = new FighterLore
            {
                Name = "Ryu",
                Origin = "Japan",
                FightingStyle = "Shotokan Karate",
                BackgroundStory = "A wandering warrior seeking the true meaning of fighting",
                PersonalityTraits = new[] { "Disciplined", "Humble", "Determined" },
                Motivations = new[] { "Self-improvement", "Protecting others", "Mastering the martial arts" },
                Fears = new[] { "The Dark Hado", "Losing control", "Failing his master's teachings" },
                VoiceLines = new Dictionary<string, string[]>
                {
                    ["victory"] = new[] { "The answer lies in the heart of battle!", "I must continue training..." },
                    ["defeat"] = new[] { "I still have much to learn.", "The path of the warrior is endless." },
                    ["vs_ken"] = new[] { "Ken! Let's see how much you've improved!", "Our rivalry makes us both stronger!" },
                    ["vs_akuma"] = new[] { "I will not succumb to the Dark Hado!", "Your path leads only to destruction!" }
                }
            },
            
            ["chun_li"] = new FighterLore
            {
                Name = "Chun-Li",
                Origin = "China",
                FightingStyle = "Chinese Kenpo",
                BackgroundStory = "An ICPO officer seeking justice for her father's death",
                PersonalityTraits = new[] { "Justice-driven", "Compassionate", "Tenacious" },
                Motivations = new[] { "Avenging her father", "Protecting innocents", "Upholding the law" },
                Fears = new[] { "Failing victims", "Corruption going unpunished", "Losing her humanity in pursuit of justice" },
                VoiceLines = new Dictionary<string, string[]>
                {
                    ["victory"] = new[] { "Justice has been served!", "This is for my father!" },
                    ["defeat"] = new[] { "I won't give up on justice.", "I'll get stronger and try again." },
                    ["vs_bison"] = new[] { "This ends here, Bison!", "You'll pay for what you did to my father!" },
                    ["vs_cammy"] = new[] { "Let's work together, Cammy!", "Two officers are better than one!" }
                }
            }
        };
    }
    
    public void RecordMatchBetweenFighters(string playerId, string fighter1Id, string fighter2Id, bool player1Won, string matchContext = "")
    {
        // Record the relationship encounter
        if (_fighterRelationships.ContainsKey(fighter1Id) && _fighterRelationships[fighter1Id].ContainsKey(fighter2Id))
        {
            var relationship = _fighterRelationships[fighter1Id][fighter2Id];
            relationship.MatchesPlayed++;
            relationship.LastEncounter = DateTime.UtcNow;
            
            // Check for relationship unlock
            if (!relationship.IsUnlocked && relationship.MatchesPlayed >= MATCHES_FOR_RELATIONSHIP_UNLOCK)
            {
                UnlockRelationship(playerId, fighter1Id, fighter2Id);
            }
            
            // Trigger contextual interactions during match
            TriggerContextualInteraction(fighter1Id, fighter2Id, matchContext);
            
            // Check for story unlock milestones
            CheckStoryUnlocks(playerId, fighter1Id, fighter2Id);
        }
        
        // Record match context for analytics
        RecordMatchContext(playerId, fighter1Id, fighter2Id, player1Won, matchContext);
        
        // Save progress
        SavePlayerProgress(playerId);
    }
    
    private void UnlockRelationship(string playerId, string fighter1Id, string fighter2Id)
    {
        var relationship = _fighterRelationships[fighter1Id][fighter2Id];
        relationship.IsUnlocked = true;
        
        // Also unlock the reverse relationship
        if (_fighterRelationships.ContainsKey(fighter2Id) && _fighterRelationships[fighter2Id].ContainsKey(fighter1Id))
        {
            _fighterRelationships[fighter2Id][fighter1Id].IsUnlocked = true;
        }
        
        EmitSignal(SignalName.RelationshipUnlocked, fighter1Id, fighter2Id, (int)relationship.Type);
        
        // Unlock related story content
        string storyId = $"relationship_{fighter1Id}_{fighter2Id}";
        UnlockStoryContent(playerId, storyId, $"Discovered the {relationship.Type} between {fighter1Id} and {fighter2Id}");
        
        // Grant cosmetic unlocks
        GrantRelationshipRewards(playerId, fighter1Id, fighter2Id, relationship.Type);
        
        GD.Print($"Relationship unlocked for {playerId}: {fighter1Id} <-> {fighter2Id} ({relationship.Type})");
    }
    
    private void TriggerContextualInteraction(string fighter1Id, string fighter2Id, string matchContext)
    {
        var relationship = _fighterRelationships[fighter1Id][fighter2Id];
        
        if (!relationship.IsUnlocked)
            return;
        
        // Determine context type based on relationship and match situation
        ContextType contextType = DetermineContextType(relationship.Type, matchContext);
        
        EmitSignal(SignalName.ContextualInteraction, fighter1Id, fighter2Id, (int)contextType);
        
        // This signal can be picked up by the character system to trigger:
        // - Special intro animations
        // - Unique victory quotes
        // - Special effects during super moves
        // - Easter egg interactions
        
        GD.Print($"Contextual interaction: {fighter1Id} vs {fighter2Id} ({contextType})");
    }
    
    private ContextType DetermineContextType(RelationshipType relType, string matchContext)
    {
        return relType switch
        {
            RelationshipType.Rival => ContextType.RivalryIntense,
            RelationshipType.Enemy => ContextType.Hostility,
            RelationshipType.Friend => ContextType.FriendlyCompetition,
            RelationshipType.Mentor => ContextType.TeacherStudent,
            RelationshipType.Family => ContextType.FamilialBond,
            RelationshipType.Ally => ContextType.MutualRespect,
            RelationshipType.Complicated => ContextType.ComplexTension,
            _ => ContextType.FirstMeeting
        };
    }
    
    private void CheckStoryUnlocks(string playerId, string fighter1Id, string fighter2Id)
    {
        if (!_playerStoryProgress.ContainsKey(playerId))
            _playerStoryProgress[playerId] = new List<StoryUnlock>();
            
        var progress = _playerStoryProgress[playerId];
        var relationship = _fighterRelationships[fighter1Id][fighter2Id];
        
        // Deep lore unlock after many encounters
        if (relationship.MatchesPlayed >= MATCHES_FOR_DEEP_LORE)
        {
            string deepLoreId = $"deep_lore_{fighter1Id}_{fighter2Id}";
            if (!progress.Any(s => s.StoryId == deepLoreId))
            {
                UnlockStoryContent(playerId, deepLoreId, $"Uncovered deep lore about {fighter1Id} and {fighter2Id}");
            }
        }
        
        // Check for story arc completions
        CheckStoryArcCompletion(playerId);
    }
    
    private void CheckStoryArcCompletion(string playerId)
    {
        var progress = _playerStoryProgress[playerId];
        
        // Example: "Ryu's Journey" arc requires relationships with Ken, Akuma, and Sagat
        var ryuJourneyRequirements = new[] { "relationship_ryu_ken", "relationship_ryu_akuma", "relationship_ryu_sagat" };
        if (ryuJourneyRequirements.All(req => progress.Any(s => s.StoryId == req)) &&
            !progress.Any(s => s.StoryId == "arc_ryu_journey"))
        {
            UnlockStoryContent(playerId, "arc_ryu_journey", "Completed Ryu's Journey story arc!");
        }
        
        // Example: "World Warriors" arc requires meeting all base roster fighters
        var worldWarriorsCount = progress.Count(s => s.StoryId.StartsWith("relationship_"));
        if (worldWarriorsCount >= 10 && !progress.Any(s => s.StoryId == "arc_world_warriors"))
        {
            UnlockStoryContent(playerId, "arc_world_warriors", "Became a true World Warrior!");
        }
    }
    
    private void UnlockStoryContent(string playerId, string storyId, string description)
    {
        if (!_playerStoryProgress.ContainsKey(playerId))
            _playerStoryProgress[playerId] = new List<StoryUnlock>();
            
        var progress = _playerStoryProgress[playerId];
        
        // Don't unlock duplicate content
        if (progress.Any(s => s.StoryId == storyId))
            return;
            
        // Check seasonal limits
        var currentSeasonUnlocks = progress.Count(s => s.UnlockDate >= GetCurrentSeasonStart());
        if (currentSeasonUnlocks >= MAX_STORY_UNLOCKS_PER_SEASON)
            return;
            
        var unlock = new StoryUnlock
        {
            StoryId = storyId,
            Description = description,
            UnlockDate = DateTime.UtcNow,
            IsNew = true
        };
        
        progress.Add(unlock);
        EmitSignal(SignalName.StoryContentUnlocked, playerId, storyId, description);
        
        GD.Print($"Story unlocked for {playerId}: {description}");
    }
    
    private void GrantRelationshipRewards(string playerId, string fighter1Id, string fighter2Id, RelationshipType relType)
    {
        var rewards = new List<string>();
        
        // Voice line unlocks
        rewards.Add($"voice_lines_{fighter1Id}_vs_{fighter2Id}");
        
        // Special intro/outro animations
        if (relType == RelationshipType.Rival)
        {
            rewards.Add($"special_intro_{fighter1Id}_{fighter2Id}");
            rewards.Add($"special_victory_{fighter1Id}_{fighter2Id}");
        }
        
        // Color palette unlocks for deep relationships
        if (relType == RelationshipType.Enemy || relType == RelationshipType.Rival)
        {
            rewards.Add($"color_rival_{fighter1Id}");
            rewards.Add($"color_rival_{fighter2Id}");
        }
        
        // Profile badges
        rewards.Add($"badge_relationship_{relType.ToString().ToLower()}");
        
        foreach (var reward in rewards)
        {
            GD.Print($"Unlocked: {reward} for {playerId}");
        }
    }
    
    private void RecordMatchContext(string playerId, string fighter1Id, string fighter2Id, bool player1Won, string context)
    {
        if (!_recentMatchContexts.ContainsKey(playerId))
            _recentMatchContexts[playerId] = new List<MatchContext>();
            
        var contexts = _recentMatchContexts[playerId];
        
        contexts.Add(new MatchContext
        {
            Fighter1 = fighter1Id,
            Fighter2 = fighter2Id,
            Player1Won = player1Won,
            Context = context,
            Timestamp = DateTime.UtcNow
        });
        
        // Keep only recent contexts
        if (contexts.Count > 50)
        {
            contexts.RemoveAt(0);
        }
    }
    
    private void SetupSeasonalArcs()
    {
        // Example seasonal story arc
        _currentSeasonalArcs["season_1"] = new SeasonalArc
        {
            Name = "The Dark Tournament",
            Description = "A mysterious tournament draws fighters together",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(90),
            RequiredRelationships = new[] { "ryu_akuma", "chun_li_bison", "ken_ryu" },
            RewardTier = RewardTier.Legendary
        };
    }
    
    public List<FighterRelationship> GetUnlockedRelationships(string playerId, string fighterId)
    {
        var result = new List<FighterRelationship>();
        
        if (_fighterRelationships.ContainsKey(fighterId))
        {
            result.AddRange(_fighterRelationships[fighterId].Values.Where(r => r.IsUnlocked));
        }
        
        return result;
    }
    
    public List<StoryUnlock> GetPlayerStoryProgress(string playerId)
    {
        return _playerStoryProgress.GetValueOrDefault(playerId, new List<StoryUnlock>());
    }
    
    public FighterLore GetFighterLore(string fighterId)
    {
        return _fighterLore.GetValueOrDefault(fighterId);
    }
    
    public string[] GetContextualVoiceLines(string fighterId, string opponentId, string situation)
    {
        var lore = GetFighterLore(fighterId);
        if (lore?.VoiceLines == null)
            return new string[0];
            
        // Try specific opponent first
        string contextKey = $"vs_{opponentId}";
        if (lore.VoiceLines.ContainsKey(contextKey))
            return lore.VoiceLines[contextKey];
            
        // Fall back to general situation
        if (lore.VoiceLines.ContainsKey(situation))
            return lore.VoiceLines[situation];
            
        return new string[0];
    }
    
    private DateTime GetCurrentSeasonStart()
    {
        // For simplicity, assume seasons start every 3 months
        var now = DateTime.UtcNow;
        var quarterStart = new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1);
        return quarterStart;
    }
    
    private void SavePlayerProgress(string playerId)
    {
        var configFile = new ConfigFile();
        configFile.Load("user://fighter_relationships.cfg");
        
        // Save story progress
        if (_playerStoryProgress.ContainsKey(playerId))
        {
            var progress = _playerStoryProgress[playerId];
            var section = $"story_{playerId}";
            
            for (int i = 0; i < progress.Count; i++)
            {
                var unlock = progress[i];
                configFile.SetValue(section, $"unlock_{i}_id", unlock.StoryId);
                configFile.SetValue(section, $"unlock_{i}_desc", unlock.Description);
                configFile.SetValue(section, $"unlock_{i}_date", unlock.UnlockDate.ToString("yyyy-MM-dd HH:mm:ss"));
            }
            
            configFile.SetValue(section, "unlock_count", progress.Count);
        }
        
        // Save relationship progress
        foreach (var fighterKvp in _fighterRelationships)
        {
            var fighterId = fighterKvp.Key;
            
            foreach (var relKvp in fighterKvp.Value)
            {
                var targetId = relKvp.Key;
                var relationship = relKvp.Value;
                var section = $"rel_{playerId}_{fighterId}_{targetId}";
                
                configFile.SetValue(section, "unlocked", relationship.IsUnlocked);
                configFile.SetValue(section, "matches", relationship.MatchesPlayed);
                configFile.SetValue(section, "last_encounter", relationship.LastEncounter.ToString("yyyy-MM-dd HH:mm:ss"));
            }
        }
        
        configFile.Save("user://fighter_relationships.cfg");
    }
    
    private void LoadPlayerProgress()
    {
        var configFile = new ConfigFile();
        var err = configFile.Load("user://fighter_relationships.cfg");
        
        if (err != Error.Ok)
            return;
            
        var sections = configFile.GetSections();
        
        foreach (string section in sections)
        {
            if (section.StartsWith("story_"))
            {
                var playerId = section.Substring(6);
                var progress = new List<StoryUnlock>();
                var unlockCount = configFile.GetValue(section, "unlock_count", 0).AsInt32();
                
                for (int i = 0; i < unlockCount; i++)
                {
                    var storyId = configFile.GetValue(section, $"unlock_{i}_id", "").AsString();
                    var description = configFile.GetValue(section, $"unlock_{i}_desc", "").AsString();
                    var dateStr = configFile.GetValue(section, $"unlock_{i}_date", "").AsString();
                    
                    if (!string.IsNullOrEmpty(storyId) && DateTime.TryParse(dateStr, out DateTime unlockDate))
                    {
                        progress.Add(new StoryUnlock
                        {
                            StoryId = storyId,
                            Description = description,
                            UnlockDate = unlockDate,
                            IsNew = false
                        });
                    }
                }
                
                _playerStoryProgress[playerId] = progress;
            }
            else if (section.StartsWith("rel_"))
            {
                var parts = section.Split('_');
                if (parts.Length >= 4)
                {
                    var playerId = parts[1];
                    var fighterId = parts[2];
                    var targetId = parts[3];
                    
                    if (_fighterRelationships.ContainsKey(fighterId) && 
                        _fighterRelationships[fighterId].ContainsKey(targetId))
                    {
                        var relationship = _fighterRelationships[fighterId][targetId];
                        
                        relationship.IsUnlocked = configFile.GetValue(section, "unlocked", false).AsBool();
                        relationship.MatchesPlayed = configFile.GetValue(section, "matches", 0).AsInt32();
                        
                        var encounterStr = configFile.GetValue(section, "last_encounter", "").AsString();
                        if (DateTime.TryParse(encounterStr, out DateTime lastEncounter))
                            relationship.LastEncounter = lastEncounter;
                    }
                }
            }
        }
        
        GD.Print("Loaded fighter relationship progress");
    }
}

// Data structures for the relationship system
public class FighterRelationship
{
    public string TargetFighter { get; set; }
    public RelationshipType Type { get; set; }
    public string Description { get; set; }
    public bool IsUnlocked { get; set; }
    public int MatchesPlayed { get; set; }
    public DateTime LastEncounter { get; set; }
}

public class FighterLore
{
    public string Name { get; set; }
    public string Origin { get; set; }
    public string FightingStyle { get; set; }
    public string BackgroundStory { get; set; }
    public string[] PersonalityTraits { get; set; }
    public string[] Motivations { get; set; }
    public string[] Fears { get; set; }
    public Dictionary<string, string[]> VoiceLines { get; set; }
}

public class StoryUnlock
{
    public string StoryId { get; set; }
    public string Description { get; set; }
    public DateTime UnlockDate { get; set; }
    public bool IsNew { get; set; }
}

public class MatchContext
{
    public string Fighter1 { get; set; }
    public string Fighter2 { get; set; }
    public bool Player1Won { get; set; }
    public string Context { get; set; }
    public DateTime Timestamp { get; set; }
}

public class SeasonalArc
{
    public string Name { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string[] RequiredRelationships { get; set; }
    public RewardTier RewardTier { get; set; }
}

public enum RelationshipType
{
    Friend,
    Rival,
    Enemy,
    Mentor,
    Family,
    Ally,
    Complicated
}

public enum ContextType
{
    FirstMeeting,
    FriendlyCompetition,
    RivalryIntense,
    Hostility,
    TeacherStudent,
    FamilialBond,
    MutualRespect,
    ComplexTension
}

public enum RewardTier
{
    Common,
    Rare,
    Epic,
    Legendary
}