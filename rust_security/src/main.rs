use argon2::{password_hash::SaltString, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use clap::{Parser, Subcommand};
use hmac::{Hmac, Mac};
use rand::rngs::OsRng;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

#[derive(Parser)]
#[command(author, version, about = "Rust backend security helper for password hashing and request signing.", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Hash {
        #[arg(long)]
        password: String,
    },
    VerifyHash {
        #[arg(long)]
        password: String,
        #[arg(long)]
        hash: String,
    },
    Sign {
        #[arg(long)]
        secret: String,
        #[arg(long)]
        message: String,
    },
    Verify {
        #[arg(long)]
        secret: String,
        #[arg(long)]
        message: String,
        #[arg(long)]
        signature: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Hash { password } => {
            let hashed = hash_password(&password).unwrap_or_else(|err| {
                eprintln!("error: {}", err);
                std::process::exit(1);
            });
            println!("{}", hashed);
        }
        Commands::VerifyHash { password, hash } => {
            let valid = verify_password(&password, &hash).unwrap_or(false);
            println!("{}", valid);
        }
        Commands::Sign { secret, message } => {
            let signature = sign_message(&secret, &message);
            println!("{}", signature);
        }
        Commands::Verify { secret, message, signature } => {
            let valid = verify_signature(&secret, &message, &signature);
            println!("{}", valid);
        }
    }
}

fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("failed to hash password: {}", e))
        .map(|hash| hash.to_string())
}

fn verify_password(password: &str, password_hash: &str) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|e| format!("invalid hash format: {}", e))?;
    let argon2 = Argon2::default();
    argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .map(|_| true)
        .or_else(|err| match err { argon2::password_hash::Error::Password => Ok(false), _ => Err(format!("verification failed: {}", err)) })
}

fn sign_message(secret: &str, message: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    let result = mac.finalize();
    URL_SAFE_NO_PAD.encode(result.into_bytes())
}

fn verify_signature(secret: &str, message: &str, signature: &str) -> bool {
    let expected_sig = match URL_SAFE_NO_PAD.decode(signature) {
        Ok(bytes) => bytes,
        Err(_) => return false,
    };

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(message.as_bytes());
    mac.verify_slice(&expected_sig).is_ok()
}
