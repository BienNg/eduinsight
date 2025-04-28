// src/components/common/ProgressBar.jsx
import { useEffect, useState } from 'react';
import '../styles/ProgressBar.css';

const COURSE_WEIGHTS = {
    'A1.1': 18,
    'A1.2': 18,
    'A2.1': 20,
    'A2.2': 20,
    'B1.1': 20,
    'B1.2': 20
};

const calculateWeightedProgress = (courseProgress) => {
    if (!courseProgress || typeof courseProgress !== 'object') return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(courseProgress).forEach(([course, progress]) => {
        const weight = COURSE_WEIGHTS[course] || 0;
        totalWeight += weight;
        weightedSum += (progress * weight);
    });

    return totalWeight ? (weightedSum / totalWeight) : 0;
};

const ProgressBar = ({
    progress,
    courseProgress, // New prop for course-specific progress
    color = '#0088FE',
    showLabel = true,
    height = '8px',
    className = '',
    labelPosition = 'right', // 'right', 'above', or 'none'
    customLabel = null // Add this new prop
}) => {
    // Calculate weighted progress if courseProgress is provided, otherwise use direct progress
    const calculatedProgress = courseProgress
        ? calculateWeightedProgress(courseProgress)
        : progress;

    // Ensure progress is between 0-100
    const normalizedProgress = Math.min(100, Math.max(0, calculatedProgress));
    const [animated, setAnimated] = useState(false);

    // Trigger animation after component mounts
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimated(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Create a lighter version of the color for the progress fill
    const lighterColor = adjustColor(color, 40);

    // This will display either the custom label or the percentage
    const displayLabel = customLabel || `${Math.round(normalizedProgress)}%`;

    return (
        <div className={`reusable-progress-container ${className}`}>
            {(showLabel && labelPosition === 'above') && (
                <div className="progress-header">
                    <span className="progress-percentage">{displayLabel}</span>
                </div>
            )}

            <div
                className="progress-bar-container"
                style={{ height }}
            >
                <div
                    className={`progress-bar ${animated ? 'animated' : ''}`}
                    style={{
                        width: animated ? `${normalizedProgress}%` : '0%',
                        backgroundColor: lighterColor,
                        '--target-width': `${normalizedProgress}%`
                    }}
                ></div>
            </div>

            {(showLabel && labelPosition === 'right') && (
                <span className="progress-percentage side-label">{displayLabel}</span>
            )}
        </div>
    );
};

// Helper function to create a lighter version of a color
function adjustColor(color, percent) {
    if (!color || typeof color !== 'string') return '#0088FE';

    // If it's not a hex color, return as is
    if (!color.startsWith('#')) return color;

    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R + (255 - R) * (percent / 100));
    G = Math.floor(G + (255 - G) * (percent / 100));
    B = Math.floor(B + (255 - B) * (percent / 100));

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

export default ProgressBar;