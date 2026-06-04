// Browser TTS helper - female voice preferred
let cachedVoice: SpeechSynthesisVoice | null = null;

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = [
    "Google UK English Female",
    "Google US English",
    "Samantha",
    "Microsoft Zira",
    "Microsoft Aria",
    "Karen",
    "Victoria",
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name.includes(name));
    if (v) return (cachedVoice = v);
  }
  const female = voices.find((v) => /female|zira|samantha|karen|victoria|aria/i.test(v.name));
  if (female) return (cachedVoice = female);
  return (cachedVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0]);
}

export function speak(text: string, onEnd?: () => void): void {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickFemaleVoice();
  if (v) u.voice = v;
  u.rate = 1.0;
  u.pitch = 1.05;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// Warm up voices list (browsers load async)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; pickFemaleVoice(); };
}
