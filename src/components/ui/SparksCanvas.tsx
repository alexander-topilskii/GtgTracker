import React, { useEffect, useRef } from 'react';
import { sparks } from '../../utils/sparks';

export const SparksCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      sparks.init(canvasRef.current);
    }
    return () => {
      sparks.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};
