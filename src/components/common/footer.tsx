import React from 'react';

import Button from '@/src/layout/button';

export default function Footer() {
    return (
        <>
            <div className="w-full flex flex-col lg:flex-row gap-1">
                <div className="flex-grow flex-wrap flex justify-center gap-3 items-center">
                    &copy; Saber 2024 |
                    <a
                        href="https://www.dextools.io/app/en/solana/pair-explorer/HiYggjP2fN53Jw46e5UuskqNP3HH98jceRxEgVoeRwNw?t=1713082715595"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <img src="/dextools.png" className="w-6 h-6" />
                        </Button>
                    </a>
                </div>
            </div>
        </>
    );
}
