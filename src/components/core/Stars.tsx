import { FC, memo } from "react";

interface StarProps {
    size: number;
    position: {
        top: string;
        left: string;
    };
    transform?: string;
}

const StarPoint: FC<StarProps> = memo(({
    size,
    position,
    transform
}) => {
    return (
        <div
            className="fixed will-change-transform"
            style={{
                top: position.top,
                left: position.left,
                width: `${size}px`,
                height: `${size}px`,
                transform: `${transform} translateZ(0)`, // Hardware acceleration
                filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.5635)) drop-shadow(0 0 24px rgba(255, 255, 255, 0.322))", // Increased glow by 15%
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="white"
                style={{ 
                    filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.4025))" // Increased glow by 15%
                }}
            >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        </div>
    );
});

StarPoint.displayName = 'StarPoint';

export default function Stars() {
    // Group container: 232.34px × 223.39px at left: 146px, top: 132px
    const stars: StarProps[] = [
        // Star 1
        {
            size: 63,
            position: { top: "170px", left: "105px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },    // Star 2
        {
            size: 63,
            position: { top: "164px", left: "170px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 3
        {
            size: 63,
            position: { top: "220px", left: "135px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 4
        {
            size: 63,
            position: { top: "100px", left: "140px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },    // Star 5
        {
            size: 63,
            position: { top: "225px", left: "200px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 6
        {
            size: 63,
            position: { top: "155px", left: "235px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 7
        {
            size: 63,
            position: { top: "100px", left: "210px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        }
    ];

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                width: "232.34px",
                height: "223.39px",
                left: "120px",
                top: "100px"
            }}
        >
            {stars.map((star, index) => (
                <StarPoint key={index} {...star} />
            ))}
        </div>
    );
}
