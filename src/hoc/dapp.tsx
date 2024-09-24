import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import invariant from 'tiny-invariant';

import Navbar from '../components/Navbar';
import useNetwork from '../hooks/useNetwork';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import Footer from '../components/Footer';
import { PageProps } from 'gatsby';
import { Toaster } from 'sonner';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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

const Dapp = <T extends PageProps>(props: { children: React.ReactElement<T>; props: any }) => {
    const { network, endpoint, wsEndpoint } = useNetwork();

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
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

    invariant(endpoint);

    return (
        <PersistQueryClientProvider client={queryClient} persistOptions={{
            persister,
            maxAge: CACHE_TIME,
            dehydrateOptions: {
                shouldDehydrateQuery: query => {
                    return ['swaps', 'pools', 'poolsData', 'prices', 'reserves', 'lpTokenAmounts', 'tokenList', 'rewardsList'].includes(query.queryKey[0] as string);
                },
            },
        }}>
            <ReactQueryDevtools initialIsOpen={false} />
            <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint: wsEndpoint }}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        {/* <div className="w-full flex items-center justify-center bg-yellow-500 border-b border-yellow-800 py-1 text-xs">
                            Solana is currently experiencing congestion issues. It might be necessary to retry your transaction multiple times.
                        </div> */}
                        <div className="text-white min-h-screen w-full flex justify-center p-5">
                            <div className="max-w-7xl flex flex-col w-full gap-5">
                                <Navbar />
                                {props.children}
                                <Footer />
                            </div>
                        </div>
                        <Toaster theme="dark" position="bottom-right" richColors={true} />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </PersistQueryClientProvider>
    );
};

export default function dapp<T extends PageProps>(
    WrappedComponent: React.ReactElement<T>,
    props: T,
) {
    return <Dapp {...props}>{WrappedComponent}</Dapp>;
}
