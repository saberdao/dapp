import React, { useRef, useState } from 'react';
import useOutsideClick from '../hooks/useOutsideClick';
import { FaCog } from 'react-icons/fa';
import clsx from 'clsx';
import { ImCross } from 'react-icons/im';
import H2 from './H2';
import Button from './Button';
import { useLocalStorage } from 'usehooks-ts';

export default function SettingsDialog() {
    const [show, setShow] = useState(false);
    const divRef = useRef<HTMLDivElement>(null);
    useOutsideClick([divRef], () => setShow(false));
    const [priorityFee, setPriorityFee] = useLocalStorage('priorityFee', 0);

    return (
        <>
            <Button type="secondary" className="flex items-center gap-2 h-10 text-xl" onClick={() => setShow(true)}>
                <FaCog />
            </Button>
            <div
                className={clsx(
                    'fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] transition-opacity ease-in z-10',
                    show ? 'opacity-100' : 'opacity-0 pointer-events-none',
                )}
            >
                <div
                    ref={divRef}
                    className="bg-black max-w-2xl w-full m-5 bg-darkblue border-2 border-activeblue p-5 rounded-xl relative z-20"
                >
                    <div className="flex text-2xl text-light-200 mb-3 items-center justify-center">
                        <div className="flex-grow font-bold flex justify-start">
                            <H2>Priority fee</H2>
                        </div>
                        <ImCross
                            className="text-xl cursor-pointer hover:text-activeblue transition-colors"
                            onClick={() => setShow(false)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type={priorityFee === 0 ? 'primary' : 'secondary'} onClick={() => setPriorityFee(0)}>None</Button>
                        <Button type={priorityFee === 0.001 ? 'primary' : 'secondary'} onClick={() => setPriorityFee(0.001)}>0.001 SOL</Button>
                        <Button type={priorityFee === 0.01 ? 'primary' : 'secondary'} onClick={() => setPriorityFee(0.01)}>0.01 SOL</Button>
                    </div>
                </div>
            </div>
        </>
    );
}
