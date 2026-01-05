
export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export type Entity = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Ball = Entity & {
  vx: number;
  vy: number;
  speed: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};
