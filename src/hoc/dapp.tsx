import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { ToastContainer } from 'react-toastify';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import Navbar from '@/src/components/common/navbar';
import Footer from '@/src/components/common/footer';
import useNetwork from '@/src/hooks/useNetwork';

const CACHE_TIME = 1000 * 60 * 60;

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            gcTime: CACHE_TIME,
            retry: 5,
        },
    },
});

const persister = createSyncStoragePersister({
    storage: typeof window !== 'undefined' ? window.localStorage : null,
});

require('@solana/wallet-adapter-react-ui/styles.css');

const Dapp = (props: { Component: any; props: any }) => {
    const { network, endpoint, wsEndpoint } = useNetwork();

    const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

    const [ready, setReady] = useState(false);

    useEffect(() => {
        setReady(true);
    }, []);

    if (!ready) {
        return null;
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: CACHE_TIME,
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        return [
                            'swaps',
                            'pools',
                            'poolsData',
                            'prices',
                            'reserves',
                            'lpTokenAmounts',
                            'tokenList',
                            'rewardsList',
                        ].includes(query.queryKey[0] as string);
                    },
                },
            }}
        >
            <ConnectionProvider endpoint={endpoint ?? ''} config={{ wsEndpoint: wsEndpoint }}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <div className="w-full flex items-center justify-center bg-yellow-500 border-b border-yellow-800 py-1 text-xs">
                            Solana is currently experiencing congestion issues. It might be
                            necessary to retry your transaction multiple times.
                        </div>
                        <div className="text-white min-h-screen w-full flex justify-center p-5">
                            <div className="max-w-7xl flex flex-col w-full gap-5">
                                <Navbar />
                                <props.Component {...props.props} />
                                <Footer />
                            </div>
                        </div>
                        <ToastContainer theme="dark" />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </PersistQueryClientProvider>
    );
};

export default function dapp(WrappedComponent: any) {
    class DappHOC extends React.Component {
        render() {
            return <Dapp Component={WrappedComponent} props={this.props} />;
        }
    }

    return DappHOC;
}
