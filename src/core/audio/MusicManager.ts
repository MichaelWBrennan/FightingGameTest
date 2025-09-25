import { AudioManager, AudioClip } from './AudioManager';

export interface MusicTrack {
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
  category: 'menu' | 'battle' | 'character_select' | 'training' | 'victory' | 'defeat';
  priority: number;
}

export interface MusicPlaylist {
  name: string;
  tracks: MusicTrack[];
  shuffle: boolean;
  repeat: boolean;
}

export class MusicManager {
  private audioManager: AudioManager;
  private currentTrack: MusicTrack | null = null;
  private playlists: Map<string, MusicPlaylist> = new Map();
  private currentPlaylist: MusicPlaylist | null = null;
  private playlistIndex = 0;
  private isPlaying = false;
  private crossfadeDuration = 2.0;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.setupDefaultPlaylists();
  }

  private setupDefaultPlaylists(): void {
    // Menu music playlist
    this.playlists.set('menu', {
      name: 'Menu Music',
      tracks: [
        {
          name: 'main_theme',
          url: '/audio/music/main_theme.mp3',
          volume: 0.7,
          loop: true,
          fadeIn: 2.0,
          fadeOut: 2.0,
          category: 'menu',
          priority: 1
        },
        {
          name: 'character_select',
          url: '/audio/music/character_select.mp3',
          volume: 0.6,
          loop: true,
          fadeIn: 1.5,
          fadeOut: 1.5,
          category: 'character_select',
          priority: 2
        }
      ],
      shuffle: false,
      repeat: true
    });

    // Battle music playlist
    this.playlists.set('battle', {
      name: 'Battle Music',
      tracks: [
        {
          name: 'battle_theme_1',
          url: '/audio/music/battle_theme_1.mp3',
          volume: 0.8,
          loop: true,
          fadeIn: 1.0,
          fadeOut: 1.0,
          category: 'battle',
          priority: 1
        },
        {
          name: 'battle_theme_2',
          url: '/audio/music/battle_theme_2.mp3',
          volume: 0.8,
          loop: true,
          fadeIn: 1.0,
          fadeOut: 1.0,
          category: 'battle',
          priority: 1
        },
        {
          name: 'boss_theme',
          url: '/audio/music/boss_theme.mp3',
          volume: 0.9,
          loop: true,
          fadeIn: 2.0,
          fadeOut: 2.0,
          category: 'battle',
          priority: 3
        }
      ],
      shuffle: true,
      repeat: true
    });

    // Training music playlist
    this.playlists.set('training', {
      name: 'Training Music',
      tracks: [
        {
          name: 'training_theme',
          url: '/audio/music/training_theme.mp3',
          volume: 0.5,
          loop: true,
          fadeIn: 2.0,
          fadeOut: 2.0,
          category: 'training',
          priority: 1
        }
      ],
      shuffle: false,
      repeat: true
    });
  }

  public async loadPlaylist(playlistName: string): Promise<void> {
    const playlist = this.playlists.get(playlistName);
    if (!playlist) {
      console.warn(`Playlist not found: ${playlistName}`);
      return;
    }

    // Load all tracks in the playlist
    const audioClips: AudioClip[] = playlist.tracks.map(track => ({
      name: track.name,
      url: track.url,
      volume: track.volume,
      pitch: 1.0,
      loop: track.loop,
      category: 'music' as const,
      priority: track.priority
    }));

    await this.audioManager.loadAudioClips(audioClips);
    console.log(`Loaded playlist: ${playlistName}`);
  }

  public async loadAllPlaylists(): Promise<void> {
    const loadPromises = Array.from(this.playlists.keys()).map(name => this.loadPlaylist(name));
    await Promise.all(loadPromises);
  }

  public playPlaylist(playlistName: string, trackIndex: number = 0): void {
    const playlist = this.playlists.get(playlistName);
    if (!playlist) {
      console.warn(`Playlist not found: ${playlistName}`);
      return;
    }

    this.currentPlaylist = playlist;
    this.playlistIndex = trackIndex;
    this.isPlaying = true;

    this.playCurrentTrack();
  }

  public playTrack(trackName: string, crossfade: boolean = true): void {
    const track = this.findTrackByName(trackName);
    if (!track) {
      console.warn(`Track not found: ${trackName}`);
      return;
    }

    if (crossfade && this.currentTrack) {
      this.crossfadeToTrack(track);
    } else {
      this.playTrackDirect(track);
    }
  }

  private playCurrentTrack(): void {
    if (!this.currentPlaylist) return;

    const track = this.currentPlaylist.tracks[this.playlistIndex];
    if (!track) return;

    this.playTrackDirect(track);
  }

  private playTrackDirect(track: MusicTrack): void {
    this.currentTrack = track;
    this.audioManager.playMusic(track.name, {
      volume: track.volume,
      loop: track.loop,
      fadeIn: track.fadeIn
    });
  }

  private crossfadeToTrack(track: MusicTrack): void {
    if (!this.currentTrack) {
      this.playTrackDirect(track);
      return;
    }

    // Fade out current track
    this.audioManager.stopMusic(this.currentTrack.fadeOut);

    // Fade in new track
    setTimeout(() => {
      this.playTrackDirect(track);
    }, this.currentTrack.fadeOut * 1000);
  }

  public nextTrack(): void {
    if (!this.currentPlaylist) return;

    this.playlistIndex = (this.playlistIndex + 1) % this.currentPlaylist.tracks.length;
    this.playCurrentTrack();
  }

  public previousTrack(): void {
    if (!this.currentPlaylist) return;

    this.playlistIndex = this.playlistIndex === 0 
      ? this.currentPlaylist.tracks.length - 1 
      : this.playlistIndex - 1;
    this.playCurrentTrack();
  }

  public stopMusic(fadeOut: number = 1.0): void {
    this.audioManager.stopMusic(fadeOut);
    this.currentTrack = null;
    this.isPlaying = false;
  }

  public pauseMusic(): void {
    // Note: Web Audio API doesn't support pause/resume directly
    // This would require implementing a custom pause system
    console.warn('Pause not implemented - use stop/play instead');
  }

  public resumeMusic(): void {
    // Note: Web Audio API doesn't support pause/resume directly
    console.warn('Resume not implemented - use stop/play instead');
  }

  public setVolume(volume: number): void {
    this.audioManager.setBusVolume('music', volume);
  }

  public setMuted(muted: boolean): void {
    this.audioManager.setBusMuted('music', muted);
  }

  public getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  public getCurrentPlaylist(): MusicPlaylist | null {
    return this.currentPlaylist;
  }

  public isMusicPlaying(): boolean {
    return this.isPlaying && this.audioManager.isPlaying(this.currentTrack?.name || '');
  }

  private findTrackByName(trackName: string): MusicTrack | null {
    for (const playlist of this.playlists.values()) {
      const track = playlist.tracks.find(t => t.name === trackName);
      if (track) return track;
    }
    return null;
  }

  public addPlaylist(playlist: MusicPlaylist): void {
    this.playlists.set(playlist.name, playlist);
  }

  public removePlaylist(playlistName: string): void {
    this.playlists.delete(playlistName);
  }

  public getPlaylistNames(): string[] {
    return Array.from(this.playlists.keys());
  }

  public getPlaylist(playlistName: string): MusicPlaylist | null {
    return this.playlists.get(playlistName) || null;
  }

  public setCrossfadeDuration(duration: number): void {
    this.crossfadeDuration = Math.max(0, duration);
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }
}