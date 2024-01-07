const React = require('react');

const HeadComponents = [
    <link key="head-1" rel="preconnect" href="https://fonts.googleapis.com" />,
    <link key="head-2" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />,
    <link key="head-3" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;600&family=Josefin+Sans:wght@200;600&family=Montserrat:wght@500&display=swap" rel="stylesheet" />,
];

exports.onRenderBody = ({
    setHeadComponents,
}) => {
    setHeadComponents(HeadComponents);
};