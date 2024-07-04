import React from 'react';
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

const HeadComponents = [
    <meta key="meta-1" name="description" content="Saber is an automated market maker for trading stable asset pairs on Solana."/>,
    <meta key="meta-2" property="og:title" content="Saber: Solana AMM"/>,
    <meta key="meta-3" property="og:site_name" content="Saber: Solana AMM"/>,
    <meta key="meta-4" property="og:url" content="https://saberdao.io"/>,
    <meta key="meta-5" property="og:description" content="Saber is an automated market maker for trading stable asset pairs on Solana."/>,
    <meta key="meta-6" property="og:type" content="website"/>,
    <meta key="meta-7" property="og:image" content="https://saberdao.io/ogimage.jpg"/>,
    <meta key="meta-8" property="twitter:card" content="summary_large_image"/>,
    <meta key="meta-9" property="twitter:url" content="https://saberdao.io"/>,
    <meta key="meta-10" property="twitter:title" content="Saber on Solana"/>,
    <meta key="meta-11" property="twitter:description" content="Saber is an automated market maker for trading stable asset pairs on Solana."/>,
    <meta key="meta-12" property="twitter:image" content="https://saberdao.io/ogimage.jpg"/>,
    <link key="head-1" rel="preconnect" href="https://fonts.googleapis.com" />,
    <link key="head-2" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />,
    <link key="head-3" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;600&family=Josefin+Sans:wght@200;600&family=Montserrat:wght@500&display=swap" rel="stylesheet" />,
    <style key="head-4">{`html {
        background-color: #1f2937;
        background-attachment: fixed;
        background-image: linear-gradient(to bottom, #030712, #1f2937);
    }`}</style>,
];

export const onRenderBody = ({
    setHeadComponents,
}) => {
    setHeadComponents(HeadComponents);
};