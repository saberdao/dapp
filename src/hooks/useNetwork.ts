import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useState } from 'react';

/**
 * Formats the network as a string.
 * @param network
 * @returns
 */
const formatNetwork = (network: WalletAdapterNetwork): string => {
    if (network === 'mainnet-beta') {
        return 'mainnet';
    }
    return network;
};

export default function () {
    const [network] = useState(WalletAdapterNetwork.Mainnet);

    // @TODO: Set actual endpoint
    const [endpoint] = useState('https://billowing-flashy-layer.solana-mainnet.quiknode.pro/31a086feb1865b0a075e44c7666b9e811061b76d/');

    return { network, formattedNetwork: formatNetwork(network), endpoint };
}