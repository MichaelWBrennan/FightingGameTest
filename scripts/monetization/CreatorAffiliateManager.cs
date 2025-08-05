using Godot;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Linq;

/// <summary>
/// Manages creator affiliate programs, branded cosmetics, and influencer monetization
/// </summary>
public partial class CreatorAffiliateManager : Node
{
    public static CreatorAffiliateManager Instance { get; private set; }
    
    private Dictionary<string, CreatorAffiliate> _creators = new();
    private Dictionary<string, AffiliateCode> _activeCodes = new();
    private Dictionary<string, List<AffiliateTransaction>> _transactions = new();
    private const string CREATOR_DATA_FILE = "user://creator_affiliates.json";
    private const string AFFILIATE_CODES_FILE = "user://affiliate_codes.json";
    
    [Signal]
    public delegate void CodeUsedEventHandler(string code, string creatorId, float earnings);
    
    [Signal]
    public delegate void CreatorRegisteredEventHandler(string creatorId);
    
    [Signal]
    public delegate void ContentCreatedEventHandler(string creatorId, string contentId);
    
    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            ProcessMode = ProcessModeEnum.Always;
            LoadCreatorData();
            LoadAffiliateCodes();
            InitializeFeaturedCreators();
        }
        else
        {
            QueueFree();
        }
    }
    
    /// <summary>
    /// Initialize featured creators and their affiliate programs
    /// </summary>
    private void InitializeFeaturedCreators()
    {
        // Example featured creator
        _creators["fightersforge"] = new CreatorAffiliate
        {
            Id = "fightersforge",
            Name = "FightersForge",
            Platform = "Twitch",
            FollowerCount = 50000,
            CommissionRate = 0.15f, // 15% commission on cosmetic sales
            IsVerified = true,
            JoinDate = DateTime.UtcNow.AddMonths(-6),
            TotalEarnings = 1250.75f,
            Tier = CreatorTier.Gold,
            Bio = "Professional fighting game content creator and tournament organizer",
            ContactEmail = "partnerships@fightersforge.tv",
            BrandedContent = new[] { "fightersforge_overlay", "fightersforge_nameplate" }
        };
        
        // Generate affiliate codes for the creator
        CreateAffiliateCode("fightersforge", "FORGE15", "fightersforge_overlay");
        CreateAffiliateCode("fightersforge", "FIGHTFORGE", "fightersforge_nameplate");
        
        _creators["comboqueen"] = new CreatorAffiliate
        {
            Id = "comboqueen",
            Name = "ComboQueen",
            Platform = "YouTube",
            FollowerCount = 125000,
            CommissionRate = 0.20f, // 20% commission for top-tier creator
            IsVerified = true,
            JoinDate = DateTime.UtcNow.AddMonths(-12),
            TotalEarnings = 3890.25f,
            Tier = CreatorTier.Platinum,
            Bio = "Tutorial expert and combo video creator",
            ContactEmail = "business@comboqueen.gg",
            BrandedContent = new[] { "comboqueen_skin_pack", "comboqueen_victory_theme" }
        };
        
        CreateAffiliateCode("comboqueen", "QUEEN20", "comboqueen_skin_pack");
        CreateAffiliateCode("comboqueen", "COMBOS", "comboqueen_victory_theme");
    }
    
    /// <summary>
    /// Register a new creator for the affiliate program
    /// </summary>
    public bool RegisterCreator(CreatorApplication application)
    {
        // Verify creator doesn't already exist
        if (_creators.ContainsKey(application.CreatorId))
            return false;
            
        // Basic validation
        if (application.FollowerCount < 1000) // Minimum requirements
            return false;
            
        var creator = new CreatorAffiliate
        {
            Id = application.CreatorId,
            Name = application.Name,
            Platform = application.Platform,
            FollowerCount = application.FollowerCount,
            CommissionRate = CalculateCommissionRate(application.FollowerCount),
            IsVerified = false, // Requires manual verification
            JoinDate = DateTime.UtcNow,
            TotalEarnings = 0.0f,
            Tier = DetermineCreatorTier(application.FollowerCount),
            Bio = application.Bio,
            ContactEmail = application.ContactEmail,
            BrandedContent = Array.Empty<string>()
        };
        
        _creators[creator.Id] = creator;
        SaveCreatorData();
        
        EmitSignal(SignalName.CreatorRegistered, creator.Id);
        
        // Generate basic affiliate code
        CreateAffiliateCode(creator.Id, $"{creator.Name.ToUpper()}10", "generic_creator_discount");
        
        return true;
    }
    
    /// <summary>
    /// Create an affiliate code for a creator
    /// </summary>
    public string CreateAffiliateCode(string creatorId, string code, string cosmeticId, float discountPercent = 10.0f)
    {
        if (!_creators.ContainsKey(creatorId))
            return "";
            
        var affiliateCode = new AffiliateCode
        {
            Code = code.ToUpper(),
            CreatorId = creatorId,
            CosmeticId = cosmeticId,
            DiscountPercent = discountPercent,
            CreatedDate = DateTime.UtcNow,
            ExpiryDate = DateTime.UtcNow.AddMonths(6), // 6-month validity
            UsageCount = 0,
            MaxUsages = 1000, // Usage limit
            IsActive = true
        };
        
        _activeCodes[code.ToUpper()] = affiliateCode;
        SaveAffiliateCodes();
        
        return code.ToUpper();
    }
    
    /// <summary>
    /// Use an affiliate code for a purchase
    /// </summary>
    public (bool success, float discount, string creatorId) UseAffiliateCode(string code, string cosmeticId, float originalPrice, string buyerId)
    {
        code = code.ToUpper();
        
        if (!_activeCodes.ContainsKey(code))
            return (false, 0.0f, "");
            
        var affiliateCode = _activeCodes[code];
        
        // Validate code
        if (!affiliateCode.IsActive ||
            DateTime.UtcNow > affiliateCode.ExpiryDate ||
            affiliateCode.UsageCount >= affiliateCode.MaxUsages ||
            (affiliateCode.CosmeticId != "generic_creator_discount" && affiliateCode.CosmeticId != cosmeticId))
        {
            return (false, 0.0f, "");
        }
        
        // Calculate discount and creator earnings
        float discountAmount = originalPrice * (affiliateCode.DiscountPercent / 100.0f);
        float finalPrice = originalPrice - discountAmount;
        float creatorCommission = finalPrice * _creators[affiliateCode.CreatorId].CommissionRate;
        
        // Record transaction
        var transaction = new AffiliateTransaction
        {
            Id = Guid.NewGuid().ToString(),
            Code = code,
            CreatorId = affiliateCode.CreatorId,
            BuyerId = buyerId,
            CosmeticId = cosmeticId,
            OriginalPrice = originalPrice,
            DiscountAmount = discountAmount,
            FinalPrice = finalPrice,
            CreatorEarnings = creatorCommission,
            Date = DateTime.UtcNow
        };
        
        // Update records
        affiliateCode.UsageCount++;
        _creators[affiliateCode.CreatorId].TotalEarnings += creatorCommission;
        
        if (!_transactions.ContainsKey(affiliateCode.CreatorId))
            _transactions[affiliateCode.CreatorId] = new List<AffiliateTransaction>();
            
        _transactions[affiliateCode.CreatorId].Add(transaction);
        
        SaveCreatorData();
        SaveAffiliateCodes();
        
        EmitSignal(SignalName.CodeUsed, code, affiliateCode.CreatorId, creatorCommission);
        
        // Analytics
        TelemetryManager.Instance?.RecordAffiliateCodeUsage(transaction);
        
        return (true, discountAmount, affiliateCode.CreatorId);
    }
    
    /// <summary>
    /// Create branded cosmetic for a creator
    /// </summary>
    public bool CreateBrandedCosmetic(string creatorId, BrandedCosmeticRequest request)
    {
        if (!_creators.ContainsKey(creatorId))
            return false;
            
        var creator = _creators[creatorId];
        
        // Only verified creators can have branded content
        if (!creator.IsVerified)
            return false;
            
        // Create the cosmetic item
        var cosmeticItem = new CosmeticItem
        {
            Id = request.CosmeticId,
            Name = request.Name,
            Description = $"Exclusive {creator.Name} branded content",
            Type = request.Type,
            CharacterId = request.CharacterId,
            Price = request.Price,
            Rarity = CosmeticRarity.Legendary,
            Tags = new[] { "creator", "exclusive", creator.Name.ToLower() },
            CreatorId = creatorId
        };
        
        // Add to creator's branded content
        var brandedList = creator.BrandedContent.ToList();
        brandedList.Add(request.CosmeticId);
        creator.BrandedContent = brandedList.ToArray();
        
        SaveCreatorData();
        
        EmitSignal(SignalName.ContentCreated, creatorId, request.CosmeticId);
        
        // Automatically create affiliate code for the item
        CreateAffiliateCode(creatorId, $"{creator.Name.ToUpper()}EXCLUSIVE", request.CosmeticId, 15.0f);
        
        return true;
    }
    
    /// <summary>
    /// Get creator statistics for dashboard
    /// </summary>
    public CreatorStats GetCreatorStats(string creatorId)
    {
        if (!_creators.ContainsKey(creatorId))
            return null;
            
        var creator = _creators[creatorId];
        var transactions = _transactions.GetValueOrDefault(creatorId, new List<AffiliateTransaction>());
        
        return new CreatorStats
        {
            CreatorId = creatorId,
            TotalEarnings = creator.TotalEarnings,
            TotalSales = transactions.Count,
            AverageOrderValue = transactions.Count > 0 ? transactions.Average(t => t.FinalPrice) : 0.0f,
            TopSellingContent = GetTopSellingContent(creatorId),
            LastMonthEarnings = GetLastMonthEarnings(creatorId),
            CodesUsed = GetTotalCodeUsages(creatorId)
        };
    }
    
    /// <summary>
    /// Get leaderboard of top creators
    /// </summary>
    public List<CreatorAffiliate> GetCreatorLeaderboard(int limit = 10)
    {
        return _creators.Values
            .Where(c => c.IsVerified)
            .OrderByDescending(c => c.TotalEarnings)
            .Take(limit)
            .ToList();
    }
    
    private float CalculateCommissionRate(int followerCount)
    {
        return followerCount switch
        {
            >= 100000 => 0.20f, // 20% for 100k+ followers
            >= 50000 => 0.15f,  // 15% for 50k+ followers
            >= 10000 => 0.12f,  // 12% for 10k+ followers
            _ => 0.10f           // 10% base rate
        };
    }
    
    private CreatorTier DetermineCreatorTier(int followerCount)
    {
        return followerCount switch
        {
            >= 100000 => CreatorTier.Platinum,
            >= 50000 => CreatorTier.Gold,
            >= 10000 => CreatorTier.Silver,
            _ => CreatorTier.Bronze
        };
    }
    
    private string GetTopSellingContent(string creatorId)
    {
        var transactions = _transactions.GetValueOrDefault(creatorId, new List<AffiliateTransaction>());
        if (transactions.Count == 0)
            return "None";
            
        return transactions
            .GroupBy(t => t.CosmeticId)
            .OrderByDescending(g => g.Count())
            .First()
            .Key;
    }
    
    private float GetLastMonthEarnings(string creatorId)
    {
        var transactions = _transactions.GetValueOrDefault(creatorId, new List<AffiliateTransaction>());
        var lastMonth = DateTime.UtcNow.AddMonths(-1);
        
        return transactions
            .Where(t => t.Date >= lastMonth)
            .Sum(t => t.CreatorEarnings);
    }
    
    private int GetTotalCodeUsages(string creatorId)
    {
        return _activeCodes.Values
            .Where(c => c.CreatorId == creatorId)
            .Sum(c => c.UsageCount);
    }
    
    private void LoadCreatorData()
    {
        try
        {
            if (FileAccess.FileExists(CREATOR_DATA_FILE))
            {
                using var file = FileAccess.Open(CREATOR_DATA_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                var data = JsonSerializer.Deserialize<CreatorAffiliateData>(json);
                
                if (data != null)
                {
                    _creators = data.Creators ?? new();
                    _transactions = data.Transactions ?? new();
                }
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load creator data: {ex.Message}");
        }
    }
    
    private void SaveCreatorData()
    {
        try
        {
            var data = new CreatorAffiliateData
            {
                Creators = _creators,
                Transactions = _transactions
            };
            
            using var file = FileAccess.Open(CREATOR_DATA_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save creator data: {ex.Message}");
        }
    }
    
    private void LoadAffiliateCodes()
    {
        try
        {
            if (FileAccess.FileExists(AFFILIATE_CODES_FILE))
            {
                using var file = FileAccess.Open(AFFILIATE_CODES_FILE, FileAccess.ModeFlags.Read);
                var json = file.GetAsText();
                _activeCodes = JsonSerializer.Deserialize<Dictionary<string, AffiliateCode>>(json) ?? new();
            }
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to load affiliate codes: {ex.Message}");
        }
    }
    
    private void SaveAffiliateCodes()
    {
        try
        {
            using var file = FileAccess.Open(AFFILIATE_CODES_FILE, FileAccess.ModeFlags.Write);
            var json = JsonSerializer.Serialize(_activeCodes, new JsonSerializerOptions { WriteIndented = true });
            file.StoreString(json);
        }
        catch (Exception ex)
        {
            GD.PrintErr($"Failed to save affiliate codes: {ex.Message}");
        }
    }
}

/// <summary>
/// Creator affiliate information
/// </summary>
public class CreatorAffiliate
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Platform { get; set; } = "";
    public int FollowerCount { get; set; }
    public float CommissionRate { get; set; }
    public bool IsVerified { get; set; }
    public DateTime JoinDate { get; set; }
    public float TotalEarnings { get; set; }
    public CreatorTier Tier { get; set; }
    public string Bio { get; set; } = "";
    public string ContactEmail { get; set; } = "";
    public string[] BrandedContent { get; set; } = Array.Empty<string>();
}

/// <summary>
/// Affiliate code information
/// </summary>
public class AffiliateCode
{
    public string Code { get; set; } = "";
    public string CreatorId { get; set; } = "";
    public string CosmeticId { get; set; } = "";
    public float DiscountPercent { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int UsageCount { get; set; }
    public int MaxUsages { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Affiliate transaction record
/// </summary>
public class AffiliateTransaction
{
    public string Id { get; set; } = "";
    public string Code { get; set; } = "";
    public string CreatorId { get; set; } = "";
    public string BuyerId { get; set; } = "";
    public string CosmeticId { get; set; } = "";
    public float OriginalPrice { get; set; }
    public float DiscountAmount { get; set; }
    public float FinalPrice { get; set; }
    public float CreatorEarnings { get; set; }
    public DateTime Date { get; set; }
}

/// <summary>
/// Creator application for affiliate program
/// </summary>
public class CreatorApplication
{
    public string CreatorId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Platform { get; set; } = "";
    public int FollowerCount { get; set; }
    public string Bio { get; set; } = "";
    public string ContactEmail { get; set; } = "";
    public string PortfolioUrl { get; set; } = "";
}

/// <summary>
/// Request for branded cosmetic creation
/// </summary>
public class BrandedCosmeticRequest
{
    public string CosmeticId { get; set; } = "";
    public string Name { get; set; } = "";
    public CosmeticType Type { get; set; }
    public string CharacterId { get; set; } = "any";
    public float Price { get; set; }
    public string DesignBrief { get; set; } = "";
}

/// <summary>
/// Creator statistics for dashboard
/// </summary>
public class CreatorStats
{
    public string CreatorId { get; set; } = "";
    public float TotalEarnings { get; set; }
    public int TotalSales { get; set; }
    public float AverageOrderValue { get; set; }
    public string TopSellingContent { get; set; } = "";
    public float LastMonthEarnings { get; set; }
    public int CodesUsed { get; set; }
}

/// <summary>
/// Data container for serialization
/// </summary>
public class CreatorAffiliateData
{
    public Dictionary<string, CreatorAffiliate> Creators { get; set; } = new();
    public Dictionary<string, List<AffiliateTransaction>> Transactions { get; set; } = new();
}

public enum CreatorTier
{
    Bronze,
    Silver,
    Gold,
    Platinum
}