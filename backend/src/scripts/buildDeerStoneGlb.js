import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import obj2gltf from "obj2gltf";

const sourceDir = path.resolve(
  process.cwd(),
  "..",
  "model",
  "obj,png",
  "Deer stone 005, Jargalan - Mongolia (1)"
);
const outDir = path.resolve(process.cwd(), "..", "model", "with-textures");

const parts = [
  { obj: "model_0.obj", mtl: "model_0.mtl", texture: "Jarg_S_005.png", material: "Jarg_S_005" },
  { obj: "model_1.obj", mtl: "model_1.mtl", texture: "Jarg_S_0051.png", material: "Jarg_S_0051" }
];

function buildMtl(material, textureFileName) {
  return [
    `newmtl ${material}`,
    "Ka 1.000 1.000 1.000",
    "Kd 1.000 1.000 1.000",
    "Ks 0.000 0.000 0.000",
    "Ns 10.0",
    "d 1.0",
    "illum 1",
    `map_Kd ${textureFileName}`,
    ""
  ].join("\n");
}

function injectUseMtl(objContent, materialName) {
  const lines = objContent.split(/\r?\n/);
  const insertAfter = lines.findIndex((l) => l.startsWith("o "));
  if (insertAfter === -1) {
    return `usemtl ${materialName}\n${objContent}`;
  }
  lines.splice(insertAfter + 1, 0, `usemtl ${materialName}`);
  return lines.join("\n");
}

async function run() {
  await mkdir(outDir, { recursive: true });

  const generatedGlbs = [];

  for (const part of parts) {
    const sourceObj = path.join(sourceDir, part.obj);
    const sourceTexture = path.join(sourceDir, part.texture);
    const stagingDir = path.join(outDir, path.parse(part.obj).name);

    await mkdir(stagingDir, { recursive: true });

    const objContent = await readFile(sourceObj, "utf8");
    const patchedObj = injectUseMtl(objContent, part.material);

    await writeFile(path.join(stagingDir, part.obj), patchedObj, "utf8");
    await writeFile(
      path.join(stagingDir, part.mtl),
      buildMtl(part.material, part.texture),
      "utf8"
    );
    await copyFile(sourceTexture, path.join(stagingDir, part.texture));

    const glbPath = path.join(outDir, `${path.parse(part.obj).name}-textured.glb`);
    const glb = await obj2gltf(path.join(stagingDir, part.obj), {
      binary: true
    });

    await writeFile(glbPath, glb);
    generatedGlbs.push(glbPath);
    console.log(`Үүсгэсэн: ${glbPath}`);
  }

  console.log("\nTexture-той GLB файлууд бэлэн боллоо. Дараа нь нэгтгэх:");
  console.log(`  npx gltf-transform merge "${generatedGlbs[0]}" "${generatedGlbs[1]}" "${path.join(outDir, "deer-stone-jargalant.glb")}"`);
}

run().catch((error) => {
  console.error("Алдаа:", error);
  process.exitCode = 1;
});
