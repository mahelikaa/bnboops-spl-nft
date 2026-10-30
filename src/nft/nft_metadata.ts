import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import wallet from "../../devnet-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz/",
  }),
);

umi.use(signerIdentity(signer));

(async () => {
  try {
    //change the image uri to your image uri obtained from nft_image.ts
    const image =
      "https://gateway.irys.xyz/6bWCZYXaeKUg27HZ4pddELehUKqGzn1QqnQQB17Ar8ef";

    //json scheme : https://www.metaplex.com/docs/smart-contracts/core/json-schema
    const metadata = {
      name: "BNBOOPS: Withdrawals Paused",
      description:
        "Day 0. One laptop, one oops, glass breaking. Devnet-only parody of the Oct 2026 Binance hack, not affiliated with Binance or BNB Chain.",
      image,
      attributes: [
        { trait_type: "Status", value: "Investigating" },
        { trait_type: "Withdrawals", value: "Paused" },
        { trait_type: "Laptop", value: "Compromised" },
        { trait_type: "Loot", value: "$3B Frozen" },
      ],
      properties: {
        files: [{ uri: image, type: "image/png" }],
        category: "image",
      },
    };
    const myUri = await umi.uploader.uploadJson(metadata);
    console.log(`metadata uri: ${myUri} `);
  } catch (error) {
    console.log("error", error);
  }
})();
