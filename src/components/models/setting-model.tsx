import React, { useEffect } from 'react';
import Button from '../Button';
import { useLocalStorage } from 'usehooks-ts';
import Input, { InputType } from '../Input';
import { useForm } from 'react-hook-form';

const RPCForm = () => {
    const [storedRpc, setStoredRpc] = useLocalStorage('rpc', '');
    const { register, watch, setValue } = useForm<{
        rpc: string;
    }>();

    const rpc = watch('rpc');

    useEffect(() => {
        if (rpc?.startsWith('https://')) {
            return setStoredRpc(rpc);
        }

        setStoredRpc('');
    }, [rpc]);

    return (
        <div className="flex gap-2 mt-4">
            <Button
                type={!rpc ? 'primary' : 'secondary'}
                onClick={() => setValue('rpc', '')}
            >
                Triton
            </Button>
            <Input type={InputType.TEXT} register={register('rpc')} placeholder="Custom..." defaultValue={storedRpc} />
        </div>
    )
}

export default function SettingModel() {
    const [priorityFee, setPriorityFee] = useLocalStorage('priorityFee', 0.0001);

    return (
        <>
            <div className="mt-3">
                <p className="font-bold">Priority fee</p>
                <div className="flex gap-2 mt-4">
                    <Button
                        type={priorityFee === 0 ? 'primary' : 'secondary'}
                        onClick={() => setPriorityFee(0)}
                    >
                        None
                    </Button>
                    <Button
                        type={priorityFee === 0.0001 ? 'primary' : 'secondary'}
                        onClick={() => setPriorityFee(0.0001)}
                    >
                        0.0001 SOL
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
            </div>
            <div className="mt-3">
                <p className="font-bold">RPC endpoint</p>
                <RPCForm />
            </div>
        </>
    );
}
