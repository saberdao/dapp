import React, { useEffect, useState } from 'react';
import Saber from '../svg/saber';
import Button from './Button';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'gatsby';
import { SiGitbook } from 'react-icons/si';
import { FaDiscord, FaExternalLinkAlt } from 'react-icons/fa';
import { MdOutlineQueryStats } from 'react-icons/md';
import Block from './Block';
import useUserATAs from '../hooks/user/useUserATAs';
import { WRAPPED_SOL } from '@saberhq/token-utils';
import useNetwork from '../hooks/useNetwork';
import { useMutation } from '@tanstack/react-query';
import TX from './TX';
import { toast } from 'react-toastify';
import useUnwrap from '../hooks/user/useUnwrap';
import { FaMedium, FaXTwitter } from 'react-icons/fa6';
import SettingsDialog from './SettingsDialog';

const WrappedSolBlock = () => {
    const { network } = useNetwork();
    const { data: ata, refetch } = useUserATAs([WRAPPED_SOL[network]], true);
    const { unwrap } = useUnwrap();
    const [lastTxHash, setLastTxHash] = useState('');
    const { mutate: execUnwrap, isPending, isSuccess, data: hash } = useMutation({
        mutationKey: ['unwrap', lastTxHash],
        mutationFn: async () => {
            const hash = await unwrap();
            return hash;
        },
    });

    // Do it like this so that when useMutation is called twice, the toast will only show once.
    // But it still works with multiple stake invocations.
    useEffect(() => {
        if (lastTxHash) {
            toast.success((
                <div className="text-sm">
                    <p>Transaction successful! Your transaction hash:</p>
                    <TX tx={lastTxHash} />
                </div>
            ), {
                onClose: () => refetch(),
            });
        }
    }, [lastTxHash]);

    if (isSuccess && hash && lastTxHash !== hash) {
        setLastTxHash(hash);
    }

    return (ata?.[0]?.balance.asNumber ?? 0) > 0 && (
        <Block active className="flex gap-1 items-center">
            You have {ata![0].balance.asNumber} wrapped SOL in your wallet.
            {(isPending
                ? <Button size="small" disabled key="g">Unwrapping...</Button>
                : <Button size="small" key="g" onClick={execUnwrap}>Unwrap</Button>)}
        </Block>
    );
};

export default function Navbar() {
    const { publicKey } = useWallet();
    
    return (
        <>
            <div className="w-full flex flex-col lg:flex-row gap-1">
                <div className="flex items-center gap-3 font-bold mb-3 lg:mb-0">
                    <div className="flex-grow flex items-center gap-3">
                        <Saber className="text-saber-light" />
                        Saber
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        {publicKey
                            ? <WalletDisconnectButton />
                            : <WalletMultiButton />}
                        <SettingsDialog />
                    </div>
                </div>
                <div className="flex-grow flex-wrap flex justify-center gap-3">
                    <Link to="/">
                        <Button className="flex items-center gap-2 h-10" type="secondary">Pools</Button>
                    </Link>
                    <a href="https://tribeca.so/gov/sbr/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10">Vote <FaExternalLinkAlt /></Button>
                    </a>
                    <a href="https://vota.fi/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10">Bribes <FaExternalLinkAlt /></Button>
                    </a>
                    
                    <a href="https://docs.saberdao.io/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl"><SiGitbook /></Button>
                    </a>
                    <a href="https://blog.saberdao.io/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl"><FaMedium /></Button>
                    </a>
                    <a href="https://data.saberdao.io/public-dashboards/8e8314fc11434f129c11d841d46d93ad?orgId=1" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl"><MdOutlineQueryStats /></Button>
                    </a>
                    <a href="https://twitter.com/The_Saber_DAO" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl"><FaXTwitter /></Button>
                    </a>
                    <a href="https://discord.com/invite/cmVUgRXS53" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl"><FaDiscord /></Button>
                    </a>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    {publicKey
                        ? <WalletDisconnectButton />
                        : <WalletMultiButton />}
                    <SettingsDialog />
                </div>
            </div>
            <WrappedSolBlock />
        </>
    );
}