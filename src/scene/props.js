import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/* Arena scenery from NVIDIA SimReady assets (CC BY 4.0), via the codepawl/simready-glb "mobile" set: a quarter of the
   triangles and 512 px KTX2 textures, about 1.9 MB for all seven. Files live in public/models/simready.
   `len` scales by the longest horizontal side (barriers, fences); `h` scales by height (everything else). */
const BASE = import.meta.env.BASE_URL;
const PROPS = {
  drumSteel:   { file: 'drum_steel_a01', h: 1.5 },
  drumBlue:    { file: 'drum_plastic_blue_a02', h: 1.5 },
  crateOrange: { file: 'crate_orange_a20', h: 1.1 },
  crateGray:   { file: 'crate_gray_a14', h: 1.1 },
  barrier:     { file: 'barrier_wall_plastic_orange_a03', len: 4.2 },
  fence:       { file: 'barrier_fence_metal_a02', len: 4.6 },
  tireRack:    { file: 'storage_tire_rack_b01', h: 3.2 }
};

// Scale to the target size, stand it on the floor, and centre it on its own origin.
function normalise(root, { h, len }) {
  let box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
  if (len && size.z > size.x) { root.rotation.y = Math.PI / 2; box = new THREE.Box3().setFromObject(root); size = box.getSize(new THREE.Vector3()); } // long side along x
  root.scale.setScalar(len ? len / Math.max(size.x, size.z) : h / size.y);
  const b = new THREE.Box3().setFromObject(root), c = b.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -b.min.y, -c.z);
  const g = new THREE.Group(); g.add(root);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export async function loadProps(renderer) {
  const ktx2 = new KTX2Loader().setTranscoderPath(BASE + 'basis/').detectSupport(renderer);
  const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  const out = {};
  await Promise.all(Object.entries(PROPS).map(async ([k, p]) => {
    const gltf = await loader.loadAsync(`${BASE}models/simready/${p.file}.glb`);
    out[k] = normalise(gltf.scene, p);
  }));
  ktx2.dispose();
  return out;
}

const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// Barrier walls ring the floor, with drum clusters, crate stacks, fences and tire racks around the edge.
// Radii stay outside the truck ring (20), and a private seed keeps the main scene's random sequence untouched.
export function placeProps(M) {
  const root = new THREE.Group(), r = seeded(5), TAU = Math.PI * 2;
  const put = (m, a, rad, spin, y = 0) => { const o = m.clone(true); o.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); o.rotation.y = spin; root.add(o); return o; };
  const tangent = a => -a - Math.PI / 2;

  for (let i = 0; i < 14; i++) { const a = (i + .5) / 14 * TAU; put(M.barrier, a, 31.9, tangent(a)); }
  [.12, .47, .83].forEach(f => put(M.tireRack, f * TAU, 28.8, tangent(f * TAU) + Math.PI / 2));
  [.30, .66].forEach(f => { const a = f * TAU; put(M.fence, a - .05, 29.6, tangent(a - .05)); put(M.fence, a + .05, 29.6, tangent(a + .05)); });
  for (let k = 0; k < 6; k++) {
    const a = (k + .22 + r() * .12) / 6 * TAU;
    for (let n = 0; n < 4; n++) put(r() < .5 ? M.drumSteel : M.drumBlue, a + (r() - .5) * .08, 29 + r() * 1.4, r() * TAU);
  }
  for (let k = 0; k < 4; k++) {
    const a = (k + .62) / 4 * TAU, A = r() < .5 ? M.crateOrange : M.crateGray, B = A === M.crateOrange ? M.crateGray : M.crateOrange;
    put(A, a, 29, r() * .6); put(B, a + .05, 29.2, r() * .6); put(A, a + .02, 29.1, r() * .6, 1.1);
  }
  return root;
}
