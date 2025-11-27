# Database Migration Guide for AWS RDS

This guide will help you migrate your database schema to a fresh AWS RDS instance.

## Prerequisites

1. **AWS RDS Instance**: You should have an AWS RDS PostgreSQL instance created
2. **AWS Secrets Manager**: The RDS instance should have a secret in AWS Secrets Manager
3. **AWS Credentials**: Configured on your local machine or in your environment

## Step 1: Configure AWS Credentials

Make sure your AWS credentials are configured. You can do this in one of the following ways:

### Option A: AWS CLI (Recommended for local development)
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-west-2`)
- Default output format (e.g., `json`)

### Option B: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=eu-west-2
```

### Option C: IAM Role (For EC2/ECS/Lambda)
If running on AWS infrastructure, use IAM roles instead of access keys.

## Step 2: Set Environment Variables

Create or update your `.env` file with:

```env
# AWS Secrets Manager Configuration
AWS_SECRET_NAME=rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db
AWS_REGION=eu-west-2

# Optional: Force using AWS Secrets Manager even in development
# FORCE_AWS_SECRETS=true

# Optional: Set NODE_ENV to production to use AWS Secrets Manager
# NODE_ENV=production
```

**Note**: If you want to use AWS Secrets Manager for migrations (even locally), either:
- Set `FORCE_AWS_SECRETS=true`, or
- Set `NODE_ENV=production`, or
- Don't set `DATABASE_URL`

## Step 3: Verify Your RDS Secret

The secret in AWS Secrets Manager should contain:
```json
{
  "username": "admin",
  "password": "your-password",
  "engine": "postgres",
  "host": "your-db-instance.xxxxx.eu-west-2.rds.amazonaws.com",
  "port": 5432,
  "dbname": "your-database-name"
}
```

You can verify this in the AWS Console or using AWS CLI:
```bash
aws secretsmanager get-secret-value --secret-id rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db --region eu-west-2
```

## Step 4: Run the Migration

### Option A: Using npm script (Recommended)
```bash
npm run migrate:rds
```

### Option B: Using ts-node directly
```bash
ts-node scripts/migrate-rds.ts
```

### Option C: Force using AWS Secrets Manager
```bash
FORCE_AWS_SECRETS=true npm run migrate:rds
```

## What the Migration Script Does

1. **Fetches Credentials**: Retrieves database credentials from AWS Secrets Manager
2. **Builds Connection String**: Constructs the PostgreSQL connection string
3. **Runs Migrations**: Executes `prisma migrate deploy` to apply all pending migrations
4. **Reports Status**: Shows success or failure of the migration

## Expected Output

When successful, you should see:
```
🚀 Starting RDS migration...

📡 Fetching database credentials from AWS Secrets Manager...
   Secret: rds!db-53e07d02-5c41-40a9-846a-dadc8b86f1db
   Region: eu-west-2

✅ Connection string retrieved: postgresql://admin:****@your-host:5432/your-db

🔄 Running Prisma migrations...

[Prisma migration output]

✅ Migrations completed successfully!
```

## Troubleshooting

### Error: "Cannot find module '../src/utils/awsSecrets'"

**Solution**: Make sure you're running the command from the project root directory.

### Error: "AccessDeniedException" or "InvalidRequestException"

**Possible causes**:
1. AWS credentials are not configured correctly
2. Your AWS credentials don't have permission to read the secret
3. The secret name or region is incorrect

**Solutions**:
- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for `secretsmanager:GetSecretValue`
- Verify the secret name and region in your `.env` file

### Error: "Connection refused" or "Timeout"

**Possible causes**:
1. RDS instance is not accessible from your network
2. Security group rules are blocking your IP
3. RDS instance is not running

**Solutions**:
- Check RDS instance status in AWS Console
- Verify security group allows connections from your IP
- If using VPC, ensure proper network configuration
- Check if you need to use a VPN or bastion host

### Error: "Database does not exist"

**Solution**: The database name in the secret might be incorrect, or the database needs to be created first. You can:
1. Create the database manually in RDS
2. Or update the secret to include the correct database name

### Error: "Migration already applied"

**Solution**: This is normal if migrations were already applied. To reset and reapply:
```bash
# WARNING: This will delete all data!
npx prisma migrate reset
npm run migrate:rds
```

## Verifying the Migration

After migration, you can verify by:

1. **Check migration status**:
   ```bash
   npx prisma migrate status
   ```

2. **Connect to the database** and verify tables:
   ```sql
   \dt  -- List all tables (in psql)
   ```

3. **Test your application**:
   ```bash
   npm run dev
   ```

## Next Steps

After successful migration:

1. **Generate Prisma Client** (if needed):
   ```bash
   npx prisma generate
   ```

2. **Start your application**:
   ```bash
   npm run dev
   ```

3. **Verify connection**: The app should connect to RDS and log:
   ```
   Fetching database credentials from AWS Secrets Manager: rds!db-...
   Database connection established successfully
   Server running on port, http://localhost:4000
   ```

## Security Notes

- Never commit `.env` files to version control
- Use IAM roles when running on AWS infrastructure
- Rotate database passwords regularly
- Use least privilege IAM policies
- Enable AWS Secrets Manager automatic rotation for RDS

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)

