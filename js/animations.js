import * as THREE from '../libs/three.module.js';
import TWEEN from '../libs/tween.esm.js';

import { degToRad, stopAllTweens, playMusic, playSound, pauseAllTweens, resumeAllTweens, randomIntFromInterval, radToDeg } from './utils.js';


var models, mario, luigi, character, sounds, settings, music, sound1, sound2;
var textures, cumulativePosition;
var tiles = [];

var characterRunningAnimationTweens = [], characterCurrentAnimationTweens = [], characterMovingAnimationTweens = [];
var activeCollisionBoxes = [];

export function initCharacters(assets, scene, audio, options, musicAudioObject, soundAudioObject1, soundAudioObject2) {

    stopAllTweens(characterCurrentAnimationTweens);

    models = assets;
    mario = models.mario;
    luigi = models.luigi;
    sounds = audio;
    settings = options;
    music = musicAudioObject;
    sound1 = soundAudioObject1;
    sound2 = soundAudioObject2;

    /* ----- MARIO ----- */
    if(!mario.instantiated) {
        mario.mesh = new THREE.Object3D();

        mario.mesh.name = "mario";

        let marioBody = mario.gltf.getObjectByName("RootNode");
        marioBody.scale.set(0.05, 0.05, 0.05);

        mario.mesh.add(marioBody);
    }
    mario.instantiated = true;

    mario.mesh.position.set(-3, 0, 0);

    mario.mesh.rotation.set(0, 0, 0);

    mario.mesh.remove(mario.mesh.children[1]);

    scene.add(mario.mesh);
    /* ----- ----- ----- */

    /* ----- LUIGI ----- */
    if(!luigi.instantiated) {
        luigi.mesh = new THREE.Object3D();

        luigi.mesh.name = "luigi";

        let luigiBody = luigi.gltf.getObjectByName("RootNode");
        luigiBody.scale.set(0.3, 0.3, 0.3);

        luigi.mesh.add(luigiBody);
    }
    luigi.instantiated = true;

    luigi.mesh.position.set(3, 0, 0);

    luigi.mesh.rotation.set(0, degToRad(180), 0);

    luigi.mesh.remove(luigi.mesh.children[1]);

    scene.add(luigi.mesh);
    /* ----- ----- ----- */
    
    characterRunningAnimationTweens = [];
    characterCurrentAnimationTweens = [];
    characterMovingAnimationTweens = [];
    activeCollisionBoxes = [];

    /* ----- LIGHTS ----- */
    const ambientLight = new THREE.AmbientLight(0xffffff);
    const emisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-30, 50, 70);
    directionalLight.castShadow = true;

    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5, "#ff0000");
    const directionalLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    if(settings.dev) {
        scene.add(directionalLightHelper);
        scene.add(directionalLightShadowHelper);
    }

    scene.add(ambientLight);
    scene.add(emisphereLight);
    scene.add(directionalLight);
    /* ----- ----- ----- */

    setMarioBones();
    setLuigiBones();


    characterReset(mario);

    characterIdleAnimation(mario);

    characterFollowMouseAnimation(mario);


    characterReset(luigi);

    characterIdleAnimation(luigi);

    characterFollowMouseAnimation(luigi);

}

export function initCharacterGame(scene, camera, tex, playableCharacter) {

    stopAllTweens(characterCurrentAnimationTweens);

    if(playableCharacter == "mario") {
        character = models.mario;
    }
    if(playableCharacter == "luigi") {
        character = models.luigi;
    }

    character.mesh.position.set(0, 0, -2);

    character.mesh.remove(character.mesh.children[1]);

    var collisionBox = initCollisionBox();
    collisionBox.scale.set(2.5, 4, 1.5);
    collisionBox.position.y = 2.5;
    character.mesh.add(collisionBox);


    scene.add(character.mesh);

    character.mesh.rotation.y = degToRad(180);

    textures = tex;
    cumulativePosition = 0;
    characterRunningAnimationTweens = [];
    characterCurrentAnimationTweens = [];
    characterMovingAnimationTweens = [];
    activeCollisionBoxes = [];

    tiles = [];

    settings.invincible = false;
    settings.star = false;
    settings.score = 0;
    if(settings.difficulty == "easy") {
        settings.lives = 10;
        settings.maxLives = 10;
        settings.speed = 20;
    }
    if(settings.difficulty == "normal") {
        settings.lives = 5;
        settings.maxLives = 5;
        settings.speed = 25;
    }
    if(settings.difficulty == "hard") {
        settings.lives = 3;
        settings.maxLives = 3;
        settings.speed = 30;
    }
    if(settings.difficulty == "godmode") {
        settings.lives = 5;
        settings.maxLives = 5;
        settings.speed = 25;
    }
    settings.inGame = true;
    character.isSliding = false;
    character.isJumping = false;


    /* ----- LIGHTS ----- */
    if(settings.environment == "grassland") {
        var ambientLight = new THREE.AmbientLight(0xffffff);
        var emisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    }
    if(settings.environment == "cave") {
        var ambientLight = new THREE.AmbientLight(0x7d7d7d);
        var emisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        var directionalLight = new THREE.DirectionalLight(0x000000, 1);
    }
    if(settings.environment == "space") {
        var ambientLight = new THREE.AmbientLight(0xffffff);
        var emisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        var directionalLight = new THREE.DirectionalLight(0xffff00, 1);
    }


    directionalLight.position.set(-20, 20, -20);
    if(settings.quality != "low") {
        directionalLight.castShadow = true;
    }
	
    directionalLight.shadow.camera.top = 10;
	directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.left = -50;
	directionalLight.shadow.camera.right = 30;

	directionalLight.shadow.camera.near = 15;
	directionalLight.shadow.camera.far = 40;
	directionalLight.shadow.bias = 0.0001;
	directionalLight.shadow.normalBias = 0.0001;


    var directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5, "#ff0000");
    var directionalLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    if(settings.dev) {
        scene.add(directionalLightHelper);
        scene.add(directionalLightShadowHelper);
    }

    var directionalLightTarget = new THREE.Object3D();
	directionalLightTarget.position.set(0, 0, character.mesh.position.z - 20);
	scene.add(directionalLightTarget);
	directionalLight.target = directionalLightTarget;
    
    scene.add(ambientLight);
    scene.add(emisphereLight);
    scene.add(directionalLight);



    var directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(0, -5, 20);
    var directionalLightTarget2 = new THREE.Object3D();
	directionalLightTarget2.position.set(0, 0, -20);
    directionalLight2.target = directionalLightTarget2;
    scene.add(directionalLight2);

    var directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight3.position.set(-5, -5, 20);
    var directionalLightTarget3 = new THREE.Object3D();
	directionalLightTarget3.position.set(-5, 0, -20);
    directionalLight3.target = directionalLightTarget3;
    scene.add(directionalLight3);

    var directionalLight4 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight4.position.set(5, -5, 20);
    var directionalLightTarget4 = new THREE.Object3D();
	directionalLightTarget4.position.set(5, 0, -20);
    directionalLight4.target = directionalLightTarget4;
    scene.add(directionalLight4);

    // var pointLight = new THREE.PointLight(0xffffff, 1, 0, 0);
	// pointLight.position.set(0, -11.5, 30);
	// scene.add(pointLight);

    // var pointLight2 = new THREE.PointLight(0xffffff, 1, 0, 0);
	// pointLight2.position.set(-20, -11.5, 40);
	// scene.add(pointLight2);

    // var pointLight3 = new THREE.PointLight(0xffffff, 1, 0, 0);
	// pointLight3.position.set(20, -11.5, 40);
	// scene.add(pointLight3);

    // var pointLight4 = new THREE.PointLight(0xffffff, 1, 0, 0);
	// pointLight4.position.set(-30, -11.5, 50);
	// scene.add(pointLight4);

    // var pointLight5 = new THREE.PointLight(0xffffff, 1, 0, 0);
	// pointLight5.position.set(30, -11.5, 50);
	// scene.add(pointLight5);
    /* ----- ----- ----- */

    initTile(scene, 3);
    
    // console.log("character:", character)

    characterReset(character);

    moveCharacterForward(scene, camera, directionalLight, directionalLightTarget);

    characterRunAnimation();
}

function setMarioBones() {

    mario.mesh.traverse(o => {

        if(o.isBone) {
            // uncomment the following line to see every mario bone
            // console.log(o.name)

            if(o.name === 'pelvis_03') {
                mario.bones.pelvis = o;
            }
            if(o.name === 'spine00_04') {
                mario.bones.spine = o;
            }
            if(o.name === 'head_05') {
                mario.bones.head = o;
            }
            if(o.name === 'head_aimcont_06') {
                mario.bones.head_aimcont = o;
            }
            if(o.name === 'cap_07') {
                mario.bones.cap = o;
            }
            if(o.name === 'chin_014') {
                mario.bones.chin = o;
            }
            if(o.name === 'lower_lip_015') {
                mario.bones.lower_lip = o;
            }
            if(o.name === 'upper_lip_016') {
                mario.bones.upper_lip = o;
            }
            if(o.name === 'attach_head_019') {
                mario.bones.attach_head = o;
            }
            if(o.name === 'L_upperarm_021') {
                mario.bones.left_upperarm = o;
            }
            if(o.name === 'L_forearm_022') {
                mario.bones.left_forearm = o;
            }
            if(o.name === 'L_hand_023') {
                mario.bones.left_hand = o;
            }
            if(o.name === 'L_finger2_1_024') {
                mario.bones.left_finger2_1 = o;
            }
            if(o.name === 'L_finger2_2_025') {
                mario.bones.left_finger2_2 = o;
            }
            if(o.name === 'L_finger3_1_026') {
                mario.bones.left_finger3_1 = o;
            }
            if(o.name === 'L_finger3_2_027') {
                mario.bones.left_finger3_2 = o;
            }
            if(o.name === 'L_finger4_1_028') {
                mario.bones.left_finger4_1 = o;
            }
            if(o.name === 'L_finger4_2_029') {
                mario.bones.left_finger4_2 = o;
            }
            if(o.name === 'L_thumb_1_030') {
                mario.bones.left_thumb_1 = o;
            }
            if(o.name === 'L_thumb_2_031') {
                mario.bones.left_thumb_2 = o;
            }
            if(o.name === 'L_finger1_1_032') {
                mario.bones.left_finger1_1 = o;
            }
            if(o.name === 'L_finger1_2_033') {
                mario.bones.left_finger1_2 = o;
            }
            if(o.name === 'L_hand_roll_035') {
                mario.bones.left_hand_roll = o;
            }
            if(o.name === 'L_elbow_036') {
                mario.bones.left_elbow = o;
            }
            if(o.name === 'R_upperarm_038') {
                mario.bones.right_upperarm = o;
            }
            if(o.name === 'R_forearm_039') {
                mario.bones.right_forearm = o;
            }
            if(o.name === 'R_hand_040') {
                mario.bones.right_hand = o;
            }
            if(o.name === 'R_finger2_1_041') {
                mario.bones.right_finger2_1 = o;
            }
            if(o.name === 'R_finger2_2_042') {
                mario.bones.right_finger2_2 = o;
            }
            if(o.name === 'R_finger3_1_043') {
                mario.bones.right_finger3_1 = o;
            }
            if(o.name === 'R_finger3_2_044') {
                mario.bones.right_finger3_2 = o;
            }
            if(o.name === 'R_finger4_1_045') {
                mario.bones.right_finger4_1 = o;
            }
            if(o.name === 'R_finger4_2_046') {
                mario.bones.right_finger4_2 = o;
            }
            if(o.name === 'R_thumb_1_047') {
                mario.bones.right_thumb_1 = o;
            }
            if(o.name === 'R_thumb_2_048') {
                mario.bones.right_thumb_2 = o;
            }
            if(o.name === 'R_finger1_1_049') {
                mario.bones.right_finger1_1 = o;
            }
            if(o.name === 'R_finger1_2_050') {
                mario.bones.right_finger1_2 = o;
            }
            if(o.name === 'R_hand_roll_052') {
                mario.bones.right_hand_roll = o;
            }
            if(o.name === 'R_elbow_053') {
                mario.bones.right_elbow = o;
            }
            if(o.name === 'L_thigh_054') {
                mario.bones.left_thigh = o;
            }
            if(o.name === 'L_calf_055') {
                mario.bones.left_calf = o;
            }
            if(o.name === 'L_foot_056') {
                mario.bones.left_foot = o;
            }
            if(o.name === 'L_toe_057') {
                mario.bones.left_toe = o;
            }
            if(o.name === 'L_knee_059') {
                mario.bones.left_knee = o;
            }
            if(o.name === 'R_thigh_060') {
                mario.bones.right_thigh = o;
            }
            if(o.name === 'R_calf_061') {
                mario.bones.right_calf = o;
            }
            if(o.name === 'R_foot_00') {
                mario.bones.right_foot = o;
            }
            if(o.name === 'R_toe_062') {
                mario.bones.right_toe = o;
            }
            if(o.name === 'R_knee_064') {
                mario.bones.right_knee = o;
            }
        }
    });
}


