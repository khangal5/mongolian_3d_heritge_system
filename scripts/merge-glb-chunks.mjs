// Merge multiple GLB chunks into a single GLB with one scene containing
// all root nodes. Useful for Sketchfab-style chunked downloads where the
// large model has been split into <65k-vertex pieces.
//
// Usage:
//   node scripts/merge-glb-chunks.mjs <out.glb> <in1.glb> <in2.glb> ...

import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, mergeDocuments } from '@gltf-transform/functions';
import path from 'node:path';

const [, , outPath, ...inputs] = process.argv;

if (!outPath || inputs.length === 0) {
  console.error('Usage: node merge-glb-chunks.mjs <out.glb> <in1.glb> [in2.glb...]');
  process.exit(1);
}

const io = new NodeIO();

const baseDoc = await io.read(inputs[0]);
const baseScene = baseDoc.getRoot().getDefaultScene() ?? baseDoc.getRoot().listScenes()[0];
baseScene.setName('merged');

for (let i = 1; i < inputs.length; i++) {
  const doc = await io.read(inputs[i]);
  mergeDocuments(baseDoc, doc);

  // After merge, `doc`'s scenes are now in baseDoc. Reparent their root nodes
  // into baseScene, then drop the now-empty scenes.
  const root = baseDoc.getRoot();
  const scenes = root.listScenes();
  // Everything past index 0 is an imported scene we want to fold in.
  for (let s = scenes.length - 1; s >= 1; s--) {
    const scn = scenes[s];
    for (const node of scn.listChildren()) {
      scn.removeChild(node);
      baseScene.addChild(node);
    }
    scn.dispose();
  }
  console.log(`merged ${path.basename(inputs[i])}`);
}

baseDoc.getRoot().setDefaultScene(baseScene);

// GLB requires a single buffer — consolidate all accessors onto buffer 0
// and drop the rest.
const buffers = baseDoc.getRoot().listBuffers();
const mainBuffer = buffers[0];
for (const accessor of baseDoc.getRoot().listAccessors()) {
  accessor.setBuffer(mainBuffer);
}
for (let i = buffers.length - 1; i >= 1; i--) {
  buffers[i].dispose();
}

await baseDoc.transform(dedup(), prune());

await io.write(outPath, baseDoc);
console.log(`\nwrote ${outPath}`);
console.log(`scene children: ${baseScene.listChildren().length}`);
