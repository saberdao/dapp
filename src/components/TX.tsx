import React from 'react';
import { HiExternalLink } from 'react-icons/hi';
import { useReadLocalStorage } from 'usehooks-ts';
import { Explorer } from '../types';
import { explorers } from '../constants';

export default function TX (props: { tx: string }) {
    const preferredExplorer = useReadLocalStorage<Explorer>('preferredExplorer');
    const explorerUrl = explorers[preferredExplorer || Explorer.SOLSCAN].tx;

    return (
        <a
            className="font-mono text-saber-light font-bold flex gap-1 items-center"
            href={`${explorerUrl}${props.tx}`}
            target="_blank"
            rel="noreferrer"
        >
            {props.tx.substring(0, 4)}...{props.tx.substring(props.tx.length - 4)}
            <HiExternalLink />
        </a>
    );
}
