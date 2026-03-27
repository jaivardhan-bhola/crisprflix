'use client';

import React, { useEffect, useState, useMemo } from 'react';

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Original animation logic from CSS
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4000);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4800);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Pre-calculate the brush background string
  const brushBackground = useMemo(() => {
    const furStyles = [
      { left: 0, width: 3.8, colorStop: 15, height: 81 },
      { left: 3.8, width: 2.8, colorStop: 10, height: 62 },
      { left: 6.6, width: 4.8, colorStop: 37, height: 100 },
      { left: 11.4, width: 4, colorStop: 23, height: 100 },
      { left: 15.4, width: 4, colorStop: 15, height: 86 },
      { left: 19.4, width: 2.5, colorStop: 27, height: 89 },
      { left: 21.9, width: 4, colorStop: 20, height: 100 },
      { left: 25.9, width: 2, colorStop: 30, height: 100 },
      { left: 27.9, width: 4, colorStop: 35, height: 95 },
      { left: 31.9, width: 3.5, colorStop: 39, height: 95 },
      { left: 35.4, width: 2, colorStop: 34, height: 95 },
      { left: 37.4, width: 2.6, colorStop: 22, height: 95 },
      { left: 40, width: 6, colorStop: 47, height: 100 },
      { left: 46, width: 2, colorStop: 36, height: 100 },
      { left: 48, width: 5.5, colorStop: 29, height: 100 },
      { left: 53.5, width: 3, colorStop: 39, height: 95 },
      { left: 56.5, width: 4.1, colorStop: 45, height: 100 },
      { left: 60.6, width: 2.4, colorStop: 34, height: 100 },
      { left: 63, width: 4, colorStop: 47, height: 100 },
      { left: 67, width: 1.5, colorStop: 27, height: 95 },
      { left: 68.5, width: 2.8, colorStop: 37, height: 100 },
      { left: 71.3, width: 2.3, colorStop: 9, height: 100 },
      { left: 73.6, width: 2.2, colorStop: 28, height: 92 },
      { left: 75.8, width: 1, colorStop: 37, height: 100 },
      { left: 76.8, width: 2.1, colorStop: 28, height: 100 },
      { left: 78.9, width: 4.1, colorStop: 34, height: 100 },
      { left: 83, width: 2.5, colorStop: 21, height: 100 },
      { left: 85.5, width: 4.5, colorStop: 39, height: 100 },
      { left: 90, width: 2.8, colorStop: 30, height: 100 },
      { left: 92.8, width: 3.5, colorStop: 19, height: 100 },
      { left: 96.3, width: 3.7, colorStop: 37, height: 100 }
    ];

    return furStyles.map(s => 
      `linear-gradient(to bottom, #e40913 0%, #e40913 ${s.colorStop}%, rgba(0, 0, 0, 0) ${s.height}%, rgba(0, 0, 0, 0) 100%) ${s.left}% 0 / ${s.width}% 100% no-repeat`
    ).join(', ');
  }, []);

  if (!isVisible) return null;

  const lampColors = ['#ff0100', '#ffde01', '#ff00cc', '#04fd8f', '#ff0100', '#ff9600', '#0084ff', '#f84006', '#ffc601', '#ff4800', '#fd0100', '#01ffff', '#ffc601', '#ffc601', '#0078fe', '#0080ff', '#ffae01', '#ff00bf', '#a601f4', '#f30b34', '#ff00bf', '#04fd8f', '#01ffff', '#a201ff', '#ec0014', '#0078fe', '#ff0036', '#06f98c'];
  const lampLefts = [0.7, 2.2, 5.8, 10.1, 12.9, 15.3, 21.2, 25, 30.5, 36.3, 41, 44.2, 51.7, 52.1, 53.8, 57.2, 62.3, 65.8, 72.8, 74.3, 79.8, 78.2, 78.5, 85.3, 86.9, 88.8, 92.4, 96.2];
  const lampWidths = [1, 1.4, 2.1, 2, 1.4, 2.8, 2.5, 2.5, 3, 3, 2.2, 2.6, 0.5, 1.8, 2.3, 2, 2.9, 1.7, 0.8, 2, 2, 2, 2, 1.1, 1.1, 2, 2.4, 2.1];

  return (
    <div className={`netflix-container ${isExiting ? 'loading-screen-exit' : ''}`}>
      <div className="netflix-intro" letter="C">
        {/* helper-1: Vertical Bar */}
        <div className="helper-1">
          <div className="effect-brush">
            <div className="fur-container" style={{ background: brushBackground }} />
          </div>
          <div className="effect-lumieres">
            {[...Array(28)].map((_, i) => (
              <span 
                key={i} 
                style={{
                  backgroundColor: lampColors[i],
                  left: `${lampLefts[i]}%`,
                  width: `${lampWidths[i]}%`,
                  animation: `lumieres-moving-${i % 2 === 0 ? 'left' : 'right'} 5s forwards`,
                  animationDelay: `${1.6 + (i * 0.02)}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* helper-2: Top Bar */}
        <div className="helper-2">
          <div className="effect-brush">
            <div className="fur-container" style={{ background: brushBackground }} />
          </div>
        </div>

        {/* helper-4: Bottom Bar */}
        <div className="helper-4">
          <div className="effect-brush">
            <div className="fur-container" style={{ background: brushBackground }} />
          </div>
        </div>
      </div>
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-0" />
    </div>
  );
};

export default LoadingScreen;
