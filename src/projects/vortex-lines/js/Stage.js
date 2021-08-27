import * as THREE from "three";
import { BokehShader  } from "three/examples/jsm/shaders/BokehShader2" //"three/examples/jsm/shaders/BokehShader2.js'";
import { GUI } from 'dat.gui';

const COLORS = {
  background: '#000',
  floor: '#000'
}
class Stage {

  constructor(mount) {

    this.container = mount;

    this.postprocessing =  { };
    this.effectController = {}
    this.shaderSettings = {
      rings: 4,
      samples: 2
    };

    //need lines here so we can update materials in postprocessing
    this.lines = [];
      
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( COLORS.background );
    
    this.tickFunctions = [];

    this.size = {
      width: 1,
      height: 1
    }

    // this.setupLights();
    this.setupCamera();
    // this.setupFloor();
    // this.setupFog();
    this.setupRenderer();
    this.initPostprocessing();
    this.onResize();
    this.setupGUI();
    window.addEventListener('resize', () => this.onResize());
    
    this.tick();
  }

  
  setupGUI(){

    this.effectController = {

      enabled: false,
      jsDepthCalculation: true,
      shaderFocus: false,

      fstop: 350,
      maxblur: 3,

      showFocus: false,
      focalDepth: 0.13,
      manualdof: false,
      vignetting: false,
      depthblur: false,

      threshold: 0.5,
      gain: 2.0,
      bias: 0,
      fringe: 0,

      focalLength: 38,
      noise: true,
      pentagon: false,

      dithering: 0.0001

    };

    const matChanger = () => {

      for ( const e in this.effectController ) {

        if ( e in this.postprocessing.bokeh_uniforms ) {

          this.postprocessing.bokeh_uniforms[ e ].value = this.effectController[ e ];

        }

      }

      this.postprocessing.enabled = this.effectController.enabled;
      this.postprocessing.bokeh_uniforms[ 'znear' ].value = this.camera.near;
      this.postprocessing.bokeh_uniforms[ 'zfar' ].value = this.camera.far;
      this.camera.setFocalLength( this.effectController.focalLength );

    };

    const gui = new GUI();
    gui.close()

    gui.add( this.effectController, 'enabled' ).onChange( matChanger );
    gui.add( this.effectController, 'jsDepthCalculation' ).onChange( matChanger );
    gui.add( this.effectController, 'shaderFocus' ).onChange( matChanger );
    gui.add( this.effectController, 'focalDepth', 0.0, 100, 0.1 ).listen().onChange( matChanger );

    gui.add( this.effectController, 'fstop', 0.1, 600, 0.1 ).onChange( matChanger );
    gui.add( this.effectController, 'maxblur', 0.0, 5.0, 0.025 ).onChange( matChanger );

    gui.add( this.effectController, 'showFocus' ).onChange( matChanger );
    gui.add( this.effectController, 'manualdof' ).onChange( matChanger );
    gui.add( this.effectController, 'vignetting' ).onChange( matChanger );

    gui.add( this.effectController, 'depthblur' ).onChange( matChanger );

    gui.add( this.effectController, 'threshold', 0, 1, 0.001 ).onChange( matChanger );
    gui.add( this.effectController, 'gain', 0, 100, 0.001 ).onChange( matChanger );
    gui.add( this.effectController, 'bias', 0, 3, 0.001 ).onChange( matChanger );
    gui.add( this.effectController, 'fringe', 0, 5, 0.001 ).onChange( matChanger );

    gui.add( this.effectController, 'focalLength', 16, 80, 0.001 ).onChange( matChanger );

    gui.add( this.effectController, 'noise' ).onChange( matChanger );

    gui.add( this.effectController, 'dithering', 0, 0.001, 0.0001 ).onChange( matChanger );

    gui.add( this.effectController, 'pentagon' ).onChange( matChanger );

    gui.add( this.shaderSettings, 'rings', 1, 8 ).step( 1 ).onChange( () => this.shaderUpdate() );
    gui.add( this.shaderSettings, 'samples', 1, 13 ).step( 1 ).onChange( () => this.shaderUpdate() );

    matChanger()

  }

  setupLights() {

    this.directionalLight = new THREE.DirectionalLight('#ffffff', 2);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.far = 10;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.normalBias = 0.05;
    this.directionalLight.position.set(2, 4, 1);
    this.add(this.directionalLight);

    const hemisphereLight = new THREE.HemisphereLight( 0xffffff, COLORS.floor, 0.5 );
    this.add(hemisphereLight)
  }

  setupCamera() {

    this.lookAt = new THREE.Vector3(0, 0, 0);
    this.camera = new THREE.PerspectiveCamera(40, this.size.width / this.size.height, 0.1, 150);
    this.camera.position.set(0, 80, 100);
    this.camera.home = {
      position: { ...this.camera.position }
    }
    
    this.add(this.camera);
  }

