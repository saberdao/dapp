import React from 'react';

export default function H1 (props: { children: string }) {
    return (
        <h1 className="text-saber text-2xl font-bold mb-5">{props.children}</h1>
    );
}