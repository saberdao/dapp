import React from 'react';
import Button from './Button';

export default function Footer() {    
    return (
        <>
            <div className="w-full flex flex-col lg:flex-row gap-1">
                <div className="flex-grow flex-wrap flex justify-center gap-3 items-center">
                    &copy; Saber 2024
                </div>
            </div>
        </>
    );
}