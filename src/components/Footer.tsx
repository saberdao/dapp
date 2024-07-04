import React from 'react';

export default function Footer() {    
    return (
        <>
            <div className="w-full flex flex-col lg:flex-row gap-1">
                <div className="flex-grow flex-wrap flex justify-center gap-3 items-center">
                    <a href="https://doc.saberdao.io/saber-dao/risks" target="_blank" rel="noreferrer" className="underline hover:no-underline">Risks</a>
                    &copy; Saber DAO 2024
                </div>
            </div>
        </>
    );
}