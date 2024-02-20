import React from 'react';
import Saber from '../svg/saber';
import Button from './Button';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'gatsby';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function Navbar() {
    const { publicKey } = useWallet();
    
    return (
        <div className="w-full flex flex-col lg:flex-row gap-1">
            <div className="flex items-center gap-3 font-bold mb-3 lg:mb-0">
                <div className="flex-grow flex items-center gap-3">
                    <Saber className="text-saber-light" />
                    Saber
                </div>

                <div className="block lg:hidden">
                    {publicKey
                        ? <WalletDisconnectButton />
                        : <WalletMultiButton />}
                </div>
            </div>
            <div className="flex-grow flex justify-center gap-3">
                <Link to="/">
                    <Button type="secondary">Pools</Button>
                </Link>
                <a href="https://tribeca.so/gov/sbr/" target="_blank" rel="noreferrer">
                    <Button type="secondary" className="flex items-center gap-2">Vote <FaExternalLinkAlt /></Button>
                </a>
                <Button type="secondary">More</Button>
            </div>
            <div className="hidden lg:block">
                {publicKey
                    ? <WalletDisconnectButton />
                    : <WalletMultiButton />}
            </div>
        </div>
    );
}