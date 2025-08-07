using Godot;
using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// EVO Tournament Manager - Handles bracket management, Swiss system, and spectator features
/// Essential for EVO mainstage inclusion - provides tournament infrastructure
/// </summary>
public partial class EVOTournamentManager : Node
{
    public static EVOTournamentManager Instance { get; private set; }
    
    [Signal]
    public delegate void TournamentStartedEventHandler();
    
    [Signal] 
    public delegate void MatchCompletedEventHandler(string winnerId, string loserId);
    
    [Signal]
    public delegate void BracketUpdatedEventHandler();

    // Tournament state
    public enum TournamentFormat
    {
        Swiss,
        DoubleElimination, 
        RoundRobin,
        Custom
    }
    
    public enum TournamentState
    {
        Registration,
        InProgress,
        Completed,
        Paused
    }

    public class TournamentPlayer
    {
        public string PlayerId { get; set; }
        public string PlayerName { get; set; }
        public string CharacterId { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public int Points { get; set; }
        public float Tiebreaker { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class TournamentMatch
    {
        public string MatchId { get; set; }
        public string Player1Id { get; set; }
        public string Player2Id { get; set; }
        public string WinnerId { get; set; }
        public string LoserId { get; set; }
        public int Round { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime ScheduledTime { get; set; }
        public Dictionary<string, object> MatchData { get; set; } = new Dictionary<string, object>();
    }

    private TournamentFormat _currentFormat = TournamentFormat.Swiss;
    private TournamentState _currentState = TournamentState.Registration;
    private List<TournamentPlayer> _players = new List<TournamentPlayer>();
    private List<TournamentMatch> _matches = new List<TournamentMatch>();
    private int _currentRound = 0;
    private int _maxRounds = 7; // EVO Swiss standard
    
    // EVO-specific settings
    private const int MIN_EVO_PLAYERS = 8;
    private const int MAX_EVO_PLAYERS = 2048;
    private const int SWISS_ROUNDS_256 = 8;
    private const int SWISS_ROUNDS_512 = 9;

    public override void _Ready()
    {
        if (Instance == null)
        {
            Instance = this;
            GD.Print("EVO Tournament Manager initialized");
        }
        else
        {
            QueueFree();
        }
    }

    /// <summary>
    /// Register player for tournament - EVO registration system
    /// </summary>
    public bool RegisterPlayer(string playerId, string playerName, string characterId)
    {
        if (_currentState != TournamentState.Registration)
        {
            GD.PrintErr("Tournament registration is closed");
            return false;
        }

        if (_players.Count >= MAX_EVO_PLAYERS)
        {
            GD.PrintErr("Tournament is full");
            return false;
        }

        if (_players.Any(p => p.PlayerId == playerId))
        {
            GD.PrintErr($"Player {playerId} is already registered");
            return false;
        }

        var player = new TournamentPlayer
        {
            PlayerId = playerId,
            PlayerName = playerName,
            CharacterId = characterId
        };

        _players.Add(player);
        GD.Print($"Player {playerName} registered with {characterId}");
        return true;
    }

    /// <summary>
    /// Start tournament with EVO-standard Swiss system
    /// </summary>
    public bool StartTournament(TournamentFormat format = TournamentFormat.Swiss)
    {
        if (_currentState != TournamentState.Registration)
        {
            GD.PrintErr("Cannot start tournament - not in registration state");
            return false;
        }

        if (_players.Count < MIN_EVO_PLAYERS)
        {
            GD.PrintErr($"Need at least {MIN_EVO_PLAYERS} players to start tournament");
            return false;
        }

        _currentFormat = format;
        _currentState = TournamentState.InProgress;
        _currentRound = 1;

        // Calculate max rounds based on player count (EVO standard)
        _maxRounds = CalculateSwissRounds(_players.Count);

        GD.Print($"Starting {format} tournament with {_players.Count} players, {_maxRounds} rounds");

        // Generate first round pairings
        GenerateNextRound();
        
        EmitSignal(SignalName.TournamentStarted);
        return true;
    }

    /// <summary>
    /// Calculate Swiss rounds needed based on player count (EVO standard)
    /// </summary>
    private int CalculateSwissRounds(int playerCount)
    {
        if (playerCount <= 16) return 4;
        if (playerCount <= 32) return 5; 
        if (playerCount <= 64) return 6;
        if (playerCount <= 128) return 7;
        if (playerCount <= 256) return SWISS_ROUNDS_256;
        if (playerCount <= 512) return SWISS_ROUNDS_512;
        return 10; // For larger tournaments
    }

    /// <summary>
    /// Generate next round pairings using Swiss system
    /// </summary>
    private void GenerateNextRound()
    {
        if (_currentFormat == TournamentFormat.Swiss)
        {
            GenerateSwissPairings();
        }
        else
        {
            GenerateEliminationPairings();
        }
    }

    /// <summary>
    /// Generate Swiss system pairings (EVO standard)
    /// </summary>
    private void GenerateSwissPairings()
    {
        var activePlayers = _players.Where(p => p.IsActive).ToList();
        
        if (_currentRound == 1)
        {
            // First round: random pairings
            var shuffled = activePlayers.OrderBy(x => GD.Randf()).ToList();
            for (int i = 0; i < shuffled.Count - 1; i += 2)
            {
                CreateMatch(shuffled[i], shuffled[i + 1]);
            }
        }
        else
        {
            // Subsequent rounds: pair by score, avoid repeat matches
            var sortedByScore = activePlayers
                .OrderByDescending(p => p.Points)
                .ThenByDescending(p => p.Tiebreaker)
                .ToList();

            var paired = new HashSet<string>();
            
            for (int i = 0; i < sortedByScore.Count - 1; i++)
            {
                var player1 = sortedByScore[i];
                if (paired.Contains(player1.PlayerId)) continue;

                // Find best available opponent
                for (int j = i + 1; j < sortedByScore.Count; j++)
                {
                    var player2 = sortedByScore[j];
                    if (paired.Contains(player2.PlayerId)) continue;

                    // Check if they've played before
                    if (!HavePlayedBefore(player1.PlayerId, player2.PlayerId))
                    {
                        CreateMatch(player1, player2);
                        paired.Add(player1.PlayerId);
                        paired.Add(player2.PlayerId);
                        break;
                    }
                }
            }
        }

        GD.Print($"Generated {GetCurrentRoundMatches().Count} matches for round {_currentRound}");
    }

    /// <summary>
    /// Generate elimination bracket pairings
    /// </summary>
    private void GenerateEliminationPairings()
    {
        // TODO: Implement double elimination bracket
        GD.Print("Double elimination not yet implemented");
    }

    /// <summary>
    /// Check if two players have played before
    /// </summary>
    private bool HavePlayedBefore(string player1Id, string player2Id)
    {
        return _matches.Any(m => 
            (m.Player1Id == player1Id && m.Player2Id == player2Id) ||
            (m.Player1Id == player2Id && m.Player2Id == player1Id));
    }

    /// <summary>
    /// Create a tournament match
    /// </summary>
    private void CreateMatch(TournamentPlayer player1, TournamentPlayer player2)
    {
        var match = new TournamentMatch
        {
            MatchId = Guid.NewGuid().ToString(),
            Player1Id = player1.PlayerId,
            Player2Id = player2.PlayerId,
            Round = _currentRound,
            ScheduledTime = DateTime.Now.AddMinutes(_matches.Count * 5) // Stagger matches
        };

        _matches.Add(match);
    }

    /// <summary>
    /// Report match result and update standings
    /// </summary>
    public bool ReportMatchResult(string matchId, string winnerId)
    {
        var match = _matches.FirstOrDefault(m => m.MatchId == matchId);
        if (match == null)
        {
            GD.PrintErr($"Match {matchId} not found");
            return false;
        }

        if (match.IsCompleted)
        {
            GD.PrintErr($"Match {matchId} is already completed");
            return false;
        }

        var loserId = winnerId == match.Player1Id ? match.Player2Id : match.Player1Id;
        
        match.WinnerId = winnerId;
        match.LoserId = loserId;
        match.IsCompleted = true;

        // Update player records
        var winner = _players.First(p => p.PlayerId == winnerId);
        var loser = _players.First(p => p.PlayerId == loserId);

        winner.Wins++;
        winner.Points += 3; // Swiss points for win
        
        loser.Losses++;
        loser.Points += 1; // Swiss points for loss (participation)

        // Update tiebreakers (opponent's match win percentage)
        UpdateTiebreakers();

        GD.Print($"Match completed: {winner.PlayerName} defeats {loser.PlayerName}");
        
        EmitSignal(SignalName.MatchCompleted, winnerId, loserId);
        
        // Check if round is complete
        if (IsRoundComplete())
        {
            AdvanceToNextRound();
        }

        return true;
    }

    /// <summary>
    /// Update tiebreaker scores (opponent match win percentage)
    /// </summary>
    private void UpdateTiebreakers()
    {
        foreach (var player in _players)
        {
            var opponents = GetPlayerOpponents(player.PlayerId);
            if (opponents.Count > 0)
            {
                float totalWinPercentage = 0;
                foreach (var opponent in opponents)
                {
                    float winPercentage = opponent.Wins + opponent.Losses > 0 
                        ? (float)opponent.Wins / (opponent.Wins + opponent.Losses)
                        : 0f;
                    totalWinPercentage += winPercentage;
                }
                player.Tiebreaker = totalWinPercentage / opponents.Count;
            }
        }
    }

    /// <summary>
    /// Get all opponents a player has faced
    /// </summary>
    private List<TournamentPlayer> GetPlayerOpponents(string playerId)
    {
        var opponents = new List<TournamentPlayer>();
        
        foreach (var match in _matches.Where(m => m.IsCompleted))
        {
            string opponentId = null;
            if (match.Player1Id == playerId)
                opponentId = match.Player2Id;
            else if (match.Player2Id == playerId)
                opponentId = match.Player1Id;

            if (opponentId != null)
            {
                var opponent = _players.First(p => p.PlayerId == opponentId);
                opponents.Add(opponent);
            }
        }

        return opponents;
    }

    /// <summary>
    /// Check if current round is complete
    /// </summary>
    private bool IsRoundComplete()
    {
        return GetCurrentRoundMatches().All(m => m.IsCompleted);
    }

    /// <summary>
    /// Get matches for current round
    /// </summary>
    private List<TournamentMatch> GetCurrentRoundMatches()
    {
        return _matches.Where(m => m.Round == _currentRound).ToList();
    }

    /// <summary>
    /// Advance to next round or complete tournament
    /// </summary>
    private void AdvanceToNextRound()
    {
        if (_currentRound >= _maxRounds)
        {
            CompleteTournament();
        }
        else
        {
            _currentRound++;
            GenerateNextRound();
            EmitSignal(SignalName.BracketUpdated);
        }
    }

    /// <summary>
    /// Complete tournament and determine final standings
    /// </summary>
    private void CompleteTournament()
    {
        _currentState = TournamentState.Completed;
        
        var finalStandings = _players
            .OrderByDescending(p => p.Points)
            .ThenByDescending(p => p.Tiebreaker)
            .ThenByDescending(p => p.Wins)
            .ToList();

        GD.Print("=== TOURNAMENT COMPLETE ===");
        for (int i = 0; i < finalStandings.Count; i++)
        {
            var player = finalStandings[i];
            GD.Print($"{i + 1}. {player.PlayerName} ({player.Wins}-{player.Losses}, {player.Points} pts)");
        }

        EmitSignal(SignalName.BracketUpdated);
    }

    /// <summary>
    /// Get current tournament standings
    /// </summary>
    public List<TournamentPlayer> GetStandings()
    {
        return _players
            .OrderByDescending(p => p.Points)
            .ThenByDescending(p => p.Tiebreaker)
            .ThenByDescending(p => p.Wins)
            .ToList();
    }

    /// <summary>
    /// Get tournament statistics for spectators/streams
    /// </summary>
    public Dictionary<string, object> GetTournamentStats()
    {
        var stats = new Dictionary<string, object>
        {
            ["TotalPlayers"] = _players.Count,
            ["ActivePlayers"] = _players.Count(p => p.IsActive),
            ["CurrentRound"] = _currentRound,
            ["MaxRounds"] = _maxRounds,
            ["CompletedMatches"] = _matches.Count(m => m.IsCompleted),
            ["TotalMatches"] = _matches.Count,
            ["Format"] = _currentFormat.ToString(),
            ["State"] = _currentState.ToString()
        };

        return stats;
    }

    /// <summary>
    /// Export tournament data for EVO submission
    /// </summary>
    public string ExportTournamentData()
    {
        var data = new Dictionary<string, object>
        {
            ["tournament_info"] = GetTournamentStats(),
            ["players"] = _players,
            ["matches"] = _matches,
            ["final_standings"] = GetStandings()
        };

        return Json.Stringify(Variant.From(data));
    }
}