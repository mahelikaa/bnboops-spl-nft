import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { fetchAsset, mplCore, update } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplCore());
umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz/",
  }),
);

//asset address from nft_mint.ts
const assetAddress = publicKey("8RwZpxjPMtJaQ1Pp79PRzdSvFDYVtzeJRPkrGsXnEZ5f");

//image uri from nft_image.ts
const image =
  "https://gateway.irys.xyz/6bWCZYXaeKUg27HZ4pddELehUKqGzn1QqnQQB17Ar8ef";

const NEW_NAME = "BNBOOPS: Withdrawals Resumed";

(async () => {
  try {
    const metadata = {
      name: NEW_NAME,
      description:
        "in case of oops: done. in case of another oops: please no ;-;\n$3B frozen. coolest money in crypto btw",
      image,
      attributes: [
        { trait_type: "Status", value: "SAFU-ish" },
        { trait_type: "Withdrawals", value: "Resumed" },
        { trait_type: "Laptop", value: "Quarantined" },
        { trait_type: "Users", value: "Covered" },
      ],
      properties: {
        files: [{ uri: image, type: "image/png" }],
        category: "image",
      },
    };
    const newUri = await umi.uploader.uploadJson(metadata);
    console.log(`new metadata uri: ${newUri}`);

    const asset = await fetchAsset(umi, assetAddress);

    // only the asset's update authority can sign this
    const tx = await update(umi, {
      asset,
      name: NEW_NAME,
      uri: newUri,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];

    console.log(`signature ${signature} , asset : ${assetAddress}`);
    console.log(
      `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (e) {
    console.error("Failed to update NFT:", e);
    process.exitCode = 1;
  }
})();
