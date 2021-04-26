import * as THREE from 'three';
import { Camera, TetrahedronBufferGeometry } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const goldenAngle = 180 * (3 - Math.sqrt(5));

const spaceWidth = 200;
const spaceHeight = 200;
const spaceDepth = 200;

class Program
{
    static scene: THREE.Scene;
    static camera: THREE.PerspectiveCamera;
    static renderer: THREE.WebGLRenderer;
    static controls: OrbitControls;

    public static init(): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x999999);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    public static Main(): void
    {
        let that = this;

        this.init();

        let space = this.makeSpace();
        this.scene.add(space);

        let light = this.makeLight();
        this.scene.add(light);

        this.camera.position.x = spaceWidth/2;
        this.camera.position.y = spaceHeight/2;
        this.camera.position.z = spaceDepth + 100;

        let objects: Object[] = [];
        let obj: Object;
        let position: Vector;
        let color: string;
        let radio: number;

        for (let i=0; i<300; i++) {
            position = {
                x: Math.floor(Math.random() * spaceWidth),
                y: Math.floor(Math.random() * spaceHeight),
                z: Math.floor(Math.random() * spaceDepth)
            };
            color = `hsl(${i * goldenAngle + 50}, 100%, 75%)`;

            radio = Math.ceil(Math.random() * 5);

            obj = new Object(position, color, radio);

            this.scene.add(obj.figure);

            objects.push(obj);
        }

        const animate = function(time: number) {
            //time *= 0.001;  // convert time to seconds

            that.renderer.render(that.scene, that.camera);

            objects.forEach(obj => {
                obj.move(time);
                obj.figure.rotation.x = time;
                obj.figure.rotation.y = time;
            });

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    private static makeSpace(): THREE.Line {
        const geometry = new THREE.BoxGeometry(spaceWidth, spaceHeight, spaceDepth);
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));

        line.position.x=spaceWidth/2;
        line.position.y=spaceHeight/2;
        line.position.z=spaceDepth/2;

        return line;
    }

    private static makeLight(): THREE.Light {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(125, 125, 125);

        return light
    }
}

interface Vector {
    x: number;
    y: number;
    z: number;
}

enum CollisionMode {
    merge,
    bounce,
    overlap
}

class Object {
    position: Vector;
    color: number | string;
    radio: number;
    mass: number;

    collisionMode: CollisionMode;

    velocity: Vector;

    figure: THREE.Mesh;
    elasedTime: number = 0;

    constructor(position: Vector, color: number | string = 0xFFFFFF, radio=1, mass=1) {
        this.position = position;
        this.color = color;
        this.radio = radio;
        this.mass = mass;

        this.collisionMode = CollisionMode.overlap;

        this.figure = this.makeFigure();

        this.velocity = {
            x: Math.random()/100 * (Math.round(Math.random()) ? 1 : -1),
            y: Math.random()/100 * (Math.round(Math.random()) ? 1 : -1),
            z: Math.random()/100 * (Math.round(Math.random()) ? 1 : -1)
        }
    }

    private makeFigure(): THREE.Mesh {
        let geometry = new THREE.SphereGeometry(this.radio);

        let material: THREE.MeshPhongMaterial;
        if (this.collisionMode == CollisionMode.overlap) {
            material = new THREE.MeshPhongMaterial({ color: this.color, transparent: true, opacity: 0.65 });
        }
        else {
            material = new THREE.MeshPhongMaterial({ color: this.color });
        }

        let figure = new THREE.Mesh(geometry, material);

        figure.position.x = this.position.x;
        figure.position.y = this.position.y;
        figure.position.z = this.position.z;

        return figure;
    }

    private moveAxis(position: number, velocity: number, timeslap: number, axisMax: number): [number, number] {
        let newPosition: number;

        let module = velocity * timeslap;

        newPosition = position + module;

        if (newPosition < 0 || newPosition > axisMax) {
            velocity = -velocity;
            newPosition = position - module
        }

        return [newPosition, velocity];
    }

    move(updatedTime: number) {
        let dTime = updatedTime - this.elasedTime;
        this.elasedTime = updatedTime;

        [this.position.x, this.velocity.x] = this.moveAxis(this.position.x, this.velocity.x, dTime, spaceWidth);
        [this.position.y, this.velocity.y] = this.moveAxis(this.position.y, this.velocity.y, dTime, spaceHeight);
        [this.position.z, this.velocity.z] = this.moveAxis(this.position.z, this.velocity.z, dTime, spaceDepth);

        this.updateFigure();
    }

    private updateFigure(): void {
        this.figure.position.x = this.position.x;
        this.figure.position.y = this.position.y;
        this.figure.position.z = this.position.z;
    }
}

// Debug Version
Program.Main();
