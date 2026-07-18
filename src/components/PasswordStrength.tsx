export function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const clamped = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  const label = ["Too weak", "Weak", "Okay", "Strong", "Excellent"][clamped];
  return { score: clamped, label };
}

export function PasswordStrength({ pw }: { pw: string }) {
  const { score, label } = scorePassword(pw);
  const colors = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-lime-500", "bg-emerald-500"];
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition ${
              i < score ? colors[score] : "bg-white/10"
            }`}
          />
        ))}
      </div>
      {pw && <div className="text-[10px] text-muted-foreground">{label}</div>}
    </div>
  );
}
