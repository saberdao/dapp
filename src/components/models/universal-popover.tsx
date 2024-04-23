import React, { forwardRef, useState, useImperativeHandle, memo } from 'react';
import type { ReactNode } from 'react';
import UniversalModal from './universal-modal';

export interface Props {
    children: ReactNode;
    onClose?: () => void;
}

export interface Ref {
    close: () => void;
    isOpened: boolean;
    open: () => void;
}

interface ModalProps extends Props {
    open: boolean;
    setOpen: (arg0: boolean) => void;
}

const Modal = memo(({ children, onClose, open, setOpen }: ModalProps) => (
    <UniversalModal onClose={onClose} open={open} setOpen={setOpen}>
        {children}
    </UniversalModal>
));

export default forwardRef(({ onClose, children }: Props, ref) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
        close() {
            setOpen(false);
        },
        isOpened: open,
        open() {
            setOpen(true);
        },
    }));
    return (
        <Modal onClose={onClose} open={open} setOpen={setOpen}>
            {open ? children : null}
        </Modal>
    );
});
