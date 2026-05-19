// Convert a Sketchfab-style ZIP (containing .obj + .mtl + .png) into a single
// upload-ready GLB with textures and correct positions.
//
// Usage:
//   node scripts/zip-to-glb.mjs <input.zip-or-folder> <output.glb>
//
// Behavior:
//   1. If input is .zip, extract to a temp folder.
//   2. Find every .obj in the folder (recursively).
//   3. For each .obj, run obj2gltf with its sibling .mtl/.png to get a
//      textured intermediate GLB.
//   4. If multiple intermediate GLBs, merge them into one scene (preserving
//      each chunk's world-space transform).
//   5. Write the final GLB to <output.glb>.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

import obj2gltf from 'obj2gltf';
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, mergeDocuments } from '@gltf-transform/functions';
import unzipper from 'unzipper';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/zip-to-glb.mjs <input.zip-or-folder> <output.glb>');
  process.exit(1);
}

const input = path.resolve(inputArg);
const output = path.resolve(outputArg);

async function exists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function extractZip(zipPath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip2glb-'));
  await new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .on('close', resolve)
      .on('error', reject);
  });
  return tempDir;
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg']);

async function ensureMtl(objPath, allFiles) {
  const dir = path.dirname(objPath);
  const objText = await fs.readFile(objPath, 'utf8');
  const mtllibMatch = objText.match(/^mtllib\s+(.+)$/m);
  if (!mtllibMatch) return; // OBJ doesn't reference an MTL — leave as-is.
  const mtlName = mtllibMatch[1].trim();
  const mtlPath = path.join(dir, mtlName);
  if (await exists(mtlPath)) return; // MTL already there.

  // No MTL on disk — synthesize one. Sketchfab OBJ exports omit MTL but
  // ship the textures alongside; pair OBJ to PNG by alphabetical order.
  const images = allFiles
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();
  const objs = allFiles
    .filter((f) => f.toLowerCase().endsWith('.obj'))
    .sort();

  let chosenImage;
  if (images.length === 0) return; // nothing to bind.
  if (images.length === 1) {
    chosenImage = images[0];
  } else if (images.length === objs.length) {
    chosenImage = images[objs.indexOf(objPath)];
  } else {
    chosenImage = images[0];
  }

  const matName = path.basename(chosenImage, path.extname(chosenImage));
  const mtlContent = [
    `newmtl ${matName}`,
    'Ka 1.000 1.000 1.000',
    'Kd 1.000 1.000 1.000',
    'Ks 0.000 0.000 0.000',
    'Ns 10.0',
    'd 1.0',
    'illum 1',
    `map_Kd ${path.basename(chosenImage)}`,
    '',
  ].join('\n');
  await fs.writeFile(mtlPath, mtlContent);

  // Ensure the OBJ binds the material so obj2gltf applies it to all faces.
  if (!/^usemtl\s/m.test(objText)) {
    const patched = objText.replace(
      /^(mtllib[^\n]*\n(?:o [^\n]*\n)?)/m,
      `$1usemtl ${matName}\n`,
    );
    await fs.writeFile(objPath, patched);
  }
  console.log(`  ↳ synthesized ${path.basename(mtlPath)} → ${path.basename(chosenImage)}`);
}

async function convertObjToGlb(objPath, outPath, allFiles) {
  await ensureMtl(objPath, allFiles);
  const glb = await obj2gltf(objPath, { binary: true });
  await fs.writeFile(outPath, glb);
}

function computeSceneAabb(doc) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const pMin = pos.getMin([]);
      const pMax = pos.getMax([]);
      for (let i = 0; i < 3; i++) {
        if (pMin[i] < min[i]) min[i] = pMin[i];
        if (pMax[i] > max[i]) max[i] = pMax[i];
      }
    }
  }
  return { min, max };
}

