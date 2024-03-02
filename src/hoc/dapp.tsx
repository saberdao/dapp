import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ToastContainer } from 'react-toastify';

import Navbar from '../components/Navbar';
import useNetwork from '../hooks/useNetwork';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import 'react-toastify/dist/ReactToastify.css';

const CACHE_TIME = 1000 * 60 * 60;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            gcTime: CACHE_TIME,
        },  
    },
});

const persister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : null,
});

require('@solana/wallet-adapter-react-ui/styles.css');

const Dapp = (props: { Component: any; props: any }) => {
    const { network, endpoint, wsEndpoint } = useNetwork();

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        [network],
    );

    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(true);
    }, []);

    if (!ready) {
        return null;
    }

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={{
            persister,
            maxAge: CACHE_TIME,
            dehydrateOptions: {
                shouldDehydrateQuery: query => {
                    return ['swaps', 'pools', 'prices-y', 'reserves-y', 'lpTokenAmounts-y', 'tokenList', 'rewardsList'].includes(query.queryKey.join('-'));
                },
            },
        }}>
            <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint: wsEndpoint }}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <div className="bg-gradient-to-b from-gray-950 bg-fixed to-gray-800 text-white min-h-screen w-full flex justify-center p-5">
                            <div className="max-w-7xl flex flex-col w-full gap-5">
                                <Navbar />
                                <props.Component {...props.props} />
                            </div>
                        </div>
                        <ToastContainer theme="dark" />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </PersistQueryClientProvider>
    );
};

export default function dapp (WrappedComponent: any) {
    class DappHOC extends React.Component {
        render () {
            return <Dapp Component={WrappedComponent} props={this.props} />;
        }
    }

    return DappHOC;
}