function setLuigiBones() {

    luigi.mesh.traverse(o => {

        if(o.isBone) {
            // uncomment the following line to see every luigi bone
            // console.log(o.name)

            if(o.name === 'pelvis_03') {
                luigi.bones.pelvis = o;
            }
            if(o.name === 'spine00_04') {
                luigi.bones.spine = o;
            }
            if(o.name === 'head_05') {
                luigi.bones.head = o;
            }
            if(o.name === 'head_aimcont_06') {
                luigi.bones.head_aimcont = o;
            }
            if(o.name === 'cap_07') {
                luigi.bones.cap = o;
            }
            if(o.name === 'chin_014') {
                luigi.bones.chin = o;
            }
            if(o.name === 'lower_lip_015') {
                luigi.bones.lower_lip = o;
            }
            if(o.name === 'upper_lip_018') {
                luigi.bones.upper_lip = o;
            }
            if(o.name === 'attach_head_022') {
                luigi.bones.attach_head = o;
            }
            if(o.name === 'L_upperarm_024') {
                luigi.bones.left_upperarm = o;
            }
            if(o.name === 'L_forearm_025') {
                luigi.bones.left_forearm = o;
            }
            if(o.name === 'L_hand_026') {
                luigi.bones.left_hand = o;
            }
            if(o.name === 'L_finger1_1_027') {
                luigi.bones.left_finger1_1 = o;
            }
            if(o.name === 'L_finger1_2_028') {
                luigi.bones.left_finger1_2 = o;
            }
            if(o.name === 'L_finger2_1_029') {
                luigi.bones.left_finger2_1 = o;
            }
            if(o.name === 'L_finger2_2_030') {
                luigi.bones.left_finger2_2 = o;
            }
            if(o.name === 'L_finger3_1_031') {
                luigi.bones.left_finger3_1 = o;
            }
            if(o.name === 'L_finger3_2_032') {
                luigi.bones.left_finger3_2 = o;
            }
            if(o.name === 'L_finger4_1_033') {
                luigi.bones.left_finger4_1 = o;
            }
            if(o.name === 'L_finger4_2_034') {
                luigi.bones.left_finger4_2 = o;
            }
            if(o.name === 'L_thumb_1_035') {
                luigi.bones.left_thumb_1 = o;
            }
            if(o.name === 'L_thumb_2_036') {
                luigi.bones.left_thumb_2 = o;
            }
            if(o.name === 'L_hand_roll_038') {
                luigi.bones.left_hand_roll = o;
            }
            if(o.name === 'L_elbow_039') {
                luigi.bones.left_elbow = o;
            }
            if(o.name === 'R_upperarm_041') {
                luigi.bones.right_upperarm = o;
            }
            if(o.name === 'R_forearm_042') {
                luigi.bones.right_forearm = o;
            }
            if(o.name === 'R_hand_043') {
                luigi.bones.right_hand = o;
            }
            if(o.name === 'R_finger1_1_044') {
                luigi.bones.right_finger1_1 = o;
            }
            if(o.name === 'R_finger1_2_045') {
                luigi.bones.right_finger1_2 = o;
            }
            if(o.name === 'R_finger2_1_046') {
                luigi.bones.right_finger2_1 = o;
            }
            if(o.name === 'R_finger2_2_047') {
                luigi.bones.right_finger2_2 = o;
            }
            if(o.name === 'R_finger3_1_048') {
                luigi.bones.right_finger3_1 = o;
            }
            if(o.name === 'R_finger3_2_049') {
                luigi.bones.right_finger3_2 = o;
            }
            if(o.name === 'R_finger4_1_050') {
                luigi.bones.right_finger4_1 = o;
            }
            if(o.name === 'R_finger4_2_051') {
                luigi.bones.right_finger4_2 = o;
            }
            if(o.name === 'R_thumb_1_052') {
                luigi.bones.right_thumb_1 = o;
            }
            if(o.name === 'R_thumb_2_053') {
                luigi.bones.right_thumb_2 = o;
            }
            if(o.name === 'R_hand_roll_055') {
                luigi.bones.right_hand_roll = o;
            }
            if(o.name === 'R_elbow_056') {
                luigi.bones.right_elbow = o;
            }
            if(o.name === 'L_thigh_057') {
                luigi.bones.left_thigh = o;
            }
            if(o.name === 'L_calf_058') {
                luigi.bones.left_calf = o;
            }
            if(o.name === 'L_foot_00') {
                luigi.bones.left_foot = o;
            }
            if(o.name === 'L_toe_059') {
                luigi.bones.left_toe = o;
            }
            if(o.name === 'L_knee_061') {
                luigi.bones.left_knee = o;
            }
            if(o.name === 'R_thigh_062') {
                luigi.bones.right_thigh = o;
            }
            if(o.name === 'R_calf_063') {
                luigi.bones.right_calf = o;
            }
            if(o.name === 'R_foot_064') {
                luigi.bones.right_foot = o;
            }
            if(o.name === 'R_toe_065') {
                luigi.bones.right_toe = o;
            }
            if(o.name === 'R_knee_067') {
                luigi.bones.right_knee = o;
            }
        }
    });
}

/* ----- CHARACTERS ANIMATIONS ----- */

function characterFollowMouseAnimation(character) {

    document.addEventListener('mousemove', function(e) {

        if(character && !settings.inGame) {

            var mousecoords = getMousePos(e);

            if(character.bones.head_aimcont && character.bones.spine) {
                if(character.name == "mario") {
                    moveJoint(mousecoords, character.bones.head_aimcont, 50);
                    moveJoint(mousecoords, character.bones.spine, 30);
                }
                if(character.name == "luigi") {
                    moveJoint(mousecoords, character.bones.head, 50);
                    moveJoint(mousecoords, character.bones.spine, 30);
                }
            }
        }
    });


    function getMousePos(e) {
        return {x: e.clientX, y: e.clientY};
    }


    function moveJoint(mouse, joint, degreeLimit) {
        var degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
        joint.rotation.y = degToRad(degrees.x);
        joint.rotation.x = degToRad(degrees.y);
    }


    function getMouseDegrees(x, y, degreeLimit) {
        var dx = 0,
            dy = 0,
            xdiff,
            xPercentage,
            ydiff,
            yPercentage;
      
        var w = { x: window.innerWidth, y: window.innerHeight };
      
        if(x <= w.x * 0.75) {
            xdiff = w.x * 0.75 - x;  
            xPercentage = (xdiff / (w.x * 0.75)) * 100;
            dx = (((degreeLimit * 0.75) * xPercentage) / 100) * -1;
        }
        if(x >= w.x * 0.75) {
            xdiff = x - w.x * 0.75;
            xPercentage = (xdiff / (w.x * 0.75)) * 100;
            dx = (degreeLimit * xPercentage) / 100;
        }
        if(y <= w.y / 2) {
            ydiff = w.y / 2 - y;
            yPercentage = (ydiff / (w.y / 2)) * 100;
            dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
            }
        if(y >= w.y / 2) {
            ydiff = y - w.y / 2;
            yPercentage = (ydiff / (w.y / 2)) * 100;
            dy = ((degreeLimit * 0.5) * yPercentage) / 100;
        }
        return {x: dx, y: dy};
    }
}


function characterIdleAnimation(character) {

    characterReset(character);

    var animationTime = character.idleAnimationTime;
    
    /* ----- BODY MOVEMENT ----- */
    var bodyMaxAngle = 2;

    var bodyRotationStart = {x:0, y:0, z:0};
    var bodyTweenStart = new TWEEN.Tween(bodyRotationStart)
    .to({x:bodyMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.mesh.rotation.x = degToRad(bodyRotationStart.x);
    })
    .start();

    var bodyRotationEnd = {x:bodyMaxAngle, y:0, z:0};
    var bodyTweenEnd = new TWEEN.Tween(bodyRotationEnd)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.mesh.rotation.x = degToRad(bodyRotationEnd.x);
    })
    .start();

    bodyTweenStart.chain(bodyTweenEnd);
    bodyTweenEnd.chain(bodyTweenStart);
    /* ----- ----- ----- */

    /* ----- PELVIS MOVEMENT ----- */
    var pelvisMaxAngle = -2;

    var pelvisRotationStart = {x:0, y:pelvisMaxAngle, z:0};
    var pelvisTweenStart = new TWEEN.Tween(pelvisRotationStart)
    .to({x:0, y:-pelvisMaxAngle, z:0}, animationTime*2)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationStart.y);
    })
    .start();

    var pelvisRotationEnd = {x:0, y:-pelvisMaxAngle, z:0};
    var pelvisTweenEnd = new TWEEN.Tween(pelvisRotationEnd)
    .to({x:0, y:pelvisMaxAngle, z:0}, animationTime*2)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationEnd.y);
    })
    .start();

    pelvisTweenStart.chain(pelvisTweenEnd);
    pelvisTweenEnd.chain(pelvisTweenStart);
    /* ----- ----- ----- */

    /* ----- ARMS MOVEMENT ----- */
    var upperArmMaxAngleX = 2;
    var upperArmMaxAngleY = 2;
    var upperArmMaxAngleZ1 = 45;
    var upperArmMaxAngleZ2 = 40;

    var upperArmRotationStart = {x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:upperArmMaxAngleZ2};
    var upperArmTweenStart = new TWEEN.Tween(upperArmRotationStart)
    .to({x:-upperArmMaxAngleX, y:-upperArmMaxAngleY, z:upperArmMaxAngleZ1}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationStart.x);
        character.bones.right_upperarm.rotation.x = degToRad(upperArmRotationStart.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationStart.y);
        character.bones.right_upperarm.rotation.y = degToRad(upperArmRotationStart.y);
        character.bones.left_upperarm.rotation.z = degToRad(upperArmRotationStart.z);
        character.bones.right_upperarm.rotation.z = degToRad(upperArmRotationStart.z);
    })
    .start();

    var upperArmRotationEnd = {x:-upperArmMaxAngleX, y:-upperArmMaxAngleY, z:upperArmMaxAngleZ1};
    var upperArmTweenEnd = new TWEEN.Tween(upperArmRotationEnd)
    .to({x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:upperArmMaxAngleZ2}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationEnd.x);
        character.bones.right_upperarm.rotation.x = degToRad(upperArmRotationEnd.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationEnd.y);
        character.bones.right_upperarm.rotation.y = degToRad(upperArmRotationEnd.y);
        character.bones.left_upperarm.rotation.z = degToRad(upperArmRotationEnd.z);
        character.bones.right_upperarm.rotation.z = degToRad(upperArmRotationEnd.z);
    })
    .start();

    upperArmTweenStart.chain(upperArmTweenEnd);
    upperArmTweenEnd.chain(upperArmTweenStart);
    /* ----- ----- ----- */

    /* ----- LEGS MOVEMENT ----- */

    /* THIGH */
    var thighMaxAngle = -5;

    var thighRotationStart = {x:0, y:0, z:0};
    var thighTweenStart = new TWEEN.Tween(thighRotationStart)
    .to({x:thighMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationStart.x);
        character.bones.right_thigh.rotation.x = degToRad(thighRotationStart.x);
    })
    .start();

    var thighRotationEnd = {x:thighMaxAngle, y:0, z:0};
    var thighTweenEnd = new TWEEN.Tween(thighRotationEnd)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationEnd.x);
        character.bones.right_thigh.rotation.x = degToRad(thighRotationEnd.x);
    })
    .start();

    thighTweenStart.chain(thighTweenEnd);
    thighTweenEnd.chain(thighTweenStart);
    /* ----- */

    /* CALF */
    var calfMaxAngle = -7;

    var calfRotationStart = {x:-calfMaxAngle, y:0, z:0};
    var calfTweenStart = new TWEEN.Tween(calfRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationStart.x));
        character.bones.right_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationStart.x));
    })
    .start();

    var calfRotationEnd = {x:0, y:0, z:0};
    var calfTweenEnd = new TWEEN.Tween(calfRotationEnd)
    .to({x:-calfMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationEnd.x));
        character.bones.right_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationEnd.x));
    })
    .start();

    calfTweenStart.chain(calfTweenEnd);
    calfTweenEnd.chain(calfTweenStart);
    /* ----- */

    /* FOOT */
    var footMaxAngle = -60;

    var footRotationStart = {x:footMaxAngle+2, y:0, z:0};
    var footTweenStart = new TWEEN.Tween(footRotationStart)
    .to({x:footMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_foot.rotation.x = degToRad(footRotationStart.x);
        character.bones.right_foot.rotation.x = degToRad(footRotationStart.x);
    })
    .start();

    var footRotationEnd = {x:footMaxAngle, y:0, z:0};
    var footTweenEnd = new TWEEN.Tween(footRotationEnd)
    .to({x:footMaxAngle+2, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_foot.rotation.x = degToRad(footRotationEnd.x);
        character.bones.right_foot.rotation.x = degToRad(footRotationEnd.x);
    })
    .start();

    footTweenStart.chain(footTweenEnd);
    footTweenEnd.chain(footTweenStart);
    /* ----- */

    /* ----- ----- ----- */

    // characterCurrentAnimationTweens = [];
    characterCurrentAnimationTweens.push(bodyTweenStart, bodyTweenEnd);
    characterCurrentAnimationTweens.push(pelvisTweenStart, pelvisTweenEnd);
    characterCurrentAnimationTweens.push(upperArmTweenStart, upperArmTweenEnd);
    characterCurrentAnimationTweens.push(thighTweenStart, thighTweenEnd);
    characterCurrentAnimationTweens.push(calfTweenStart, calfTweenEnd);
    characterCurrentAnimationTweens.push(footTweenStart, footTweenEnd);

}


function moveCharacterForward(scene, camera, directionalLight, directionalLightTarget) {

    /* ----- BODY MOVEMENT ----- */
    var animationTime = (-settings.endPosition / settings.speed)*1000;

    var bodyPositionStart = {x:0, y:0, z:character.mesh.position.z};
    var bodyTweenStart = new TWEEN.Tween(bodyPositionStart)
    .to({x:0, y:0, z:settings.endPosition}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.mesh.position.z = bodyPositionStart.z;

        camera.position.z = character.mesh.position.z + 15;

        if(settings.environment != "cave") {
            directionalLight.position.z = character.mesh.position.z - 20;
	        directionalLightTarget.position.set(0, 0, character.mesh.position.z - 20);
            directionalLight.target = directionalLightTarget;
        }

        var actualScore = settings.score*settings.scoreMultiplier;
        var scoreString = actualScore.toString();

        settings.score++;

        if(actualScore < 100) {
            scoreString = "0" + scoreString;
        }

        document.getElementById("score").innerHTML = scoreString.slice(0,-2) + "." + scoreString.slice(-2);
        document.getElementById("lives").innerHTML = settings.lives;


        var collision = [];
        vertices.forEach(function(coordinates) {
            var vertex = new THREE.Vector3();
            vertex.copy(coordinates);
            
            // accessing the collision box
            character.mesh.children[1].localToWorld(vertex);
            collision.push(vertex)
        });

        character.mesh.children[1].collision = collision;


        checkCollisions(scene);

        removeTiles(scene);

        
        if(character.mesh.position.k<settings.endPosition) {
            gameOver();
        }

    })
    .start();
    /* ----- ----- ----- */

    characterMovingAnimationTweens.push(bodyTweenStart)

}


