import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function inferModelFormat(modelUrl) {
  if (!modelUrl) {
    return null;
  }

  try {
    const parsed = new URL(modelUrl, window.location.origin);
    const pathname = parsed.pathname.toLowerCase();

    if (pathname.endsWith(".glb")) {
      return "glb";
    }

    if (pathname.endsWith(".gltf")) {
      return "gltf";
    }
  } catch {
    return null;
  }

  return null;
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  material?.dispose?.();
}

function buildFallbackArtifact(root) {
  const group = new Group();

  const body = new Mesh(
    new IcosahedronGeometry(0.85, 0),
    new MeshStandardMaterial({
      color: "#c9a46b",
      metalness: 0.35,
      roughness: 0.45,
      flatShading: true
    })
  );
  body.position.y = 0.9;

  const ornament = new Mesh(
    new TorusKnotGeometry(0.38, 0.11, 140, 20),
    new MeshStandardMaterial({
      color: "#73d7ff",
      metalness: 0.65,
      roughness: 0.25
    })
  );
  ornament.position.y = 0.9;

  group.add(body, ornament);
  root.add(group);

  return group;
}

export default function ModelViewer({ modelUrl, title }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return undefined;
    }

    const format = inferModelFormat(modelUrl);
    const usingFallback = !format;

    let animationFrameId = 0;
    let disposed = false;
    let resizeObserver = null;

    setStatus("loading");
    setMessage("3D моделио ачааллаж байна...");

    const scene = new Scene();
    scene.background = new Color("#0f141b");

    const camera = new PerspectiveCamera(45, 1, 0.01, 100);
    camera.position.set(2.6, 1.8, 3.2);

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambientLight = new AmbientLight("#ffffff", 2.4);
    const keyLight = new DirectionalLight("#ffffff", 2.6);
    const rimLight = new DirectionalLight("#73d7ff", 1.8);

    keyLight.position.set(4, 6, 5);
    rimLight.position.set(-5, 3, -4);

    scene.add(ambientLight, keyLight, rimLight);

    const root = new Group();
    scene.add(root);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.9;

    function resizeRenderer() {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resizeRenderer();

    if (usingFallback) {
      buildFallbackArtifact(root);
      const distance = 3.4;
      camera.position.set(distance * 0.82, distance * 0.55, distance);
      controls.target.set(0, 0.9, 0);
      controls.update();

      setStatus("ready");
      setMessage(
        `${title || "3D model"} — Three.js WebGL procedural жишиг загвараар харуулж байна.`
      );
    } else {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (disposed) {
            return;
          }

          root.add(gltf.scene);

          // Normalize: scale the model so its largest dimension fits a
          // fixed target size, then center the entire bbox at the origin.
          // The pedestal sits below; we don't try to land the model on it
          // because photogrammetry meshes often have thin tails that
          // confuse bounds.min.y and leave the visible body floating.
          const TARGET_SIZE = 2;

          const rawBounds = new Box3().setFromObject(gltf.scene);
          const rawSize = rawBounds.getSize(new Vector3());
          const maxAxis = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
          gltf.scene.scale.setScalar(TARGET_SIZE / maxAxis);

          const bounds = new Box3().setFromObject(gltf.scene);
          const center = bounds.getCenter(new Vector3());
          gltf.scene.position.x -= center.x;
          gltf.scene.position.y -= center.y;
          gltf.scene.position.z -= center.z;

          const distance = TARGET_SIZE * 1.9;
          camera.position.set(distance * 0.75, distance * 0.55, distance);
          controls.target.set(0, 0, 0);
          controls.update();

          setStatus("ready");
          setMessage(`${title || "3D model"} Three.js WebGL viewer дээр амжилттай ачааллаа.`);
        },
        undefined,
        (error) => {
          if (disposed) {
            return;
          }

          setStatus("error");
          setMessage(error.message || "3D model ачааллах үед алдаа гарлаа.");
        }
      );
    }

    function render() {
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(render);
    }

    render();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        resizeRenderer();
      });
      resizeObserver.observe(mount);
    } else {
      window.addEventListener("resize", resizeRenderer);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      if (!resizeObserver) {
        window.removeEventListener("resize", resizeRenderer);
      }

      controls.dispose();
      root.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry?.dispose?.();
          disposeMaterial(child.material);
        }
      });
      renderer.dispose();
      mount.innerHTML = "";
    };
  }, [modelUrl, title, retryToken]);

  return (
    <div className="model-viewer-shell">
      <div ref={mountRef} className="model-viewer-canvas" />
      {status === "error" && (
        <div className={`model-viewer-status model-viewer-status-${status}`}>
          <span>{message}</span>
          <button
            type="button"
            className="action-button compact"
            onClick={() => setRetryToken((value) => value + 1)}
          >
            Дахин ачааллах
          </button>
        </div>
      )}
    </div>
  );
}
