import React from 'react';

export default function H1 (props: { children: string }) {
    return (
        <h1 className="text-saber text-xl">{props.children}</h1>
    );
}