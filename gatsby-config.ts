import type { GatsbyConfig } from 'gatsby';

require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`,
});

const config: GatsbyConfig = {
    siteMetadata: {
        title: 'dapp',
        siteUrl: 'https://www.saber.so',
    },
    // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
    // If you use VSCode you can also use the GraphQL plugin
    // Learn more at: https://gatsby.dev/graphql-typegen
    graphqlTypegen: true,
    plugins: [
        'gatsby-plugin-postcss',
        {
            resolve: "gatsby-plugin-google-tagmanager",
            options: {
              id: "G-R67GCPSJD7",
            },
        },
    ],
};

export default config;
