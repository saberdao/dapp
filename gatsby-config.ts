import type { GatsbyConfig } from 'gatsby';

require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
});

const config: GatsbyConfig = {
  siteMetadata: {
    title: 'dapp',
    siteUrl: 'https://www.saber.so',
  },
  graphqlTypegen: true,
  plugins: [
    'gatsby-plugin-postcss',
    {
      resolve: 'gatsby-plugin-google-tagmanager',
      options: {
        id: 'G-R67GCPSJD7',
      },
    },
  ],
};

export default config;
