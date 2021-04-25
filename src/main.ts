import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Program
{
    static scene: THREE.Scene;
    static camera: THREE.PerspectiveCamera;
    static renderer: THREE.WebGLRenderer;


    public static init(): void {
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    public static Main(): void
    {
        let that = this;

        this.init();

        let cube = this.makeCube();
        this.scene.add(cube);

        let line = this.makeLine();
        this.scene.add(line);

        let light = this.makeLight();
        this.scene.add(light);

        this.camera.position.z = 5;

        const animate = function(time: number) {
            time *= 0.001;  // convert time to seconds

            that.renderer.render(that.scene, that.camera);

            cube.rotation.x = time;
            cube.rotation.y = time;

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }


    private static makeCube(): THREE.Mesh {
        const boxWidth = 1;
        const boxHeight = 2;
        const boxDepth = 1;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
        const cube = new THREE.Mesh(geometry, material);

        return cube;
    }

    private static makeLine(): THREE.Line {
        //create a blue LineBasicMaterial
        const points = [];
        points.push(new THREE.Vector3( - 10, 0, 0 ));
        points.push(new THREE.Vector3( 0, 10, 0 ));
        points.push(new THREE.Vector3( 10, 0, 0 ));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

        const line = new THREE.Line( geometry, material );

        return line;
    }

    private static makeLight(): THREE.Light {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);

        return light
    }
}

// Debug Version
Program.Main();
