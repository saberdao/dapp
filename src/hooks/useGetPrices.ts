import {
  PythHttpClient,
  getPythProgramKeyForCluster,
} from "@pythnetwork/client";
import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import useNetwork from "../hooks/useNetwork";
import { OraclePrice } from "../types";
import { chunk } from "lodash";
import useGetPools from "./useGetPools";
import { SBR_MINT } from "@saberhq/saber-periphery";

export default function useGetPrices() {
  const { formattedNetwork } = useNetwork();
  const { connection } = useConnection();
  const { data: poolData } = useGetPools(formattedNetwork);
  const { network, endpoint } = useNetwork();

  const pools = poolData?.pools;

  return useQuery({
    queryKey: ["prices", endpoint, (pools ?? []).length > 0 ? "y" : "n"],
    queryFn: async () => {
      try {
        if (!pools) {
          return null;
        }

        // Get prices from pyth
        const client = new PythHttpClient(
          connection,
          getPythProgramKeyForCluster(network)
        );
        const pythData = await client.getData();

        let tryPrice = 0;
        try {
          const cgData = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bilira&vs_currencies=usd"
          );
          tryPrice = (await cgData.json())?.bilira?.usd ?? 0;
        } catch (e) {
          // Do nothing (just assume is 0)
        }

        // We can add more from pyth here later
        const prices: OraclePrice = {};

        // Get the rest from Jupiter for now, until all Pyth oracles are defined.
        const oraclePriceMints = Object.keys(prices);
        const allContractMints = pools
          .map((pool) => {
            return [pool.tokens[0].address, pool.tokens[1].address];
          })
          .flat()
          .filter((address) => !oraclePriceMints.includes(address))
          .concat(SBR_MINT);

        // Chunk them per 100 (Jup limit)
        const chunks = chunk(allContractMints, 100);

        // Call Jup price api for each chunk
        const result = (
          await Promise.all(
            chunks.map(async (chunk) => {
              try {
                return await fetch(
                  `https://api.jup.ag/price/v2?ids=${chunk.join(",")}`
                ).then((res) => res.json());
              } catch (e) {
                return {};
              }
            })
          )
        ).flat();

        // Merge the results into prices
        result.forEach((item: any) => {
          Object.values(item?.data ?? {}).forEach((priceRecord: any) => {
            if (!priceRecord) {
              return;
            }
            prices[priceRecord.id] = parseFloat(priceRecord.price);
          });
        });
        console.log(prices);

        return prices;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    staleTime: 1000 * 600,
  });
}