function characterSlideHandler() {

    if(character.isSliding||character.isJumping) return;

    characterSlideStart();
}

function characterSlideStart() {

    stopAllTweens(characterRunningAnimationTweens);

    character.isSliding = true;

    characterSlideAnimation();

    sound1.stop();
    if(character.name == "mario") {
        playSound(sounds.mario.slide.sound, 0.5, 1, false, settings, sound1);
    }
    if(character.name == "luigi") {
        playSound(sounds.luigi.slide.sound, 0.5, 1, false, settings, sound1);
    }
}

function characterSlideStop() {

    character.isSliding = false;

    characterRunAnimation();
}


function characterJumpHandler() {

    if(character.isJumping||character.isSliding) return;

    characterJumpStart();
}

function characterJumpStart() {

    stopAllTweens(characterRunningAnimationTweens);

    character.isJumping = true;

    characterJumpAnimation();

    sound1.stop();
    if(character.name == "mario") {
        playSound(sounds.mario.jump.sound, 1, 1, false, settings, sound1);
    }
    if(character.name == "luigi") {
        playSound(sounds.luigi.jump.sound, 1, 1, false, settings, sound1);
    }
}

function characterJumpStop() {

    character.isJumping = false;

    characterRunAnimation();
}


function characterReset(character) {

    // x->y, y->x, z->z

    character.mesh.rotation.x = degToRad(0);

    /* ----- SPINE ----- */
    character.bones.spine.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- PELVIS ----- */
    character.bones.pelvis.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- HEAD ----- */
    character.bones.head.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    character.bones.head_aimcont.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- CAP ----- */
    character.bones.cap.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- LEFT ARM ----- */
    character.bones.left_upperarm.rotation.set(degToRad(-15), degToRad(0), degToRad(35));
    character.bones.left_forearm.rotation.set(degToRad(-45), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- LEFT HAND ----- */
    character.bones.left_hand.rotation.set(degToRad(-15), degToRad(30), degToRad(0));
    character.bones.left_hand_roll.rotation.set(degToRad(-15), degToRad(30), degToRad(0));

    character.bones.left_finger1_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.left_finger1_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.left_finger2_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.left_finger2_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.left_finger3_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.left_finger3_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.left_finger4_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.left_finger4_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.left_thumb_1.rotation.set(degToRad(90), degToRad(90), degToRad(-100));
    character.bones.left_thumb_2.rotation.set(degToRad(-110), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- RIGHT ARM ----- */
    character.bones.right_upperarm.rotation.set(degToRad(-15), degToRad(0), degToRad(35));
    character.bones.right_forearm.rotation.set(degToRad(-45), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- RIGHT HAND ----- */
    character.bones.right_hand.rotation.set(degToRad(-15), degToRad(30), degToRad(0));
    character.bones.right_hand_roll.rotation.set(degToRad(-15), degToRad(30), degToRad(0));

    character.bones.right_finger1_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.right_finger1_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.right_finger2_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.right_finger2_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.right_finger3_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.right_finger3_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.right_finger4_1.rotation.set(degToRad(-80), degToRad(0), degToRad(0));
    character.bones.right_finger4_2.rotation.set(degToRad(-90), degToRad(0), degToRad(0));
    character.bones.right_thumb_1.rotation.set(degToRad(90), degToRad(90), degToRad(-100));
    character.bones.right_thumb_2.rotation.set(degToRad(-110), degToRad(0), degToRad(0));
    /* ----- ----- ----- */

    /* ----- LEFT LEG ----- */
    character.bones.left_thigh.rotation.set(degToRad(180), degToRad(0), degToRad(-5));
    character.bones.left_calf.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    character.bones.left_foot.rotation.set(degToRad(-58), degToRad(-5), degToRad(0));
    /* ----- ----- ----- */

    /* ----- RIGHT LEG ----- */
    character.bones.right_thigh.rotation.set(degToRad(0), degToRad(0), degToRad(-5));
    character.bones.right_calf.rotation.set(degToRad(0), degToRad(0), degToRad(0));
    character.bones.right_foot.rotation.set(degToRad(-58), degToRad(-5), degToRad(0));
    /* ----- ----- ----- */

}


function characterRunAnimation() {

    characterReset(character);


    sound1.stop();
    if(settings.environment == "grassland") {
        if(character.name == "mario") {
            playSound(sounds.mario.run.sound, 1, 0.8, true, settings, sound1);
        }
        if(character.name == "luigi") {
            playSound(sounds.luigi.run.sound, 1, 0.8, true, settings, sound1);
        }
    }
    if(settings.environment == "cave") {
        if(character.name == "mario") {
            playSound(sounds.mario.run.sound, 1, 0.8, true, settings, sound1);
        }
        if(character.name == "luigi") {
            playSound(sounds.luigi.run.sound, 1, 0.8, true, settings, sound1);
        }
    }
    if(settings.environment == "space") {
        if(character.name == "mario") {
            playSound(sounds.mario.run3.sound, 1, 0.8, true, settings, sound1);
        }
        if(character.name == "luigi") {
            playSound(sounds.luigi.run3.sound, 1, 0.8, true, settings, sound1);
        }
    }

    var animationTime = character.runAnimationTime;
    character.bones.spine.rotation.x = degToRad(20);
    character.bones.head.rotation.x = degToRad(-10);

    /* ----- SPINE MOVEMENT ----- */
    var spineMaxAngle = 50;

    var spineRotationStart = {x:0, y:spineMaxAngle, z:0};
    var spineTweenStart = new TWEEN.Tween(spineRotationStart)
    .to({x:0, y:-spineMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.spine.rotation.y = degToRad(spineRotationStart.y);
    })
    .start();

    var spineRotationEnd = {x:0, y:-spineMaxAngle, z:0};
    var spineTweenEnd = new TWEEN.Tween(spineRotationEnd)
    .to({x:0, y:spineMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.spine.rotation.y = degToRad(spineRotationEnd.y);
    })
    .start();

    spineTweenStart.chain(spineTweenEnd);
    spineTweenEnd.chain(spineTweenStart);
    /* ----- ----- ----- */

    /* ----- HEAD MOVEMENT ----- */
    var headMaxAngleY = -45;
    var headMaxAngleZ = 20;

    var headRotationStart = {x:0, y:headMaxAngleY, z:-headMaxAngleZ};
    var headTweenStart = new TWEEN.Tween(headRotationStart)
    .to({x:0, y:-headMaxAngleY, z:headMaxAngleZ}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.head.rotation.y = degToRad(headRotationStart.y);
        character.bones.head.rotation.z = degToRad(headRotationStart.z);
    })
    .start();

    var headRotationEnd = {x:0, y:-headMaxAngleY, z:headMaxAngleZ};
    var headTweenEnd = new TWEEN.Tween(headRotationEnd)
    .to({x:0, y:headMaxAngleY, z:-headMaxAngleZ}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.head.rotation.y = degToRad(headRotationEnd.y);
        character.bones.head.rotation.z = degToRad(headRotationEnd.z);
    })
    .start();

    headTweenStart.chain(headTweenEnd);
    headTweenEnd.chain(headTweenStart);
    /* ----- ----- ----- */

    /* ----- PELVIS MOVEMENT ----- */
    var pelvisMaxAngle = -10;

    var pelvisRotationStart = {x:0, y:pelvisMaxAngle, z:0};
    var pelvisTweenStart = new TWEEN.Tween(pelvisRotationStart)
    .to({x:0, y:-pelvisMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationStart.y);
    })
    .start();

    var pelvisRotationEnd = {x:0, y:-pelvisMaxAngle, z:0};
    var pelvisTweenEnd = new TWEEN.Tween(pelvisRotationEnd)
    .to({x:0, y:pelvisMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationEnd.y);
    })
    .start();

    pelvisTweenStart.chain(pelvisTweenEnd);
    pelvisTweenEnd.chain(pelvisTweenStart);
    /* ----- ----- ----- */

    /* ----- ARMS MOVEMENT ----- */
    var upperArmMaxAngleX = 30;
    var upperArmMaxAngleY = 50;

    var upperArmRotationStart = {x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:0};
    var upperArmTweenStart = new TWEEN.Tween(upperArmRotationStart)
    .to({x:-upperArmMaxAngleX, y:-upperArmMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationStart.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationStart.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationStart.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationStart.y);
    })
    .start();

    var upperArmRotationEnd = {x:-upperArmMaxAngleX, y:-upperArmMaxAngleY, z:0};
    var upperArmTweenEnd = new TWEEN.Tween(upperArmRotationEnd)
    .to({x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationEnd.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationEnd.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationEnd.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationEnd.y);
    })
    .start();

    upperArmTweenStart.chain(upperArmTweenEnd);
    upperArmTweenEnd.chain(upperArmTweenStart);
    /* ----- ----- ----- */

    /* ----- LEGS MOVEMENT ----- */

    /* THIGH */
    var thighMaxAngle = -50;

    var thighRotationStart = {x:thighMaxAngle, y:0, z:0};
    var thighTweenStart = new TWEEN.Tween(thighRotationStart)
    .to({x:-thighMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationStart.x);
        character.bones.right_thigh.rotation.x = degToRad(-thighRotationStart.x);
    })
    .start();

    var thighRotationEnd = {x:-thighMaxAngle, y:0, z:0};
    var thighTweenEnd = new TWEEN.Tween(thighRotationEnd)
    .to({x:thighMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationEnd.x);
        character.bones.right_thigh.rotation.x = degToRad(-thighRotationEnd.x);
    })
    .start();

    thighTweenStart.chain(thighTweenEnd);
    thighTweenEnd.chain(thighTweenStart);
    /* ----- */

    /* CALF */
    var calfMaxAngle = -50;

    var calfRotationStart = {x:-calfMaxAngle, y:0, z:0};
    var calfTweenStart = new TWEEN.Tween(calfRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationStart.x));
        character.bones.right_calf.rotation.x = degToRad(calfRotationStart.x);
    })
    .start();

    var calfRotationEnd = {x:0, y:0, z:0};
    var calfTweenEnd = new TWEEN.Tween(calfRotationEnd)
    .to({x:-calfMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationEnd.x));
        character.bones.right_calf.rotation.x = degToRad(calfRotationEnd.x);
    })
    .start();

    calfTweenStart.chain(calfTweenEnd);
    calfTweenEnd.chain(calfTweenStart);
    /* ----- */

    /* ----- ----- ----- */

    /* ----- BODY MOVEMENT ----- */
    var bodyMaxPosition = 0.5;

    var bodyPositionStart = {x:0, y:0, z:0};
    var bodyTweenStart = new TWEEN.Tween(bodyPositionStart)
    .to({x:0, y:bodyMaxPosition, z:0}, animationTime/2)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.mesh.position.y = bodyPositionStart.y;
    })
    .start();

    var bodyPositionEnd = {x:0, y:bodyMaxPosition, z:0};
    var bodyTweenEnd = new TWEEN.Tween(bodyPositionEnd)
    .to({x:0, y:0, z:0}, animationTime/2)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.mesh.position.y = bodyPositionEnd.y;
    })
    .start();

    bodyTweenStart.chain(bodyTweenEnd);
    bodyTweenEnd.chain(bodyTweenStart);
    /* ----- ----- ----- */

    characterRunningAnimationTweens.push(spineTweenStart, spineTweenEnd);
    characterRunningAnimationTweens.push(headTweenStart, headTweenEnd);
    characterRunningAnimationTweens.push(pelvisTweenStart, pelvisTweenEnd);
    characterRunningAnimationTweens.push(upperArmTweenStart, upperArmTweenEnd);
    characterRunningAnimationTweens.push(thighTweenStart, thighTweenEnd);
    characterRunningAnimationTweens.push(calfTweenStart, calfTweenEnd);
    characterRunningAnimationTweens.push(bodyTweenStart, bodyTweenEnd);

    characterCurrentAnimationTweens = [];
    characterCurrentAnimationTweens.push(spineTweenStart, spineTweenEnd);
    characterCurrentAnimationTweens.push(headTweenStart, headTweenEnd);
    characterCurrentAnimationTweens.push(pelvisTweenStart, pelvisTweenEnd);
    characterCurrentAnimationTweens.push(upperArmTweenStart, upperArmTweenEnd);
    characterCurrentAnimationTweens.push(thighTweenStart, thighTweenEnd);
    characterCurrentAnimationTweens.push(calfTweenStart, calfTweenEnd);
    characterCurrentAnimationTweens.push(bodyTweenStart, bodyTweenEnd);

}


