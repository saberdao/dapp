import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import useNetwork from '../hooks/useNetwork';
import { OraclePrice } from '../types';
import { chunk } from 'lodash';
import useGetPools from './useGetPools';

export default function useGetPrices() {
    const { formattedNetwork } = useNetwork();
    const { connection } = useConnection();
    const { data: poolData } = useGetPools(formattedNetwork);
    const { network, endpoint } = useNetwork();

    const pools = poolData?.pools;

    return useQuery({
        queryKey: ['prices', endpoint, (pools ?? []).length > 0 ? 'y' : 'n'],
        queryFn: async () => {
            if (!pools) {
                return null;
            }

            // Get prices from pyth
            const client = new PythHttpClient(connection, getPythProgramKeyForCluster(network));
            const pythData = await client.getData();

            let tryPrice = 0;
            try {
                const cgData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bilira&vs_currencies=usd')
                tryPrice = (await cgData.json())?.bilira?.usd ?? 0;
            } catch (e) {
                // Do nothing (just assume is 0)
            }


            // We can add more from pyth here later
            const prices: OraclePrice = {
                'JEFFSQ3s8T3wKsvp4tnRAsUBW7Cqgnf8ukBZC4C8XBm1': pythData.productPrice.get('Crypto.USDC/USD')?.aggregate.price ?? 0, // Saber wrapped USDC
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': pythData.productPrice.get('Crypto.USDC/USD')?.aggregate.price ?? 0,
                'CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5': pythData.productPrice.get('Crypto.WBTC/USD')?.aggregate.price ?? 0,
                'KNVfdSJyq1pRQk9AKKv1g5uyGuk6wpm4WG16Bjuwdma': pythData.productPrice.get('Crypto.ETH/USD')?.aggregate.price ?? 0,
                '7g166TuBmnoHKvS2PEkZx6kREZtbfjUxCHGWjCqoDXZv': pythData.productPrice.get('Crypto.EURC/USD')?.aggregate.price ?? 0,
                'EzfgjvkSwthhgHaceR3LnKXUoRkP6NUhfghdaHAj1tUv': pythData.productPrice.get('Crypto.FTT/USD')?.aggregate.price ?? 0,
                'LUNGEjUXyP48nrC1GYY5o4eTAkwm4RdX8BxFUxWJBLB': pythData.productPrice.get('Crypto.LUNC/USD')?.aggregate.price ?? 0,
                'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1': pythData.productPrice.get('Crypto.SBR/USD')?.aggregate.price ?? 0,
                'So11111111111111111111111111111111111111112': pythData.productPrice.get('Crypto.SOL/USD')?.aggregate.price ?? 0,
                'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt': pythData.productPrice.get('Crypto.SRM/USD')?.aggregate.price ?? 0,
                'A94X2fRy3wydNShU4dRaDyap2UuoeWJGWyATtyp61WZf': tryPrice ?? 0,
            };

            // Get the rest from Jupiter for now, until all Pyth oracles are defined.
            const oraclePriceMints = Object.keys(prices);
            const allContractMints = pools.map(pool => {
                return [
                    pool.tokens[0].address,
                    pool.tokens[1].address,
                ];
            }).flat().filter(address => !oraclePriceMints.includes(address));

            // Chunk them per 100 (Jup limit)
            const chunks = chunk(allContractMints, 100);

            // Call Jup price api for each chunk
            const result = (await Promise.all(chunks.map(async (chunk) => {
                return fetch(`https://price.jup.ag/v4/price?ids=${chunk.join(',')}`).then(res => res.json());
            }))).flat();

            // Merge the results into prices
            result.forEach((item: any) => {
                Object.values(item.data).forEach((priceRecord: any) => {
                    prices[priceRecord.id] = priceRecord.price;
                });
            });
            
            return prices;
        },
        staleTime: 1000 * 60,
    });
}