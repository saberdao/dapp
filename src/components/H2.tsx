import React from 'react';

export default function H1 (props: { children: string }) {
    return (
        <h2 className="text-saber text-xl mb-3">{props.children}</h2>
    );
}