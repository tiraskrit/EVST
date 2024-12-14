import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, keypairIdentity, signerIdentity } from "@metaplex-foundation/umi";
import { updateMetadataAccountV2, findMetadataPda } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import fs from 'fs';

// Read configuration files
const mintAddress = JSON.parse(fs.readFileSync('./mint-address.json', 'utf-8'));
const keypairFile = JSON.parse(fs.readFileSync('./keypair.json', 'utf-8'));

async function main() {
    // Initialize UMI
    const umi = createUmi('https://api.devnet.solana.com');
    
    // Create a signer from your keypair
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(keypairFile));
    const signer = createSignerFromKeypair(umi, keypair);
    
    // Set the signer as the identity
    umi.use(signerIdentity(signer));
    
    try {
        // Fetch metadata from GitHub
        const response = await fetch('https://raw.githubusercontent.com/tiraskrit/evst/main/metadata.json');
        const metadata = await response.json();
        
        // Calculate the metadata account address using the mint address
        const metadataAccountAddress = findMetadataPda(umi, {
            mint: publicKey(mintAddress.address),
        });
        
        // Update metadata account
        const builder = await updateMetadataAccountV2(umi, {
            metadata: metadataAccountAddress,
            updateAuthority: signer,
            data: {
                name: metadata.name,
                symbol: metadata.symbol,
                uri: 'https://raw.githubusercontent.com/tiraskrit/evst/main/metadata.json',
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            },
            primarySaleHappened: false,
            isMutable: true,
        });

        // Send the transaction
        const result = await builder.sendAndConfirm(umi);
        
        console.log('Metadata updated successfully!');
        console.log('Transaction signature:', result.signature);
        
    } catch (error) {
        console.error('Error updating metadata:', error);
    }
}

main();