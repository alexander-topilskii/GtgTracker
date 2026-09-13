import React, { useEffect, useRef } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useRestTimer } from '../../hooks/useRestTimer';

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_readiness;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float t = u_time * 0.12;

    vec2 center = vec2(0.5, 0.5);
    float dist = length(uv - center);

    float n1 = snoise(uv * 1.5 + vec2(t * 0.2, t * 0.1));
    float n2 = snoise(uv * 2.2 - vec2(t * 0.15, t * 0.2));
    float n = (n1 + n2) * 0.5;

    vec3 recoveryAura = vec3(0.08, 0.12, 0.22);
    vec3 readyAura = vec3(0.10, 0.75, 0.55);

    float pulse = 0.85 + 0.15 * sin(u_time * 1.8);
    vec3 activeAura = mix(recoveryAura, readyAura * pulse, u_readiness);

    float vignette = smoothstep(0.20, 0.85, dist);
    float auraIntensity = (vignette * 0.35 + n * 0.15) * (0.35 + 0.65 * u_readiness);

    float auraAlpha = clamp(auraIntensity * 0.45, 0.0, 0.35);
    gl_FragColor = vec4(activeAura, auraAlpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const AmbientAuraShader: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { lastSetTimestamp, settings, activeRecord } = useWorkout();
  const { readinessPercent } = useRestTimer(lastSetTimestamp, settings.restIntervalMinutes);

  // readinessTarget: 0.0 to 1.0
  const isRestDay = activeRecord.dayType === 'REST';
  const targetReadiness = isRestDay ? 0.0 : readinessPercent / 100;
  const currentReadinessRef = useRef<number>(targetReadiness);

  useEffect(() => {
    currentReadinessRef.current = targetReadiness;
  }, [targetReadiness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });

    if (!gl) {
      console.warn('WebGL not supported for ambient aura');
      return;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (2 triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const resUniform = gl.getUniformLocation(program, 'u_resolution');
    const timeUniform = gl.getUniformLocation(program, 'u_time');
    const readinessUniform = gl.getUniformLocation(program, 'u_readiness');

    let animationFrameId: number;
    let startTime = performance.now();
    let isPaused = false;
    let smoothReadiness = currentReadinessRef.current;

    const resize = () => {
      // Рендерим с половинным разрешением для ультра-низкого энергопотребления
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor((canvas.clientWidth || 390) * 0.5 * dpr);
      const height = Math.floor((canvas.clientHeight || 844) * 0.5 * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Пауза шейдера при неактивной вкладке
    const handleVisibility = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        startTime = performance.now();
        loop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const loop = () => {
      if (isPaused) return;

      const elapsed = (performance.now() - startTime) * 0.001;
      
      // Плавная интерполяция u_readiness
      smoothReadiness += (currentReadinessRef.current - smoothReadiness) * 0.05;

      gl.uniform2f(resUniform, canvas.width, canvas.height);
      gl.uniform1f(timeUniform, elapsed);
      gl.uniform1f(readinessUniform, smoothReadiness);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 filter blur-xl opacity-80"
      style={{ transform: 'translateZ(0)' }}
    />
  );
};
