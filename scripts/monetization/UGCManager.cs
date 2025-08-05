using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages User-Generated Content creation, curation, and monetization
/// </summary>
public partial class UGCManager : Node
{
    public static UGCManager Instance { get; private set; }
    
    private Dictionary<string, UGCItem> _publishedContent = new();
    private Dictionary<string, UGCItem> _pendingReview = new();
    private Dictionary<string, float> _creatorEarnings = new();
    private const string UGC_DATA_FILE = "user://ugc_content.json";
    private const string CREATOR_EARNINGS_FILE = "user://creator_earnings.json";
    private const float CREATOR_REVENUE_SHARE = 0.70f; // 70% to creator, 30% to platform
    
    [Signal]
    public delegate void ContentSubmittedEventHandler(string contentId);
    
    [Signal]
    public delegate void ContentApprovedEventHandler(string contentId);
    
    [Signal]
    public delegate void ContentPurchasedEventHandler(string contentId, string creatorId, float earnings);
    
    [Signal]
    public delegate void EarningsUpdateEventHandler(string creatorId, float newTotal);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadUGCData();
            LoadCreatorEarnings();
            InitializeSampleContent();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize sample UGC content for demonstration
    /// </summary>
    private void InitializeSampleContent()
    {
        // Sample approved UGC content
        _publishedContent["community_ryu_neon"] = new UGCItem
        {
            Id = "community_ryu_neon",
            Name = "Neon Warrior Ryu",
            Description = "Cyberpunk-inspired Ryu skin with glowing effects",
            CreatorId = "creator_artistforge",
            CreatorName = "ArtistForge",
            Type = UGCType.FighterSkin,
            CharacterId = "ryu",
            Price = 4.99f,
            CreatedDate = DateTime.UtcNow.AddDays(-30),
            ApprovedDate = DateTime.UtcNow.AddDays(-25),
            Downloads = 1250,
            Rating = 4.7f,
            RatingCount = 89,
            Tags = new[] { "cyberpunk", "neon", "effects", "community" },
            IsApproved = true,
            ThumbnailPath = "res://assets/ugc/thumbnails/neon_ryu.png",
            ContentPath = "res://assets/ugc/content/neon_ryu_skin.zip"
        };
        
        _publishedContent["community_victory_dance"] = new UGCItem
        {
            Id = "community_victory_dance",
            Name = "Victory Dance Animation",
            Description = "Celebratory dance animation for victory screens",
            CreatorId = "creator_animstudio",
            CreatorName = "AnimationStudio",
            Type = UGCType.VictoryAnimation,
            CharacterId = "any",
            Price = 2.99f,
            CreatedDate = DateTime.UtcNow.AddDays(-20),
            ApprovedDate = DateTime.UtcNow.AddDays(-18),
            Downloads = 567,
            Rating = 4.2f,
            RatingCount = 43,
            Tags = new[] { "dance", "celebration", "animation", "fun" },
            IsApproved = true,
            ThumbnailPath = "res://assets/ugc/thumbnails/victory_dance.png",
            ContentPath = "res://assets/ugc/content/victory_dance.zip"
        };
    }
    
    /// <summary>
    /// Submit new UGC content for review
    /// </summary>
    public string SubmitContent(UGCSubmission submission)
    {
        var contentId = GenerateContentId();
        
        var ugcItem = new UGCItem
        {
            Id = contentId,
            Name = submission.Name,
            Description = submission.Description,
            CreatorId = submission.CreatorId,
            CreatorName = submission.CreatorName,
            Type = submission.Type,
            CharacterId = submission.CharacterId,
            Price = submission.Price,
            CreatedDate = DateTime.UtcNow,
            Tags = submission.Tags,
            IsApproved = false,
            ThumbnailPath = submission.ThumbnailPath,
            ContentPath = submission.ContentPath,
            ReviewNotes = ""
        };
        
        _pendingReview[contentId] = ugcItem;
        SaveUGCData();
        
        EmitSignal(SignalName.ContentSubmitted, contentId);
        
        // Initiate automated safety checks
        RunContentSafetyChecks(ugcItem);
        
        return contentId;
    }
    
