import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <path d="M16 9v7l5 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M5 5h4M5 5v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
    );
}
