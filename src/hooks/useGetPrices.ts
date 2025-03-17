import { useQuery } from "@tanstack/react-query";
import useNetwork from "../hooks/useNetwork";
import { OraclePrice } from "../types";
import { chunk } from "lodash";
import useGetPools from "./useGetPools";
import { SBR_MINT } from "@saberhq/saber-periphery";
import { vaultLSTs } from "../constants";

export default function useGetPrices() {
  const { formattedNetwork } = useNetwork();
  const { data: poolData } = useGetPools(formattedNetwork);
  const { endpoint } = useNetwork();

  const pools = poolData?.pools;

  return useQuery({
    queryKey: ["prices", endpoint, (pools ?? []).length > 0 ? "y" : "n"],
    queryFn: async () => {
      try {
        if (!pools) {
          return null;
        }

        // We can add more from pyth here later
        const prices: OraclePrice = {};

        // Get the rest from Jupiter for now, until all Pyth oracles are defined.
        const allContractMints = pools
          .map((pool) => {
            return [pool.tokens[0].address, pool.tokens[1].address];
          })
          .flat()
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

        // Add vault LSTs
        vaultLSTs.forEach((lst) => {
          prices[lst] = prices["vSoLxydx6akxyMD9XEcPvGYNGq6Nn66oqVb3UkGkei7"];
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
