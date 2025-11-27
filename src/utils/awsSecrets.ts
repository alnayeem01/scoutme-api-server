import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

/**
 * Interface for RDS database credentials stored in AWS Secrets Manager
 * AWS RDS automatically creates secrets with this structure
 */
interface RDSSecret {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: number;
  dbname?: string;
  dbInstanceIdentifier?: string;
}

/**
 * Retrieves a secret from AWS Secrets Manager
 * @param secretName - The name or ARN of the secret
 * @param region - AWS region where the secret is stored (default: eu-west-2)
 * @returns The secret as a parsed JSON object
 */
export async function getSecretFromAWS(
  secretName: string,
  region: string = "eu-west-2"
): Promise<RDSSecret> {
  const client = new SecretsManagerClient({
    region: region,
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );

    if (!response.SecretString) {
      throw new Error("Secret value is empty or not a string");
    }

    // Parse the secret string (it's typically JSON)
    const secret: RDSSecret = JSON.parse(response.SecretString);
    return secret;
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    console.error("Error retrieving secret from AWS Secrets Manager:", error);
    throw error;
  }
}

/**
 * Constructs a PostgreSQL connection string from RDS secret
 * Format: postgresql://username:password@host:port/dbname
 * @param secret - The RDS secret object from AWS Secrets Manager
 * @returns PostgreSQL connection string
 */
export function buildDatabaseUrl(secret: RDSSecret): string {
  const { username, password, host, port, dbname } = secret;
  
  // Encode username and password to handle special characters
  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  
  // Construct the connection string
  // If dbname is not provided, it will be omitted (PostgreSQL will use default)
  const dbNamePart = dbname ? `/${dbname}` : "";
  const connectionString = `postgresql://${encodedUsername}:${encodedPassword}@${host}:${port}${dbNamePart}`;
  
  return connectionString;
}

/**
 * Gets the database connection string, either from AWS Secrets Manager or environment variable
 * This allows for local development using DATABASE_URL and production using AWS Secrets Manager
 * @returns PostgreSQL connection string
 */
export async function getDatabaseUrl(): Promise<string> {
  // For local development, use DATABASE_URL if available
  if (process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    console.log("Using DATABASE_URL from environment variables (local development)");
    return process.env.DATABASE_URL;
  }

  // For production, fetch from AWS Secrets Manager
  const secretName = process.env.AWS_SECRET_NAME || "rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db";
  const awsRegion = process.env.AWS_REGION || "eu-west-2";

  console.log(`Fetching database credentials from AWS Secrets Manager: ${secretName}`);
  const secret = await getSecretFromAWS(secretName, awsRegion);
  const connectionString = buildDatabaseUrl(secret);

  return connectionString;
}