function characterSlideAnimation() {

    characterReset(character);

    var animationTime = character.slideAnimationTime;
    var delay = animationTime*3;

    /* ----- SPINE MOVEMENT ----- */
    var spineMaxAngleX = 50;
    var spineMaxAngleY = 50;

    var spineRotationStart = {x:spineMaxAngleX, y:spineMaxAngleY, z:0};
    var spineTweenStart = new TWEEN.Tween(spineRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.spine.rotation.x = degToRad(spineRotationStart.x);
        character.bones.spine.rotation.y = degToRad(spineRotationStart.y);
    })
    .start();

    var spineRotationEnd = {x:0, y:-spineMaxAngleY, z:0};
    var spineTweenEnd = new TWEEN.Tween(spineRotationEnd)
    .to({x:spineMaxAngleX, y:spineMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.spine.rotation.x = degToRad(spineRotationEnd.x);
        character.bones.spine.rotation.y = degToRad(spineRotationEnd.y);
    })
    .start();

    spineTweenEnd.chain(spineTweenStart);
    spineTweenStart.delay(delay);
    /* ----- ----- ----- */

    /* ----- HEAD MOVEMENT ----- */
    var headMaxAngleX = 30;
    var headMaxAngleY = 40;

    var headRotationStart = {x:headMaxAngleX, y:-headMaxAngleY, z:0};
    var headTweenStart = new TWEEN.Tween(headRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.head.rotation.x = degToRad(headRotationStart.x);
        character.bones.head.rotation.y = degToRad(headRotationStart.y);
    })
    .start();

    var headRotationEnd = {x:0, y:0, z:0};
    var headTweenEnd = new TWEEN.Tween(headRotationEnd)
    .to({x:headMaxAngleX, y:-headMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.head.rotation.x = degToRad(headRotationEnd.x);
        character.bones.head.rotation.y = degToRad(headRotationEnd.y);
    })
    .start();

    headTweenEnd.chain(headTweenStart);
    headTweenStart.delay(delay);
    /* ----- ----- ----- */

    /* ----- ARMS MOVEMENT ----- */
    var upperArmMaxAngleX = 30;
    var upperArmMaxAngleY = 50;

    var upperArmRotationStart = {x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:0};
    var upperArmTweenStart = new TWEEN.Tween(upperArmRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationStart.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationStart.x/8);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationStart.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationStart.y/8);
    })
    .start();

    var upperArmRotationEnd = {x:0, y:0, z:0};
    var upperArmTweenEnd = new TWEEN.Tween(upperArmRotationEnd)
    .to({x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationEnd.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationEnd.x/8);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationEnd.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationEnd.y/8);
    })
    .start();

    upperArmTweenEnd.chain(upperArmTweenStart);
    upperArmTweenStart.delay(delay);
    /* ----- ----- ----- */

    /* ----- FINGERS MOVEMENT ----- */
    var finger1MaxAngleX = -80;
    var finger2MaxAngleX = -90;

    var thumb1MaxAngleX = 90;
    var thumb1MaxAngleY = 90;
    var thumb1MaxAngleZ = -100;
    var thumb2MaxAngleX = -110;

    /* ----- FINGER 1 ----- */
    var finger1RotationStart = {x:0, y:0, z:0};
    var finger1TweenStart = new TWEEN.Tween(finger1RotationStart)
    .to({x:finger1MaxAngleX, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_finger1_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.left_finger2_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.left_finger3_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.left_finger4_1.rotation.x = degToRad(finger1RotationStart.x);

        character.bones.right_finger1_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.right_finger2_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.right_finger3_1.rotation.x = degToRad(finger1RotationStart.x);
        character.bones.right_finger4_1.rotation.x = degToRad(finger1RotationStart.x);
    })
    .start();

    var finger1RotationEnd = {x:finger1MaxAngleX, y:0, z:0};
    var finger1TweenEnd = new TWEEN.Tween(finger1RotationEnd)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_finger1_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.left_finger2_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.left_finger3_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.left_finger4_1.rotation.x = degToRad(finger1RotationEnd.x);

        character.bones.right_finger1_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.right_finger2_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.right_finger3_1.rotation.x = degToRad(finger1RotationEnd.x);
        character.bones.right_finger4_1.rotation.x = degToRad(finger1RotationEnd.x);
    })
    .start();

    finger1TweenEnd.chain(finger1TweenStart);
    finger1TweenStart.delay(delay);
    /* ----- */

    /* ----- FINGER 2 ----- */
    var finger2RotationStart = {x:0, y:0, z:0};
    var finger2TweenStart = new TWEEN.Tween(finger2RotationStart)
    .to({x:finger2MaxAngleX, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_finger1_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.left_finger2_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.left_finger3_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.left_finger4_2.rotation.x = degToRad(finger2RotationStart.x);

        character.bones.right_finger1_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.right_finger2_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.right_finger3_2.rotation.x = degToRad(finger2RotationStart.x);
        character.bones.right_finger4_2.rotation.x = degToRad(finger2RotationStart.x);
    })
    .start();

    var finger2RotationEnd = {x:finger2MaxAngleX, y:0, z:0};
    var finger2TweenEnd = new TWEEN.Tween(finger2RotationEnd)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_finger1_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.left_finger2_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.left_finger3_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.left_finger4_2.rotation.x = degToRad(finger2RotationEnd.x);

        character.bones.right_finger1_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.right_finger2_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.right_finger3_2.rotation.x = degToRad(finger2RotationEnd.x);
        character.bones.right_finger4_2.rotation.x = degToRad(finger2RotationEnd.x);
    })
    .start();

    finger2TweenEnd.chain(finger2TweenStart);
    finger2TweenStart.delay(delay);
    /* ----- */

    /* ----- THUMB 1 ----- */
    var thumb1RotationStart = {x:0, y:0, z:-30};
    var thumb1TweenStart = new TWEEN.Tween(thumb1RotationStart)
    .to({x:thumb1MaxAngleX, y:thumb1MaxAngleY, z:thumb1MaxAngleZ}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_thumb_1.rotation.x = degToRad(thumb1RotationStart.x);
        character.bones.right_thumb_1.rotation.x = degToRad(thumb1RotationStart.x);

        character.bones.left_thumb_1.rotation.y = degToRad(thumb1RotationStart.y);
        character.bones.right_thumb_1.rotation.y = degToRad(thumb1RotationStart.y);

        character.bones.left_thumb_1.rotation.z = degToRad(thumb1RotationStart.z);
        character.bones.right_thumb_1.rotation.z = degToRad(thumb1RotationStart.z);
    })
    .start();

    var thumb1RotationEnd = {x:thumb1MaxAngleX, y:thumb1MaxAngleY, z:thumb1MaxAngleZ};
    var thumb1TweenEnd = new TWEEN.Tween(thumb1RotationEnd)
    .to({x:0, y:0, z:-30}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_thumb_1.rotation.x = degToRad(thumb1RotationEnd.x);
        character.bones.right_thumb_1.rotation.x = degToRad(thumb1RotationEnd.x);

        character.bones.left_thumb_1.rotation.y = degToRad(thumb1RotationEnd.y);
        character.bones.right_thumb_1.rotation.y = degToRad(thumb1RotationEnd.y);

        character.bones.left_thumb_1.rotation.z = degToRad(thumb1RotationEnd.z);
        character.bones.right_thumb_1.rotation.z = degToRad(thumb1RotationEnd.z);
    })
    .start();

    thumb1TweenEnd.chain(thumb1TweenStart);
    thumb1TweenStart.delay(delay);
    /* ----- */

    /* ----- THUMB 2 ----- */
    var thumb2RotationStart = {x:0, y:0, z:0};
    var thumb2TweenStart = new TWEEN.Tween(thumb2RotationStart)
    .to({x:thumb2MaxAngleX, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_thumb_2.rotation.x = degToRad(thumb2RotationStart.x);
        character.bones.right_thumb_2.rotation.x = degToRad(thumb2RotationStart.x);
    })
    .start();

    var thumb2RotationEnd = {x:thumb2MaxAngleX, y:0, z:0};
    var thumb2TweenEnd = new TWEEN.Tween(thumb2RotationEnd)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function() {
        character.bones.left_thumb_2.rotation.x = degToRad(thumb2RotationEnd.x);
        character.bones.right_thumb_2.rotation.x = degToRad(thumb2RotationEnd.x);
    })
    .start();

    thumb2TweenEnd.chain(thumb2TweenStart);
    thumb2TweenStart.delay(delay);
    /* ----- */

    /* ----- ----- ----- */

    /* ----- HAND MOVEMENT ----- */
    var handMaxAngle = 30;

    var handAngleStart = {x:handMaxAngle, y:0, z:0};
    var handTweenStart = new TWEEN.Tween(handAngleStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_hand.rotation.x = degToRad(handAngleStart.x);
        character.bones.right_hand.rotation.x = degToRad(handAngleStart.x);

    })
    .start();

    var handAngleEnd = {x:0, y:0, z:0};
    var handTweenEnd = new TWEEN.Tween(handAngleEnd)
    .to({x:handMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_hand.rotation.x = degToRad(handAngleEnd.x);
        character.bones.right_hand.rotation.x = degToRad(handAngleEnd.x);
    })
    .start();

    handTweenEnd.chain(handTweenStart);
    handTweenStart.delay(delay);
    /* ----- ----- ----- */

    /* ----- HAND ROLL MOVEMENT ----- */
    var handRollMaxAngle = 30;

    var handRollAngleStart = {x:handRollMaxAngle, y:0, z:0};
    var handRollTweenStart = new TWEEN.Tween(handRollAngleStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_hand_roll.rotation.x = degToRad(handRollAngleStart.x);
        character.bones.right_hand_roll.rotation.x = degToRad(handRollAngleStart.x);

    })
    .start();

    var handRollAngleEnd = {x:0, y:0, z:0};
    var handRollTweenEnd = new TWEEN.Tween(handRollAngleEnd)
    .to({x:handRollMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.bones.left_hand_roll.rotation.x = degToRad(handRollAngleEnd.x);
        character.bones.right_hand_roll.rotation.x = degToRad(handRollAngleEnd.x);
    })
    .start();

    handRollTweenEnd.chain(handRollTweenStart);
    handRollTweenStart.delay(delay);
    /* ----- ----- ----- */

    /* ----- BODY MOVEMENT ----- */
    var bodyMaxAngle = 60;

    var bodyAngleStart = {x:bodyMaxAngle, y:0, z:0};
    var bodyTweenStart = new TWEEN.Tween(bodyAngleStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.mesh.rotation.x = degToRad(bodyAngleStart.x);
    });

    var bodyAngleEnd = {x:0, y:0, z:0};
    var bodyTweenEnd = new TWEEN.Tween(bodyAngleEnd)
    .to({x:bodyMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        character.mesh.rotation.x = degToRad(bodyAngleEnd.x);
    })
    .start();

    bodyTweenEnd.chain(bodyTweenStart);
    bodyTweenStart.delay(delay);
    /* ----- ----- ----- */

    bodyTweenStart.onComplete(function() {
        characterSlideStop();
    });

    // characterCurrentAnimationTweens = [];
    characterCurrentAnimationTweens.push(spineTweenStart, spineTweenEnd);
    characterCurrentAnimationTweens.push(headTweenStart, headTweenEnd);
    characterCurrentAnimationTweens.push(upperArmTweenStart, upperArmTweenEnd);
    characterCurrentAnimationTweens.push(finger1TweenStart, finger1TweenEnd);
    characterCurrentAnimationTweens.push(finger2TweenStart, finger2TweenEnd);
    characterCurrentAnimationTweens.push(thumb1TweenStart, thumb1TweenEnd);
    characterCurrentAnimationTweens.push(thumb2TweenStart, thumb2TweenEnd);
    characterCurrentAnimationTweens.push(handTweenStart, handTweenEnd);
    characterCurrentAnimationTweens.push(handRollTweenStart, handRollTweenEnd);
    characterCurrentAnimationTweens.push(bodyTweenStart, bodyTweenEnd);

}


