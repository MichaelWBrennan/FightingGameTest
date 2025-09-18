import * as pc from 'playcanvas';
import { GameState } from './GameStateStack';

export class LoginState implements GameState {
	public name = 'login';
	private app: pc.Application;
	private events: any;
	private uiRoot: pc.Entity | null = null;
	private inputGroup: pc.Entity | null = null;
	private usernameText: pc.Entity | null = null;
	private promptText: pc.Entity | null = null;
	private username: string = '';
	private busy: boolean = false;
	private keyHandler: ((e: any) => void) | null = null;

	constructor(app: pc.Application, events: any) {
		this.app = app;
		this.events = events;
	}

	async enter(): Promise<void> {
		this.createUI();
		this.attachInput();
	}

	exit(): void {
		this.detachInput();
		if (this.uiRoot && this.uiRoot.parent) {
			this.uiRoot.destroy();
		}
		this.uiRoot = null;
	}

	update(dt: number): void {}

	private createUI(): void {
		this.uiRoot = new pc.Entity('LoginUI');
		this.uiRoot.addComponent('screen', {
			referenceResolution: new pc.Vec2(1920, 1080),
			scaleMode: pc.SCALEMODE_BLEND,
			scaleBlend: 0.5,
			screenSpace: true
		});
		this.app.root.addChild(this.uiRoot);

		// Background panel
		const panel = new pc.Entity('LoginPanel');
		panel.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			anchor: [0.25, 0.25, 0.75, 0.75],
			color: new pc.Color(0.08, 0.08, 0.1, 0.95)
		});
		this.uiRoot.addChild(panel);

		// Title
		const title = new pc.Entity('Title');
		title.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			anchor: [0.1, 0.75, 0.9, 0.92],
			text: 'Sign In',
			fontSize: 48,
			color: new pc.Color(1, 1, 1),
			alignment: new pc.Vec2(0.5, 0.5)
		});
		this.applyRuntimeFont(title);
		panel.addChild(title);

		// Username group
		this.inputGroup = new pc.Entity('UsernameGroup');
		this.inputGroup.addComponent('element', {
			type: pc.ELEMENTTYPE_GROUP,
			anchor: [0.1, 0.45, 0.9, 0.65]
		});
		panel.addChild(this.inputGroup);

		const inputBg = new pc.Entity('InputBg');
		inputBg.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			anchor: [0, 0.25, 1, 0.75],
			color: new pc.Color(0.15, 0.15, 0.2, 1)
		});
		this.inputGroup.addChild(inputBg);

		const inputLabel = new pc.Entity('InputLabel');
		inputLabel.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			anchor: [0, 0.75, 0.3, 1],
			text: 'Username',
			fontSize: 24,
			color: new pc.Color(0.8, 0.8, 0.9),
			alignment: new pc.Vec2(0, 0.5)
		});
		this.applyRuntimeFont(inputLabel);
		this.inputGroup.addChild(inputLabel);

		this.usernameText = new pc.Entity('UsernameText');
		this.usernameText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			anchor: [0.02, 0.25, 0.98, 0.75],
			text: '',
			fontSize: 28,
			color: new pc.Color(1, 1, 1),
			alignment: new pc.Vec2(0, 0.5)
		});
		this.applyRuntimeFont(this.usernameText);
		this.inputGroup.addChild(this.usernameText);

		// Prompt / button
		this.promptText = new pc.Entity('Prompt');
		this.promptText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			anchor: [0.1, 0.25, 0.9, 0.38],
			text: 'Press Enter to continue',
			fontSize: 22,
			color: new pc.Color(0.9, 0.9, 1),
			alignment: new pc.Vec2(0.5, 0.5)
		});
		this.applyRuntimeFont(this.promptText);
		panel.addChild(this.promptText);

		// Clickable login button (optional)
		const loginBtn = new pc.Entity('LoginButton');
		loginBtn.addComponent('element', {
			type: pc.ELEMENTTYPE_IMAGE,
			anchor: [0.4, 0.08, 0.6, 0.18],
			color: new pc.Color(0.25, 0.35, 0.6, 1)
		});
		const loginText = new pc.Entity('LoginButtonText');
		loginText.addComponent('element', {
			type: pc.ELEMENTTYPE_TEXT,
			anchor: [0, 0, 1, 1],
			text: 'Login',
			fontSize: 24,
			color: new pc.Color(1, 1, 1),
			alignment: new pc.Vec2(0.5, 0.5)
		});
		this.applyRuntimeFont(loginText);
		loginBtn.addChild(loginText);
		loginBtn.addComponent('button', { imageEntity: loginBtn });
		loginBtn.button!.on('click', () => this.submit());
		panel.addChild(loginBtn);
	}

	private applyRuntimeFont(entity: pc.Entity): void {
		try {
			const ui: any = (this.app as any)._ui;
			const font = ui?.getRuntimeFont?.();
			if (font && (entity as any).element) {
				(entity as any).element.font = font;
			}
		} catch {}
	}

	private attachInput(): void {
		const keyboard = this.app.keyboard!;
		this.keyHandler = (e: any) => {
			if (this.busy) return;
			if (e.key === pc.KEY_RETURN || e.key === pc.KEY_NUMPAD_ENTER) {
				this.submit();
				return;
			}
			if (e.key === pc.KEY_BACKSPACE) {
				this.username = this.username.slice(0, -1);
				this.refreshText();
				return;
			}
			// Basic character input filtering
			const ch = (e.event as KeyboardEvent).key;
			if (typeof ch === 'string' && ch.length === 1) {
				if (/^[a-zA-Z0-9_\- ]$/.test(ch) && this.username.length < 20) {
					this.username += ch;
					this.refreshText();
				}
			}
		};
		keyboard.on(pc.EVENT_KEYDOWN, this.keyHandler, this);
	}

	private detachInput(): void {
		if (this.keyHandler) {
			this.app.keyboard!.off(pc.EVENT_KEYDOWN, this.keyHandler, this);
			this.keyHandler = null;
		}
	}

	private refreshText(): void {
		if (this.usernameText && this.usernameText.element) {
			this.usernameText.element.text = this.username || '<enter a username>';
		}
	}

	private async submit(): Promise<void> {
		if (this.busy) return;
		this.busy = true;
		if (this.promptText?.element) {
			this.promptText.element.text = 'Signing in...';
		}
		try {
			const r = await fetch('/api/session');
			let token = '';
			let userId = 'guest';
			if (r.ok) {
				const data = await r.json();
				token = data.token;
				userId = data.userId || 'guest';
			}
			const services = (this.app as any)._services as any;
			services.register('session', { token, userId, username: this.username || 'Player' });
			try { localStorage.setItem('sf3_session', JSON.stringify({ token, userId, username: this.username || 'Player' })); } catch {}
			this.events.emit('state:goto', { state: 'characterselect' });
		} catch (e) {
			if (this.promptText?.element) {
				this.promptText.element.text = 'Sign in failed, press Enter to retry';
			}
		} finally {
			this.busy = false;
		}
	}
}

