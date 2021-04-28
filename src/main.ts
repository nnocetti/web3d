import * as THREE from 'three';
import { Line } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//import { GUI } from 'dat.gui';
//import { Points } from 'three';

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

enum EdgeMode {
    bounce,
    delete,
    relocate
}

const goldenAngle = 180 * (3 - Math.sqrt(5));

const spaceWidth = 200;
const spaceHeight = 200;
const spaceDepth = 200;

const constantG = 1;

const collisionMode = CollisionMode.overlap;

class Program
{
    static scene: THREE.Scene;
    static camera: THREE.PerspectiveCamera;
    static renderer: THREE.WebGLRenderer;
    static controls: OrbitControls;

    static elapsedTime: number = 0;
    static objects: Object[] = [];
    static trails: any[] = [];

    public static init(): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x999999);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.x = spaceWidth/2;
        this.camera.position.y = spaceHeight/2;
        this.camera.position.z = spaceDepth + 100;

    }

    public static Main(): void
    {
        let that = this;

        this.init();

        let space = this.makeSpace();
        this.scene.add(space);

        let light = this.makeLight();
        this.scene.add(light);

        let obj: Object;
        let position: Vector;
        let color: string;
        let radio: number;

        for (let i=0; i<50; i++) {
            position = {
                x: Math.floor(Math.random() * spaceWidth),
                y: Math.floor(Math.random() * spaceHeight),
                z: Math.floor(Math.random() * spaceDepth)
            };
            color = `hsl(${i * goldenAngle + 50}, 100%, 75%)`;

            radio = Math.random() * 2;

            obj = new Object(position, color, radio, radio);

            obj.velocity = {
                x: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1),
                y: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1),
                z: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1)
            }

            this.scene.add(obj.figure);

            this.objects.push(obj);

            //console.log('positon: ', obj.position);
            //console.log('velocity: ', obj.velocity);

            let points: THREE.Vector3[] = [];
            let vPosition = new THREE.Vector3(position.x, position.y, position.z);
        for (let j = 0; j < 1000; j++) {
                points[j] = vPosition.clone(); 
            }
            let lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

            let lineMaterial = new THREE.LineBasicMaterial({color: color});

            let trail  = new THREE.Line(lineGeometry, lineMaterial)

            this.trails.push(trail);

            this.scene.add(trail)
        }

        requestAnimationFrame(this.timeFrame.bind(this));
    }


    static timeFrame(updatedTime: number): void {
        let dTime = (updatedTime - this.elapsedTime) * 0.001;
        this.elapsedTime = updatedTime;

        this.renderer.render(this.scene, this.camera);
        //alert('stop!');

        let gForces: {[key: string]: Vector} = {};

        for (let i = 0; i < this.objects.length; i++) {
            //Calcular fuerza
            let iObj = this.objects[i];
            let totalForce = {x:0, y:0, z:0};

            for (let j = 0; j < this.objects.length; j++) {
                if (i != j) {
                    if (!gForces[`${j}${i}`]) {
                        let jObj = this.objects[j];

                        // Calculamos la distancia entre los centros de los objetos
                        let dx = jObj.position.x - iObj.position.x;
                        let dy = jObj.position.y - iObj.position.y;
                        let dz = jObj.position.z - iObj.position.z;

                        // Este resultado parcial de la distancia me sirve en la formula que calcula la magnitud de
                        // la fuerza gravitacional
                        // Es el cuadrado de la distancia entre los centros de los objetos
                        let r2 = (
                            Math.pow(dx, 2) +
                            Math.pow(dy, 2) +
                            Math.pow(dz, 2)
                        );

                        // Distancia entre el centro de los objetos
                        let objDist = Math.pow(r2, 0.5);

                        // Magnitud de la fuerza gravitacional
                        let forceMag = (constantG*this.objects[i].mass*this.objects[j].mass)/r2;

                        // Si la distancia entre el centro de los objetos es menor que la suma de los radios,
                        // entonces empezaron a solaparse!
                        // Calculamos la fuerza actuante con una regla de tres,
                        // talvez no sea exacto pero se debe aproximar
                        let rSum = iObj.radio + jObj.radio;
                        if (objDist <= rSum) {
                            if (collisionMode == CollisionMode.overlap) {
                                let actingForce = objDist / rSum;
                                forceMag *= actingForce;
                            }
                        }

                        // Este resultado hay que guardarlo, porque ijForce = (-1)jiForce
                        let ijForce = {x: dx*forceMag, y: dy*forceMag, z: dz*forceMag}

                        totalForce.x += ijForce.x;
                        totalForce.y += ijForce.y;
                        totalForce.z += ijForce.z;

                        gForces[`${i}${j}`] = {x: ijForce.x, y: ijForce.y, z: ijForce.z};
                    }
                    else {
                        let jiForce = gForces[`${j}${i}`];
                        totalForce.x += -jiForce.x;
                        totalForce.y += -jiForce.y;
                        totalForce.z += -jiForce.z;
                    }
                }
            }

            // Calcular Aceleracion
            let accel = {x: totalForce.x/iObj.mass, y: totalForce.y/iObj.mass, z: totalForce.z/iObj.mass};

            //console.log('dTime: ', dTime);
            //console.log('accel: ', accel);

            let newVelocity = {
                x: iObj.velocity.x + accel.x*dTime,
                y: iObj.velocity.y + accel.y*dTime,
                z: iObj.velocity.z + accel.z*dTime
            };

            //console.log('newVelocity: ', newVelocity);

            // Mover
            let newPosition = {
                x: iObj.position.x + iObj.velocity.x*dTime + accel.x * Math.pow(dTime, 2) * 0.5,
                y: iObj.position.y + iObj.velocity.y*dTime + accel.y * Math.pow(dTime, 2) * 0.5,
                z: iObj.position.z + iObj.velocity.z*dTime + accel.z * Math.pow(dTime, 2) * 0.5,
            };

            //console.log('newPosition: ', iObj.position);

            iObj.position = newPosition;
            iObj.velocity = newVelocity;

            iObj.updateFigure();


            // Trails

            const trailPositions = this.trails[i].geometry.attributes.position.array;

            for (let j = trailPositions.length - 1; j >= 3; j--) {
                trailPositions[j] = trailPositions[j-3];
            }
            trailPositions[0] = newPosition.x;
            trailPositions[1] = newPosition.y;
            trailPositions[2] = newPosition.z;

            this.trails[i].geometry.attributes.position.needsUpdate = true;

            //console.log('positions: ', this.trails[i].geometry.attributes.position.array)
        }

        requestAnimationFrame(this.timeFrame.bind(this));
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

class Object {
    position: Vector;
    color: number | string;
    radio: number;
    mass: number;

    velocity: Vector;

    figure: THREE.Mesh;

    constructor(position: Vector, color: number | string = 0xFFFFFF, radio=1, mass=1) {
        this.position = position;
        this.color = color;
        this.radio = radio;
        this.mass = mass;

        this.velocity = {x:0, y:0, z:0};

        this.figure = this.makeFigure();
    }

    private makeFigure(): THREE.Mesh {
        let geometry = new THREE.SphereGeometry(this.radio);

        let material: THREE.MeshPhongMaterial;
        if (collisionMode == CollisionMode.overlap) {
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

    private moveAxis(position: number, velocity: number, dTime: number, axisMax: number): [number, number] {
        let newPosition: number;

        let module = velocity * dTime;

        newPosition = position + module;

        if (newPosition < 0 || newPosition > axisMax) {
            velocity = -velocity;
            newPosition = position - module
        }

        return [newPosition, velocity];
    }

    updateFigure(): void {
        this.figure.position.x = this.position.x;
        this.figure.position.y = this.position.y;
        this.figure.position.z = this.position.z;
    }
}

// Debug Version
Program.Main();
