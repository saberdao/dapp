import { useQuery } from '@tanstack/react-query';
import { SBR_REWARDER } from '@saberhq/saber-periphery';
import { getRewarder } from '../helpers/rewarder';

const lsts = [
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    'vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7',
    'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',
    '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    '7Q2afV64in6N6SeZsAAB81TJzwDoD6zpqmHkzi9Dcavn',
    'picobAEvs6w7QEknPce34wAE4gknZA9v5tTonnmHYdX',
    'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v',
    'LnTRntk2kTfWEY6cVB8K9649pgJbt6dJLS1Ns1GZCWg',
    'HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
    'BonK1YhkXEGLZzwtcvRTip3gAL9nCeQD7ppZBLXhtTs',
]

export default function useGetStakePoolAPY(network: string) {
    return useQuery({
        queryKey: ['stakePoolApy'],
        staleTime: 1000 * 3600,
        queryFn: async () => {
            const response = await fetch(`https://sanctum-extra-api.ngrok.dev/v1/apy/latest?${lsts.map(lst => `lst=${lst}`).join('&')}`)
            const result = await response.json();

            return result.apys as Record<string, number>;
        },
        enabled: !!network,
    });
}