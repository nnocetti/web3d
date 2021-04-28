import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
var goldenAngle = 180 * (3 - Math.sqrt(5));
var spaceWidth = 200;
var spaceHeight = 200;
var spaceDepth = 200;
var constantG = 1;
var collisionMode = CollisionMode.overlap;
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
        this.camera.position.x = spaceWidth / 2;
        this.camera.position.y = spaceHeight / 2;
        this.camera.position.z = spaceDepth + 100;
    };
    Program.Main = function () {
        var that = this;
        this.init();
        var space = this.makeSpace();
        this.scene.add(space);
        var light = this.makeLight();
        this.scene.add(light);
        var obj;
        var position;
        var color;
        var radio;
        for (var i = 0; i < 50; i++) {
            position = {
                x: Math.floor(Math.random() * spaceWidth),
                y: Math.floor(Math.random() * spaceHeight),
                z: Math.floor(Math.random() * spaceDepth)
            };
            color = "hsl(" + (i * goldenAngle + 50) + ", 100%, 75%)";
            radio = Math.random() * 2;
            obj = new Object(position, color, radio, radio);
            obj.velocity = {
                x: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1),
                y: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1),
                z: Math.random() * 3 * (Math.round(Math.random()) ? 1 : -1)
            };
            this.scene.add(obj.figure);
            this.objects.push(obj);
            //console.log('positon: ', obj.position);
            //console.log('velocity: ', obj.velocity);
            var points = [];
            var vPosition = new THREE.Vector3(position.x, position.y, position.z);
            for (var j = 0; j < 1000; j++) {
                points[j] = vPosition.clone();
            }
            var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            var lineMaterial = new THREE.LineBasicMaterial({ color: color });
            var trail = new THREE.Line(lineGeometry, lineMaterial);
            this.trails.push(trail);
            this.scene.add(trail);
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
                        // Calculamos la distancia entre los centros de los objetos
                        var dx = jObj.position.x - iObj.position.x;
                        var dy = jObj.position.y - iObj.position.y;
                        var dz = jObj.position.z - iObj.position.z;
                        // Este resultado parcial de la distancia me sirve en la formula que calcula la magnitud de
                        // la fuerza gravitacional
                        // Es el cuadrado de la distancia entre los centros de los objetos
                        var r2 = (Math.pow(dx, 2) +
                            Math.pow(dy, 2) +
                            Math.pow(dz, 2));
                        // Distancia entre el centro de los objetos
                        var objDist = Math.pow(r2, 0.5);
                        // Magnitud de la fuerza gravitacional
                        var forceMag = (constantG * this.objects[i].mass * this.objects[j].mass) / r2;
                        // Si la distancia entre el centro de los objetos es menor que la suma de los radios,
                        // entonces empezaron a solaparse!
                        // Calculamos la fuerza actuante con una regla de tres,
                        // talvez no sea exacto pero se debe aproximar
                        var rSum = iObj.radio + jObj.radio;
                        if (objDist <= rSum) {
                            if (collisionMode == CollisionMode.overlap) {
                                var actingForce = objDist / rSum;
                                forceMag *= actingForce;
                            }
                        }
                        // Este resultado hay que guardarlo, porque ijForce = (-1)jiForce
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
            // Trails
            var trailPositions = this.trails[i].geometry.attributes.position.array;
            for (var j = trailPositions.length - 1; j >= 3; j--) {
                trailPositions[j] = trailPositions[j - 3];
            }
            trailPositions[0] = newPosition.x;
            trailPositions[1] = newPosition.y;
            trailPositions[2] = newPosition.z;
            this.trails[i].geometry.attributes.position.needsUpdate = true;
            //console.log('positions: ', this.trails[i].geometry.attributes.position.array)
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
    Program.trails = [];
    return Program;
}());
var Object = /** @class */ (function () {
    function Object(position, color, radio, mass) {
        if (color === void 0) { color = 0xFFFFFF; }
        if (radio === void 0) { radio = 1; }
        if (mass === void 0) { mass = 1; }
        this.position = position;
        this.color = color;
        this.radio = radio;
        this.mass = mass;
        this.velocity = { x: 0, y: 0, z: 0 };
        this.figure = this.makeFigure();
    }
    Object.prototype.makeFigure = function () {
        var geometry = new THREE.SphereGeometry(this.radio);
        var material;
        if (collisionMode == CollisionMode.overlap) {
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
    Object.prototype.updateFigure = function () {
        this.figure.position.x = this.position.x;
        this.figure.position.y = this.position.y;
        this.figure.position.z = this.position.z;
    };
    return Object;
}());
// Debug Version
Program.Main();
