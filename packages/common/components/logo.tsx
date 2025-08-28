import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        {...props}
    >
        <text
            x="50"
            y="65"
            fontSize="100"
            fontFamily="AR BERKLEY, serif"
            fontWeight="bold"
            textAnchor="middle"
            fill="currentColor"
        >
            D
        </text>
    </svg>
);

export const DarkLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="currentColor"
        preserveAspectRatio="xMidYMid meet"
        {...props}
    >
        <text
            x="50"
            y="65"
            fontSize="70"
            fontFamily="AR BERKLEY, serif"
            fontWeight="bold"
            textAnchor="middle"
            fill="currentColor"
        >
            D
        </text>
    </svg>
);