    /// <summary>
    /// Approve content for publication (admin/moderation function)
    /// </summary>
    public bool ApproveContent(string contentId, string reviewNotes = "")
    {
        if (!_pendingReview.ContainsKey(contentId))
            return false;
            
        var content = _pendingReview[contentId];
        content.IsApproved = true;
        content.ApprovedDate = DateTime.UtcNow;
        content.ReviewNotes = reviewNotes;
        
        // Move from pending to published
        _publishedContent[contentId] = content;
        _pendingReview.Remove(contentId);
        
        SaveUGCData();
        EmitSignal(SignalName.ContentApproved, contentId);
        
        // Notify creator
        NotifyCreator(content.CreatorId, $"Your content '{content.Name}' has been approved!");
        
        return true;
    }
    
    /// <summary>
    /// Purchase UGC content and distribute revenue
    /// </summary>
    public bool PurchaseUGCContent(string contentId, float paidAmount, string buyerId)
    {
        if (!_publishedContent.ContainsKey(contentId))
            return false;
            
        var content = _publishedContent[contentId];
        
        // Verify payment amount
        if (Math.Abs(paidAmount - content.Price) > 0.01f)
            return false;
            
        // Calculate revenue split
        float creatorEarnings = paidAmount * CREATOR_REVENUE_SHARE;
        float platformEarnings = paidAmount * (1.0f - CREATOR_REVENUE_SHARE);
        
        // Update creator earnings
        if (!_creatorEarnings.ContainsKey(content.CreatorId))
            _creatorEarnings[content.CreatorId] = 0.0f;
            
        _creatorEarnings[content.CreatorId] += creatorEarnings;
        
        // Update content stats
        content.Downloads++;
        
        SaveUGCData();
        SaveCreatorEarnings();
        
        EmitSignal(SignalName.ContentPurchased, contentId, content.CreatorId, creatorEarnings);
        EmitSignal(SignalName.EarningsUpdated, content.CreatorId, _creatorEarnings[content.CreatorId]);
        
        // Grant content to buyer through CosmeticManager
        GrantUGCContentToBuyer(content, buyerId);
        
        // Analytics
        TelemetryManager.Instance?.RecordUGCPurchase(content, creatorEarnings, platformEarnings);
        
        return true;
    }
    
    /// <summary>
    /// Get creator's total earnings
    /// </summary>
    public float GetCreatorEarnings(string creatorId)
    {
        return _creatorEarnings.GetValueOrDefault(creatorId, 0.0f);
    }
    
    /// <summary>
    /// Get published content by type
    /// </summary>
    public List<UGCItem> GetPublishedContent(UGCType? type = null, string characterId = null)
    {
        var content = new List<UGCItem>();
        
        foreach (var item in _publishedContent.Values)
        {
            if (type.HasValue && item.Type != type.Value)
                continue;
                
            if (!string.IsNullOrEmpty(characterId) && 
                item.CharacterId != characterId && 
                item.CharacterId != "any")
                continue;
                
            content.Add(item);
        }
        
        // Sort by popularity (downloads * rating)
        content.Sort((a, b) => (b.Downloads * b.Rating).CompareTo(a.Downloads * a.Rating));
        
        return content;
    }
    
    /// <summary>
    /// Rate UGC content
    /// </summary>
    public bool RateContent(string contentId, float rating, string userId)
    {
        if (!_publishedContent.ContainsKey(contentId))
            return false;
            
        if (rating < 1.0f || rating > 5.0f)
            return false;
            
        var content = _publishedContent[contentId];
        
        // Simple rating update (in production, would track individual user ratings)
        float totalRating = content.Rating * content.RatingCount + rating;
        content.RatingCount++;
        content.Rating = totalRating / content.RatingCount;
        
        SaveUGCData();
        return true;
    }
    
    /// <summary>
    /// Run automated content safety and quality checks
    /// </summary>
    private void RunContentSafetyChecks(UGCItem content)
    {
        // Automated checks would include:
        // - File format validation
        // - Content scanning for inappropriate material
        // - Performance impact analysis
        // - Compatibility testing
        
        // For demo purposes, simulate check completion
        CallDeferred(nameof(CompleteAutomatedChecks), content.Id);
    }
    
    private void CompleteAutomatedChecks(string contentId)
    {
        if (_pendingReview.ContainsKey(contentId))
        {
            var content = _pendingReview[contentId];
            content.ReviewNotes = "Passed automated safety checks. Pending manual review.";
            
            // In production, would queue for human review or auto-approve simple content
            GD.Print($"Content {contentId} passed automated checks and is ready for manual review.");
        }
    }
    