function characterJumpAnimation() {

    // characterReset();

    var animationTime = character.jumpAnimationTime;

    /* ----- SPINE MOVEMENT ----- */
    var spineMaxAngle = 20;

    var spineRotationStart = {x:0, y:spineMaxAngle, z:0};
    var spineTweenStart = new TWEEN.Tween(spineRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.spine.rotation.y = degToRad(spineRotationStart.y);
    })
    .start();

    var spineRotationEnd = {x:0, y:0, z:0};
    var spineTweenEnd = new TWEEN.Tween(spineRotationEnd)
    .to({x:0, y:spineMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.spine.rotation.y = degToRad(spineRotationEnd.y);
    })
    .start();

    spineTweenEnd.chain(spineTweenStart);
    /* ----- ----- ----- */

    /* ----- PELVIS MOVEMENT ----- */
    var pelvisMaxAngle = 5;

    var pelvisRotationStart = {x:0, y:pelvisMaxAngle, z:0};
    var pelvisTweenStart = new TWEEN.Tween(pelvisRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationStart.y);
    })
    .start();

    var pelvisRotationEnd = {x:0, y:0, z:0};
    var pelvisTweenEnd = new TWEEN.Tween(pelvisRotationEnd)
    .to({x:0, y:pelvisMaxAngle, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.pelvis.rotation.y = degToRad(pelvisRotationEnd.y);
    })
    .start();

    pelvisTweenEnd.chain(pelvisTweenStart);
    /* ----- ----- ----- */

    /* ----- HEAD MOVEMENT ----- */
    var headMaxAngleX = 10;
    var headMaxAngleY = 35;

    var headRotationStart = {x:headMaxAngleX, y:-headMaxAngleY, z:0};
    var headTweenStart = new TWEEN.Tween(headRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.head.rotation.x = degToRad(headRotationStart.x);
        character.bones.head.rotation.y = degToRad(headRotationStart.y);
    })
    .start();

    var headRotationEnd = {x:0, y:0, z:0};
    var headTweenEnd = new TWEEN.Tween(headRotationEnd)
    .to({x:headMaxAngleX, y:-headMaxAngleY, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.head.rotation.x = degToRad(headRotationEnd.x);
        character.bones.head.rotation.y = degToRad(headRotationEnd.y);
    })
    .start();

    headTweenEnd.chain(headTweenStart);
    /* ----- ----- ----- */

    /* ----- CAP MOVEMENT ----- */
    var capMaxAngle = -8;

    var capAngleStart = {x:capMaxAngle, y:0, z:0};
    var capTweenStart = new TWEEN.Tween(capAngleStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.cap.rotation.x = degToRad(capAngleStart.x);
    })
    .start();

    var capAngleEnd = {x:0, y:0, z:0};
    var capTweenEnd = new TWEEN.Tween(capAngleEnd)
    .to({x:capMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.cap.rotation.x = degToRad(capAngleEnd.x);
    })
    .start();

    capTweenEnd.chain(capTweenStart);
    /* ----- ----- ----- */

    /* ----- ARMS MOVEMENT ----- */
    var upperArmMaxAngleX = 30;
    var upperArmMaxAngleY = 50;
    var upperArmMaxAngleZ = 50;

    var upperArmRotationStart = {x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:upperArmMaxAngleZ};
    var upperArmTweenStart = new TWEEN.Tween(upperArmRotationStart)
    .to({x:0, y:0, z:-35}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationStart.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationStart.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationStart.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationStart.y);
        character.bones.right_upperarm.rotation.z = degToRad(-upperArmRotationStart.z);
    })
    .start();

    var upperArmRotationEnd = {x:0, y:0, z:-35};
    var upperArmTweenEnd = new TWEEN.Tween(upperArmRotationEnd)
    .to({x:upperArmMaxAngleX, y:upperArmMaxAngleY, z:upperArmMaxAngleZ}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_upperarm.rotation.x = degToRad(upperArmRotationEnd.x);
        character.bones.right_upperarm.rotation.x = degToRad(-upperArmRotationEnd.x);
        character.bones.left_upperarm.rotation.y = degToRad(upperArmRotationEnd.y);
        character.bones.right_upperarm.rotation.y = degToRad(-upperArmRotationEnd.y);
        character.bones.right_upperarm.rotation.z = degToRad(-upperArmRotationEnd.z);
    })
    .start();

    upperArmTweenEnd.chain(upperArmTweenStart);
    /* ----- ----- ----- */

    /* ----- LEGS MOVEMENT ----- */

    /* THIGH */
    var thighMaxAngle = -50;

    var thighRotationStart = {x:thighMaxAngle, y:0, z:0};
    var thighTweenStart = new TWEEN.Tween(thighRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationStart.x);
        character.bones.right_thigh.rotation.x = degToRad(-thighRotationStart.x);
    })
    .start();

    var thighRotationEnd = {x:0, y:0, z:0};
    var thighTweenEnd = new TWEEN.Tween(thighRotationEnd)
    .to({x:thighMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_thigh.rotation.x = degToRad(180+thighRotationEnd.x);
        character.bones.right_thigh.rotation.x = degToRad(-thighRotationEnd.x);
    })
    .start();

    thighTweenEnd.chain(thighTweenStart);
    /* ----- */

    /* CALF */
    var calfMaxAngle = -50;

    var calfRotationStart = {x:-calfMaxAngle, y:0, z:0};
    var calfTweenStart = new TWEEN.Tween(calfRotationStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationStart.x));
        character.bones.right_calf.rotation.x = degToRad(calfRotationStart.x);
    })
    .start();

    var calfRotationEnd = {x:0, y:0, z:0};
    var calfTweenEnd = new TWEEN.Tween(calfRotationEnd)
    .to({x:-calfMaxAngle, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.bones.left_calf.rotation.x = degToRad(-(calfMaxAngle+calfRotationEnd.x));
        character.bones.right_calf.rotation.x = degToRad(calfRotationEnd.x);
    })
    .start();

    calfTweenEnd.chain(calfTweenStart);
    /* ----- */

    /* ----- ----- ----- */

    /* ----- BODY MOVEMENT ----- */
    var bodyMaxPosition = character.jumpHeight;

    var bodyPositionStart = {x:0, y:bodyMaxPosition, z:0};
    var bodyTweenStart = new TWEEN.Tween(bodyPositionStart)
    .to({x:0, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.In)
    .onUpdate(function() {
        character.mesh.position.y = bodyPositionStart.y;
    });

    var bodyPositionEnd = {x:0, y:0, z:0};
    var bodyTweenEnd = new TWEEN.Tween(bodyPositionEnd)
    .to({x:0, y:bodyMaxPosition, z:0}, animationTime)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function() {
        character.mesh.position.y = bodyPositionEnd.y;
    })
    .start();

    bodyTweenEnd.chain(bodyTweenStart);
    /* ----- ----- ----- */

    bodyTweenStart.onComplete(function() {
        characterJumpStop();
    });

    // characterCurrentAnimationTweens = [];
    characterCurrentAnimationTweens.push(spineTweenStart, spineTweenEnd);
    characterCurrentAnimationTweens.push(pelvisTweenStart, pelvisTweenEnd);
    characterCurrentAnimationTweens.push(headTweenStart, headTweenEnd);
    characterCurrentAnimationTweens.push(capTweenStart, capTweenEnd);
    characterCurrentAnimationTweens.push(upperArmTweenStart, upperArmTweenEnd);
    characterCurrentAnimationTweens.push(thighTweenStart, thighTweenEnd);
    characterCurrentAnimationTweens.push(calfTweenStart, calfTweenEnd);
    characterCurrentAnimationTweens.push(bodyTweenStart, bodyTweenEnd);

}


function moveCharacterTo(direction) {

    var animationTime = character.moveAnimationTime;

    var finalPosition = character.currentPosition + character.horizontalMovement*direction;

    // LEGAL MOVEMENT
    if(-character.horizontalMovement <= finalPosition && finalPosition <= character.horizontalMovement) {

        character.currentPosition = finalPosition;

        /* ----- BODY MOVEMENT ----- */
        var bodyPositionStart = {x:character.mesh.position.x, y:0, z:0};
        var bodyTweenStart = new TWEEN.Tween(bodyPositionStart)
        .to({x:finalPosition, y:0, z:0}, animationTime)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function() {
            character.mesh.position.x = bodyPositionStart.x;
        })
        .start();
        /* ----- ----- ----- */

        characterCurrentAnimationTweens.push(bodyTweenStart);

    }

    // ILLEGAL MOVEMENT
    else {

        /* ----- BODY MOVEMENT ----- */
        var outsidePosition = 0.65*finalPosition;

        var bodyPositionStart = {x:outsidePosition, y:0, z:0};
        var bodyTweenStart = new TWEEN.Tween(bodyPositionStart)
        .to({x:character.currentPosition, y:0, z:0}, animationTime/2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function() {
            character.mesh.position.x = bodyPositionStart.x;
        });

        var bodyPositionEnd = {x:character.mesh.position.x, y:0, z:0};
        var bodyTweenEnd = new TWEEN.Tween(bodyPositionEnd)
        .to({x:outsidePosition, y:0, z:0}, animationTime/2)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function() {
            character.mesh.position.x = bodyPositionEnd.x;
        })
        .start();

        bodyTweenEnd.chain(bodyTweenStart);
        /* ----- ----- ----- */

        sound2.stop();
        if(character.name == "mario") {
            playSound(sounds.mario.invalid_movement.sound, 1, 0.8, false, settings, sound2);
        }
        if(character.name == "luigi") {
            playSound(sounds.luigi.invalid_movement.sound, 1, 0.8, false, settings, sound2);
        }

        characterCurrentAnimationTweens.push(bodyTweenEnd);

    }

}


var damageCount = 0;
function characterDamageAnimation() {

    settings.invincible = true;

    var num = 5;
    var animationTime = character.damageAnimationTime;

    var intervalID = setInterval(function() {
        if(!settings.gamePaused && settings.inGame) {
            character.mesh.visible = !character.mesh.visible;
            if(damageCount < num) {
                damageCount++;
            }
            else {
                clearInterval(intervalID);
                damageCount = 0;
                character.mesh.visible = true;
                settings.invincible = false;
    
                console.log("DAMAGE FINISHED")
    
                return;
            }
        }
        else if(!settings.inGame) {
            clearInterval(intervalID);
            damageCount = 0;
            character.mesh.visible = true;
            settings.invincible = false;

            console.log("NOT IN GAME - DAMAGE FINISHED")
    
            return;
        }
        
    }, animationTime);
}

    
var starCount = 0;
function characterStarAnimation() {

    settings.invincible = true;
    settings.star = true;
    music.stop();
    playMusic(sounds.music.star.sound, 1, settings, music);

    starCount = 0;
    var localCount = 0;
    var num = 100;
    var animationTime = character.starAnimationTime;

    var intervalID = setInterval(function() {
        if(!settings.gamePaused && settings.inGame) {
            character.mesh.visible = !character.mesh.visible;
            if(starCount < num) {
                if(starCount != localCount) {
                    clearInterval(intervalID);
                    console.log("STAR OVERLAPPED")
                    return;
                }
                starCount++;
                localCount++;
            }
            else {
                clearInterval(intervalID);
                // starCount = 0;
                character.mesh.visible = true;
                settings.invincible = false;
                settings.star = false;
                
                music.pause();
                if(settings.environment == "grassland") {
                    playMusic(sounds.music.grassland.sound, 0.5, settings, music);
                }
                if(settings.environment == "cave") {
                    playMusic(sounds.music.cave.sound, 0.5, settings, music);
                }
                if(settings.environment == "space") {
                    playMusic(sounds.music.space.sound, 0.5, settings, music);
                }

                console.log("STAR FINISHED")
    
                return;
            }
        }
        else if(!settings.inGame) {
            clearInterval(intervalID);
            // starCount = 0;
            character.mesh.visible = true;
            settings.invincible = false;
            settings.star = false;
            
            music.pause();
            if(settings.environment == "grassland") {
                playMusic(sounds.music.grassland.sound, 0.5, settings, music);
            }
            if(settings.environment == "cave") {
                playMusic(sounds.music.cave.sound, 0.5, settings, music);
            }
            if(settings.environment == "space") {
                playMusic(sounds.music.space.sound, 0.5, settings, music);
            }

            console.log("NOT IN GAME - STAR FINISHED")

            return;
        }
        
    }, animationTime);

}


/* ----- ----- ----- ----- */



export function initCharacterKeybordEventListeners() {

    document.onkeydown = function(e) {

        switch(e.key) {

            case "w":
            case "W":
            case "ArrowUp":
                characterJumpHandler();
                break;

            case "a":
            case "A":
            case "ArrowLeft":
                moveCharacterTo(-1);
                break;

            case "s":
            case "S":
            case "ArrowDown":
                characterSlideHandler();
                break;

            case "d":
            case "D":
            case "ArrowRight":
                moveCharacterTo(1);
                break;

            case "Escape":
            case " ":
                pauseCharacterGame();
                break;

            default:
                console.log(e.key)

        }
    }
}

export function pauseCharacterGame() {

    if(!settings.gamePaused && settings.inGame) {
        settings.gamePaused = true;
        document.getElementById("menuPause-screen-wrapper").hidden = false;
        document.getElementById("menuPause-wrapper").hidden = false;
        
        pauseAllTweens(characterCurrentAnimationTweens);
        pauseAllTweens(characterMovingAnimationTweens);

        music.pause();
        if(settings.star) {
            playMusic(sounds.music.star.sound, 0.2, settings, music);
        }
        else {
            if(settings.environment == "grassland") {
                playMusic(sounds.music.grassland.sound, 0.1, settings, music);
            }
            if(settings.environment == "cave") {
                playMusic(sounds.music.cave.sound, 0.1, settings, music);
            }
            if(settings.environment == "space") {
                playMusic(sounds.music.space.sound, 0.1, settings, music);
            }
        }
        if(!settings.playMusic) {
            music.pause();
        }

        sound1.pause();
        sound2.pause();

        document.onkeydown = function(e) {
            switch(e.key) {
                case "Escape":
                case " ":
                    pauseCharacterGame();
                    break;

                default:
                    console.log(e.key)
            }
        }
    }
    else if(settings.gamePaused && settings.inGame) {
        settings.gamePaused = false;
        initCharacterKeybordEventListeners();
        document.getElementById("menuPause-screen-wrapper").hidden = true;
        document.getElementById("menuPause-wrapper").hidden = true;

        resumeAllTweens(characterCurrentAnimationTweens);
        resumeAllTweens(characterMovingAnimationTweens);

        music.pause();
        if(settings.star) {
            playMusic(sounds.music.star.sound, 1, settings, music);
        }
        else {
            if(settings.environment == "grassland") {
                playMusic(sounds.music.grassland.sound, 0.5, settings, music);
            }
            if(settings.environment == "cave") {
                playMusic(sounds.music.cave.sound, 0.5, settings, music);
            }
            if(settings.environment == "space") {
                playMusic(sounds.music.space.sound, 0.5, settings, music);
            }
        }
        if(settings.playSound) {
            sound1.play();

            if(!(character.isSliding || character.isJumping)) {
                sound1.stop();
                if(settings.environment == "grassland") {
                    if(character.name == "mario") {
                        playSound(sounds.mario.run.sound, 1, 0.8, true, settings, sound1);
                    }
                    if(character.name == "luigi") {
                        playSound(sounds.luigi.run.sound, 1, 0.8, true, settings, sound1);
                    }
                }
                if(settings.environment == "cave") {
                    if(character.name == "mario") {
                        playSound(sounds.mario.run.sound, 1, 0.8, true, settings, sound1);
                    }
                    if(character.name == "luigi") {
                        playSound(sounds.luigi.run.sound, 1, 0.8, true, settings, sound1);
                    }
                }
                if(settings.environment == "space") {
                    if(character.name == "mario") {
                        playSound(sounds.mario.run3.sound, 1, 0.8, true, settings, sound1);
                    }
                    if(character.name == "luigi") {
                        playSound(sounds.luigi.run3.sound, 1, 0.8, true, settings, sound1);
                    }
                }
            }
        }
    }
    else {
        // do nothing - NOT in game
    }


}


function gameOver() {

    // settings.gamePaused = true;
    document.getElementById("menuPause-screen-wrapper").hidden = false;
    document.getElementById("menuGameOver-wrapper").hidden = false;
    
    pauseAllTweens(characterCurrentAnimationTweens);
    pauseAllTweens(characterMovingAnimationTweens);

    music.pause();
    playMusic(sounds.music.game_over.sound, 1, settings, music);
    if(!settings.playMusic) {
        music.pause();
    }

    sound1.pause();
    sound2.pause();

    playSound(sounds.general.game_over.sound, 1, 1, false, settings, sound1);
    if(!settings.playSound) {
        sound1.pause();
    }

    document.onkeydown = function(e) {
        switch(e.key) {  
            default:
                console.log(e.key)
        }
    }

}



