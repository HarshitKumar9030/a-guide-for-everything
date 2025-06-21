import { FC } from "react";

interface StarProps {
    size: number;
    position: {
        top: string;
        left: string;
    };
    transform?: string;
}

const StarPoint: FC<StarProps> = ({
    size,
    position,
    transform
}) => {
    return (<div
        className="fixed"
        style={{
            top: position.top,
            left: position.left,
            width: `${size}px`,
            height: `${size}px`,
            transform: transform,
            filter: "drop-shadow(0 0 22.5px #ffffff) drop-shadow(0 0 45px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 75px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 112.5px rgba(255, 255, 255, 0.3))",
        }}
    >      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="white"
        className="drop-shadow-[0_0_15px_#ffffff]"
    >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    </div>
    );
};

export default function Stars() {
    // Group container: 232.34px × 223.39px at left: 146px, top: 132px
    const stars: StarProps[] = [
        // Star 1
        {
            size: 63,
            position: { top: "190px", left: "125px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },    // Star 2
        {
            size: 63,
            position: { top: "184px", left: "190px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 3
        {
            size: 63,
            position: { top: "240px", left: "155px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 4
        {
            size: 63,
            position: { top: "120px", left: "160px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },    // Star 5
        {
            size: 63,
            position: { top: "245px", left: "220px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 6
        {
            size: 63,
            position: { top: "175px", left: "255px" },
            transform: "matrix(0.88, -0.48, 0.45, 0.89, 0, 0)"
        },
        // Star 7
        {
            size: 63,
            position: { top: "120px", left: "230px" },
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
