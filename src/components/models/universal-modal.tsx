import type { ReactNode } from 'react';
import React, { useCallback } from 'react';
import clsx from 'clsx';

export interface Props {
    children: ReactNode;
    onClose?: () => void;
    open: boolean;
    title?: string;
    setOpen: (arg0: boolean) => void;
}

export default ({ children, onClose, open, setOpen, title }: Props) => {
    const handleClose = useCallback(() => {
        setOpen(false);
        if (onClose) onClose();
    }, [onClose, setOpen]);

    return (
        <div
            className={clsx(
                'fixed inset-0 flex items-center justify-center transition-colors z-10',
                open ? 'visible bg-[rgba(0,0,0,0.4)]' : 'invisible',
            )}
            onClick={handleClose}
        >
            {children}
        </div>
    );
};
