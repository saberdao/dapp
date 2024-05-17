import React from 'react';
import type { HeadFC, PageProps } from 'gatsby';

import H1 from '../components/H1';

const NotFoundPage: React.FC<PageProps> = () => {
    return (
        <div className="max-w-2xl">
            <H1>Page not found</H1>
            <p>The page you are looking for does not exist.</p>
        </div>
    );
};

export default NotFoundPage;

export const Head: HeadFC = () => <title>Saber | Solana AMM</title>;
