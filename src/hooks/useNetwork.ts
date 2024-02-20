import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useState } from 'react';

/**
 * Formats the network as a string.
 * @param network
 * @returns
 */
const formatNetwork = (network: WalletAdapterNetwork) => {
    if (network === 'mainnet-beta') {
        return 'mainnet' as const;
    }
    return network;
};

export default function () {
    const [network] = useState(WalletAdapterNetwork.Mainnet);

    // @TODO: Set actual endpoint
    const [endpoint] = useState('https://rpc.ankr.com/solana/010f8ab55e016875312e71da3f611d5c6fec24afde95a876d2c65a25838211a2');

    return { network, formattedNetwork: formatNetwork(network), endpoint };
}