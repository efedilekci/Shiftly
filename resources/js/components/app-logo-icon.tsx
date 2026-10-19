import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2.25" />
            <path d="M16 9.5v7l4.5 2.75" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 6h3.5M6 6v3.5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
    );
}
