// Micro-spark particle engine inspired by kinetic luxury instruments
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  decay: number;
}

class SparksEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private sparks: Spark[] = [];
  private isRunning: boolean = false;
  private readonly palette = ['#ccff00', '#d9f99d', '#ffffff', '#e2ff3b'];

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    this.sparks = [];
    this.isRunning = false;
  }

  resize = () => {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  explode(x: number, y: number, count: number = 28) {
    for (let i = 0; i < count; i++) {
      const rad = Math.random() * Math.PI * 2;
      const v = Math.random() * 5.5 + 1.5;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(rad) * v,
        vy: Math.sin(rad) * v - 1.2,
        radius: Math.random() * 2.2 + 1,
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
        opacity: 1,
        decay: Math.random() * 0.03 + 0.025,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.render);
    }
  }

  private render = () => {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12;
      s.opacity -= s.decay;

      if (s.opacity <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.opacity;
      this.ctx.fillStyle = s.color;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    if (this.sparks.length > 0) {
      requestAnimationFrame(this.render);
    } else {
      this.isRunning = false;
    }
  };
}

export const sparks = new SparksEngine();