function initTile(scene, num) {

    // console.log("ACTIVE COLLISION BOXES:", activeCollisionBoxes)

    var geometry = new THREE.BoxGeometry(1, 1, 1);

    if(settings.environment == "grassland") {
        var textureRoad = textures.dirt.textureObject;
        var materialRoad = new THREE.MeshStandardMaterial({map: textureRoad});

        var textureSide = textures.grass.textureObject;
        var materialSide = new THREE.MeshStandardMaterial({map: textureSide});
    }
    else if(settings.environment == "cave") {
        var textureRoad = textures.rock1.textureObject;
        var materialRoad = new THREE.MeshStandardMaterial({map: textureRoad});

        var textureSide = textures.rock2.textureObject;
        var materialSide = new THREE.MeshStandardMaterial({map: textureSide});
    }
    else if(settings.environment == "space") {
        var textureRoad = textures.cloud.textureObject;
        var materialRoad = new THREE.MeshStandardMaterial({map: textureRoad});

        var textureSide = textures.space.textureObject;
        var materialSide = new THREE.MeshStandardMaterial({map: textureSide});
    }


    for(var k=0; k<num; k++) {

        // generate one tile
        var tile = new THREE.Group();

        if(settings.quality == "high") {
            var meshWidth = 5;
            var meshHeight = 1;
            var meshDepth = 5;
            var jMax = 17;
            var iMax = 19;
            var iMin = 1;
        }
        else {
            if(settings.quality == "medium") {
                var meshWidth = 15;
                var meshHeight = 1;
                var meshDepth = 15;
                var jMax = 5;
                var iMax = 6;
                var iMin = 0;

            }
            else {
                if(settings.quality == "low") {
                    var meshWidth = 15;
                    var meshHeight = 1;
                    var meshDepth = 15;
                    var jMax = 5;
                    var iMax = 6;
                    var iMin = 0;
                }
            }
        }


        for(var j=0; j<=jMax; j++) {
            for(var i=-iMax; i<=iMax; i++) {

                // SIDES
                if(i<-iMin||i>iMin) {

                    var mesh = new THREE.Mesh(geometry, materialSide);

                    mesh.scale.set(meshWidth, meshHeight, meshDepth);
                    mesh.position.y = -meshHeight/2;
                    mesh.position.x = i*meshWidth;
                    mesh.position.z = -j*meshDepth - cumulativePosition*meshDepth;
                    mesh.receiveShadow = true;
                    tile.add(mesh);


                    /* useful code to visualize the tiles' borders */
                    var geo = new THREE.EdgesGeometry(geometry);
                    var mat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1});
                    var wireframe = new THREE.LineSegments(geo, mat);
                    wireframe.scale.set(meshWidth, meshHeight, meshDepth);
                    wireframe.position.y = -0.5;
                    wireframe.position.x = i*meshWidth;
                    wireframe.position.z = -j*meshDepth - cumulativePosition*meshDepth;
                    if(settings.dev) {
                        scene.add(wireframe);
                    }
                    /* ------------------ */
                }
                // ROAD
                else {
                    var mesh = new THREE.Mesh(geometry, materialRoad);

                    mesh.scale.set(meshWidth, meshHeight, meshDepth);
                    mesh.position.y = -meshHeight/2;
                    mesh.position.x = i*meshWidth;
                    mesh.position.z = -j*meshDepth - cumulativePosition*meshDepth;
                    mesh.receiveShadow = true;
                    tile.add(mesh);


                    /* useful code to visualize the tiles' borders */
                    var geo = new THREE.EdgesGeometry(geometry);
                    var mat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1});
                    var wireframe = new THREE.LineSegments(geo, mat);
                    wireframe.scale.set(meshWidth, meshHeight, meshDepth);
                    wireframe.position.y = -0.5;
                    wireframe.position.x = i*meshWidth;
                    wireframe.position.z = -j*meshDepth - cumulativePosition*meshDepth;
                    if(settings.dev) {
                        scene.add(wireframe);
                    }
                    /* ------------------ */

                }

            }
        }


        cumulativePosition = cumulativePosition + j;


        // used to not spawn hazards on the first tile
        var flag = (num == 3 && k == 0);
        initObjects(tile, flag);

        scene.add(tile);
        tiles.push(tile);

    }

}



const vertices = [
    new THREE.Vector3(0.5, 0.5, 0.5),
    new THREE.Vector3(0.5, -0.5, 0.5),
    new THREE.Vector3(-0.5, -0.5, 0.5),
    new THREE.Vector3(-0.5, 0.5, 0.5),
    new THREE.Vector3(0.5, 0.5, -0.5),
    new THREE.Vector3(0.5, -0.5, -0.5),
    new THREE.Vector3(-0.5, -0.5, -0.5),
    new THREE.Vector3(-0.5, 0.5, -0.5)
]

function initObjects(tile, flag) {

    var zPosition = -cumulativePosition;
    var offset = 1;
    if(settings.quality!="high") {
        zPosition = zPosition*3;
        offset = 2;
    }
    var mat = initMatrix();

    var rows = mat.length;
    var cols = mat[0].length;
    

    for(var i=rows-1; i>=0; i--) {
        for(var j=cols-1; j>=0; j--) {

            /* ----- MAIN ROAD ----- */

            // if not on the first tile
            if(!flag) {
                if(mat[i][j]=="spike") {
                    var spike = new THREE.Object3D();
                    spike.name = "spike";
    
                    var object = models.spike.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object.scale.set(8, 8, 8);
                    collisionBox.scale.set(5, 2, 5);
    
                    spike.add(object);
                    spike.add(collisionBox);
                    spike.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
    
                    initCollisionVertices(collisionBox);
                    
                    spikeAnimation(spike);
                    tile.add(spike);
                }
                if(mat[i][j]=="roller1") {
                    var roller = new THREE.Object3D();
                    roller.name = "roller";
    
                    var object1 = models.roller.gltf.clone();
                    var object2 = models.roller.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object1.scale.set(2, 2, 2);
                    object1.rotation.z = degToRad(90);
                    object2.scale.set(2, 2, 2);
                    object2.rotation.z = degToRad(-90);
                    object2.position.x = -2;
                    collisionBox.scale.set(14, 2.5, 2.5);
    
                    var rollerGroup = new THREE.Group();
                    rollerGroup.add(object1);
                    rollerGroup.add(object2);
    
                    roller.add(rollerGroup);
                    roller.add(collisionBox);
                    rollerGroup.position.x = 1;
                    roller.position.set(5*(j - Math.floor(cols/2)), 5.5, 5*(zPosition+i+offset));
    
                    initCollisionVertices(collisionBox);
                    
                    rollerHorizontalAnimation(roller);
                    tile.add(roller);
                }
                if(mat[i][j]=="roller2") {
                    var roller = new THREE.Object3D();
                    roller.name = "roller";
    
                    var object = models.roller.gltf.clone();
                    var collisionBox = initCollisionBox();
    
                    object.scale.set(2, 2, 2);
                    collisionBox.scale.set(3, 7.5, 3);
                    collisionBox.position.y = 4;
    
                    roller.add(object);
                    roller.add(collisionBox);
                    roller.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
    
                    initCollisionVertices(collisionBox);
    
                    rollerVerticalAnimation(roller);
                    tile.add(roller);
                }
                if(mat[i][j]=="roller3") {
                    var roller = new THREE.Object3D();
                    roller.name = "roller";
    
                    var object1 = models.roller.gltf.clone();
                    var object2 = models.roller.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object1.scale.set(1.1, 1.1, 1.1);
                    object1.rotation.z = degToRad(90);
                    object2.scale.set(1.1, 1.1, 1.1);
                    object2.rotation.z = degToRad(-90);
                    object2.position.x = -1;
                    collisionBox.scale.set(7.5, 1.3, 1.3);
    
                    var rollerGroup = new THREE.Group();
                    rollerGroup.add(object1);
                    rollerGroup.add(object2);
                    
                    roller.add(rollerGroup);
                    roller.add(collisionBox);
                    rollerGroup.position.x = 0.5;
                    roller.position.set(5*(j - Math.floor(cols/2))+3, 4.7, 5*(zPosition+i+offset));
    
                    initCollisionVertices(collisionBox);
                    
                    rollerHorizontalAnimation(roller);
                    tile.add(roller);
                }
                if(mat[i][j]=="coin") {
                    var coinNumber = randomIntFromInterval(2, 4);
                    var yPosition = randomIntFromInterval(0, 1);
                    for(var y=0; y<coinNumber; y++) {
                        var coin = new THREE.Object3D();
                        coin.name = "coin";
    
                        var object = models.coin.gltf.clone();
                        var collisionBox = initCollisionBox();
                        object.scale.set(10, 10, 10);
                        collisionBox.scale.set(1.5, 3, 3.5);
                        collisionBox.rotation.y = degToRad(90);
    
                        coin.add(object);
                        coin.add(collisionBox);
                        coin.position.set(5*(j - Math.floor(cols/2)), 4*yPosition+2.5, 5*(zPosition+i+offset-y));
    
                        initCollisionVertices(collisionBox);
    
                        coinAnimation(coin);
                        tile.add(coin);
                    }
                }
                if(mat[i][j]=="coinDown") {
                    var coinNumber = randomIntFromInterval(2, 4);
                    for(var y=0; y<coinNumber; y++) {
                        var coin = new THREE.Object3D();
                        coin.name = "coin";
    
                        var object = models.coin.gltf.clone();
                        var collisionBox = initCollisionBox();
                        object.scale.set(10, 10, 10);
                        collisionBox.scale.set(1.5, 3, 3.5);
                        collisionBox.rotation.y = degToRad(90);
    
                        coin.add(object);
                        coin.add(collisionBox);
                        coin.position.set(5*(j - Math.floor(cols/2)), 2, 5*(zPosition+i+offset-y));
    
                        initCollisionVertices(collisionBox);
    
                        coinAnimation(coin);
                        tile.add(coin);
                    }
                }
                if(mat[i][j]=="coinUp") {
                    var coinNumber = randomIntFromInterval(2, 4);
                    for(var y=0; y<coinNumber; y++) {
                        var coin = new THREE.Object3D();
                        coin.name = "coin";
    
                        var object = models.coin.gltf.clone();
                        var collisionBox = initCollisionBox();
                        object.scale.set(10, 10, 10);
                        collisionBox.scale.set(1.5, 3, 3.5);
                        collisionBox.rotation.y = degToRad(90);
    
                        coin.add(object);
                        coin.add(collisionBox);
                        coin.position.set(5*(j - Math.floor(cols/2)), 6.5, 5*(zPosition+i+offset-y));
    
                        initCollisionVertices(collisionBox);
    
                        coinAnimation(coin);
                        tile.add(coin);
                    }
                }
                if(mat[i][j]=="starUp") {
                    var star = new THREE.Object3D();
                    star.name = "star";
    
                    var object = models.star.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object.scale.set(0.5, 0.5, 0.5);
                    collisionBox.scale.set(3, 3, 1.5);
    
                    star.add(object);
                    star.add(collisionBox);
                    star.position.set(5*(j - Math.floor(cols/2)), 6, 5*(zPosition+i+offset)-3);
    
                    initCollisionVertices(collisionBox);
    
                    starAnimation(star);
                    tile.add(star);
                }
                if(mat[i][j]=="starDown") {
                    var star = new THREE.Object3D();
                    star.name = "star";
    
                    var object = models.star.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object.scale.set(0.5, 0.5, 0.5);
                    collisionBox.scale.set(3, 3, 1.5);

                    star.add(object);
                    star.add(collisionBox);
                    star.position.set(5*(j - Math.floor(cols/2)), 2, 5*(zPosition+i+offset)-3);
    
                    initCollisionVertices(collisionBox);
    
                    starAnimation(star);
                    tile.add(star);
                }
                if(mat[i][j]=="mushroom") {
                    var yPosition = randomIntFromInterval(0, 1);
                    var mushroom = new THREE.Object3D();
                    mushroom.name = "mushroom";
    
                    var object = models.mushroom.gltf.clone();
                    var collisionBox = initCollisionBox();
                    object.scale.set(0.5, 0.5, 0.5);
                    collisionBox.scale.set(2.3, 2.3, 2.3);
                    collisionBox.position.y = 0.5;
    
                    mushroom.add(object);
                    mushroom.add(collisionBox);
                    mushroom.position.set(5*(j - Math.floor(cols/2)), 4*yPosition+2, 5*(zPosition+i+offset));
    
                    initCollisionVertices(collisionBox);
    
                    mushroomAnimation(mushroom);
                    tile.add(mushroom);
                }
            }
            else {
                // do not spawn hazards
            }
            
            /* ----- ----- ----- */

            /* ----- GRASSLAND ----- */
            if(mat[i][j]=="random") {
                var object = randomIntFromInterval(1, 5);
                switch(object) {
                    case 1:
                        var mystery_block = models.mystery_block.gltf.clone();
                        var size = 5;
                        mystery_block.scale.set(size, size, size);
                        mystery_block.rotation.y = degToRad(randomIntFromInterval(0, 360));
                        mystery_block.position.set(5*(j - Math.floor(cols/2)), size*0.7, 5*(zPosition+i+offset));
                        tile.add(mystery_block);
                        break;
                    case 2:
                        var brick_block = models.brick_block.gltf.clone();
                        var size = 8;
                        brick_block.scale.set(size, size, size);
                        brick_block.rotation.y = degToRad(randomIntFromInterval(0, 360));
                        brick_block.position.set(5*(j - Math.floor(cols/2)), size*0.25, 5*(zPosition+i+offset));
                        tile.add(brick_block);
                        break;
                    case 3:
                        var pow_block = models.pow_block.gltf.clone();
                        var size = 0.8;
                        pow_block.scale.set(size, size, size);
                        pow_block.rotation.y = degToRad(randomIntFromInterval(0, 360));
                        pow_block.position.set(5*(j - Math.floor(cols/2)), -0.35, 5*(zPosition+i+offset));
                        tile.add(pow_block);
                        break;
                    case 4:
                        var pipe = models.pipe.gltf.clone();
                        var size = 10;
                        pipe.scale.set(size, size, size);
                        pipe.rotation.x = degToRad(-90);
                        pipe.position.set(5*(j - Math.floor(cols/2)), size/2, 5*(zPosition+i+offset));
                        tile.add(pipe);
                        break;
                    case 5:
                        var tree = models.tree.gltf.clone();
                        var size = 0.035;
                        tree.scale.set(size, size, size);
                        tree.rotation.y = degToRad(randomIntFromInterval(0, 360));
                        tree.position.set(5*(j - Math.floor(cols/2)), 0.5, 5*(zPosition+i+offset));
                        tile.add(tree);
                        break;
                    default:
                        console.log("Invalid random object");
                }
            }
            if(mat[i][j]=="forest1") {
                var forest1 = models.forest1.gltf.clone();
                forest1.scale.set(10, 10, 10);
                forest1.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
                tile.add(forest1);
            }
            if(mat[i][j]=="forest2") {
                var forest1 = models.forest1.gltf.clone();
                forest1.scale.set(10, 10, 10);
                forest1.rotation.y = degToRad(180);
                forest1.position.set(5*(j - Math.floor(cols/2))+10, 0, 5*(zPosition+i+offset));
                tile.add(forest1);
            }
            /* ----- ----- ----- */

            /* ----- CAVE ----- */
            if(mat[i][j]=="cave1") {
                var cave = models.cave.gltf.clone();
                cave.scale.set(79.5, 79.5, 79.5);
                cave.position.set(5*(j - Math.floor(cols/2))+7, 0, 5*(zPosition+i+offset));
                tile.add(cave);
            }
            if(mat[i][j]=="cave2") {
                var cave = models.cave.gltf.clone();
                cave.scale.set(81, 81, 81);
                cave.rotation.y = degToRad(180);
                cave.position.set(5*(j - Math.floor(cols/2))-7, 0, 5*(zPosition+i+offset));
                tile.add(cave);
            }
            if(mat[i][j]=="randomCrystal") {
                var object = randomIntFromInterval(1, 3);
                var rotationX = randomIntFromInterval(0, 30);
                var rotationY = randomIntFromInterval(0, 360);
                var rotationZ = randomIntFromInterval(0, 30);
                switch(object) {
                    case 1:
                        var crystal = models.crystal1.gltf.clone();
                        crystal.scale.set(0.5, 0.5, 0.5);
                        crystal.rotation.x = degToRad(rotationX);
                        crystal.rotation.y = degToRad(rotationY);
                        crystal.rotation.z = degToRad(rotationZ);
                        crystal.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
                        tile.add(crystal);
                        break;
                    case 2:
                        var crystal = models.crystal2.gltf.clone();
                        crystal.scale.set(0.01, 0.01, 0.01);
                        crystal.rotation.x = degToRad(rotationX);
                        crystal.rotation.y = degToRad(rotationY);
                        crystal.rotation.z = degToRad(rotationZ);
                        crystal.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
                        tile.add(crystal);
                        break;
                    case 3:
                        var crystal = models.crystal3.gltf.clone();
                        crystal.scale.set(0.5, 0.5, 0.5);
                        crystal.rotation.x = degToRad(rotationX);
                        crystal.rotation.y = degToRad(rotationY);
                        crystal.rotation.z = degToRad(rotationZ);
                        crystal.position.set(5*(j - Math.floor(cols/2)), 0, 5*(zPosition+i+offset));
                        tile.add(crystal);
                        break;
                }  
            }
            /* ----- ----- ----- */

            /* ----- SPACE ----- */
            if(mat[i][j]=="randomSpaceObject") {
                var object = randomIntFromInterval(1, 5);
                var rotationX = randomIntFromInterval(0, 30);
                var rotationY = randomIntFromInterval(0, 360);
                var rotationZ = randomIntFromInterval(0, 30);
                var translationY = randomIntFromInterval(1, 5);
                switch(object) {
                    case 1:
                        var planet = models.planet.gltf.clone();
                        planet.scale.set(1.5, 1.5, 1.5);
                        planet.rotation.x = degToRad(rotationX);
                        planet.rotation.y = degToRad(rotationY);
                        planet.rotation.z = degToRad(rotationZ);
                        planet.position.set(5*(j - Math.floor(cols/2)), translationY, 5*(zPosition+i+offset));
                        tile.add(planet);
                        break;
                    case 2:
                        var rocket = models.rocket.gltf.clone();
                        rocket.scale.set(1.5, 1.5, 1.5);
                        rocket.rotation.x = degToRad(rotationX);
                        rocket.rotation.y = degToRad(rotationY);
                        rocket.rotation.z = degToRad(rotationZ);
                        rocket.position.set(5*(j - Math.floor(cols/2)), 4 + translationY, 5*(zPosition+i+offset));
                        tile.add(rocket);
                        break;
                    case 3:
                        var satellite = models.satellite.gltf.clone();
                        satellite.scale.set(0.2, 0.2, 0.2);
                        satellite.rotation.x = degToRad(rotationX);
                        satellite.rotation.y = degToRad(rotationY);
                        satellite.rotation.z = degToRad(rotationZ);
                        satellite.position.set(5*(j - Math.floor(cols/2)), translationY, 5*(zPosition+i+offset));
                        tile.add(satellite);
                        break;
                    case 4:
                        var spaceship = models.spaceship.gltf.clone();
                        spaceship.scale.set(1.2, 1.2, 1.2);
                        spaceship.rotation.x = degToRad(rotationX);
                        spaceship.rotation.y = degToRad(rotationY);
                        spaceship.rotation.z = degToRad(rotationZ);
                        spaceship.position.set(5*(j - Math.floor(cols/2)), -3 + translationY, 5*(zPosition+i+offset));
                        tile.add(spaceship);
                        break;
                    case 5:
                        var ufo = models.ufo.gltf.clone();
                        ufo.scale.set(1, 1, 1);
                        ufo.rotation.x = degToRad(rotationX);
                        ufo.rotation.y = degToRad(rotationY);
                        ufo.rotation.z = degToRad(rotationZ);
                        ufo.position.set(5*(j - Math.floor(cols/2)), 2+ translationY, 5*(zPosition+i+offset));
                        tile.add(ufo);
                        break;
                    
                } 
            }
            /* ----- ----- ----- */




        }
    }

    // console.log("CUMULATIVE POSITION:",cumulativePosition)

}


