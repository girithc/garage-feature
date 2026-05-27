import { resetDemoStore } from "@/server/demo/demoStore";
import { getPrismaClient } from "@/server/db/prisma";

async function main() {
  await resetDemoStore();
  await getPrismaClient()?.$disconnect();
  console.log("Demo store reset.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
