import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
var Program = /** @class */ (function () {
    function Program() {
    }
    Program.init = function () {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        var controls = new OrbitControls(this.camera, this.renderer.domElement);
    };
    Program.Main = function () {
        var that = this;
        this.init();
        var cube = this.makeCube();
        this.scene.add(cube);
        var line = this.makeLine();
        this.scene.add(line);
        var light = this.makeLight();
        this.scene.add(light);
        this.camera.position.z = 5;
        var animate = function (time) {
            time *= 0.001; // convert time to seconds
            that.renderer.render(that.scene, that.camera);
            cube.rotation.x = time;
            cube.rotation.y = time;
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    };
    Program.makeCube = function () {
        var boxWidth = 1;
        var boxHeight = 2;
        var boxDepth = 1;
        var geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        var material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });
        var cube = new THREE.Mesh(geometry, material);
        return cube;
    };
    Program.makeLine = function () {
        //create a blue LineBasicMaterial
        var points = [];
        points.push(new THREE.Vector3(-10, 0, 0));
        points.push(new THREE.Vector3(0, 10, 0));
        points.push(new THREE.Vector3(10, 0, 0));
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        var line = new THREE.Line(geometry, material);
        return line;
    };
    Program.makeLight = function () {
        var color = 0xFFFFFF;
        var intensity = 1;
        var light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        return light;
    };
    return Program;
}());
// Debug Version
Program.Main();
