import { 
    Connection, 
    Keypair, 
    PublicKey,
} from '@solana/web3.js';
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
} from '@solana/spl-token';
import fs from 'fs';

async function createEverestToken() {
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Try to load existing keypair or create new one
    let mintAuthority;
    try {
        if (fs.existsSync('keypair.json')) {
            console.log('Loading existing keypair...');
            const keypairData = JSON.parse(fs.readFileSync('keypair.json', 'utf-8'));
            mintAuthority = Keypair.fromSecretKey(new Uint8Array(keypairData));
        } else {
            console.log('Creating new keypair...');
            mintAuthority = Keypair.generate();
            // Save the new keypair
            fs.writeFileSync(
                'keypair.json', 
                JSON.stringify(Array.from(mintAuthority.secretKey))
            );
        }
    } catch (error) {
        console.error('Error with keypair:', error);
        throw error;
    }
    
    console.log('Mint Authority Public Key:', mintAuthority.publicKey.toString());
    
    // Check SOL balance
    const balance = await connection.getBalance(mintAuthority.publicKey);
    console.log('Current balance:', balance / 1000000000, 'SOL');
    
    if (balance < 1000000000) {  // less than 1 SOL
        console.log('Insufficient SOL. Please fund your wallet using https://faucet.solana.com');
        console.log('After funding, run this script again.');
        return;
    }
    
    // Create the token mint
    console.log('Creating token mint...');
    const mint = await createMint(
        connection,
        mintAuthority,
        mintAuthority.publicKey, // mint authority
        mintAuthority.publicKey, // freeze authority
        9 // decimals (same as SOL)
    );
    
    console.log('Token Mint Address:', mint.toString());
    
    // Create associated token account
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        mintAuthority,
        mint,
        mintAuthority.publicKey
    );
    
    // Mint initial supply (example: 1 billion tokens)
    console.log('Minting initial supply...');
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
    
    // Save mint address for later use
    fs.writeFileSync(
        'mint-address.json',
        JSON.stringify({ address: mint.toString() })
    );
    
    return {
        mint: mint.toString(),
        mintAuthority: mintAuthority.publicKey.toString(),
        tokenAccount: tokenAccount.address.toString()
    };
}

// Execute the token creation
createEverestToken().then(console.log).catch(console.error);