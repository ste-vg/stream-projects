import { Stage } from "./js/Stage";
import { Line } from "./js/Line";
import * as THREE from 'three';

const colors = ["#f94144","#f3722c","#f8961e","#f9844a","#f9c74f","#90be6d","#43aa8b","#4d908e","#577590","#277da1"]


const canvas = document.getElementById('webgl');
const stage = new Stage(canvas);

const lineGroup = new THREE.Group();
lineGroup.rotation.y = Math.PI
stage.add(lineGroup);
// const lines = [];

for (let i = 0; i < 200; i++) {
  
  const line = new Line(
    0.005 + Math.random() * 0.02 , 
    colors[Math.floor(Math.random() * colors.length)],
    0.4 + Math.random() * 0.1,
    stage.camera.near,
    stage.camera.far
  )
  lineGroup.add(line.mesh);
  stage.lines.push({
    obj: line,
    speed: 0.002 + Math.random() * 0.009
  });
}

const tick = () => {
  lineGroup.rotation.y += 0.01;
  lineGroup.rotation.x = Math.cos(lineGroup.rotation.y * 1.2) * 0.3;
  lineGroup.rotation.z = Math.sin(lineGroup.rotation.y) * 0.01;

  // lines.forEach(line => {
  //   // if(line.obj.mesh.material.uniforms.dashOffset.value < -line.obj.dashLength) return;
  //   line.obj.mesh.material.uniforms.dashOffset.value -= line.speed;
  // })
}

stage.addTickFunction(tick)