import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

export default function ChartCanvas({ type, data, options, height = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }
    const chart = new Chart(canvasRef.current, { type, data, options });
    return () => chart.destroy();
  }, [type, data, options]);

  return <canvas ref={canvasRef} height={height} />;
}
