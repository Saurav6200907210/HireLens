// Web Speech API helpers
export type SpeechRec = {
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export function getSpeechRecognition(
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onError?: (err: string) => void,
): SpeechRec | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  rec.onresult = (event: any) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    if (interim) onInterim(interim);
    if (final) onFinal(final);
  };
  rec.onerror = (e: any) => onError?.(e.error || "speech-error");

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}