// Quaternion (x,y,z,w) that rotates `axis` onto +Y.
function axisToYRotation(axis) {
  // +90° around Z: +X → +Y
  if (axis === 'x') return [0, 0, Math.SQRT1_2, Math.SQRT1_2];
  // -90° around X: +Z → +Y
  if (axis === 'z') return [-Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  return [0, 0, 0, 1];
}

async function mergeGlbs(inputs, out) {
  const io = new NodeIO();
  const baseDoc = await io.read(inputs[0]);
  const baseScene = baseDoc.getRoot().getDefaultScene()
    ?? baseDoc.getRoot().listScenes()[0];
  baseScene.setName('merged');

  for (let i = 1; i < inputs.length; i++) {
    const doc = await io.read(inputs[i]);
    mergeDocuments(baseDoc, doc);
    const scenes = baseDoc.getRoot().listScenes();
    for (let s = scenes.length - 1; s >= 1; s--) {
      const scn = scenes[s];
      for (const node of scn.listChildren()) {
        scn.removeChild(node);
        baseScene.addChild(node);
      }
      scn.dispose();
    }
  }

  baseDoc.getRoot().setDefaultScene(baseScene);

  // Auto-orient: photogrammetry OBJ exports often store the longest axis
  // along X or Z rather than Y. Heuristic: the longest axis of the combined
  // model should be Y (vertical), the shortest should be Z (depth).
  const aabb = computeSceneAabb(baseDoc, baseScene);
  const ranges = {
    x: aabb.max[0] - aabb.min[0],
    y: aabb.max[1] - aabb.min[1],
    z: aabb.max[2] - aabb.min[2],
  };
  const longestAxis = Object.entries(ranges)
    .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  if (longestAxis !== 'y') {
    const rotation = axisToYRotation(longestAxis);
    const wrapper = baseDoc.createNode('orient-root').setRotation(rotation);
    for (const child of baseScene.listChildren()) {
      baseScene.removeChild(child);
      wrapper.addChild(child);
    }
    baseScene.addChild(wrapper);
    console.log(`  ↻ rotated so longest axis (${longestAxis}) → Y (up)`);
  }

  // GLB requires a single buffer.
  const buffers = baseDoc.getRoot().listBuffers();
  for (const acc of baseDoc.getRoot().listAccessors()) {
    acc.setBuffer(buffers[0]);
  }
  for (let i = buffers.length - 1; i >= 1; i--) buffers[i].dispose();

  await baseDoc.transform(dedup(), prune());
  await io.write(out, baseDoc);
}

async function main() {
  if (!(await exists(input))) {
    console.error(`input not found: ${input}`);
    process.exit(1);
  }

  let workDir;
  let cleanup = null;
  const stat = await fs.stat(input);
  if (stat.isDirectory()) {
    workDir = input;
  } else if (input.toLowerCase().endsWith('.zip')) {
    console.log(`extracting ${path.basename(input)}…`);
    workDir = await extractZip(input);
    cleanup = workDir;
  } else {
    console.error('input must be a .zip file or a folder');
    process.exit(1);
  }

  const allFiles = await walk(workDir);
  const objs = allFiles.filter((f) => f.toLowerCase().endsWith('.obj'));
  if (objs.length === 0) {
    console.error(`no .obj files found in ${workDir}`);
    process.exit(1);
  }
  console.log(`found ${objs.length} .obj file(s)`);

  const tempGlbs = [];
  for (const obj of objs) {
    const glbPath = obj.replace(/\.obj$/i, '.tmp.glb');
    console.log(`converting ${path.basename(obj)}…`);
    await convertObjToGlb(obj, glbPath, allFiles);
    tempGlbs.push(glbPath);
  }

  await fs.mkdir(path.dirname(output), { recursive: true });

  console.log(`processing ${tempGlbs.length} chunk(s)…`);
  await mergeGlbs(tempGlbs, output);

  for (const g of tempGlbs) await fs.unlink(g).catch(() => {});
  if (cleanup) await fs.rm(cleanup, { recursive: true, force: true });

  const finalStat = await fs.stat(output);
  console.log(`\nwrote ${output}`);
  console.log(`size: ${(finalStat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
