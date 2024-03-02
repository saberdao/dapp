import { useEffect, useState } from 'react';

/**
 * Uses a real-time feed of the claimable amounts.
 *
 * Warning: this causes the component to re-render extremely frequently, so one should
 * take care to not put this too high up in the component tree.
 *
 * @param getter
 * @returns
 */
export const useClaimableAmounts = (
    getter: () => number | null,
): number | null => {
    const [amounts, setAmounts] = useState<number | null>(null);
    useEffect(() => {
        let playing = true;
        const doFrame = () => {
            const amounts = getter();
            if (amounts) {
                setAmounts(getter());
            }
            if (playing && amounts) {
                requestAnimationFrame(doFrame);
            }
        };
        doFrame();
        return () => {
            playing = false;
        };
    }, [getter]);

    return amounts;
};