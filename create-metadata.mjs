import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { 
    createMetadataAccountV3,
    DataV2,
    PROGRAM_ID as METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import { bundlrStorage, keypairIdentity, Metaplex } from '@metaplex-foundation/js';

async function createTokenMetadata(
    mintAddress,
    mintAuthority,
    name = "Everest",
    symbol = "EVT",
    description = "Everest Token - Reaching New Heights"
) {
    // Connect to devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Initialize Metaplex
    const metaplex = Metaplex.make(connection)
        .use(keypairIdentity(mintAuthority))
        .use(bundlrStorage());

    // Metadata for your token
    const tokenMetadata = {
        name: name,
        symbol: symbol,
        uri: "https://raw.githubusercontent.com/your-repo/metadata.json", // You'll need to host this
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    };

    try {
        const metadataPDA = metaplex.nfts().pdas().metadata({ mint: new PublicKey(mintAddress) });
        
        const tx = createMetadataAccountV3({
            data: tokenMetadata,
            mintAuthority: mintAuthority.publicKey,
            mint: new PublicKey(mintAddress),
            payer: mintAuthority.publicKey,
            updateAuthority: mintAuthority.publicKey,
        });

        const txSignature = await tx.buildAndSend();
        console.log('Metadata created successfully!');
        console.log('Transaction signature:', txSignature);
        console.log('Metadata address:', metadataPDA.toString());
        
        return { 
            signature: txSignature,
            metadataAddress: metadataPDA.toString()
        };
    } catch (error) {
        console.error('Error creating metadata:', error);
        throw error;
    }
}

// You'll need to pass in your mint address and authority from the previous script
const mintAddress = "2iAxtiCwHGX59nU6giNhTYinrPRwxjpWsxW1f1MB7uB4";
const mintAuthority = Keypair.fromSecretKey("91gXFau2YZPKFRrWx2t1JCUJtukbiHkEBKvbBYhwFJ8Q");

createTokenMetadata(mintAddress, mintAuthority)
    .then(console.log)
    .catch(console.error);