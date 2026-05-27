import { resetDemoStore } from "@/server/demo/demoStore";

async function main() {
  await resetDemoStore();
  console.log("Demo store reset.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
