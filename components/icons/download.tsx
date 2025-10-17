'use client';

export default function Download({ className = '' }) {
    return (
        <svg className={className} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 15C3.5 17.828 3.5 19.243 4.379 20.121C5.257 21 6.672 21 9.5 21H15.5C18.328 21 19.743 21 20.621 20.121C21.5 19.243 21.5 17.828 21.5 15M12.5 3V16M12.5 16L16.5 11.625M12.5 16L8.5 11.625" stroke="url(#paint0_linear_5_995)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
                <linearGradient id="paint0_linear_5_995" x1="3.5" y1="3" x2="21.5" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stopColor="currentColor" />
                    <stop offset="1" stopColor="currentColor" />
                </linearGradient>
            </defs>
        </svg>
    );
}
