import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";

/**
 * Interface for RDS database credentials stored in AWS Secrets Manager
 * AWS RDS automatically creates secrets with this structure
 * Note: Some secrets may use 'address' instead of 'host'
 */
interface RDSSecret {
  username: string;
  password: string;
  engine: string;
  host?: string;
  address?: string; // Alternative field name used by some RDS secrets
  port?: number | string; // Can be number or string
  dbname?: string;
  dbInstanceIdentifier?: string;
  // Additional fields that might exist
  [key: string]: any;
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
    
    // Debug: Log secret structure (without sensitive data)
    console.log("Secret structure:", JSON.stringify({
      username: secret.username ? "***" : "missing",
      password: secret.password ? "***" : "missing",
      engine: secret.engine,
      host: secret.host || secret.address || "missing",
      port: secret.port || "missing",
      dbname: secret.dbname || "missing",
      keys: Object.keys(secret)
    }, null, 2));
    
    // Validate required fields
    if (!secret.username || !secret.password) {
      throw new Error("Secret is missing username or password");
    }
    
  // Note: host, port, and dbname can come from:
  // 1. The secret itself
  // 2. Environment variables
  // 3. Auto-fetched from RDS API (if dbInstanceIdentifier is available)
  
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
 * 
 * Connection details can come from:
 * 1. The secret itself (if it contains host, port, dbname)
 * 2. Environment variables (RDS_HOST, RDS_PORT, RDS_DBNAME) - takes precedence
 * 
 * @param secret - The RDS secret object from AWS Secrets Manager
 * @returns PostgreSQL connection string
 */
export function buildDatabaseUrl(secret: RDSSecret): string {
  const { username, password } = secret;
  
  // Validate required fields
  if (!username || !password) {
    throw new Error("Secret must contain 'username' and 'password' fields");
  }
  
  // Get connection details - prefer environment variables, fallback to secret
  const host = process.env.RDS_HOST || secret.host || secret.address;
  const port = process.env.RDS_PORT || (secret.port ? String(secret.port) : null) || "5432";
  const dbname = process.env.RDS_DBNAME || secret.dbname;
  
  // Validate host
  if (!host || host === "undefined") {
    throw new Error(
      "Database host is missing. Please provide it via:\n" +
      "  - RDS_HOST environment variable, or\n" +
      "  - Include 'host' or 'address' in the AWS Secrets Manager secret"
    );
  }
  
  // Validate port
  if (!port || port === "undefined") {
    throw new Error(
      "Database port is missing. Please provide it via:\n" +
      "  - RDS_PORT environment variable (default: 5432), or\n" +
      "  - Include 'port' in the AWS Secrets Manager secret"
    );
  }
  
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
 * Extracts DB instance identifier from secret name
 * Secret names like "rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db" contain the instance ID
 * @param secretName - The secret name or ARN
 * @returns DB instance identifier or null
 */
function extractDbInstanceId(secretName: string): string | null {
  // Pattern: rds!db-{instance-id}
  const match = secretName.match(/rds!db-([a-f0-9-]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  
  // If secret name is just the instance ID
  if (secretName.match(/^[a-f0-9-]+$/i)) {
    return secretName;
  }
  
  return null;
}

/**
 * Fetches RDS instance endpoint from AWS RDS API
 * @param dbInstanceIdentifier - The DB instance identifier
 * @param region - AWS region
 * @returns Object with host and port, or null if not found
 */
async function getRdsEndpoint(
  dbInstanceIdentifier: string,
  region: string
): Promise<{ host: string; port: number } | null> {
  try {
    const rdsClient = new RDSClient({ region });
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbInstanceIdentifier,
    });
    
    const response = await rdsClient.send(command);
    
    if (response.DBInstances && response.DBInstances.length > 0) {
      const instance = response.DBInstances[0];
      if (instance.Endpoint?.Address && instance.Endpoint.Port) {
        return {
          host: instance.Endpoint.Address,
          port: instance.Endpoint.Port,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Could not fetch RDS endpoint for ${dbInstanceIdentifier}:`, error);
    return null;
  }
}

/**
 * Gets the database connection string, either from AWS Secrets Manager or environment variable
 * This allows for local development using DATABASE_URL and production using AWS Secrets Manager
 * 
 * Similar to Python boto3 approach:
 * - Fetches secret from AWS Secrets Manager
 * - Extracts credentials (username, password)
 * - Gets connection details (host, port, dbname) from secret, env vars, or RDS API
 * 
 * @returns PostgreSQL connection string
 */
export async function getDatabaseUrl(): Promise<string> {
  // Check if we should force using AWS Secrets Manager
  const forceAwsSecrets = process.env.FORCE_AWS_SECRETS === "true";
  
  // For local development, use DATABASE_URL if available (unless forced to use AWS)
  if (!forceAwsSecrets && process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    console.log("Using DATABASE_URL from environment variables (local development)");
    return process.env.DATABASE_URL;
  }

  // For production or when forced, fetch from AWS Secrets Manager
  const secretName = process.env.AWS_SECRET_NAME || "rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db";
  const awsRegion = process.env.AWS_REGION || "eu-west-2";

  console.log(`Fetching database credentials from AWS Secrets Manager: ${secretName}`);
  const secret = await getSecretFromAWS(secretName, awsRegion);
  
  // Try to get connection details from multiple sources
  let host: string | undefined;
  let port: string | undefined;
  let dbname: string | undefined;
  
  // Priority 1: Environment variables (explicit override)
  if (process.env.RDS_HOST || process.env.RDS_PORT || process.env.RDS_DBNAME) {
    console.log("Using connection details from environment variables (RDS_HOST, RDS_PORT, RDS_DBNAME)");
    host = process.env.RDS_HOST;
    port = process.env.RDS_PORT;
    dbname = process.env.RDS_DBNAME;
  }
  // Priority 2: Secret itself
  else if (secret.host || secret.address || secret.port) {
    console.log("Using connection details from AWS Secrets Manager secret");
    host = secret.host || secret.address;
    port = secret.port ? String(secret.port) : undefined;
    dbname = secret.dbname;
  }
  // Priority 3: Auto-fetch from RDS API (if we can extract instance ID)
  else {
    const dbInstanceId = extractDbInstanceId(secretName) || secret.dbInstanceIdentifier;
    if (dbInstanceId) {
      console.log(`Attempting to fetch RDS endpoint from AWS RDS API for instance: ${dbInstanceId}`);
      const endpoint = await getRdsEndpoint(dbInstanceId, awsRegion);
      if (endpoint) {
        console.log("✅ Successfully fetched RDS endpoint from AWS RDS API");
        host = endpoint.host;
        port = String(endpoint.port);
        dbname = secret.dbname; // Still get dbname from secret if available
      }
    }
  }
  
  // If still missing, update secret object with fetched values
  if (host) secret.host = host;
  if (port) secret.port = port;
  if (dbname) secret.dbname = dbname;
  
  // Final check and warning
  if (!host || !port) {
    console.log("⚠️  Warning: Connection details not found. Please set RDS_HOST, RDS_PORT, and optionally RDS_DBNAME environment variables.");
  }
  
  const connectionString = buildDatabaseUrl(secret);

  return connectionString;
}

