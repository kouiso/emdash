import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { transform } from "esbuild";

// Astro leaves server chunks unminified. Keep the module layout while reducing
// the Worker upload size; client assets are already minified by Astro.
async function minifyDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await minifyDirectory(path);
    else if (entry.name.endsWith(".mjs")) {
      const result = await transform(await readFile(path, "utf8"), {
        format: "esm", target: "es2022", minify: true, legalComments: "inline",
      });
      await writeFile(path, result.code);
    }
  }
}

await minifyDirectory(new URL("../dist/server/", import.meta.url).pathname);
