import React from 'react';

const ProgressRing = ({ 
    progress, 
    size = 40, 
    strokeWidth = 3, 
    color = 'var(--primary-cyan)', 
    fontSize = '11px', 
    textColor = '#fff' 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <div className="compose-spinner-wrapper" style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            position: 'relative', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            verticalAlign: 'middle'
        }}>
            <svg 
                width={size} 
                height={size} 
                viewBox={`0 0 ${size} ${size}`} 
                style={{ 
                    transform: 'rotate(-90deg)',
                    display: 'block'
                }}
            >
                <circle
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ 
                        transition: 'stroke-dashoffset 0.1s linear'
                    }}
                />
            </svg>
            <span className="compose-progress-text" style={{ 
                fontSize, 
                color: textColor, 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: 0,
                fontWeight: '700',
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none'
            }}>
                {Math.round(pct)}%
            </span>
        </div>
    );
};

export default ProgressRing;
