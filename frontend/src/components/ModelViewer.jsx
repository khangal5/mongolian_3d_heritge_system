import { useEffect, useRef, useState } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
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

export default function ModelViewer({ modelUrl, title }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const mount = mountRef.current;
    const format = inferModelFormat(modelUrl);

    if (!mount) {
      return undefined;
    }

    if (!modelUrl) {
      setStatus("empty");
      setMessage("3D model URL оруулаагүй байна.");
      return undefined;
    }

    if (!format) {
      setStatus("unsupported");
      setMessage("Зөвхөн .glb эсвэл .gltf файл Three.js viewer дээр ажиллана.");
      return undefined;
    }

    let animationFrameId = 0;
    let disposed = false;
    let resizeObserver = null;

    setStatus("loading");
    setMessage("3D моделио ачааллаж байна...");

    const scene = new Scene();
    scene.background = new Color("#0f141b");

    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
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

    const pedestal = new Mesh(
      new CylinderGeometry(1.2, 1.35, 0.16, 48),
      new MeshStandardMaterial({ color: "#10151d" })
    );
    pedestal.position.set(0, -1.08, 0);
    scene.add(pedestal);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.8;
    controls.maxDistance = 12;
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

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) {
          return;
        }

        root.add(gltf.scene);

        const bounds = new Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new Vector3());
        const center = bounds.getCenter(new Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;

        gltf.scene.position.sub(center);
        gltf.scene.position.y -= bounds.min.y;
        gltf.scene.position.y -= size.y * 0.5;

        const distance = Math.max(maxAxis * 2.1, 2.6);
        camera.position.set(distance * 0.82, distance * 0.55, distance);
        controls.target.set(0, Math.max(size.y * 0.12, 0), 0);
        controls.update();

        const scale = 1 / Math.max(maxAxis / 1.8, 1);
        const clampedScale = MathUtils.clamp(scale, 0.6, 2.2);
        gltf.scene.scale.setScalar(clampedScale);

        setStatus("ready");
        setMessage(`${title || "3D model"} WebGL viewer дээр амжилттай ачааллаа.`);
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
      pedestal.geometry.dispose();
      disposeMaterial(pedestal.material);
      root.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry?.dispose?.();
          disposeMaterial(child.material);
        }
      });
      renderer.dispose();
      mount.innerHTML = "";
    };
  }, [modelUrl, title]);

  return (
    <div className="model-viewer-shell">
      <div ref={mountRef} className="model-viewer-canvas" />
      <div className={`model-viewer-status model-viewer-status-${status}`}>
        <strong>Three.js WebGL Viewer</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
