/**
 * Script to list all RDS instances and their endpoints
 * This helps you find the correct RDS_HOST value
 */

import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import dotenv from "dotenv";

dotenv.config();

async function listRdsInstances() {
  const region = process.env.AWS_REGION || "eu-west-2";
  
  console.log(`\n🔍 Listing RDS instances in region: ${region}\n`);
  
  try {
    const client = new RDSClient({ region });
    const command = new DescribeDBInstancesCommand({});
    const response = await client.send(command);
    
    if (!response.DBInstances || response.DBInstances.length === 0) {
      console.log("❌ No RDS instances found in this region.");
      console.log("\nPossible reasons:");
      console.log("  1. No RDS instances exist in this region");
      console.log("  2. Your AWS credentials don't have permission to list RDS instances");
      console.log("  3. Wrong region - try setting AWS_REGION in .env\n");
      return;
    }
    
    console.log(`Found ${response.DBInstances.length} RDS instance(s):\n`);
    console.log("=".repeat(80));
    
    for (const instance of response.DBInstances) {
      console.log(`\n📦 Instance: ${instance.DBInstanceIdentifier}`);
      console.log(`   Engine: ${instance.Engine} ${instance.EngineVersion}`);
      console.log(`   Status: ${instance.DBInstanceStatus}`);
      
      if (instance.Endpoint) {
        console.log(`   Host: ${instance.Endpoint.Address}`);
        console.log(`   Port: ${instance.Endpoint.Port}`);
        console.log(`   Database: ${instance.DBName || "(default)"}`);
        
        console.log(`\n   ✅ Add these to your .env file:`);
        console.log(`   RDS_HOST=${instance.Endpoint.Address}`);
        console.log(`   RDS_PORT=${instance.Endpoint.Port}`);
        if (instance.DBName) {
          console.log(`   RDS_DBNAME=${instance.DBName}`);
        }
      } else {
        console.log(`   ⚠️  No endpoint available (instance may still be starting)`);
      }
      
      console.log("\n" + "-".repeat(80));
    }
    
    console.log("\n📝 Next steps:");
    console.log("   1. Copy the RDS_HOST and RDS_PORT values above");
    console.log("   2. Add them to your .env file");
    console.log("   3. Run: npm run migrate:rds\n");
    
  } catch (error: any) {
    console.error("❌ Error listing RDS instances:", error.message);
    
    if (error.Code === "AccessDenied") {
      console.log("\n⚠️  Your AWS credentials don't have permission to list RDS instances.");
      console.log("   You can still get the endpoint from the AWS Console:");
      console.log("   1. Go to AWS Console → RDS → Databases");
      console.log("   2. Click on your database instance");
      console.log("   3. Find the 'Endpoint' field\n");
    }
  }
}

listRdsInstances();

