export class TtsService {
  speak(text: string, lang?: string): void {
    try {
      const s = new SpeechSynthesisUtterance(text);
      if (lang) s.lang = lang;
      speechSynthesis.speak(s);
    } catch {}
  }
}

