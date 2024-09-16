import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BaseWalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link } from 'gatsby';
import { ImCross } from 'react-icons/im';
import { SiGitbook } from 'react-icons/si';
import { FaCog } from 'react-icons/fa';
import { FaDiscord, FaExternalLinkAlt } from 'react-icons/fa';
import { MdOutlineQueryStats } from 'react-icons/md';
import { useMutation } from '@tanstack/react-query';
import { Token, WRAPPED_SOL } from '@saberhq/token-utils';
import { FaMedium, FaXTwitter } from 'react-icons/fa6';
import clsx from 'clsx';

import I18n from '../i18n';
import Saber from '../svg/saber';
import Button from './Button';
import Block from './Block';
import useUserATA from '../hooks/user/useUserATA';
import useNetwork from '../hooks/useNetwork';
import useUnwrap from '../hooks/user/useUnwrap';
import TX from './TX';
import UniversalPopover, { Ref } from './models/universal-popover';
import ModelHeader from './models/model-header';
import SettingModel from './models/setting-model';
import { toast } from 'sonner';
import { SABER_IOU_MINT } from '@saberhq/saber-periphery';
import useRedeemSbr from '../hooks/user/useRedeemSbr';

const WrappedSolBlock = () => {
    const { network } = useNetwork();
    const { data: ata, refetch } = useUserATA(WRAPPED_SOL[network], true);
    const { unwrap } = useUnwrap();
    const {
        mutate: execUnwrap,
        isPending,
    } = useMutation({
        mutationKey: ['unwrap'],
        mutationFn: async () => {
            await unwrap();
            refetch();
        },
    });

    return (
        (ata?.balance.asNumber ?? 0) > 0 && (
            <Block active className="flex gap-1 items-center">
                You have {ata!.balance.asNumber} wrapped SOL in your wallet.
                {isPending ? (
                    <Button size="small" disabled key="g">
                        Unwrapping...
                    </Button>
                ) : (
                    <Button size="small" key="g" onClick={execUnwrap}>
                        Unwrap
                    </Button>
                )}
            </Block>
        )
    );
};

const IOUSBRBlock = () => {
    const { redeem } = useRedeemSbr();
    const { data: iou, refetch } = useUserATA(new Token({
        address: SABER_IOU_MINT.toString(),
        decimals: 6,
        symbol: 'IOU',
        name: 'IOU',
        chainId: 101,
    }));
    const {
        mutate: execRedeem,
        isPending,
    } = useMutation({
        mutationKey: ['redeem'],
        mutationFn: async () => {
            await redeem();
            refetch();
        },
    });

    return (
        (iou?.balance.asNumber ?? 0) > 0 && (
            <Block active className="flex gap-1 items-center">
                You have {iou!.balance.asNumber} IOU SBR in your wallet. You can redeem it here.
                {isPending ? (
                    <Button size="small" disabled key="g">
                        Redeeming...
                    </Button>
                ) : (
                    <Button size="small" key="g" onClick={execRedeem}>
                        Redeem
                    </Button>
                )}
            </Block>
        )
    );
};

export default function Navbar() {
    const { publicKey } = useWallet();
    const settingRef = useRef<Ref>();

    const handleModelClose = useCallback(() => {
        settingRef.current?.close();
    }, []);

    const handleOpenModel = useCallback(() => {
        settingRef.current?.open();
    }, []);

    const LABELS = {
        disconnecting: 'Disconnecting ...',
        'has-wallet': <div className="flex items-center gap-1">{publicKey?.toString().substring(0, 3)}...{publicKey?.toString().substring(publicKey?.toString().length - 3)} <ImCross /></div>,
        'no-wallet': 'Disconnect Wallet',
    } as const;

    return (
        <>
            <UniversalPopover ref={settingRef} onClose={handleModelClose}>
                <div
                    className={clsx(
                        'bg-saber-modelBg max-w-2xl w-full m-2 sm:m-2 md:m-2 bg-darkblue border  border-gray-600 p-5 shadow-3xl rounded-xl z-[1000] transition-opacity',
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ModelHeader handleClose={handleModelClose} title={I18n.SettingPopupTitle} />
                    <SettingModel />
                </div>
            </UniversalPopover>
            <div className="w-full flex flex-col lg:flex-row gap-1">
                <div className="flex items-center gap-3 font-bold mb-3 lg:mb-0">
                    <Link to="/" className="flex-grow">
                        <div className="flex items-center gap-3">
                            <Saber className="text-saber-light" />
                            Saber
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 lg:hidden">
                        {/* @ts-ignore */}
                        {publicKey ? <BaseWalletDisconnectButton labels={LABELS} /> : <WalletMultiButton />}
                        <Button
                            type="secondary"
                            className="flex items-center gap-2 h-10 text-xl"
                            onClick={handleOpenModel}
                        >
                            <FaCog />
                        </Button>
                    </div>
                </div>
                <div className="flex-grow flex-wrap flex justify-center gap-3">
                    <Link to="/">
                        <Button className="flex items-center gap-2 h-10" type="secondary">
                            Pools
                        </Button>
                    </Link>
                    <a href="https://tribeca.so/gov/sbr/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10">
                            Vote <FaExternalLinkAlt />
                        </Button>
                    </a>
                    <a href="https://vota.fi/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10">
                            Bribes <FaExternalLinkAlt />
                        </Button>
                    </a>

                    <a href="https://doc.saberdao.io/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <SiGitbook />
                        </Button>
                    </a>
                    <a href="https://blog.saberdao.io/" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <FaMedium />
                        </Button>
                    </a>
                    {/* <a
                        href="https://data.saberdao.io/public-dashboards/8e8314fc11434f129c11d841d46d93ad?orgId=1"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <MdOutlineQueryStats />
                        </Button>
                    </a> */}
                    <a href="https://twitter.com/thesaberdao" target="_blank" rel="noreferrer">
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <FaXTwitter />
                        </Button>
                    </a>
                    <a
                        href="https://discord.com/invite/cmVUgRXS53"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button type="secondary" className="flex items-center gap-2 h-10 text-xl">
                            <FaDiscord />
                        </Button>
                    </a>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                    {/* @ts-ignore */}
                    {publicKey ? <BaseWalletDisconnectButton labels={LABELS} /> : <WalletMultiButton />}
                    <Button
                        type="secondary"
                        className="flex items-center gap-2 h-10 text-xl"
                        onClick={handleOpenModel}
                    >
                        <FaCog />
                    </Button>
                </div>
            </div>
            <WrappedSolBlock />
            <IOUSBRBlock />
        </>
    );
}
