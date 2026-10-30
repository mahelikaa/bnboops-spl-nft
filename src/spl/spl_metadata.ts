import { readFile } from "fs/promises";
import {
  createGenericFile,
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
} from "@metaplex-foundation/umi";
import wallet from "../../devnet-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import bs58 from "bs58";

//mint address from spl_init.ts
const mint = publicKey("EF8CeLCEfaEPRVEWxy671sDQXVNX2ehykv4re4y9ds7M");

const TOKEN_NAME = "Big Naughty Breach";
const TOKEN_SYMBOL = "BNBOOPS";

const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));

umi.use(
  irysUploader({
    address: "https://devnet.irys.xyz/",
  }),
);

(async () => {
  try {
    const image = await readFile("src/art/bnboops.png");
    const file = createGenericFile(image, "bnboops.png", {
      contentType: "image/png",
    });
    const [imageUri] = await umi.uploader.upload([file]);
    console.log(`Image URI: ${imageUri}`);

    //off-chain json that wallets/explorers read for the token
    const tokenUri = await umi.uploader.uploadJson({
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      description:
        "In case of oops, break glass. A devnet-only parody of the Oct 2026 Binance hack, with zero value. Not affiliated with Binance or BNB Chain.",
      image: imageUri,
    });
    console.log(`Token metadata URI: ${tokenUri}`);

    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint,
      mintAuthority: signer,
      payer: signer,
      updateAuthority: signer,
    };

    const data: DataV2Args = {
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      uri: tokenUri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };

    const args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: true,
      collectionDetails: null,
    };

    const tx = createMetadataAccountV3(umi, {
      ...accounts,
      ...args,
    });

    const result = await tx.sendAndConfirm(umi);
    const signature = bs58.encode(Buffer.from(result.signature));

    console.log(`Token name: ${TOKEN_NAME}`);
    console.log(`Token symbol: ${TOKEN_SYMBOL}`);
    console.log(`metadata txid: ${signature}`);
    console.log(
      `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    );
  } catch (error) {
    console.error("Failed to create token metadata:", error);
    process.exitCode = 1;
  }
})();
