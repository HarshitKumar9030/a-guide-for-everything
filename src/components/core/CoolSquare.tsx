import React from "react";

interface CoolSquareProps {
    className?: string;
    size?: number;
    lineThickness?: number;
    padding?: number;
    lineColor?: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    showCornerCircles?: boolean;
    circleSize?: number;
    rotate?: number;
    dashLength?: number;
    dashSpacing?: number;
}

export default function CoolSquare({
    className,
    size = 400,
    lineThickness = 1,
    padding = 16,
    lineColor = 'border-neutral-400',
    lineStyle = 'dashed',
    showCornerCircles = true,
    circleSize = 8,
    rotate = 0,
    dashLength = 5,
    dashSpacing = 5
}: CoolSquareProps) {
    const containerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        padding: `${padding}px`,
        transform: `rotate(${rotate}deg)`
    };

    const dashPattern = lineStyle === 'dashed' ? `${dashLength} ${dashSpacing}` : undefined;

    const getBorderColor = () => {
        if (lineColor.includes('border-')) {
            const colorMap: { [key: string]: string } = {
                'border-neutral-400': '#a3a3a3',
                'border-gray-400': '#9ca3af',
                'border-blue-500': '#3b82f6',
                'border-red-500': '#ef4444',
                'border-green-500': '#22c55e',
                'border-yellow-500': '#eab308',
                'border-purple-500': '#a855f7',
                'border-pink-500': '#ec4899',
            };
            return colorMap[lineColor] || '#a3a3a3';
        }
        return lineColor;
    };

    return (
        <div
            className={`relative ${className || ''}`}
            style={containerStyle}
        >            {/* Top horizontal line */}
            <div
                className="absolute"
                style={{
                    top: `${padding}px`,
                    left: `${padding}px`,
                    right: `${padding}px`,
                    height: '0px',
                    borderTopWidth: `${lineThickness}px`,
                    borderTopStyle: lineStyle,
                    borderTopColor: getBorderColor(),
                    ...(dashPattern && { borderTopStyle: 'dashed', strokeDasharray: dashPattern })
                }}
            ></div>

            {/* Bottom horizontal line */}
            <div
                className="absolute"
                style={{
                    bottom: `${padding}px`,
                    left: `${padding}px`,
                    right: `${padding}px`,
                    height: '0px',
                    borderTopWidth: `${lineThickness}px`,
                    borderTopStyle: lineStyle,
                    borderTopColor: getBorderColor(),
                    ...(dashPattern && { borderTopStyle: 'dashed', strokeDasharray: dashPattern })
                }}
            ></div>

            {/* Left vertical line */}
            <div
                className="absolute"
                style={{
                    top: `${padding}px`,
                    bottom: `${padding}px`,
                    left: `${padding}px`,
                    width: '0px',
                    borderLeftWidth: `${lineThickness}px`,
                    borderLeftStyle: lineStyle,
                    borderLeftColor: getBorderColor(),
                    ...(dashPattern && { borderLeftStyle: 'dashed', strokeDasharray: dashPattern })
                }}
            ></div>

            {/* Right vertical line */}
            <div
                className="absolute"
                style={{
                    top: `${padding}px`,
                    bottom: `${padding}px`,
                    right: `${padding}px`,
                    width: '0px',
                    borderLeftWidth: `${lineThickness}px`,
                    borderLeftStyle: lineStyle,
                    borderLeftColor: getBorderColor(),
                    ...(dashPattern && { borderLeftStyle: 'dashed', strokeDasharray: dashPattern })
                }}
            ></div>

            {/* Corner circles */}
            {showCornerCircles && (
                <>
                    {/* Top-left corner */}
                    <div
                        className="absolute bg-[#1BE1FF] rounded-full"
                        style={{
                            top: `${padding - circleSize / 2}px`,
                            left: `${padding - circleSize / 2}px`,
                            width: `${circleSize}px`,
                            height: `${circleSize}px`
                        }}
                    ></div>

                    {/* Top-right corner */}
                    <div
                        className="absolute bg-[#1BE1FF] rounded-full"
                        style={{
                            top: `${padding - circleSize / 2}px`,
                            right: `${padding - circleSize / 2}px`,
                            width: `${circleSize}px`,
                            height: `${circleSize}px`
                        }}
                    ></div>

                    {/* Bottom-left corner */}
                    <div
                        className="absolute bg-[#1BE1FF] rounded-full"
                        style={{
                            bottom: `${padding - circleSize / 2}px`,
                            left: `${padding - circleSize / 2}px`,
                            width: `${circleSize}px`,
                            height: `${circleSize}px`
                        }}
                    ></div>

                    {/* Bottom-right corner */}
                    <div
                        className="absolute bg-[#1BE1FF] rounded-full"
                        style={{
                            bottom: `${padding - circleSize / 2}px`,
                            right: `${padding - circleSize / 2}px`,
                            width: `${circleSize}px`,
                            height: `${circleSize}px`
                        }}
                    ></div>
                </>
            )}
        </div>
    );
}