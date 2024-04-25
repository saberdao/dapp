import React from 'react';
import { useLocalStorage } from 'usehooks-ts';

import Button from '@/src/components/Button';

export default function SettingModel() {
    const [priorityFee, setPriorityFee] = useLocalStorage('priorityFee', 0);

    return (
        <>
            <div className="flex gap-2 mt-4">
                <Button
                    type={priorityFee === 0 ? 'primary' : 'secondary'}
                    onClick={() => setPriorityFee(0)}
                >
                    None
                </Button>
                <Button
                    type={priorityFee === 0.001 ? 'primary' : 'secondary'}
                    onClick={() => setPriorityFee(0.001)}
                >
                    0.001 SOL
                </Button>
                <Button
                    type={priorityFee === 0.01 ? 'primary' : 'secondary'}
                    onClick={() => setPriorityFee(0.01)}
                >
                    0.01 SOL
                </Button>
            </div>
        </>
    );
}
