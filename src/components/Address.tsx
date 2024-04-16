import React from 'react';
import { HiExternalLink } from 'react-icons/hi';
import { useReadLocalStorage } from 'usehooks-ts';
import { Explorer } from '../types';
import { explorers } from '../constants';

export default function Address (props: { address: string }) {
    const preferredExplorer = useReadLocalStorage<Explorer>('preferredExplorer');
    const explorerUrl = explorers[preferredExplorer || Explorer.SOLSCAN].address;

    return (
        <a
            className="font-mono text-saber-light font-bold flex gap-1 items-center"
            href={`${explorerUrl}${props.address}`}
            target="_blank"
            rel="noreferrer"
        >
            {props.address.substring(0, 4)}...{props.address.substring(props.address.length - 4)}
            <HiExternalLink />
        </a>
    );
}