  setupFloor() {
    const plane = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.floor })
    const floor = new THREE.Mesh(plane, floorMaterial);
    floor.receiveShadow = true;
    
    floor.rotateX(-Math.PI * 0.5)

    this.add(floor);
  }

  setupFog() {
    const fog = new THREE.Fog(COLORS.background, 0, 1)
    this.scene.fog = fog;
  }

  setupRenderer() {

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      
    })
    // this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    // this.renderer.toneMapping = THREE.ReinhardToneMapping;
    // this.renderer.toneMappingExposure = 3;
    // this.renderer.shadowMap.enabled = true;
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild( this.renderer.domElement );
  }

  onResize() {
  
    this.size.width = this.container.clientWidth;
    this.size.height = this.container.clientHeight;
    
    this.postprocessing.rtTextureDepth.setSize( this.size.width, this.size.height );
    this.postprocessing.rtTextureColor.setSize( this.size.width, this.size.height );

    this.postprocessing.bokeh_uniforms[ 'textureWidth' ].value = this.size.width;
    this.postprocessing.bokeh_uniforms[ 'textureHeight' ].value = this.size.height;

    this.camera.aspect = this.size.width / this.size.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.size.width, this.size.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  initPostprocessing() {

    this.postprocessing.scene = new THREE.Scene();

    this.postprocessing.camera = new THREE.OrthographicCamera( this.size.width / - 2, this.size.width / 2, this.size.height / 2, this.size.height / - 2, - 10000, 10000 );
    this.postprocessing.camera.position.z = 100;

    this.postprocessing.scene.add( this.postprocessing.camera );

    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
    this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( this.size.width, this.size.height, pars );
    this.postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( this.size.width, this.size.height, pars );

    const bokeh_shader = BokehShader;

    this.postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

    this.postprocessing.bokeh_uniforms[ 'tColor' ].value = this.postprocessing.rtTextureColor.texture;
    this.postprocessing.bokeh_uniforms[ 'tDepth' ].value = this.postprocessing.rtTextureDepth.texture;
    this.postprocessing.bokeh_uniforms[ 'textureWidth' ].value = this.size.width;
    this.postprocessing.bokeh_uniforms[ 'textureHeight' ].value = this.size.height;

    this.postprocessing.materialBokeh = new THREE.ShaderMaterial( {

      uniforms: this.postprocessing.bokeh_uniforms,
      vertexShader: bokeh_shader.vertexShader,
      fragmentShader: bokeh_shader.fragmentShader,
      defines: {
        RINGS: this.shaderSettings.rings,
        SAMPLES: this.shaderSettings.samples
      }

    } );

    this.postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( this.size.width, this.size.height ), this.postprocessing.materialBokeh );
    this.postprocessing.quad.position.z = - 500;
    this.postprocessing.scene.add( this.postprocessing.quad );

  }

  shaderUpdate() {

    this.postprocessing.materialBokeh.defines.RINGS = this.shaderSettings.rings;
    this.postprocessing.materialBokeh.defines.SAMPLES = this.shaderSettings.samples;
    this.postprocessing.materialBokeh.needsUpdate = true;

  }

  addTickFunction(tickFunction)
  {
    this.tickFunctions.push(tickFunction)
  }

  render() {
    if ( this.postprocessing.enabled ) {

      this.renderer.clear();

      // render scene into texture

      this.renderer.setRenderTarget( this.postprocessing.rtTextureColor );
      this.renderer.clear();
      this.renderer.render( this.scene, this.camera );
      // render depth into texture
         
      this.lines.forEach(line => line.obj.mesh.material.showDepth = true)
      this.renderer.setRenderTarget( this.postprocessing.rtTextureDepth );
      this.renderer.clear();
      this.renderer.render( this.scene, this.camera );
      this.lines.forEach(line => line.obj.mesh.material.showDepth = false)
      
      
      this.renderer.clear();
      this.renderer.setRenderTarget( null );
      this.renderer.render( this.postprocessing.scene, this.postprocessing.camera );


    } else {
      this.scene.overrideMaterial = null;
			this.renderer.setRenderTarget( null );
			this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }

  tick() {
    this.camera.lookAt(this.lookAt);
    this.tickFunctions.forEach(func => func())
    this.render();
    window.requestAnimationFrame(() => this.tick())
  }

  add(element) { this.scene.add(element);}

  set light(value) {
    this.directionalLight.intensity = value;
  }
  
  get light() {
    return this.directionalLight.intensity;
  }
  
  destroy() {

    this.container.removeChild( this.renderer.domElement);
    window.removeEventListener('resize', this.onResize);
  }
}

export { Stage }