function initMatrix() {

    var mat = [];

    var jMax = 13;
    var iMax = 18;
    if(settings.quality == "low") {
        jMax = 11;
    }

    for(var i=0; i<iMax; i++) {
        mat[i] = [];
        for(var j=0; j<jMax; j++) {
            mat[i][j]=0;
        }
    }

    for(var i=0; i<iMax; i++) {
        for(var j=0; j<jMax; j++) {

            // CENTER OF THE ROAD
            if(j==Math.floor(jMax/2)) {
                if(i==0) {
                    var up = Math.random();
                    var starProbability = 0.25;

                    // spawn object up
                    if(up>=0.5) {
                        mat[i][j] = "roller1";

                        // spawn star
                        if(Math.random()<starProbability && !settings.star) {

                            // left lane
                            if(Math.random()<0.333) {
                                mat[i+1][j-1] = "starDown";
                            }

                            // center lane
                            else {
                                if(Math.random()>=0.333 && Math.random()<0.666) {
                                    mat[i+1][j] = "starDown";
                                }

                                // right lane
                                else {
                                    mat[i+1][j+1] = "starDown";
                                }
                            }
                        }
                    }
                    else {
                        mat[i][j-1] = "spike";
                        mat[i][j] = "spike";
                        mat[i][j+1] = "spike";

                        // spawn star
                        if(Math.random()<starProbability && !settings.star) {

                            // left lane
                            if(Math.random()<0.333) {
                                mat[i+1][j-1] = "starUp";
                            }

                            // center lane
                            else {
                                if(Math.random()>=0.333 && Math.random()<0.666) {
                                    mat[i+1][j] = "starUp";
                                }

                                // right lane
                                else {
                                    mat[i+1][j+1] = "starUp";
                                }
                            }
                        }
                    }
                }
                if(i==5) {
                    var mushroomProbability = 0.25;

                    // spawn mushroom
                    if(Math.random()<mushroomProbability) {

                        // left lane
                        if(Math.random()<0.333) {
                            mat[i][j-1] = "mushroom";
                        }

                        // center lane
                        else {
                            if(Math.random()>=0.333 && Math.random()<0.666) {
                                mat[i][j] = "mushroom";
                            }

                            // right lane
                            else {
                                mat[i][j+1] = "mushroom";
                            }
                        }
                    }

                }
                if(i==9) {
                    var obstacle = Math.random();
                    var coinProbability = 0.5;

                    // roller
                    if(obstacle>=0.5) {
                        var position = randomIntFromInterval(1, 5);
                        switch(position) {
                            case 1:
                                mat[i][j-1] = "roller2";

                                // spawn coins
                                if(Math.random()<coinProbability) {

                                    // center lane
                                    if(Math.random()<0.5) {
                                        mat[i+1][j] = "coin";
                                    }

                                    // right lane
                                    else {
                                        mat[i+1][j+1] = "coin";
                                    }
                                }
                                break;
                            case 2:
                                mat[i][j] = "roller2";

                                // spawn coins
                                if(Math.random()<coinProbability) {

                                    // left lane
                                    if(Math.random()<0.5) {
                                        mat[i+1][j-1] = "coin";
                                    }

                                    // right lane
                                    else {
                                        mat[i+1][j+1] = "coin";
                                    }
                                }
                                break;
                            case 3:
                                mat[i][j+1] = "roller2";

                                // spawn coins
                                if(Math.random()<coinProbability) {

                                    // left lane
                                    if(Math.random()<0.5) {
                                        mat[i+1][j-1] = "coin";
                                    }

                                    // center lane
                                    else {
                                        mat[i+1][j] = "coin";
                                    }
                                }
                                break;
                            case 4:
                                mat[i][j-1] = "roller3";

                                // spawn coins
                                if(Math.random()<coinProbability) {

                                    // left lane
                                    if(Math.random()<0.333) {
                                        mat[i+2][j-1] = "coinDown";
                                    }

                                    // center lane
                                    else {
                                        if(Math.random()>=0.333 && Math.random()<0.666) {
                                            mat[i+2][j] = "coinDown";
                                        }

                                        // right lane
                                        else {
                                            mat[i+2][j+1] = "coin";
                                        }
                                    }
                                }
                                break;
                            case 5:
                                mat[i][j] = "roller3";

                                // spawn coins
                                if(Math.random()<coinProbability) {

                                    // left lane
                                    if(Math.random()<0.333) {
                                        mat[i+2][j-1] = "coin";
                                    }

                                    // center lane
                                    else {
                                        if(Math.random()>=0.333 && Math.random()<0.666) {
                                            mat[i+2][j] = "coinDown";
                                        }

                                        // right lane
                                        else {
                                            mat[i+2][j+1] = "coinDown";
                                        }
                                    }
                                }
                                break;
                            default:
                                console.log("Invalid roller position");
                        }
                    }

                    // spikes
                    else {
                        var position = randomIntFromInterval(1, 3);
                        switch(position) {
                            case 1:
                                mat[i][j-1] = "spike";
                                mat[i][j] = "spike";

                                // spawn coins
                                if(Math.random()<coinProbability) {
                                
                                    // left lane
                                    if(Math.random()<0.333) {
                                        mat[i+1][j-1] = "coinUp";
                                    }
                                
                                    // center lane
                                    else {
                                        if(Math.random()>=0.333 && Math.random()<0.666) {
                                            mat[i+1][j] = "coinUp";
                                        }
                                
                                        // right lane
                                        else {
                                            mat[i+1][j+1] = "coin";
                                        }
                                    }
                                }
                                break;
                            case 2:
                                mat[i][j] = "spike";
                                mat[i][j+1] = "spike";
                                
                                // spawn coins
                                if(Math.random()<coinProbability) {
                                    // left lane
                                    if(Math.random()<0.333) {
                                        mat[i+1][j-1] = "coin";
                                    }
                                
                                    // center lane
                                    else {
                                        if(Math.random()>=0.333 && Math.random()<0.666) {
                                            mat[i+1][j] = "coinUp";
                                        }
                                
                                        // right lane
                                        else {
                                            mat[i+1][j+1] = "coinUp";
                                        }
                                    }
                                }
                                break;
                            case 3:
                                mat[i][j-1] = "spike";
                                mat[i][j+1] = "spike";
                                
                                // spawn coins
                                if(Math.random()<coinProbability) {
                                
                                    // left lane
                                    if(Math.random()<0.333) {
                                        mat[i+1][j-1] = "coinUp";
                                    }
                                
                                    // center lane
                                    else {
                                        if(Math.random()>=0.333 && Math.random()<0.666) {
                                            mat[i+1][j] = "coin";
                                        }
                                
                                        // right lane
                                        else {
                                            mat[i+1][j+1] = "coinUp";
                                        }
                                    }
                                }
                                break;
                            default:
                                console.log("Invalid spikes position");
                        }
                    }
                }
            }

            // SIDES
            else {
                if(i==9 && j==0) {

                    // GRASSLAND
                    if(settings.environment == "grassland") {
                        var decoration = randomIntFromInterval(1,3);
                        var spawnProbability = 0.5;
                        if(settings.quality == "low") {
                            spawnProbability = 0.3;
                        }
                        switch(decoration) {
                            case 1:
                                mat[i][Math.floor(jMax/2)+4] = "forest1";
                                break;
                            case 2:
                                mat[i][Math.floor(jMax/2)-6] = "forest2";
                                break;
                            case 3:
                                for(var x=1; x<iMax; x=x+3) {
                                    for(var y=Math.floor(jMax/2)-6; y<Math.floor(jMax/2); y=y+3) {
                                        
                                        // spawn object
                                        if(Math.random()<=spawnProbability) {
                                            mat[x][y]="random";
                                        }
                                        else {
                                            // do nothing
                                        }
                                    }
                                }
                                for(var x=1; x<iMax; x=x+3) {
                                    for(var y=Math.floor(jMax/2)+3; y<Math.floor(jMax/2)+7; y=y+3) {
                                        
                                        // spawn object
                                        if(Math.random()<=spawnProbability) {
                                            mat[x][y]="random";
                                        }
                                        else {
                                            // do nothing
                                        }
                                    }
                                }
                                break;
                            default:
                                console.log("Invalid object position");
                        }

                    }

                    // CAVE
                    if(settings.environment == "cave") {
                        mat[i][Math.floor(jMax/2)-5] = "cave1";
                        mat[i][Math.floor(jMax/2)+5] = "cave2";
                        var spawnProbability = 0.5;
                        if(settings.quality == "low") {
                            spawnProbability = 0.3;
                        }
                        for(var x=1; x<iMax; x=x+3) {
                            
                            // spawn object
                            if(Math.random()<=spawnProbability) {
                                mat[x][Math.floor(jMax/2)-3]="randomCrystal";
                            }
                            else {
                                // do nothing
                            }
                        }
                        for(var x=1; x<iMax; x=x+3) {
                            
                            // spawn object
                            if(Math.random()<=spawnProbability) {
                                mat[x][Math.floor(jMax/2)+3]="randomCrystal";
                            }
                            else {
                                // do nothing
                            }
                        }

                    }

                    // SPACE
                    if(settings.environment == "space") {
                        var spawnProbability = 0.25;
                        if(settings.quality == "low") {
                            spawnProbability = 0.1;
                        }
                        for(var x=1; x<iMax; x=x+3) {
                            for(var y=Math.floor(jMax/2)-6; y<Math.floor(jMax/2); y=y+3) {
                                
                                // spawn object
                                if(Math.random()<=spawnProbability) {
                                    mat[x][y]="randomSpaceObject";
                                }
                                else {
                                    // do nothing
                                }
                            }
                        }
                        for(var x=1; x<iMax; x=x+3) {
                            for(var y=Math.floor(jMax/2)+3; y<Math.floor(jMax/2)+7; y=y+3) {
                                
                                // spawn object
                                if(Math.random()<=spawnProbability) {
                                    mat[x][y]="randomSpaceObject";
                                }
                                else {
                                    // do nothing
                                }
                            }
                        }
                    }

                }

            }
        }
    }

    return mat;
}



