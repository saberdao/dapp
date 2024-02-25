import { Percent } from '@saberhq/token-utils';
import { useState } from 'react';

export default function useSettings() {
    const [maxSlippagePercent] = useState<Percent>(
        new Percent(10, 10_000),
    );

    return { maxSlippagePercent };
}