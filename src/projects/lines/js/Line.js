import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from "./MeshLine"
import { gsap } from "gsap";

const TAU = Math.PI * 2;

class Line 
{
  constructor(width, color, radius, near, far) {
    this.color = color;
    this.width = width;
    this.radius = radius;
    this.near = near;
    this.far = far;
    this.dashLength = 5 ;
    this.mesh = null;
    this.createLine()
  }

  createLine()
  {
    const points = [];
    var angle = Math.random() * TAU
    this.radius += Math.random() * 0.1

    let pos = {
      x: Math.cos(angle) * this.radius, 
      y: (-1 + Math.random() * 2) * 0.1,
      z: Math.sin(angle) * this.radius
    }

    let direction = angle + 1 + (Math.random() * 0.1);
    let y = 0;

     for (let j = 0; j < 50; j ++) {
   
      direction += (0.02 * ((50 - j) * 0.1)) + (-0.4 + Math.random() * 0.8 ) * (j * 0.04);
      y += (-1 + Math.random() * 2) * 0.05;

      pos.x += Math.cos(direction) * 0.1 
      pos.y += Math.sin(y) * 0.05 
      pos.z += Math.sin(direction) * 0.1

      // velocities.x += (-.1 + Math.random() * 0.2)
      points.push(pos.x, pos.y, pos.z);
    }

    const line = new MeshLine();
    line.setPoints(points,  p => this.width * Math.pow(1 - p, 0.7)  );


    const material = new MeshLineMaterial({
      color: new THREE.Color(this.color),
      transparent: true,
      depthTest: false,
      dashArray: this.dashLength,
           
      dashOffset: 0,    // start the dash at zero
      dashRatio: 0.92,  
      showDepth: false
    });

    material.uniforms[ 'mNear' ].value = this.near;
    material.uniforms[ 'mFar' ].value = this.far;


    this.mesh = new THREE.Mesh(line, material);

    setTimeout(() => {
      const delayedStart = Math.random() > 0.8;
      if(delayedStart) setTimeout(() => this.animate(), 100 + Math.random() * 2000)
      else this.animate(false)
    }, 1000)
  }

  animate(slow = true) 
  {
    // line.obj.mesh.material.uniforms.dashOffset.value -= line.speed;

    const duration = (slow ? 3 : 2) + Math.random() * 1;
    const ease = 'power4.in';

    gsap.fromTo(this.mesh.material.uniforms.dashOffset, 
      { value: 0 },
      {
        value: -this.dashLength * 0.3, 
        duration, 
        ease,
        onComplete: () => setTimeout(() => this.animate(), Math.random() * 1000)
      })
    let brightness = slow ? '+=.4' : '+=.8';
    gsap.from(this.mesh.material.uniforms.color.value, {r: brightness, g: brightness, b: brightness, duration: duration * 0.75, ease})
  }
}

export { Line }