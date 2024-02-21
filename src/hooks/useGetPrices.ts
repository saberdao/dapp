import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import useNetwork from './useNetwork';
import { CurrencyMarket } from '../_temp_stableswap_types';
import { ReferencePrice } from '../types';

export default function useGetPrices() {
    const { connection } = useConnection();
    const { network } = useNetwork();

    return useQuery({
        queryKey: ['prices'],
        queryFn: async () => {
            const client = new PythHttpClient(connection, getPythProgramKeyForCluster(network));
            const [pythData, cgData] = await Promise.all([
                client.getData(),
                fetch('https://api.coingecko.com/api/v3/simple/price?ids=bilira&vs_currencies=usd'),
            ]);

            const tryPrice = (await cgData.json()).bilira.usd;

            const prices: ReferencePrice = {
                [CurrencyMarket.USD]: {
                    referenceMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    price: pythData.productPrice.get('Crypto.USDC/USD')?.aggregate.price ?? 0, // Reference oracle = USDC
                },
                [CurrencyMarket.BTC]: {
                    referenceMint: 'CDJWUqTcYTVAKXAVXoQZFes5JUFc7owSeq7eMQcDSbo5', // renBTC for now @TODO -> this is a mismatch. Should be portal BTC
                    price: pythData.productPrice.get('Crypto.WBTC/USD')?.aggregate.price ?? 0, // Reference oracle = wBTC (portal)
                },
                [CurrencyMarket.ETH]: {
                    referenceMint: 'KNVfdSJyq1pRQk9AKKv1g5uyGuk6wpm4WG16Bjuwdma', // saber wrapped ETH portal -> should update
                    price: pythData.productPrice.get('Crypto.ETH/USD')?.aggregate.price ?? 0, // Reference oracle = ?? portal ETH? need to ceheck
                },
                [CurrencyMarket.EUR]: {
                    referenceMint: '7g166TuBmnoHKvS2PEkZx6kREZtbfjUxCHGWjCqoDXZv', // @TODO: this is now acEUR, but we need to change this to EURC
                    price: pythData.productPrice.get('Crypto.EURC/USD')?.aggregate.price ?? 0, // Reference oracle = EURC but we have no pool for it
                },
                [CurrencyMarket.FTT]: {
                    referenceMint: 'EzfgjvkSwthhgHaceR3LnKXUoRkP6NUhfghdaHAj1tUv',
                    price: pythData.productPrice.get('Crypto.FTT/USD')?.aggregate.price ?? 0, // Reference oracle = FTT
                },
                [CurrencyMarket.LUNA]: {
                    referenceMint: 'LUNGEjUXyP48nrC1GYY5o4eTAkwm4RdX8BxFUxWJBLB',
                    price: pythData.productPrice.get('Crypto.LUNC/USD')?.aggregate.price ?? 0,
                },
                [CurrencyMarket.SBR]: {
                    referenceMint: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
                    price: pythData.productPrice.get('Crypto.SBR/USD')?.aggregate.price ?? 0,
                },
                [CurrencyMarket.SOL]: {
                    referenceMint: 'So11111111111111111111111111111111111111112',
                    price: pythData.productPrice.get('Crypto.SOL/USD')?.aggregate.price ?? 0,
                },
                [CurrencyMarket.SRM]: {
                    referenceMint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
                    price: pythData.productPrice.get('Crypto.SRM/USD')?.aggregate.price ?? 0,
                },
                [CurrencyMarket.TRY]: {
                    referenceMint: 'A94X2fRy3wydNShU4dRaDyap2UuoeWJGWyATtyp61WZf',
                    price: tryPrice ?? 0, // fetch this from coingecko?
                },
            };

            return prices;
        },
    });
}