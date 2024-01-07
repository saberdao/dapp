import clsx from 'clsx';
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export enum InputType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DROPDOWN = 'DROPDOWN'
}

type InputTypes = { register?: UseFormRegisterReturn } & 
    (
        {
            type: InputType.TEXT,
            placeholder?: string,
        } |
        {
            type: InputType.NUMBER,
            placeholder?: string,
        } |
        {
            type: InputType.DROPDOWN,
            placeholder?: string,
            values: string[][],
        }
    )


export default function Input (props: InputTypes) {
    if (!props.type || props.type === InputType.TEXT) {
        return (
            <input
                {...props.register}
                type="text"
                placeholder={props.placeholder}
                className="bg-slate-800 text-slate-200 rounded-lg focus:outline-none transition-colors focus:ring-1 ring-saber-light text-sm py-2 px-3 placeholder:italic placeholder:text-slate-400"
            />
        );
    }

    if (props.type === InputType.NUMBER) {
        return (
            <input
                {...props.register}
                type="number"
                placeholder={props.placeholder}
                className="bg-transparent text-xl text-right text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none"
            />
        );
    }

    if (props.type === InputType.DROPDOWN) {
        return (
            <select
                {...props.register}
                className={clsx(
                    'bg-slate-800 text-slate-200 rounded-lg focus:outline-none transition-colors focus:ring-1 ring-saber-light text-sm py-2 px-3',
                )}
            >
                {props.placeholder && <option key="placeholder" value="" disabled selected>{props.placeholder}</option>}
                {props.values.map(value => (
                    <option key={value[0]} value={value[0]}>{value[1]}</option>
                ))}
            </select>
        );
    }
}