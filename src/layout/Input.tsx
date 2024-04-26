import clsx from 'clsx';
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export enum InputType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DROPDOWN = 'DROPDOWN',
    CHECKBOX = 'CHECKBOX',
    SWITCH = 'SWITCH',
}

type InputTypes = { register?: UseFormRegisterReturn; size?: 'full' } & (
    | {
          type: InputType.TEXT;
          placeholder?: string;
      }
    | {
          type: InputType.NUMBER;
          placeholder?: string;
          align?: 'right';
      }
    | {
          type: InputType.DROPDOWN;
          placeholder?: string;
          values: string[][];
      }
    | {
          type: InputType.CHECKBOX;
          label: string;
      }
);

export default function Input(props: InputTypes) {
    if (!props.type || props.type === InputType.TEXT) {
        return (
            <div className={clsx('flex', props.size === 'full' && 'w-full')}>
                <div className={clsx('group relative', props.size === 'full' && 'w-full')}>
                    <input
                        {...props.register}
                        type="text"
                        placeholder={props.placeholder}
                        className={clsx(
                            'bg-slate-800 z-1 relative text-slate-200 rounded-lg focus:outline-none transition-colors text-sm py-2 px-3 placeholder:italic placeholder:text-slate-400',
                            props.size === 'full' && 'w-full',
                        )}
                    />
                </div>
            </div>
        );
    }

    if (props.type === InputType.NUMBER) {
        return (
            <div className={clsx('flex', props.size === 'full' && 'w-full')}>
                <div className={clsx('group relative', props.size === 'full' && 'w-full')}>
                    <div
                        className={clsx(
                            props.align === 'right' ? 'bg-gradient-to-r' : 'bg-gradient-to-l',
                        )}
                    />
                    <input
                        {...props.register}
                        type="number"
                        placeholder={props.placeholder}
                        className={clsx(
                            'relative z-1 bg-transparent text-xl text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none',
                            props.size === 'full' && 'w-full',
                            props.align === 'right' && 'text-right',
                        )}
                    />
                </div>
            </div>
        );
    }

    if (props.type === InputType.CHECKBOX) {
        return (
            <div className={clsx('flex', props.size === 'full' && 'w-full')}>
                <div className={clsx('group relative', props.size === 'full' && 'w-full')}>
                    <div className="bg-slate-800 z-1 relative text-slate-200 rounded-lg focus:outline-none transition-colors text-sm py-2 px-3">
                        <label
                            className={clsx(
                                'flex items-center gap-1',
                                props.size === 'full' && 'w-full',
                            )}
                        >
                            <input
                                {...props.register}
                                type="checkbox"
                                className="py-2 relative z-1 bg-transparent text-xl text-right text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none"
                            />
                            {props.label}
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    if (props.type === InputType.DROPDOWN) {
        return (
            <div className={clsx('flex', props.size === 'full' && 'w-full')}>
                <div className="group relative">
                    <select
                        {...props.register}
                        className={clsx(
                            'bg-slate-800 relative z-1 cursor-pointer text-slate-200 rounded-lg focus:outline-none transition-colors text-sm py-2 px-3',
                        )}
                    >
                        {props.placeholder && (
                            <option key="placeholder" value="" disabled selected>
                                {props.placeholder}
                            </option>
                        )}
                        {props.values.map((value) => (
                            <option key={value[0]} value={value[0]}>
                                {value[1]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }
}
