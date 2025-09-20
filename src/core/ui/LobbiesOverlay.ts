import { MatchmakingService, Lobby, PlayerProfile, Region } from '../online/MatchmakingService';

export class LobbiesOverlay {
  private container: HTMLDivElement;
  private header: HTMLDivElement;
  private listEl: HTMLDivElement;
  private friendsEl: HTMLDivElement;
  private invitesEl: HTMLDivElement | null = null;
  private createName: HTMLInputElement;
  private createMax: HTMLInputElement;
  private nameInput: HTMLInputElement;
  private regionSel: HTMLSelectElement;
  private visible = false;

  constructor(private svc: MatchmakingService) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.left = '8px';
    this.container.style.bottom = '8px';
    this.container.style.width = '300px';
    this.container.style.padding = '10px';
    this.container.style.background = 'rgba(0,0,0,0.65)';
    this.container.style.color = '#fff';
    this.container.style.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.35)';
    this.container.style.zIndex = '10003';
    this.container.style.display = 'none';

    this.header = document.createElement('div');
    this.header.textContent = 'Lobbies & Friends';
    this.header.style.fontWeight = 'bold';
    this.header.style.marginBottom = '6px';
    this.container.appendChild(this.header);

    // Profile controls
    const profileRow = document.createElement('div');
    profileRow.style.display = 'flex';
    profileRow.style.gap = '6px';
    this.nameInput = document.createElement('input');
    this.nameInput.placeholder = 'Name';
    this.nameInput.style.flex = '1';
    this.regionSel = document.createElement('select');
    ;['NA','EU','AS','SA','OC','AF'].forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; this.regionSel.appendChild(o); });
    profileRow.appendChild(this.nameInput); profileRow.appendChild(this.regionSel);
    this.container.appendChild(profileRow);
    const saveBtn = document.createElement('button'); saveBtn.textContent = 'Save'; saveBtn.style.margin = '6px 0';
    saveBtn.onclick = () => { this.svc.setName(this.nameInput.value || this.svc.getProfile().name); this.svc.setRegion((this.regionSel.value as Region) || 'NA'); this.refresh(); this.track('profile_update'); };
    this.container.appendChild(saveBtn);

    // Create lobby
    const createRow = document.createElement('div'); createRow.style.display = 'flex'; createRow.style.gap = '6px'; createRow.style.marginTop = '6px';
    this.createName = document.createElement('input'); this.createName.placeholder = 'Lobby name'; this.createName.style.flex = '1';
    this.createMax = document.createElement('input'); this.createMax.placeholder = 'Max'; this.createMax.type = 'number'; this.createMax.min = '2'; this.createMax.max = '8'; this.createMax.style.width = '56px';
    const createBtn = document.createElement('button'); createBtn.textContent = 'Create';
    createBtn.onclick = () => { const max = Math.max(2, Math.min(8, parseInt(this.createMax.value || '2', 10))); const l = this.svc.createLobby(this.createName.value || 'Lobby', max); this.track('lobby_create', { id: l.id, max }); this.refresh(); };
    createRow.appendChild(this.createName); createRow.appendChild(this.createMax); createRow.appendChild(createBtn);
    this.container.appendChild(createRow);

    // Lobby list
    const listTitle = document.createElement('div'); listTitle.textContent = 'Lobbies'; listTitle.style.marginTop = '8px'; listTitle.style.opacity = '0.9';
    this.container.appendChild(listTitle);
    this.listEl = document.createElement('div'); this.listEl.style.display = 'flex'; this.listEl.style.flexDirection = 'column'; this.listEl.style.gap = '4px'; this.container.appendChild(this.listEl);

    // Friends
    const friendsTitle = document.createElement('div'); friendsTitle.textContent = 'Friends'; friendsTitle.style.marginTop = '8px'; friendsTitle.style.opacity = '0.9';
    this.container.appendChild(friendsTitle);
    this.friendsEl = document.createElement('div'); this.friendsEl.style.display = 'flex'; this.friendsEl.style.flexDirection = 'column'; this.friendsEl.style.gap = '4px'; this.container.appendChild(this.friendsEl);
    // Invites area
    const invTitle = document.createElement('div'); invTitle.textContent = 'Invites'; invTitle.style.marginTop = '8px'; invTitle.style.opacity = '0.9';
    this.container.appendChild(invTitle);
    this.invitesEl = document.createElement('div'); this.invitesEl.style.display = 'flex'; this.invitesEl.style.flexDirection = 'column'; this.invitesEl.style.gap = '4px'; this.container.appendChild(this.invitesEl);
    const addRow = document.createElement('div'); addRow.style.display = 'flex'; addRow.style.gap = '6px';
    const addId = document.createElement('input'); addId.placeholder = 'Friend id'; addId.style.flex = '1';
    const addBtn = document.createElement('button'); addBtn.textContent = 'Add'; addBtn.onclick = () => { const id = (addId.value || '').trim(); if (id) { this.svc.addFriend(id); this.track('friend_add'); this.refresh(); } };
    addRow.appendChild(addId); addRow.appendChild(addBtn); this.container.appendChild(addRow);

    const toggle = document.createElement('button');
    toggle.textContent = 'Lobbies (F7)';
    toggle.style.position = 'fixed'; toggle.style.left = '8px'; toggle.style.bottom = '8px'; toggle.style.zIndex = '10002';
    toggle.onclick = () => this.toggle();
    document.body.appendChild(toggle);
    document.body.appendChild(this.container);

    // Listen to service events
    this.svc.on(() => this.refresh());
    try { (window as any).addEventListener('message', (e: MessageEvent) => { const m = e.data; if (m?.t === 'lobby_invite' && this.invitesEl) this.renderInvite(m); }); } catch {}
    window.addEventListener('keydown', (e) => { if (e.key === 'F7') this.toggle(); });

    this.refresh();
  }

  private toggle(): void { this.visible = !this.visible; this.container.style.display = this.visible ? 'block' : 'none'; }

  private refresh(): void {
    const p = this.svc.getProfile();
    this.nameInput.value = p.name;
    this.regionSel.value = p.region;
    this.renderLobbies();
    this.renderFriends(p);
  }

  private renderLobbies(): void {
    this.listEl.innerHTML = '';
    const lobbies = this.svc.listLobbies(this.svc.getProfile().region);
    if (lobbies.length === 0) {
      const empty = document.createElement('div'); empty.textContent = 'No lobbies'; empty.style.opacity = '0.7'; this.listEl.appendChild(empty); return;
    }
    for (const l of lobbies) {
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '6px';
      const name = document.createElement('div'); name.textContent = `${l.name} · ${l.players.length}/${l.max}`; name.style.flex = '1';
      const join = document.createElement('button'); join.textContent = 'Join'; join.onclick = () => { if (this.svc.joinLobby(l.id)) { this.track('lobby_join', { id: l.id }); this.refresh(); } };
      row.appendChild(name); row.appendChild(join);
      this.listEl.appendChild(row);
    }
  }

  private renderFriends(p: PlayerProfile): void {
    this.friendsEl.innerHTML = '';
    if ((p.friends || []).length === 0) { const empty = document.createElement('div'); empty.textContent = 'No friends'; empty.style.opacity = '0.7'; this.friendsEl.appendChild(empty); return; }
    for (const f of p.friends) {
      const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '6px';
      const name = document.createElement('div'); name.textContent = f; name.style.flex = '1';
      const invite = document.createElement('button'); invite.textContent = 'Invite'; invite.onclick = () => this.sendInvite(f);
      const rm = document.createElement('button'); rm.textContent = 'Remove'; rm.onclick = () => { this.svc.removeFriend(f); this.track('friend_remove'); this.refresh(); };
      row.appendChild(name); row.appendChild(invite); row.appendChild(rm);
      this.friendsEl.appendChild(row);
    }
  }

  private sendInvite(friendId: string): void {
    try {
      // Local broadcast as a stub for invites
      const p = this.svc.getProfile();
      window.postMessage({ t: 'lobby_invite', from: p.id, to: friendId, lobby: (this.svc.listLobbies(p.region)[0]?.id || null) }, '*');
      this.track('invite_send', { to: friendId });
    } catch {}
  }

  private renderInvite(m: any): void {
    if (!this.invitesEl) return;
    const row = document.createElement('div'); row.style.display = 'flex'; row.style.alignItems = 'center'; row.style.gap = '6px';
    const label = document.createElement('div'); label.textContent = `Invite from ${m.from}`; label.style.flex = '1';
    const accept = document.createElement('button'); accept.textContent = 'Accept'; accept.onclick = () => { if (m.lobby) this.svc.joinLobby(m.lobby); this.track('invite_accept', { from: m.from }); this.refresh(); row.remove(); };
    const decline = document.createElement('button'); decline.textContent = 'Decline'; decline.onclick = () => { this.track('invite_decline', { from: m.from }); row.remove(); };
    row.appendChild(label); row.appendChild(accept); row.appendChild(decline);
    this.invitesEl.appendChild(row);
  }

  private track(name: string, props?: Record<string, any>): void {
    try {
      const services: any = (window as any).pc?.Application?.getApplication?._services || (window as any)._services || (document as any)._services;
      const analytics = services?.resolve?.('analytics');
      analytics?.track?.(name, props);
    } catch {}
  }
}

