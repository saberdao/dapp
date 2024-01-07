import React from 'react';

export enum InputType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER'
}

export default function Input (props: { placeholder?: string; type?: InputType }) {
    if (!props.type || props.type === InputType.TEXT) {
        return (
            <input
                type="text"
                placeholder={props.placeholder}
                className="bg-slate-800 text-slate-200 rounded-lg focus:outline-none transition-colors focus:ring-1 ring-saber-light text-sm py-2 px-3 placeholder:italic"
            />
        );
    }

    if (props.type === InputType.NUMBER) {
        return (
            <input
                type="number"
                placeholder={props.placeholder}
                className="bg-transparent text-xl text-right text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none"
            />
        );
    }
}