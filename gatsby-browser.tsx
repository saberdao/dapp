import './src/styles/global.css';

import dapp from './src/hoc/dapp';

export const wrapPageElement = ({
    element,
    props,
}: {
    element: React.ReactElement;
    props: Record<string, unknown> & { location: Location };
}) => {
    return dapp(element, props);
};
