import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from "./MeshLine"
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

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
    this.travelDistance = 1;
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
      y: 0,
      z: Math.sin(angle) * this.radius
    }

    let direction = angle + 1 + (Math.random() * 0.1);
    let y = 0;

    const steps = 75;

     for (let j = 0; j < steps; j ++) {
   
      direction += (0.012 * ((steps - j) * 0.1)) + (-0.4 + Math.random() * 0.8 ) * (j * (Math.random() * 0.02));
      y += (-1 + Math.random() * 2)  * (j * 0.001);

      pos.x += Math.cos(direction) * this.travelDistance 
      pos.y += Math.sin(y) * this.travelDistance
      pos.z += Math.sin(direction) * this.travelDistance

      // velocities.x += (-.1 + Math.random() * 0.2)
      points.push(pos.x, pos.y, pos.z);
    }

    const line = new MeshLine();
    line.setPoints(points,  p => this.width * Math.pow(1 - Math.cos(TAU * p), 0.3)  );


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
      const delayedStart = Math.random() > 0.3;
      if(delayedStart) setTimeout(() => this.animate(), 100 + Math.random() * 4000)
      else this.animate(false)
    }, 1000)
  }

  animate(slow = true) 
  {
    // line.obj.mesh.material.uniforms.dashOffset.value -= line.speed;

    const duration = (slow ? 4 : 3) + Math.random() * 1;
    const ease = 'power4.inOut';
    const brightness = slow ? .8 : 1;

    gsap.fromTo(this.mesh.material.uniforms.dashOffset, 
      { value: 0 },
      {
        value: -this.dashLength * 0.3, 
        duration, 
        ease,
        onComplete: () => setTimeout(() => this.animate(), Math.random() * 4000)
      })
    const color = this.mesh.material.uniforms.color.value;
    gsap.fromTo(color, { r: 0, g: 0, b: 0, }, {
      motionPath: [
        {
          r: color.r + brightness, 
          g: color.g + brightness, 
          b: color.b + brightness, 
        },
        {
          r: color.r, 
          g: color.g, 
          b: color.b, 
        }
      ],
      duration: duration * 0.4, 
      ease: 'power2.in'
    })
  }
}

export { Line }