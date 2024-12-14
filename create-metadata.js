import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createSignerFromKeypair, keypairIdentity, signerIdentity } from "@metaplex-foundation/umi";
import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
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
        
        // Create metadata account
        const builder = await createMetadataAccountV3(umi, {
            mint: publicKey(mintAddress.address),
            mintAuthority: signer,
            updateAuthority: keypair.publicKey,
            data: {
                name: metadata.name,
                symbol: metadata.symbol,
                uri: 'https://raw.githubusercontent.com/tiraskrit/evst/main/metadata.json',
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            },
            isMutable: true,
            collectionDetails: null,
        });

        // Send the transaction
        const result = await builder.sendAndConfirm(umi);
        
        console.log('Metadata created successfully!');
        console.log('Transaction signature:', result.signature);
        
    } catch (error) {
        console.error('Error creating metadata:', error);
    }
}

main();