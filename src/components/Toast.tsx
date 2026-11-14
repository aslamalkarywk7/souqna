import {useEffect, useState} from 'react';
import {CheckCircle2} from 'lucide-react';

/**
 * Minimal toast bus — `toast(message)` shows a transient confirmation bubble.
 * Avoids pulling a whole toast library for one use case.
 */

let push: ((msg: string) => void) | null = null;

export function toast(message: string): void {
  push?.(message);
}

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    push = (msg: string) => {
      setMessage(msg);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 2600);
    };
    return () => {
      push = null;
      clearTimeout(timer);
    };
  }, []);

  if (!message) return null;
  return (
    <div className="fixed bottom-6 inset-x-0 z-[100] flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl fade-up">
        <CheckCircle2 size={17} className="text-emerald-400" />
        {message}
      </div>
    </div>
  );
}
