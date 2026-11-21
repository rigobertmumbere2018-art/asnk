import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const archive = path.resolve("Kivu Scouts Hub.zip");
const assetsDestination = path.resolve("src", "assets");

if (!existsSync(archive)) {
  throw new Error(`Archive d'images introuvable : ${archive}. Placez "Kivu Scouts Hub.zip" à la racine du projet.`);
}

const temp = mkdtempSync(path.join(tmpdir(), "asnk-assets-"));

try {
  if (process.platform === "win32") {
    const quotePowerShell = (value) => value.replace(/'/g, "''");
    const command = `Expand-Archive -LiteralPath '${quotePowerShell(archive)}' -DestinationPath '${quotePowerShell(temp)}' -Force`;
    execFileSync("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", command], {
      stdio: "inherit",
    });
  } else {
    execFileSync("unzip", ["-q", archive, "-d", temp], { stdio: "inherit" });
  }

  const source = path.join(temp, "src", "assets");
  if (!existsSync(source)) {
    throw new Error('Aucun dossier "src/assets" trouvé dans l’archive Kivu Scouts Hub.zip.');
  }

  mkdirSync(assetsDestination, { recursive: true });
  cpSync(source, assetsDestination, { recursive: true, force: true });
  console.log("ASNK images and R2 asset descriptors restored.");
} catch (error) {
  if (process.platform === "win32" && error?.code === "ENOENT") {
    throw new Error("PowerShell est introuvable : impossible d'extraire l'archive sur Windows.", { cause: error });
  }
  throw error;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
