import clsx from 'clsx';
import React from 'react';

export default function ModelHeader({
    handleClose,
    title,
}: {
    handleClose: () => void;
    title?: string;
}) {
    return (
        <div
            className={clsx(
                'flex items-center justify-between pb-3 md:pb-3',
                title && 'border-b border-gray-700 rounded-t',
            )}
        >
            {title && <h3 className="text-xl font-semibold text-gray-300">{title}</h3>}

            <button
                onClick={handleClose}
                type="button"
                className="text-gray-300 cursor-pointer bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
                data-modal-hide="default-modal"
            >
                <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                >
                    <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                </svg>
                <span className="sr-only">Close modal</span>
            </button>
        </div>
    );
}
