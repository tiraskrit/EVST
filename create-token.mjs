import { 
    Connection, 
    Keypair, 
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
} from '@solana/web3.js';
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
} from '@solana/spl-token';

async function createEverestToken() {
    // Connect to Solana devnet first (change to mainnet-beta for production)
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create a new wallet keypair for the mint authority
    const mintAuthority = Keypair.generate();
    
    console.log('Mint Authority Public Key:', mintAuthority.publicKey.toString());
    
    // Request airdrop of SOL to pay for transactions (only works on devnet)
    const airdropSignature = await connection.requestAirdrop(
        mintAuthority.publicKey,
        1000000000 // 1 SOL
    );
    
    // Using the new way to confirm transactions
    try {
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            signature: airdropSignature,
            ...latestBlockhash
        });
        console.log('Airdrop confirmed');
    } catch (error) {
        console.error('Error confirming airdrop:', error);
        throw error;
    }
    
    // Create the token mint
    const mint = await createMint(
        connection,
        mintAuthority,
        mintAuthority.publicKey, // mint authority
        mintAuthority.publicKey, // freeze authority
        9 // decimals (same as SOL)
    );
    
    console.log('Token Mint Address:', mint.toString());
    
    // Create associated token account for the mint authority
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        mintAuthority.publicKey
    );
    
    // Mint initial supply (example: 1 billion tokens)
    const initialSupply = 1000000000 * Math.pow(10, 9); // Adjust supply as needed
    await mintTo(
        connection,
        mintAuthority,
        mint,
        tokenAccount.address,
        mintAuthority,
        initialSupply
    );
    
    console.log('Token successfully created and minted!');
    console.log('Token Account:', tokenAccount.address.toString());
    
    return {
        mint: mint.toString(),
        mintAuthority: mintAuthority.publicKey.toString(),
        tokenAccount: tokenAccount.address.toString()
    };
}

// Execute the token creation
createEverestToken().then(console.log).catch(console.error);