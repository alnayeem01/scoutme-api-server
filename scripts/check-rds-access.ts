/**
 * Script to check RDS accessibility and security group configuration
 */

import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { EC2Client, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import dotenv from "dotenv";

dotenv.config();

async function checkRdsAccess() {
  const region = process.env.AWS_REGION || "eu-west-2";
  
  console.log("\n🔍 Checking RDS instance accessibility...\n");
  
  try {
    const rdsClient = new RDSClient({ region });
    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: "smo-database"
    });
    
    const response = await rdsClient.send(command);
    const instance = response.DBInstances?.[0];
    
    if (!instance) {
      console.log("❌ RDS instance 'smo-database' not found");
      return;
    }
    
    console.log("📦 RDS Instance: smo-database");
    console.log(`   Status: ${instance.DBInstanceStatus}`);
    console.log(`   Endpoint: ${instance.Endpoint?.Address}:${instance.Endpoint?.Port}`);
    console.log(`   Publicly Accessible: ${instance.PubliclyAccessible ? "✅ Yes" : "❌ No"}`);
    
    if (!instance.PubliclyAccessible) {
      console.log("\n⚠️  PROBLEM: Your RDS instance is NOT publicly accessible!");
      console.log("   This means it can only be accessed from within your AWS VPC.");
      console.log("\n   To fix this:");
      console.log("   1. Go to AWS Console → RDS → Databases → smo-database");
      console.log("   2. Click 'Modify'");
      console.log("   3. Under 'Connectivity', set 'Public access' to 'Yes'");
      console.log("   4. Click 'Continue' and 'Apply immediately'\n");
    }
    
    // Check security groups
    const securityGroups = instance.VpcSecurityGroups || [];
    console.log(`\n🔒 Security Groups: ${securityGroups.length}`);
    
    if (securityGroups.length > 0) {
      const ec2Client = new EC2Client({ region });
      
      for (const sg of securityGroups) {
        console.log(`\n   Security Group: ${sg.VpcSecurityGroupId} (${sg.Status})`);
        
        try {
          const sgCommand = new DescribeSecurityGroupsCommand({
            GroupIds: [sg.VpcSecurityGroupId!]
          });
          const sgResponse = await ec2Client.send(sgCommand);
          const sgDetails = sgResponse.SecurityGroups?.[0];
          
          if (sgDetails) {
            console.log(`   Name: ${sgDetails.GroupName}`);
            console.log(`   Description: ${sgDetails.Description}`);
            
            const inboundRules = sgDetails.IpPermissions || [];
            console.log(`\n   📥 Inbound Rules:`);
            
            let hasPostgresRule = false;
            for (const rule of inboundRules) {
              const port = rule.FromPort === rule.ToPort 
                ? `${rule.FromPort}` 
                : `${rule.FromPort}-${rule.ToPort}`;
              
              const sources = [
                ...(rule.IpRanges?.map(r => r.CidrIp) || []),
                ...(rule.Ipv6Ranges?.map(r => r.CidrIpv6) || []),
                ...(rule.UserIdGroupPairs?.map(g => g.GroupId) || [])
              ];
              
              console.log(`      Port ${port} (${rule.IpProtocol}): ${sources.join(", ") || "none"}`);
              
              if (rule.FromPort === 5432 || (rule.FromPort! <= 5432 && rule.ToPort! >= 5432)) {
                hasPostgresRule = true;
                if (sources.includes("0.0.0.0/0") || sources.includes("::/0")) {
                  console.log(`      ✅ PostgreSQL port 5432 is open to the internet`);
                }
              }
            }
            
            if (!hasPostgresRule) {
              console.log(`\n   ⚠️  PROBLEM: No inbound rule for PostgreSQL port 5432!`);
            }
          }
        } catch (err) {
          console.log(`   Could not fetch security group details`);
        }
      }
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("\n📝 To allow connections from your computer:\n");
    console.log("   1. Go to AWS Console → EC2 → Security Groups");
    console.log("   2. Find the security group attached to your RDS instance");
    console.log("   3. Click 'Edit inbound rules'");
    console.log("   4. Add a rule:");
    console.log("      - Type: PostgreSQL");
    console.log("      - Port: 5432");
    console.log("      - Source: My IP (or 0.0.0.0/0 for anywhere)");
    console.log("   5. Save rules\n");
    
    console.log("   Also ensure 'Public access' is set to 'Yes' on your RDS instance.\n");
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

checkRdsAccess();

