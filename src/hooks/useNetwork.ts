import { useState } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

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
    const [endpoint] = useState(process.env.GATSBY_RPC_URL);
    const [wsEndpoint] = useState(process.env.GATSBY_RPC_WS);

    return { network, wsEndpoint, formattedNetwork: formatNetwork(network), endpoint };
}