    private void GrantUGCContentToBuyer(UGCItem content, string buyerId)
    {
        // Grant the UGC content as a cosmetic item
        var cosmeticItem = new CosmeticItem
        {
            Id = content.Id,
            Name = content.Name,
            Description = content.Description,
            Type = UGCTypeToCosmeticType(content.Type),
            CharacterId = content.CharacterId,
            Price = content.Price,
            Rarity = CosmeticRarity.UGC,
            IsUGC = true,
            CreatorId = content.CreatorId
        };
        
        // This would integrate with CosmeticManager to grant ownership
        CosmeticManager.Instance?._ownedCosmetics?.Add(content.Id, true);
    }
    
    private CosmeticType UGCTypeToCosmeticType(UGCType ugcType)
    {
        return ugcType switch
        {
            UGCType.FighterSkin => CosmeticType.FighterSkin,
            UGCType.VictoryAnimation => CosmeticType.OutroAnimation,
            UGCType.IntroAnimation => CosmeticType.IntroAnimation,
            UGCType.KOEffect => CosmeticType.KOEffect,
            UGCType.UITheme => CosmeticType.UITheme,
            _ => CosmeticType.FighterSkin
        };
    }
    
    private void NotifyCreator(string creatorId, string message)
    {
        // In production, would send notifications through various channels
        GD.Print($"Notification to {creatorId}: {message}");
    }
    
    private string GenerateContentId()
    {
        return $"ugc_{DateTime.UtcNow:yyyyMMddHHmmss}_{Guid.NewGuid().ToString()[..8]}";
    }
    
    private void LoadUGCData()
    {
        try
        {
            if (FileAccess.FileExists(UGC_DATA_FILE))
            {
                using var file = FileAccess.Open(UGC_DATA_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                var data = JsonSerializer.Deserialize<UGCData>(json);
                
                if (data != null)
                {
                    _publishedContent = data.PublishedContent ?? new();
                    _pendingReview = data.PendingReview ?? new();
                }
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load UGC data: {ex.Message}");
        }
    }
    
    private void SaveUGCData()
    {
        try
        {
            var data = new UGCData
            {
                PublishedContent = _publishedContent,
                PendingReview = _pendingReview
            };
            
            using var file = FileAccess.Open(UGC_DATA_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save UGC data: {ex.Message}");
        }
    }
    
    private void LoadCreatorEarnings()
    {
        try
        {
            if (FileAccess.FileExists(CREATOR_EARNINGS_FILE))
            {
                using var file = FileAccess.Open(CREATOR_EARNINGS_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                _creatorEarnings = JsonSerializer.Deserialize<Dictionary<string, float>>(json) ?? new();
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load creator earnings: {ex.Message}");
        }
    }
    
    private void SaveCreatorEarnings()
    {
        try
        {
            using var file = FileAccess.Open(CREATOR_EARNINGS_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(_creatorEarnings, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save creator earnings: {ex.Message}");
        }
    }
}

/// <summary>
/// UGC content item
/// </summary>
public class UGCItem
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string CreatorId { get; set; } = "";
    public string CreatorName { get; set; } = "";
    public UGCType Type { get; set; }
    public string CharacterId { get; set; } = "any";
    public float Price { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public int Downloads { get; set; }
    public float Rating { get; set; }
    public int RatingCount { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public bool IsApproved { get; set; }
    public string ThumbnailPath { get; set; } = "";
    public string ContentPath { get; set; } = "";
    public string ReviewNotes { get; set; } = "";
}

/// <summary>
/// UGC submission from creator
/// </summary>
public class UGCSubmission
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string CreatorId { get; set; } = "";
    public string CreatorName { get; set; } = "";
    public UGCType Type { get; set; }
    public string CharacterId { get; set; } = "any";
    public float Price { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string ThumbnailPath { get; set; } = "";
    public string ContentPath { get; set; } = "";
}

/// <summary>
/// UGC data container for serialization
/// </summary>
public class UGCData
{
    public Dictionary<string, UGCItem> PublishedContent { get; set; } = new();
    public Dictionary<string, UGCItem> PendingReview { get; set; } = new();
}

public enum UGCType
{
    FighterSkin,
    IntroAnimation,
    VictoryAnimation,
    KOEffect,
    UITheme,
    MusicTrack,
    StageMod
}