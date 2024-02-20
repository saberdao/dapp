import React, { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import Navbar from '../components/Navbar';
import useNetwork from '../hooks/useNetwork';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            cacheTime: 1000 * 60 * 5,
        },
    },
});

require('@solana/wallet-adapter-react-ui/styles.css');

const Dapp = (props: { Component: any; props: any }) => {
    const { network, endpoint } = useNetwork();

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
        <QueryClientProvider client={queryClient}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <div className="bg-gradient-to-b from-gray-950 bg-fixed to-gray-800 text-white min-h-screen w-full flex justify-center p-5">
                            <div className="max-w-7xl flex flex-col w-full gap-5">
                                <Navbar />
                                <props.Component {...props.props} />
                            </div>
                        </div>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </QueryClientProvider>
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