function removeTiles(scene) {

    // console.log("TILES", tiles)
    tiles.forEach(function(tile) {
        
        if(tile.children.at(-1).position.z > character.mesh.position.z + 15 && character.mesh.position.z <= -90) {
            console.log("deleting tile ...")
            // console.log(characterMovingAnimationTweens);
            scene.remove(tile);
            tiles.shift(tile);
            // console.log("ACTIVE COLLISION BOXES BEFORE:", activeCollisionBoxes)
            removeInactiveCollisionBoxes();
            initTile(scene, 1);
        }
    })

}


function removeInactiveTween(tween) {
    if(characterMovingAnimationTweens.includes(tween)) {
        characterMovingAnimationTweens.splice(characterMovingAnimationTweens.indexOf(tween), 1);
        tween.stop();
    }
}

function removeInactiveCollisionBoxes() {

    activeCollisionBoxes.forEach(function(collisionBox) {
        if(collisionBox.collision.reduce((prev, current) => (prev.z < current.z) ? prev : current).z > character.mesh.position.z + 5) {
            activeCollisionBoxes.splice(activeCollisionBoxes.indexOf(collisionBox), 1);
            // console.log("removing collision box: ", collisionBox.parent)
        }
    });

}


function checkCollisions(scene) {

    activeCollisionBoxes.forEach(function(collisionBox) {

        var objectMinX = collisionBox.collision.reduce((prev, current) => (prev.x < current.x) ? prev : current).x
        var objectMinY = collisionBox.collision.reduce((prev, current) => (prev.y < current.y) ? prev : current).y
        var objectMinZ = collisionBox.collision.reduce((prev, current) => (prev.z < current.z) ? prev : current).z

        var objectMaxX = collisionBox.collision.reduce((prev, current) => (prev.x > current.x) ? prev : current).x
        var objectMaxY = collisionBox.collision.reduce((prev, current) => (prev.y > current.y) ? prev : current).y
        var objectMaxZ = collisionBox.collision.reduce((prev, current) => (prev.z > current.z) ? prev : current).z

        var characterMinX = character.mesh.children[1].collision.reduce((prev, current) => (prev.x < current.x) ? prev : current).x
        var characterMinY = character.mesh.children[1].collision.reduce((prev, current) => (prev.y < current.y) ? prev : current).y
        var characterMinZ = character.mesh.children[1].collision.reduce((prev, current) => (prev.z < current.z) ? prev : current).z

        var characterMaxX = character.mesh.children[1].collision.reduce((prev, current) => (prev.x > current.x) ? prev : current).x
        var characterMaxY = character.mesh.children[1].collision.reduce((prev, current) => (prev.y > current.y) ? prev : current).y
        var characterMaxZ = character.mesh.children[1].collision.reduce((prev, current) => (prev.z > current.z) ? prev : current).z
        
        
        // collision over the z axys
        if(characterMaxZ > objectMinZ && characterMinZ < objectMaxZ) {

            // collision over the x axys
            if(characterMaxX > objectMinX && characterMinX < objectMaxX) {
            
                // collision over the y axys
                if(characterMaxY > objectMinY && characterMinY < objectMaxY) {
            
                    console.log("HIT - parent name:", collisionBox.parent.name)

                    // console.log("collisioned with:", collisionBox.collision)


                    activeCollisionBoxes.splice(activeCollisionBoxes.indexOf(collisionBox), 1);

                    collisionBox.parent.visible = false;
                    collisionBox.parent.hit = true;

                    switch(collisionBox.parent.name) {

                        case "spike":
                            if(!settings.invincible && settings.difficulty != "godmode") {
                                settings.lives--;
                                document.getElementById("lives").innerHTML = settings.lives;
                                if(settings.lives == 0) {
                                    gameOver();
                                }
                                characterDamageAnimation();
                                sound2.stop();
                                if(Math.random()<0.5) {
                                    if(character.name == "mario") {
                                        playSound(sounds.mario.damage1.sound, 1, 1, false, settings, sound2);
                                    }
                                    if(character.name == "luigi") {
                                        playSound(sounds.luigi.damage1.sound, 1, 1, false, settings, sound2);
                                    }
                                }
                                else {
                                    if(character.name == "mario") {
                                        playSound(sounds.mario.damage2.sound, 1, 1, false, settings, sound2);
                                    }
                                    if(character.name == "luigi") {
                                        playSound(sounds.luigi.damage2.sound, 1, 1, false, settings, sound2);
                                    }
                                }
                            }
                            break;
                        case "roller":
                            if(!settings.invincible && settings.difficulty != "godmode") {
                                settings.lives--;
                                document.getElementById("lives").innerHTML = settings.lives;
                                if(settings.lives == 0) {
                                    gameOver();
                                }
                                characterDamageAnimation();
                                sound2.stop();
                                if(Math.random()<0.5) {
                                    if(character.name == "mario") {
                                        playSound(sounds.mario.damage1.sound, 1, 1, false, settings, sound2);
                                    }
                                    if(character.name == "luigi") {
                                        playSound(sounds.luigi.damage1.sound, 1, 1, false, settings, sound2);
                                    }
                                }
                                else {
                                    if(character.name == "mario") {
                                        playSound(sounds.mario.damage2.sound, 1, 1, false, settings, sound2);
                                    }
                                    if(character.name == "luigi") {
                                        playSound(sounds.luigi.damage2.sound, 1, 1, false, settings, sound2);
                                    }
                                }
                            }
                            break;
                        case "coin":
                            document.getElementById("sum-points").classList.add("add-points");
                            setTimeout(function() {
                                document.getElementById("sum-points").classList.remove("add-points");
                                document.getElementById("sum-points").innerHTML = "";
                            }, 3000)
                            document.getElementById("sum-points").innerHTML = "+10";
                            settings.score = settings.score + Math.floor(1000/settings.scoreMultiplier);
                            sound2.stop();
                            playSound(sounds.general.coin.sound, 1, 1, false, settings, sound2);
                            break;
                        case "mushroom":
                            if(settings.lives<settings.maxLives) {
                                settings.lives++;
                                document.getElementById("sum-lives").classList.add("add-lives");
                                setTimeout(function() {
                                    document.getElementById("sum-lives").classList.remove("add-lives");
                                    document.getElementById("sum-lives").innerHTML = "";
                                }, 3000)
                                document.getElementById("sum-lives").innerHTML = "+1";
                            }
                            else {
                                document.getElementById("sum-points").classList.add("add-points");
                                setTimeout(function() {
                                    document.getElementById("sum-points").classList.remove("add-points");
                                    document.getElementById("sum-points").innerHTML = "";
                                }, 3000)
                                document.getElementById("sum-points").innerHTML = "+20";
                                settings.score = settings.score + Math.floor(2000/settings.scoreMultiplier);
                            }
                            sound2.stop();
                            playSound(sounds.general.mushroom.sound, 1, 1, false, settings, sound2);
                            break;
                        case "star":
                            characterStarAnimation();
                            sound2.stop();
                            if(character.name == "mario") {
                                playSound(sounds.mario.star.sound, 0.5, 1.1, false, settings, sound2);
                            }
                            if(character.name == "luigi") {
                                playSound(sounds.luigi.star.sound, 0.5, 1.1, false, settings, sound2);
                            }
                            break;
                        default:
                            break;

                    }

                }
            }
        }

    });

}



const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxCollisionMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: 0.7});
function initCollisionBox() {
    var box = new THREE.Mesh(boxGeometry, boxCollisionMaterial);
	box.scale.set(1, 1, 1);
	box.position.set(0, 0, 0);
	box.name = "collisionBox";
	box.visible = settings.dev;
	return box;
}


function initCollisionVertices(collisionBox) {

    if(typeof(collisionBox.collision) != "undefined") {
        
        activeCollisionBoxes.splice(activeCollisionBoxes.indexOf(collisionBox), 1);
        
    }

    var collision = [];
    vertices.forEach(function(coordinates) {
        var vertex = new THREE.Vector3();
        vertex.copy(coordinates);
        collisionBox.localToWorld(vertex);
        collision.push(vertex)
    });
    collisionBox.collision = collision;
    activeCollisionBoxes.push(collisionBox);
}


function coinAnimation(coin) {
    var animationTime = 1000;
    var coinRotationStart = {x:0, y:0, z:0};
    var coinTweenStart = new TWEEN.Tween(coinRotationStart)
    .to({x:0, y:360, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        coin.rotation.y = degToRad(coinRotationStart.y);
        if(typeof(coin.hit) == "undefined") {
            initCollisionVertices(coin.children[1]);
        }
    })
    .start();
    coinTweenStart.repeat(15);
    coinTweenStart.onComplete(function() {
        removeInactiveTween(coinTweenStart);
    });
    characterMovingAnimationTweens.push(coinTweenStart);
}

function mushroomAnimation(mushroom) {
    var animationTime = 500;
    var mushroomPositionStart = {x:0, y:mushroom.position.y, z:0};
    var mushroomTweenStart = new TWEEN.Tween(mushroomPositionStart)
    .to({x:0, y:mushroom.position.y+1, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        mushroom.position.y = mushroomPositionStart.y;
        if(typeof(mushroom.hit) == "undefined") {
            initCollisionVertices(mushroom.children[1]);
        }
    })
    .start();
    mushroomTweenStart.repeat(30);
    mushroomTweenStart.yoyo(true);
    mushroomTweenStart.onComplete(function() {
        removeInactiveTween(mushroomTweenStart);
    });
    characterMovingAnimationTweens.push(mushroomTweenStart);
}

function starAnimation(star) {
    var animationTime = 500;
    var starRotationStart = {x:0, y:60, z:0};
    var starTweenStart = new TWEEN.Tween(starRotationStart)
    .to({x:0, y:-60, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        star.rotation.y = degToRad(starRotationStart.y);
        if(typeof(star.hit) == "undefined") {
            initCollisionVertices(star.children[1]);
        }
    })
    .start();
    starTweenStart.repeat(30);
    starTweenStart.yoyo(true);
    starTweenStart.onComplete(function() {
        removeInactiveTween(starTweenStart);

    });
    characterMovingAnimationTweens.push(starTweenStart);
}

function spikeAnimation(spike) {
    var animationTime = 500;
    var spikeScaleStart = {x:0, y:spike.scale.y, z:0};
    var spikeTweenStart = new TWEEN.Tween(spikeScaleStart)
    .to({x:0, y:spike.scale.y+0.5, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        spike.scale.y = spikeScaleStart.y;
        if(typeof(spike.hit) == "undefined") {
            initCollisionVertices(spike.children[1]);
        }
    })
    .start();
    spikeTweenStart.repeat(30);
    spikeTweenStart.yoyo(true);
    spikeTweenStart.onComplete(function() {
        removeInactiveTween(spikeTweenStart);
    });
    characterMovingAnimationTweens.push(spikeTweenStart);
}

function rollerVerticalAnimation(roller) {
    var animationTime = 1000;
    var rollerRotationStart = {x:0, y:0, z:0};
    var rollerTweenStart = new TWEEN.Tween(rollerRotationStart)
    .to({x:0, y:360, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        roller.rotation.y = degToRad(rollerRotationStart.y);
        if(typeof(roller.hit) == "undefined") {
            initCollisionVertices(roller.children[1]);
        }
    })
    .start();
    rollerTweenStart.repeat(15);
    rollerTweenStart.onComplete(function() {
        removeInactiveTween(rollerTweenStart);
    });
    characterMovingAnimationTweens.push(rollerTweenStart);
}

function rollerHorizontalAnimation(roller) {
    var animationTime = 1000;
    var rollerRotationStart = {x:0, y:0, z:0};
    var rollerTweenStart = new TWEEN.Tween(rollerRotationStart)
    .to({x:360, y:0, z:0}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        roller.rotation.x = degToRad(rollerRotationStart.x);
        if(typeof(roller.hit) == "undefined") {
            initCollisionVertices(roller.children[1]);
        }
    })
    .start();
    rollerTweenStart.repeat(15);
    rollerTweenStart.onComplete(function() {
        removeInactiveTween(rollerTweenStart);
    });
    characterMovingAnimationTweens.push(rollerTweenStart);
}
