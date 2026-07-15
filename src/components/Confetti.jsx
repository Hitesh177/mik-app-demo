import { useEffect, useState } from 'react';

const COLORS = ['#22c55e', '#f97316', '#eab308', '#3b82f6', '#ec4899', '#a855f7', '#ef4444', '#14b8a6'];
const COUNT = 80;

function rand(min, max) { return Math.random() * (max - min) + min; }

export default function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      left: rand(0, 100),
      delay: rand(0, 2),
      duration: rand(2.5, 4.5),
      size: rand(6, 12),
      color: COLORS[i % COLORS.length],
      shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'triangle',
    }))
  );
  const [active, setActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setActive(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            width: p.size,
            height: p.size,
            backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : 'none',
            borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : 'none',
            borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
