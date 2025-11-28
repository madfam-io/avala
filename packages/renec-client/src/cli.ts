#!/usr/bin/env node
/**
 * RENEC Harvester CLI (Updated Nov 2025 for new Angular SPA)
 *
 * Usage:
 *   pnpm harvest:renec              # Harvest all data
 *   pnpm harvest:renec --type ec    # Harvest only EC standards
 *   pnpm harvest:renec --output ./data  # Save to specific directory
 *   pnpm harvest:renec --headless false # Run with browser visible (debugging)
 *   pnpm harvest:renec --detailed      # Harvest with full EC details including certifiers
 *   pnpm harvest:renec --max 10        # Limit to first N items (for testing)
 */

import { harvestAll, createDriver, type DriverType } from "./index";
import { ECDriver } from "./drivers/ec.driver";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface CLIArgs {
  type?: DriverType | "all";
  output: string;
  headless: boolean;
  verbose: boolean;
  detailed: boolean;
  max?: number;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    type: "all",
    output: "./data/renec",
    headless: true,
    verbose: false,
    detailed: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--type":
      case "-t":
        result.type = next as DriverType | "all";
        i++;
        break;
      case "--output":
      case "-o":
        result.output = next;
        i++;
        break;
      case "--headless":
        result.headless = next !== "false";
        i++;
        break;
      case "--verbose":
      case "-v":
        result.verbose = true;
        break;
      case "--detailed":
      case "-d":
        result.detailed = true;
        break;
      case "--max":
      case "-m":
        result.max = parseInt(next, 10);
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return result;
}

function printHelp() {
  console.log(`
RENEC Harvester CLI - Harvest CONOCER competency data (Nov 2025)

Usage:
  npx ts-node src/cli.ts [options]

Options:
  -t, --type <type>     Data type to harvest: ec, certifier, center, sector, all (default: all)
  -o, --output <dir>    Output directory for JSON files (default: ./data/renec)
  --headless <bool>     Run browser in headless mode (default: true)
  -v, --verbose         Enable verbose logging
  -d, --detailed        Harvest with full EC details including certifiers (slower)
  -m, --max <num>       Limit to first N items (useful for testing)
  -h, --help            Show this help message

Examples:
  # Harvest all data
  npx ts-node src/cli.ts

  # Harvest only EC standards
  npx ts-node src/cli.ts --type ec

  # Harvest EC standards with full details (certifiers, training centers)
  npx ts-node src/cli.ts --type ec --detailed

  # Test with 5 EC standards and visible browser
  npx ts-node src/cli.ts --type ec --detailed --max 5 --headless false --verbose

  # Debug mode with visible browser
  npx ts-node src/cli.ts --type ec --headless false --verbose
`);
}

function log(message: string, verbose: boolean) {
  if (verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

async function main() {
  const args = parseArgs();
  const startTime = Date.now();

  console.log("🌾 RENEC Harvester Starting...");
  console.log(`   Type: ${args.type}`);
  console.log(`   Output: ${args.output}`);
  console.log(`   Headless: ${args.headless}`);
  console.log(`   Detailed: ${args.detailed}`);
  if (args.max) console.log(`   Max items: ${args.max}`);
  console.log("");

  // Ensure output directory exists
  if (!existsSync(args.output)) {
    mkdirSync(args.output, { recursive: true });
  }

  const config = {
    headless: args.headless,
    politeDelayMs: [800, 1500] as [number, number], // Be nice to the server
  };

  try {
    if (args.type === "all") {
      // Harvest everything
      log("Starting full harvest...", args.verbose);
      const data = await harvestAll(config);

      // Save each data type
      const files = [
        { name: "ec-standards.json", data: data.ecStandards },
        { name: "certifiers.json", data: data.certifiers },
        { name: "centers.json", data: data.centers },
        { name: "sectors.json", data: data.sectors },
        { name: "comites.json", data: data.comites },
        { name: "ec-sector-relations.json", data: data.ecSectorRelations },
        { name: "harvest-stats.json", data: data.stats },
      ];

      for (const file of files) {
        const path = join(args.output, file.name);
        writeFileSync(path, JSON.stringify(file.data, null, 2));
        console.log(
          `✅ Saved ${file.name} (${Array.isArray(file.data) ? file.data.length : "N/A"} records)`,
        );
      }

      // Summary
      console.log("\n📊 Harvest Summary:");
      console.log(`   EC Standards: ${data.ecStandards.length}`);
      console.log(`   Certifiers: ${data.certifiers.length}`);
      console.log(`   Centers: ${data.centers.length}`);
      console.log(`   Sectors: ${data.sectors.length}`);
      console.log(`   Comités: ${data.comites.length}`);
    } else if (args.type === "ec" && args.detailed) {
      // Detailed EC harvest with certifiers
      log(
        "Starting detailed EC harvest (includes certifiers)...",
        args.verbose,
      );
      const driver = new ECDriver(config);

      const data = await driver.harvestWithDetails({ maxItems: args.max });

      // Separate different item types
      const ecStandards = data.filter((i) => i.type === "ec_standard");
      const ecDetails = data.filter((i) => i.type === "ec_detail");
      const certifierRelations = data.filter(
        (i) => i.type === "ec_certifier_relation",
      );

      // Save files
      writeFileSync(
        join(args.output, "ec-standards.json"),
        JSON.stringify(ecStandards, null, 2),
      );
      console.log(`✅ Saved ec-standards.json (${ecStandards.length} records)`);

      writeFileSync(
        join(args.output, "ec-details.json"),
        JSON.stringify(ecDetails, null, 2),
      );
      console.log(`✅ Saved ec-details.json (${ecDetails.length} records)`);

      writeFileSync(
        join(args.output, "ec-certifier-relations.json"),
        JSON.stringify(certifierRelations, null, 2),
      );
      console.log(
        `✅ Saved ec-certifier-relations.json (${certifierRelations.length} records)`,
      );

      // Stats
      const statsPath = join(args.output, "ec-detailed-stats.json");
      writeFileSync(statsPath, JSON.stringify(driver.getStats(), null, 2));

      // Summary
      console.log("\n📊 Detailed EC Harvest Summary:");
      console.log(`   EC Standards: ${ecStandards.length}`);
      console.log(`   EC Details (with certifiers): ${ecDetails.length}`);
      console.log(`   Certifier Relations: ${certifierRelations.length}`);
    } else if (args.type) {
      // Harvest specific type (args.type is guaranteed to be DriverType here since "all" handled above)
      const driverType = args.type as DriverType;
      log(`Starting ${driverType} harvest...`, args.verbose);
      const driver = createDriver(driverType, config);
      const data = await driver.harvest();

      const filename = `${args.type}s.json`;
      const path = join(args.output, filename);
      writeFileSync(path, JSON.stringify(data, null, 2));
      console.log(`✅ Saved ${filename} (${data.length} records)`);

      // Stats
      const statsPath = join(args.output, `${args.type}-stats.json`);
      writeFileSync(statsPath, JSON.stringify(driver.getStats(), null, 2));
    }

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log(`\n🎉 Harvest completed in ${duration} minutes`);

    // Save metadata
    const metadataPath = join(args.output, "harvest-metadata.json");
    writeFileSync(
      metadataPath,
      JSON.stringify(
        {
          harvestedAt: new Date().toISOString(),
          type: args.type,
          detailed: args.detailed,
          maxItems: args.max,
          durationMinutes: parseFloat(duration),
          source: "https://conocer.gob.mx/conocer/#/renec",
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error("❌ Harvest failed:", error);
    process.exit(1);
  }
}

main();
