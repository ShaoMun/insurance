"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import Link from 'next/link';

const Page = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    const container = mountRef.current;
    if (!container) return;

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(3, 1, 100, 16);
    const material = new THREE.MeshNormalMaterial();
    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    camera.position.z = 10;

    const animate = () => {
      requestAnimationFrame(animate);
      torusKnot.rotation.x += 0.01;
      torusKnot.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div>
      <div className="landingContainer">
        <div className="landingLeft">
          <div className="landingLeftTop">
            <h1>Revolutionizing Insurance with Blockchain</h1>
            <p>
              Our platform leverages blockchain technology to provide secure, transparent, and efficient insurance solutions. 
              Simplify your insurance journey with decentralized access to policy management, claims processing, and real-time data tracking.
            </p>
          </div>
          <div className="landingLeftBottom">
            <Link href="/buy-insurance">
              <button className="landingLeftBottomButton1">Buy Insurance</button>
            </Link>
            <Link href="/claim-insurance">
              <button className="landingLeftBottomButton2">Claim Insurance</button>
            </Link>
          </div>
        </div>
        <div ref={mountRef} className="landingRight"></div>
      </div>
    </div>
  );
};

export default Page;
