import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
var goldenAngle = 180 * (3 - Math.sqrt(5));
var spaceWidth = 200;
var spaceHeight = 200;
var spaceDepth = 200;
var constantG = 1;
var Program = /** @class */ (function () {
    function Program() {
    }
    Program.init = function () {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x999999);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    };
    Program.Main = function () {
        var that = this;
        this.init();
        var space = this.makeSpace();
        this.scene.add(space);
        var light = this.makeLight();
        this.scene.add(light);
        this.camera.position.x = spaceWidth / 2;
        this.camera.position.y = spaceHeight / 2;
        this.camera.position.z = spaceDepth + 100;
        var obj;
        var position;
        var color;
        var radio;
        for (var i = 0; i < 300; i++) {
            position = {
                x: Math.floor(Math.random() * spaceWidth),
                y: Math.floor(Math.random() * spaceHeight),
                z: Math.floor(Math.random() * spaceDepth)
            };
            color = "hsl(" + (i * goldenAngle + 50) + ", 100%, 75%)";
            radio = Math.ceil(Math.random() * 5);
            obj = new Object(position, color, radio, radio);
            this.scene.add(obj.figure);
            this.objects.push(obj);
            //console.log('positon: ', obj.position);
            //console.log('velocity: ', obj.velocity);
        }
        requestAnimationFrame(this.timeFrame.bind(this));
    };
    Program.timeFrame = function (updatedTime) {
        var dTime = (updatedTime - this.elapsedTime) * 0.001;
        this.elapsedTime = updatedTime;
        this.renderer.render(this.scene, this.camera);
        //alert('stop!');
        var gForces = {};
        for (var i = 0; i < this.objects.length; i++) {
            //Calcular fuerza
            var iObj = this.objects[i];
            var totalForce = { x: 0, y: 0, z: 0 };
            for (var j = 0; j < this.objects.length; j++) {
                if (i != j) {
                    if (!gForces["" + j + i]) {
                        var jObj = this.objects[j];
                        var dx = jObj.position.x - iObj.position.x;
                        var dy = jObj.position.y - iObj.position.y;
                        var dz = jObj.position.z - iObj.position.z;
                        var r2 = (Math.pow(dx, 2) +
                            Math.pow(dy, 2) +
                            Math.pow(dz, 2));
                        var forceMag = (constantG * this.objects[i].mass * this.objects[j].mass) / r2;
                        // Este resultado hay que guardarlo, es el mismo para ij y para ji
                        var ijForce = { x: dx * forceMag, y: dy * forceMag, z: dz * forceMag };
                        totalForce.x += ijForce.x;
                        totalForce.y += ijForce.y;
                        totalForce.z += ijForce.z;
                        gForces["" + i + j] = { x: ijForce.x, y: ijForce.y, z: ijForce.z };
                    }
                    else {
                        var jiForce = gForces["" + j + i];
                        totalForce.x += -jiForce.x;
                        totalForce.y += -jiForce.y;
                        totalForce.z += -jiForce.z;
                    }
                }
            }
            // Calcular Aceleracion
            var accel = { x: totalForce.x / iObj.mass, y: totalForce.y / iObj.mass, z: totalForce.z / iObj.mass };
            //console.log('dTime: ', dTime);
            //console.log('accel: ', accel);
            var newVelocity = {
                x: iObj.velocity.x + accel.x * dTime,
                y: iObj.velocity.y + accel.y * dTime,
                z: iObj.velocity.z + accel.z * dTime
            };
            //console.log('newVelocity: ', newVelocity);
            // Mover
            var newPosition = {
                x: iObj.position.x + iObj.velocity.x * dTime + accel.x * Math.pow(dTime, 2) * 0.5,
                y: iObj.position.y + iObj.velocity.y * dTime + accel.y * Math.pow(dTime, 2) * 0.5,
                z: iObj.position.z + iObj.velocity.z * dTime + accel.z * Math.pow(dTime, 2) * 0.5,
            };
            //console.log('newPosition: ', iObj.position);
            iObj.position = newPosition;
            iObj.velocity = newVelocity;
            iObj.updateFigure();
        }
        requestAnimationFrame(this.timeFrame.bind(this));
    };
    Program.makeSpace = function () {
        var geometry = new THREE.BoxGeometry(spaceWidth, spaceHeight, spaceDepth);
        var edges = new THREE.EdgesGeometry(geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        line.position.x = spaceWidth / 2;
        line.position.y = spaceHeight / 2;
        line.position.z = spaceDepth / 2;
        return line;
    };
    Program.makeLight = function () {
        var color = 0xFFFFFF;
        var intensity = 1;
        var light = new THREE.DirectionalLight(color, intensity);
        light.position.set(125, 125, 125);
        return light;
    };
    Program.elapsedTime = 0;
    Program.objects = [];
    return Program;
}());
var CollisionMode;
(function (CollisionMode) {
    CollisionMode[CollisionMode["merge"] = 0] = "merge";
    CollisionMode[CollisionMode["bounce"] = 1] = "bounce";
    CollisionMode[CollisionMode["overlap"] = 2] = "overlap";
})(CollisionMode || (CollisionMode = {}));
var EdgeMode;
(function (EdgeMode) {
    EdgeMode[EdgeMode["bounce"] = 0] = "bounce";
    EdgeMode[EdgeMode["delete"] = 1] = "delete";
    EdgeMode[EdgeMode["relocate"] = 2] = "relocate";
})(EdgeMode || (EdgeMode = {}));
var Object = /** @class */ (function () {
    function Object(position, color, radio, mass) {
        if (color === void 0) { color = 0xFFFFFF; }
        if (radio === void 0) { radio = 1; }
        if (mass === void 0) { mass = 1; }
        this.position = position;
        this.color = color;
        this.radio = radio;
        this.mass = mass;
        this.collisionMode = CollisionMode.overlap;
        this.figure = this.makeFigure();
        this.velocity = {
            x: Math.random() / 100 * (Math.round(Math.random()) ? 1 : -1),
            y: Math.random() / 100 * (Math.round(Math.random()) ? 1 : -1),
            z: Math.random() / 100 * (Math.round(Math.random()) ? 1 : -1)
        };
    }
    Object.prototype.makeFigure = function () {
        var geometry = new THREE.SphereGeometry(this.radio);
        var material;
        if (this.collisionMode == CollisionMode.overlap) {
            material = new THREE.MeshPhongMaterial({ color: this.color, transparent: true, opacity: 0.65 });
        }
        else {
            material = new THREE.MeshPhongMaterial({ color: this.color });
        }
        var figure = new THREE.Mesh(geometry, material);
        figure.position.x = this.position.x;
        figure.position.y = this.position.y;
        figure.position.z = this.position.z;
        return figure;
    };
    Object.prototype.moveAxis = function (position, velocity, dTime, axisMax) {
        var newPosition;
        var module = velocity * dTime;
        newPosition = position + module;
        if (newPosition < 0 || newPosition > axisMax) {
            velocity = -velocity;
            newPosition = position - module;
        }
        return [newPosition, velocity];
    };
    Object.prototype.move = function (dTime) {
        var _a, _b, _c;
        _a = this.moveAxis(this.position.x, this.velocity.x, dTime, spaceWidth), this.position.x = _a[0], this.velocity.x = _a[1];
        _b = this.moveAxis(this.position.y, this.velocity.y, dTime, spaceHeight), this.position.y = _b[0], this.velocity.y = _b[1];
        _c = this.moveAxis(this.position.z, this.velocity.z, dTime, spaceDepth), this.position.z = _c[0], this.velocity.z = _c[1];
        this.updateFigure();
    };
    Object.prototype.updateFigure = function () {
        this.figure.position.x = this.position.x;
        this.figure.position.y = this.position.y;
        this.figure.position.z = this.position.z;
    };
    return Object;
}());
// Debug Version
Program.Main();
