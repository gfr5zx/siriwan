
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Ball, Particle } from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_SIZE, 
  PADDLE_SPEED, 
  INITIAL_BALL_SPEED, 
  BALL_ACCELERATION, 
  WINNING_SCORE,
  COLORS
} from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>(0);
  
  // Game Objects
  const p1Y = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const p2Y = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ball = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: BALL_SIZE,
    height: BALL_SIZE,
    vx: INITIAL_BALL_SPEED,
    vy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
  });
  
  const particles = useRef<Particle[]>([]);
  const trail = useRef<{x: number, y: number}[]>([]);
  const screenShake = useRef(0);

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color
      });
    }
  };

  const resetBall = (dir: number) => {
    ball.current.x = CANVAS_WIDTH / 2;
    ball.current.y = CANVAS_HEIGHT / 2;
    ball.current.speed = INITIAL_BALL_SPEED;
    ball.current.vx = INITIAL_BALL_SPEED * dir;
    ball.current.vy = (Math.random() - 0.5) * 6;
    trail.current = [];
    screenShake.current = 10;
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Paddle Movement
    if (keys.current.has('KeyW')) p1Y.current = Math.max(0, p1Y.current - PADDLE_SPEED);
    if (keys.current.has('KeyS')) p1Y.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p1Y.current + PADDLE_SPEED);
    if (keys.current.has('ArrowUp')) p2Y.current = Math.max(0, p2Y.current - PADDLE_SPEED);
    if (keys.current.has('ArrowDown')) p2Y.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, p2Y.current + PADDLE_SPEED);

    // Ball Physics
    ball.current.x += ball.current.vx;
    ball.current.y += ball.current.vy;

    // Trail
    trail.current.push({ x: ball.current.x, y: ball.current.y });
    if (trail.current.length > 15) trail.current.shift();

    // Wall Collision
    if (ball.current.y <= 0 || ball.current.y + BALL_SIZE >= CANVAS_HEIGHT) {
      ball.current.vy *= -1;
      createParticles(ball.current.x, ball.current.y, COLORS.BALL);
    }

    // Paddle Collision - Player 1
    if (
      ball.current.vx < 0 &&
      ball.current.x <= PADDLE_WIDTH + 10 &&
      ball.current.y + BALL_SIZE >= p1Y.current &&
      ball.current.y <= p1Y.current + PADDLE_HEIGHT
    ) {
      ball.current.vx *= -1;
      ball.current.speed *= BALL_ACCELERATION;
      ball.current.vx = Math.abs(ball.current.vx) * BALL_ACCELERATION;
      // Change angle based on hit location
      const hitPos = (ball.current.y + BALL_SIZE / 2) - (p1Y.current + PADDLE_HEIGHT / 2);
      ball.current.vy = hitPos * 0.15;
      createParticles(ball.current.x, ball.current.y, COLORS.PLAYER1);
    }

    // Paddle Collision - Player 2
    if (
      ball.current.vx > 0 &&
      ball.current.x + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH - 10 &&
      ball.current.y + BALL_SIZE >= p2Y.current &&
      ball.current.y <= p2Y.current + PADDLE_HEIGHT
    ) {
      ball.current.vx *= -1;
      ball.current.speed *= BALL_ACCELERATION;
      ball.current.vx = -Math.abs(ball.current.vx) * BALL_ACCELERATION;
      const hitPos = (ball.current.y + BALL_SIZE / 2) - (p2Y.current + PADDLE_HEIGHT / 2);
      ball.current.vy = hitPos * 0.15;
      createParticles(ball.current.x, ball.current.y, COLORS.PLAYER2);
    }

    // Scoring
    if (ball.current.x < 0) {
      setScore2(s => s + 1);
      resetBall(1);
    } else if (ball.current.x > CANVAS_WIDTH) {
      setScore1(s => s + 1);
      resetBall(-1);
    }

    // Particles update
    particles.current = particles.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });

    if (screenShake.current > 0) screenShake.current -= 1;
  }, [gameState]);

  useEffect(() => {
    if (score1 >= WINNING_SCORE) {
      setWinner(1);
      setGameState('GAMEOVER');
    } else if (score2 >= WINNING_SCORE) {
      setWinner(2);
      setGameState('GAMEOVER');
    }
  }, [score1, score2]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Screen Shake
    if (screenShake.current > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake.current, (Math.random() - 0.5) * screenShake.current);
    }

    // Background
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Center Line
    ctx.strokeStyle = COLORS.GRID;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    trail.current.forEach((t, i) => {
      ctx.globalAlpha = i / trail.current.length;
      ctx.fillStyle = COLORS.BALL;
      ctx.fillRect(t.x, t.y, BALL_SIZE, BALL_SIZE);
    });
    ctx.globalAlpha = 1.0;

    // Particles
    particles.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Paddles
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.PLAYER1;
    ctx.shadowColor = COLORS.PLAYER1;
    ctx.fillRect(10, p1Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

    ctx.fillStyle = COLORS.PLAYER2;
    ctx.shadowColor = COLORS.PLAYER2;
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, p2Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = COLORS.BALL;
    ctx.shadowColor = COLORS.BALL;
    ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);
    ctx.shadowBlur = 0;

    if (screenShake.current > 0) ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, []);

  useEffect(() => {
    const loop = () => {
      update();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update, draw]);

  const startGame = () => {
    setScore1(0);
    setScore2(0);
    setWinner(null);
    setGameState('PLAYING');
    resetBall(1);
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white p-4 font-sans">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#ff00ea]">
          NEON PING PONG
        </h1>
        <div className="flex justify-center gap-20 mt-4 text-5xl font-mono">
          <span style={{ color: COLORS.PLAYER1 }}>{score1}</span>
          <span style={{ color: COLORS.PLAYER2 }}>{score2}</span>
        </div>
      </div>

      <div className="relative border-4 border-zinc-800 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT} 
          className="bg-black block"
        />

        {gameState === 'MENU' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
            <h2 className="text-3xl font-bold mb-8">เตรียมพร้อมหรือยัง?</h2>
            <div className="flex gap-10 mb-10">
              <div className="text-center">
                <p className="text-[#00f2ff] font-bold mb-2">ผู้เล่น 1</p>
                <div className="flex gap-1">
                  <span className="bg-zinc-800 px-2 py-1 rounded">W</span>
                  <span className="bg-zinc-800 px-2 py-1 rounded">S</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[#ff00ea] font-bold mb-2">ผู้เล่น 2</p>
                <div className="flex gap-1">
                  <span className="bg-zinc-800 px-2 py-1 rounded">↑</span>
                  <span className="bg-zinc-800 px-2 py-1 rounded">↓</span>
                </div>
              </div>
            </div>
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-white text-black font-black text-xl rounded hover:scale-105 transition-transform"
            >
              เริ่มเกม
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10">
            <h2 className="text-5xl font-black mb-2 animate-bounce" style={{ color: winner === 1 ? COLORS.PLAYER1 : COLORS.PLAYER2 }}>
              {winner === 1 ? 'ผู้เล่น 1 ชนะ!' : 'ผู้เล่น 2 ชนะ!'}
            </h2>
            <p className="text-zinc-400 mb-8 uppercase tracking-widest">ยินดีด้วยกับการแข่งขันที่ยอดเยี่ยม</p>
            <button 
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-[#00f2ff] to-[#ff00ea] text-white font-black text-xl rounded hover:scale-105 transition-transform"
            >
              เล่นอีกครั้ง
            </button>
            <button 
              onClick={() => setGameState('MENU')}
              className="mt-4 text-zinc-500 hover:text-white"
            >
              กลับหน้าเมนู
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-zinc-500 text-[10px] uppercase tracking-[0.2em]">
        ชนะเมื่อได้ครบ {WINNING_SCORE} คะแนน | แข่งขันกันบนคีย์บอร์ดเดียว
      </div>
    </div>
  );
};

export default App;
