import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const archive = path.resolve("Kivu Scouts Hub.zip");
if (!existsSync(archive)) throw new Error("Missing preserved image archive: Kivu Scouts Hub.zip");
const temp = mkdtempSync(path.join(tmpdir(), "asnk-assets-"));
try {
  execFileSync("unzip", ["-q", archive, "-d", temp], { stdio: "inherit" });
  const source = path.join(temp, "src", "assets");
  if (!existsSync(source)) throw new Error("No src/assets directory in archive");
  cpSync(source, path.resolve("src", "assets"), { recursive: true, force: true });
  console.log("ASNK images and R2 asset descriptors restored.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
