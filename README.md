# Saber

This README will be completed later.

## Local development

Create a file `.env.development` in the root directory containing:

```
GATSBY_RPC_URL=
GATSBY_RPC_WS=
```

If your RPC has no websocket endpoint (the second), just enter the same url for both, but use wss:// instead of https:// for the websocket.

Then run

`yarn start`