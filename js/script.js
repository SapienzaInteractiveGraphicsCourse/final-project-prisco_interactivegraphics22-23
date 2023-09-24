import * as THREE from '../libs/three.module.js';
import TWEEN from '../libs/tween.esm.js';
// import {OrbitControls} from '../libs/three.js-master/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../libs/GLTFLoader.js';

import { initCharacters, initCharacterGame, initCharacterKeybordEventListeners, pauseCharacterGame } from './animations.js';
import { degToRad, playMusic, playSound } from './utils.js';


var scene, camera, renderer, audioListener, music, sound1, sound2;
var plane;
var rendererSize = {};
var globalCameraPosition, globalCameraRotation;

var playableCharacter = "mario";

renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});

renderer.shadowMap.enabled = true;

const canvas = document.getElementById('canvas');
canvas.appendChild(renderer.domElement);


const settings = {
    speed: 20,
    endPosition: -100000,
    playMusic: true,
    playSound: true,
    inGame: false,
    gamePaused: false,
    quality: "medium",
    difficulty: "normal",
    environment: "grassland",
    dev: false,
    invincible: false,
    star: false,
    score: 0,
    lives: 5,
    maxLives: 5,
    scoreMultiplier: 3,
};

/* ----- MODELS ----- */
const models = {
    mario: {
        url: './assets/3Dmodels/mario/scene.gltf',
        name: "mario",
        mesh: new THREE.Object3D(),
        bones: {},
        idleAnimationTime: 750,
        runAnimationTime: 250,
        slideAnimationTime: 200,
        jumpAnimationTime: 400,
        moveAnimationTime: 300,
        damageAnimationTime: 200,
        starAnimationTime: 100,
        isSliding: false,
        isJumping: false,
        jumpHeight: 3,
        horizontalMovement: 5,
        currentPosition: 0,
        instantiated: false,
        castShadow: true,
    },
    luigi: {
        url: './assets/3Dmodels/luigi/scene.gltf',
        name: "luigi",
        mesh: new THREE.Object3D(),
        bones: {},
        idleAnimationTime: 750,
        runAnimationTime: 250,
        slideAnimationTime: 200,
        jumpAnimationTime: 500,
        moveAnimationTime: 300,
        damageAnimationTime: 200,
        starAnimationTime: 100,
        isSliding: false,
        isJumping: false,
        jumpHeight: 4,
        horizontalMovement: 5,
        currentPosition: 0,
        instantiated: false,
        castShadow: true,
    },
    mushroom: {
        url: './assets/3Dmodels/mushroom/scene.gltf',
        castShadow: true,
    },
    star: {
        url: './assets/3Dmodels/star/scene.gltf',
        castShadow: true,
    },
    coin: {
        url: './assets/3Dmodels/coin/scene.gltf',
        castShadow: true,
    },
    spike: {
        url: './assets/3Dmodels/spike/scene.gltf',
        castShadow: true,
    },
    roller: {
        url: './assets/3Dmodels/roller/scene.gltf',
        castShadow: true,
    },
    mystery_block: {
        url: './assets/3Dmodels/mystery_block/scene.gltf',
    },
    brick_block: {
        url: './assets/3Dmodels/brick_block/scene.gltf',
    },
    pow_block: {
        url: './assets/3Dmodels/pow_block/scene.gltf',
    },
    pipe: {
        url: './assets/3Dmodels/pipe/scene.gltf',
    },
    tree: {
        url: './assets/3Dmodels/tree/scene.gltf',
    },
    forest1: {
        url: './assets/3Dmodels/forest1/scene.gltf',
    },
    cave: {
        url: './assets/3Dmodels/cave/scene.gltf',
    },
    crystal1: {
        url: './assets/3Dmodels/crystal1/scene.gltf',
    },
    crystal2: {
        url: './assets/3Dmodels/crystal2/scene.gltf',
    },
    crystal3: {
        url: './assets/3Dmodels/crystal3/scene.gltf',
    },
    planet: {
        url: './assets/3Dmodels/planet/scene.gltf',
    },
    rocket: {
        url: './assets/3Dmodels/rocket/scene.gltf',
    },
    satellite: {
        url: './assets/3Dmodels/satellite/scene.gltf',
    },
    spaceship: {
        url: './assets/3Dmodels/spaceship/scene.gltf',
    },
    ufo: {
        url: './assets/3Dmodels/ufo/scene.gltf',
    }, 
};
/* ----- ----- ----- */

/* ----- TEXTURES ----- */
const textures = {
    back: {url: './assets/images/back.jpg'},
    background: {url: './assets/images/background.jpg'},
    background1: {url: './assets/images/background1.png'},
    background2: {url: './assets/images/background2.png'},
    cave: {url: './assets/images/cave.jpg'},
    cloud: {url: './assets/images/cloud.png'},
    dirt: {url: './assets/images/dirt.png'},
    favicon: {url: './assets/images/favicon.jpg'},
    grass: {url: './assets/images/grass.png'},
    grassland: {url: './assets/images/grassland.avif'},
    luigi: {url: './assets/images/luigi.png'},
    mario: {url: './assets/images/mario.jpg'},
    musicOff: {url: './assets/images/musicOff.png'},
    musicOn: {url: './assets/images/musicOn.png'},
    rock1: {url: './assets/images/rock1.png'},
    rock2: {url: './assets/images/rock2.png'},
    settings: {url: './assets/images/settings.png'},
    soundOff: {url: './assets/images/soundOff.png'},
    soundOn: {url: './assets/images/soundOn.png'},
    space: {url: './assets/images/space.png'},
    space1: {url: './assets/images/space.avif'},
};
/* ----- ----- ----- */

/* ----- SOUNDS ----- */
const sounds = {
    general: {
        announcer_go: {url: './assets/sounds/general/announcer_go.wav'},
        announcer_new_record: {url: './assets/sounds/general/announcer_new_record.wav'},
        coin: {url: './assets/sounds/general/coin.wav'},
        game_over: {url: './assets/sounds/general/game_over.wav'},
        mushroom: {url: './assets/sounds/general/mushroom.wav'},
    },
    mario: {
        damage1: {url: './assets/sounds/mario/damage1.wav'},
        damage2: {url: './assets/sounds/mario/damage2.wav'},
        game_over: {url: './assets/sounds/mario/game_over.wav'},
        invalid_movement: {url: './assets/sounds/mario/invalid_movement.wav'},
        jump: {url: './assets/sounds/mario/jump.wav'},
        run: {url: './assets/sounds/mario/run.wav'},
        run2: {url: './assets/sounds/mario/run2.wav'},
        run3: {url: './assets/sounds/mario/run3.wav'},
        selected: {url: './assets/sounds/mario/selected.wav'},
        slide: {url: './assets/sounds/mario/slide.wav'},
        star: {url: './assets/sounds/mario/star.wav'},
    },
    luigi: {
        damage1: {url: './assets/sounds/luigi/damage1.wav'},
        damage2: {url: './assets/sounds/luigi/damage2.wav'},
        game_over: {url: './assets/sounds/luigi/game_over.wav'},
        invalid_movement: {url: './assets/sounds/luigi/invalid_movement.wav'},
        jump: {url: './assets/sounds/luigi/jump.wav'},
        run: {url: './assets/sounds/luigi/run.wav'},
        run2: {url: './assets/sounds/luigi/run2.wav'},
        run3: {url: './assets/sounds/luigi/run3.wav'},
        selected: {url: './assets/sounds/luigi/selected.wav'},
        slide: {url: './assets/sounds/luigi/slide.wav'},
        star: {url: './assets/sounds/luigi/star.wav'},
    },
    menu: {
        clicked: {url: './assets/sounds/menu/clicked.wav'},
        hover: {url: './assets/sounds/menu/hover.wav'},
        pause: {url: './assets/sounds/menu/pause.wav'},
        start: {url: './assets/sounds/menu/start.wav'},
    },
    music: {
        game_over: {url: './assets/sounds/music/game_over.wav'},
        home: {url: './assets/sounds/music/home.mp3'},
        star: {url: './assets/sounds/music/star.mp3'},
        grassland: {url: './assets/sounds/music/grassland.mp3'},
        cave: {url: './assets/sounds/music/cave.mp3'},
        space: {url: './assets/sounds/music/space.mp3'},
    },
};
/* ----- ----- ----- */


initEventListeners();

var modelsLoaded = false;
var soundsLoaded = false;
var texturesLoaded = false;

load3dModels();

/* ----- LOAD 3D MODELS ----- */
function load3dModels() {

    const modelsLoaderManager = new THREE.LoadingManager();
	modelsLoaderManager.onLoad = () => {

		modelsLoaded = true;

        if(modelsLoaded) {
            loadTextures();
		}
	};


    document.getElementById("progressBar").style.width = 0;
    document.getElementById("progressBar-text").innerHTML = "0%";

	modelsLoaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading models... ", (itemsLoaded / itemsTotal * 100).toFixed(2), '%');
        document.getElementById("progressBar").style.width = (itemsLoaded / itemsTotal * 100) + "%" ;
        document.getElementById("progressBar-text").innerHTML = (itemsLoaded / itemsTotal * 100).toFixed(1) + "%";
	};
	
    const gltfLoader = new GLTFLoader(modelsLoaderManager);
    
    document.getElementById("loadingText").innerHTML = "Loading Models";

    for (const model of Object.values(models)) {
        gltfLoader.load(model.url, function(gltf) {

            gltf.scene.traverse(o => {

                if (o.isMesh) {

                    if(model.castShadow) {
                        o.castShadow = true;
                    }
                }
            });

            model.gltf = gltf.scene;

        }, undefined,			
        function (error) {
            console.error(error);
        });
    }
}
/* ----- ----- ----- */

/* ----- LOAD ALL TEXTURES ----- */
function loadTextures() {

    const texturesLoaderManager = new THREE.LoadingManager();
	texturesLoaderManager.onLoad = () => {

		texturesLoaded = true;

		if(texturesLoaded) {
            loadSounds();
		}
	};


    document.getElementById("progressBar").style.width = 0;
    document.getElementById("progressBar-text").innerHTML = "0%";

	texturesLoaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading textures... ", (itemsLoaded / itemsTotal * 100).toFixed(2), '%');
        document.getElementById("progressBar").style.width = (itemsLoaded / itemsTotal * 100) + "%" ;
        document.getElementById("progressBar-text").innerHTML = (itemsLoaded / itemsTotal * 100).toFixed(1) + "%";
	};
	
	const textureLoader = new THREE.TextureLoader(texturesLoaderManager);

    document.getElementById("loadingText").innerHTML = "Loading textures";

	for (const texture of Object.values(textures)) {

            textureLoader.load(texture.url, function(textureObject) {
			
                texture.textureObject = textureObject;

            });
	}
}
/* ----- ----- ----- */

/* ----- LOAD ALL SOUNDS ----- */
function loadSounds() {

    const soundsLoaderManager = new THREE.LoadingManager();
	soundsLoaderManager.onLoad = () => {

		soundsLoaded = true;

		if(soundsLoaded) {
            document.getElementById("loader-wrapper").remove();
            document.getElementById("goButton").hidden = false;
            document.getElementById("goButton").classList.add("pulsating-button");
            document.getElementById("loadedText").classList.add("blur");
            document.getElementById("loadedText").innerHTML = "Loading complete! You can now enter the game";
		}
	};


    document.getElementById("progressBar").style.width = 0;
    document.getElementById("progressBar-text").innerHTML = "0%";

	soundsLoaderManager.onProgress = (url, itemsLoaded, itemsTotal) => {
		console.log("Loading sounds... ", (itemsLoaded / itemsTotal * 100).toFixed(2), '%');
        document.getElementById("progressBar").style.width = (itemsLoaded / itemsTotal * 100) + "%" ;
        document.getElementById("progressBar-text").innerHTML = (itemsLoaded / itemsTotal * 100).toFixed(1) + "%";
	};
	
	const audioLoader = new THREE.AudioLoader(soundsLoaderManager);

    document.getElementById("loadingText").innerHTML = "Loading Sounds";

	for (const category of Object.values(sounds)) {
        for(const sound of Object.values(category)) {

            audioLoader.load(sound.url, function(audioBuffer) {
			
                sound.sound = audioBuffer;

            });

		};
	}
}
/* ----- ----- ----- */


function init() {

    rendererSize.x = 0.5;
    rendererSize.y = 1.0;
   
    renderer.setSize(window.innerWidth*rendererSize.x, window.innerHeight*rendererSize.y);

    /* ----- CAMERA ----- */
    camera = new THREE.PerspectiveCamera(45, window.innerWidth*rendererSize.x/window.innerHeight*rendererSize.y, 0.1, 500);
    
    // const orbit = new OrbitControls(camera, renderer.domElement);

    camera.position.set(0, 0, 200);

    setTimeout(function() {
        var position = new THREE.Vector3(-3, 5, 7);
        var lookAt = new THREE.Vector3(-3, 1, -3);
        camera.position.set(position.x, position.y, position.z);
        camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

        var a = Math.abs(position.y - lookAt.y);
        var b = Math.sqrt(Math.pow((position.x - lookAt.x),2) + Math.pow((position.z - lookAt.z),2));

        globalCameraPosition = position;
        globalCameraRotation = new THREE.Vector3(-Math.atan(a/b), 0, 0);

        rotateCamera();

    }, 100)

    // orbit.update();
    /* ----- ----- ----- */

    /* ----- SOUNDS ----- */
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    music = new THREE.Audio(audioListener);
    sound1 = new THREE.Audio(audioListener);
    sound2 = new THREE.Audio(audioListener);
    /* ----- ----- ----- */

    initWindowEventListeners();

    initScene();

    var planeGeometry = new THREE.PlaneGeometry(50, 50);
	var planeMaterial = new THREE.ShadowMaterial({side: THREE.DoubleSide});
	planeMaterial.opacity = 0.5;
	plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.receiveShadow = true;
	planeGeometry.rotateX(-degToRad(90));
	scene.add(plane);

    initCharacters(models, scene, sounds, settings, music, sound1, sound2);

    models.mario.isSliding = false;
    models.mario.isJumping = false;
    models.luigi.isSliding = false;
    models.luigi.isJumping = false;
    animate();

    music.stop();
    playMusic(sounds.music.home.sound, 0.5, settings, music);

}

function animate() {

    requestAnimationFrame(animate);
    
    TWEEN.update();

    renderer.render(scene, camera);
}


function initScene() {

    scene = new THREE.Scene();
    scene.background = null;

    /* ----- HELPERS ----- */
    const axesHelper = new THREE.AxesHelper(50);
    const gridHelper = new THREE.GridHelper(50, 50);

    if(settings.dev) {
        scene.add(axesHelper);
        scene.add(gridHelper);
    }
    /* ----- ----- ----- */

    if(settings.inGame) {
        if(settings.environment == "grassland") {
            scene.background = textures.background1.textureObject;
            if(settings.quality != "low") {
                scene.fog = new THREE.Fog(0xffffff, 15, 140);
            }
        }
        if(settings.environment == "cave") {
            scene.background = textures.background2.textureObject;
            if(settings.quality != "low") {
                scene.fog = new THREE.Fog(0x000000, 15, 140);
            }
        }
        if(settings.environment == "space") {
            scene.background = textures.space.textureObject;
            if(settings.quality != "low") {
                scene.fog = new THREE.Fog(0x141452, 0, 140);
            }
        }
    }

}


function startGame() {

    // let variables = Object.keys(window);
    // console.log(variables);

    rendererSize.x = 1.0;
    rendererSize.y = 1.0;
   
    renderer.setSize(window.innerWidth*rendererSize.x, window.innerHeight*rendererSize.y);

    /* ----- CAMERA ----- */
    camera.aspect = window.innerWidth*rendererSize.x / window.innerHeight*rendererSize.y;
    camera.updateProjectionMatrix();

    camera.position.set(0, 11.5, 20);
    camera.lookAt(0, 1, 0);

    // orbit.update();
    /* ----- ----- ----- */

    initScene();

    initCharacterKeybordEventListeners();

    if(playableCharacter == "mario") {
        initCharacterGame(scene, camera, textures, playableCharacter);
    }
    if(playableCharacter == "luigi") {
        initCharacterGame(scene, camera, textures, playableCharacter);
    }

    animate();

    music.stop();
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



function rotateCamera() {

    var animationTime = 500;
    var initialPlayableCharacter = playableCharacter;
    var cameraMaxAngle;
    var cameraStartAngleX = camera.rotation.x;
    var cameraStartAngleY = camera.rotation.y;
    var cameraEndAngleX;
    var cameraEndAngleY;
    var cameraEndPositionX;
    var cameraEndPositionZ;
    var cameraMaxAngle = 180;

    if(initialPlayableCharacter=="mario") {
        cameraEndAngleX = globalCameraRotation.x;
        cameraEndAngleY = globalCameraRotation.y;
        cameraEndPositionX = globalCameraPosition.x;
        cameraEndPositionZ = globalCameraPosition.z;
    }
    if(initialPlayableCharacter=="luigi") {
        cameraEndAngleX = -globalCameraRotation.x;
        cameraEndAngleY = globalCameraRotation.y+degToRad(180);
        cameraEndPositionX = -globalCameraPosition.x;
        cameraEndPositionZ = -globalCameraPosition.z;
    }

    var cameraRotationStart = {x:cameraStartAngleX, y:cameraStartAngleY, z:0};
    var cameraTweenStart = new TWEEN.Tween(cameraRotationStart)
    .to({x:cameraEndAngleX, y:cameraEndAngleY, z:cameraMaxAngle}, animationTime)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
        if(initialPlayableCharacter!=playableCharacter) {
            cameraTweenStart.stop();
        }
        camera.position.x = -cameraEndPositionX*Math.cos(degToRad(cameraRotationStart.z))
        camera.position.z = -cameraEndPositionZ*Math.cos(degToRad(cameraRotationStart.z))
        
        camera.rotation.x = cameraRotationStart.x;
        camera.rotation.y = -cameraRotationStart.y;
    })
    .start();

}


function initEventListeners() {

    var buttons = [];
    buttons[0] = document.getElementById("devButton");
    buttons[1] = document.getElementById("musicButton");
    buttons[2] = document.getElementById("soundButton");
    buttons[3] = document.getElementById("lowButton");
    buttons[4] = document.getElementById("mediumButton");
    buttons[5] = document.getElementById("highButton");
    buttons[6] = document.getElementById("marioButton");
    buttons[7] = document.getElementById("luigiButton");
    buttons[8] = document.getElementById("easyButton");
    buttons[9] = document.getElementById("normalButton");
    buttons[10] = document.getElementById("hardButton");
    buttons[11] = document.getElementById("godmodeButton");
    buttons[12] = document.getElementById("grasslandButton");
    buttons[13] = document.getElementById("caveButton");
    buttons[14] = document.getElementById("spaceButton");
    buttons[15] = document.getElementById("musicButtonPause");
    buttons[16] = document.getElementById("soundButtonPause");
    buttons[17] = document.getElementById("musicButtonGameOver");
    buttons[18]= document.getElementById("soundButtonGameOver");
    buttons[19] = document.getElementById("exitButtonPause");
    buttons[20]= document.getElementById("continueButtonPause");
    buttons[21] = document.getElementById("exitButtonGameOver");
    buttons[22]= document.getElementById("restartButtonGameOver");
    buttons[23] = document.getElementById("settingsButton");
    buttons[24]= document.getElementById("backButton");
    

    buttons.forEach(function(button) {
        button.onmouseover = function() {
            sound2.stop();
            playSound(sounds.menu.hover.sound, 1, 1, false, settings, sound2);
        }

        button.addEventListener("click", function() {
            sound2.stop();
            playSound(sounds.menu.clicked.sound, 1, 1, false, settings, sound2);
        })
    })


    /* ----- SELECT DEFAULT OPTIONS ----- */
    document.getElementById("marioButton").classList.add("selected");
    document.getElementById("luigiButton").classList.remove("selected");

    document.getElementById("grasslandButton").classList.add("selected");
    document.getElementById("caveButton").classList.remove("selected");
    document.getElementById("spaceButton").classList.remove("selected");

    document.getElementById("normalButton").classList.add("selected");
    document.getElementById("easyButton").classList.remove("selected");
    document.getElementById("hardButton").classList.remove("selected");

    document.getElementById("mediumButton").classList.add("selected");
    document.getElementById("lowButton").classList.remove("selected");
    document.getElementById("highButton").classList.remove("selected");
    /* ----- ----- ----- */


    document.getElementById("goButton").onclick = function() {
        document.getElementById("page-transition-static").id = "page-transition-dynamic";
        document.getElementById("loading").hidden = true;
        document.getElementById("loader-animation").remove();

        setTimeout(function() {
            document.body.style.backgroundColor = "transparent";

            document.getElementById("menu").hidden = false;
            document.getElementById("settingsButton").hidden = false;
            document.getElementById("background").hidden = false;

            init();

            setTimeout(function() {
                document.getElementById("page-transition-dynamic").id = "page-transition-static";
            }, 1500)

        }, 500)
    };

    document.onkeydown = function(e) {
        switch(e.key) {
            default:
                console.log(e.key)
        }
    }

    /* ----- START MENU ----- */

    /* ----- SETTINGS BUTTON ----- */
    document.getElementById("settingsButton").onclick = function() {
        document.getElementById("menuSettings-wrapper").classList.remove("menuSettings-wrapperOff");
        document.getElementById("menuSettings-wrapper").classList.add("menuSettings-wrapperOn");
    };
    /* ----- */

    /* ----- BACK BUTTON ----- */
    document.getElementById("backButton").onclick = function() {
        document.getElementById("menuSettings-wrapper").classList.remove("menuSettings-wrapperOn");
        document.getElementById("menuSettings-wrapper").classList.add("menuSettings-wrapperOff");
    };
    /* ----- */

    /* AUDIO SETTINGS */

    document.getElementById("musicButton").onclick = function() {
        document.getElementById("musicButtonPause").classList.toggle("musicButtonOn");
        document.getElementById("musicButtonPause").classList.toggle("musicButtonOff");
        document.getElementById("musicButtonGameOver").classList.toggle("musicButtonOn");
        document.getElementById("musicButtonGameOver").classList.toggle("musicButtonOff");

        settings.playMusic = !settings.playMusic;
        if(!settings.playMusic) {
            music.pause();
        }
        else {
            playMusic(sounds.music.home.sound, 0.5, settings, music);
        }
        this.classList.toggle("musicButtonOn");
        this.classList.toggle("musicButtonOff");
    };
    document.getElementById("soundButton").onclick = function() {
        document.getElementById("soundButtonPause").click();
        document.getElementById("soundButtonGameOver").click();
        settings.playSound = !settings.playSound;
        if(!settings.playSound) {
            if(!(models.mario.isSliding||models.mario.isJumping||models.luigi.isSliding||models.luigi.isJumping)) {
                sound1.pause();
            }
            sound1.stop();
            sound2.stop();
        }
        else {
            // do nothing
        }
        this.classList.toggle("soundButtonOn");
        this.classList.toggle("soundButtonOff");
    };
    /* ----- */


    /* GRAPHICS SETTINGS */
    document.getElementById("lowButton").onclick = function() {
        settings.quality = "low";
        document.getElementById("lowButton").classList.add("selected");
        document.getElementById("mediumButton").classList.remove("selected");
        document.getElementById("highButton").classList.remove("selected");

        document.getElementById("lowButton").classList.add("animate");
        document.getElementById("mediumButton").classList.remove("animate");
        document.getElementById("highButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("lowButton").classList.remove('animate');
        }, 500);
    };
    document.getElementById("mediumButton").onclick = function() {
        settings.quality = "medium";
        document.getElementById("mediumButton").classList.add("selected");
        document.getElementById("lowButton").classList.remove("selected");
        document.getElementById("highButton").classList.remove("selected");

        document.getElementById("mediumButton").classList.add("animate");
        document.getElementById("lowButton").classList.remove("animate");
        document.getElementById("highButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("mediumButton").classList.remove('animate');
        }, 500);
    };
    document.getElementById("highButton").onclick = function() {
        settings.quality = "high";
        document.getElementById("highButton").classList.add("selected");
        document.getElementById("lowButton").classList.remove("selected");
        document.getElementById("mediumButton").classList.remove("selected");

        document.getElementById("highButton").classList.add("animate");
        document.getElementById("lowButton").classList.remove("animate");
        document.getElementById("mediumButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("highButton").classList.remove('animate');
        }, 500);
    };
    /* ----- */

    
    /* CHARACTER SELECTION */
    document.getElementById("marioButton").onclick = function() {
        document.getElementById("marioButton").classList.add("selected");
        document.getElementById("luigiButton").classList.remove("selected");
        if(playableCharacter!="mario") {
            playableCharacter = "mario";
            rotateCamera();
        }
        sound1.stop();
        playSound(sounds.mario.selected.sound, 1, 1, false, settings, sound1);
    };
    document.getElementById("luigiButton").onclick = function() {
        document.getElementById("luigiButton").classList.add("selected");
        document.getElementById("marioButton").classList.remove("selected");
        if(playableCharacter!="luigi") {
            playableCharacter = "luigi";
            rotateCamera();
        }
        sound1.stop();
        playSound(sounds.luigi.selected.sound, 1, 1, false, settings, sound1);
    };
    /* ----- */


    /* DIFFICULTY SETTINGS */
    document.getElementById("easyButton").onclick = function() {
        settings.difficulty = "easy";
        document.getElementById("easyButton").classList.add("selected");
        document.getElementById("normalButton").classList.remove("selected");
        document.getElementById("hardButton").classList.remove("selected");
        let element = document.getElementById("godmodeButton-selected");
        if(element != null) element.id = "godmodeButton";


        document.getElementById("easyButton").classList.add("animate");
        document.getElementById("normalButton").classList.remove("animate");
        document.getElementById("hardButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("easyButton").classList.remove('animate');
        }, 500);
    };
    document.getElementById("normalButton").onclick = function() {
        settings.difficulty = "normal";
        document.getElementById("normalButton").classList.add("selected");
        document.getElementById("easyButton").classList.remove("selected");
        document.getElementById("hardButton").classList.remove("selected");
        let element = document.getElementById("godmodeButton-selected");
        if(element != null) element.id = "godmodeButton";

        document.getElementById("normalButton").classList.add("animate");
        document.getElementById("easyButton").classList.remove("animate");
        document.getElementById("hardButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("normalButton").classList.remove('animate');
        }, 500);
    };
    document.getElementById("hardButton").onclick = function() {
        settings.difficulty = "hard";
        document.getElementById("hardButton").classList.add("selected");
        document.getElementById("easyButton").classList.remove("selected");
        document.getElementById("normalButton").classList.remove("selected");
        let element = document.getElementById("godmodeButton-selected");
        if(element != null) element.id = "godmodeButton";

        document.getElementById("hardButton").classList.add("animate");
        document.getElementById("easyButton").classList.remove("animate");
        document.getElementById("normalButton").classList.remove("animate");

        setTimeout(function() {
            document.getElementById("hardButton").classList.remove('animate');
        }, 500);
    };
    document.getElementById("godmodeButton").onclick = function() {
        settings.difficulty = "godmode";
        document.getElementById("godmodeButton").id = "godmodeButton-selected";
        document.getElementById("easyButton").classList.remove("selected");
        document.getElementById("normalButton").classList.remove("selected");
        document.getElementById("hardButton").classList.remove("selected");

        document.getElementById("easyButton").classList.remove("animate");
        document.getElementById("normalButton").classList.remove("animate");
        document.getElementById("hardButton").classList.remove("animate");
    };
    /* ----- */


    /* ENVIRONMENT SETTINGS */
    document.getElementById("grasslandButton").onclick = function() {
        settings.environment = "grassland";
        document.getElementById("grasslandButton").classList.add("selected");
        document.getElementById("caveButton").classList.remove("selected");
        document.getElementById("spaceButton").classList.remove("selected");
    };
    document.getElementById("caveButton").onclick = function() {
        settings.environment = "cave";
        document.getElementById("caveButton").classList.add("selected");
        document.getElementById("grasslandButton").classList.remove("selected");
        document.getElementById("spaceButton").classList.remove("selected");
    };
    document.getElementById("spaceButton").onclick = function() {
        settings.environment = "space";
        document.getElementById("spaceButton").classList.add("selected");
        document.getElementById("grasslandButton").classList.remove("selected");
        document.getElementById("caveButton").classList.remove("selected");
    };
    /* ----- */

    /* DEVELOPER OPTIONS */
    document.getElementById("devButton").onclick = function() {
        settings.dev = !settings.dev;
        if(settings.dev == true) {
            this.innerHTML = "On";
        }
        else {
            this.innerHTML = "Off";
        }
        this.classList.toggle("devButtonOn");
        this.classList.toggle("devButtonOff");
        initScene();
	    scene.add(plane);
        initCharacters(models, scene, sounds, settings, music, sound1, sound2);
    };
    /* ----- */


    document.getElementById("startButton").onmouseover = function() {
        sound2.stop();
        playSound(sounds.menu.hover.sound, 1, 1, false, settings, sound2);
    };

    document.getElementById("startButton").onclick = function() {
        document.getElementById("page-transition-static").id = "page-transition-dynamic";
        sound2.stop();
        playSound(sounds.menu.start.sound, 1, 1, false, settings, sound2);
        settings.inGame = true;
        
        setTimeout(function() {
            document.getElementById("menu").hidden = true;
            document.getElementById("settingsButton").hidden = true;
            document.getElementById("menuSettings-wrapper").hidden = true;
            document.getElementById("gameScore").hidden = false;
            
            startGame();

            setTimeout(function() {
                document.getElementById("page-transition-dynamic").id = "page-transition-static";

            }, 1500)

        }, 500)

    };
    /* ----- ----- ----- */


    /* ----- PAUSE MENU ----- */

    document.getElementById("musicButtonPause").onclick = function() {
        document.getElementById("musicButton").classList.toggle("musicButtonOn");
        document.getElementById("musicButton").classList.toggle("musicButtonOff");
        document.getElementById("musicButtonGameOver").classList.toggle("musicButtonOn");
        document.getElementById("musicButtonGameOver").classList.toggle("musicButtonOff");

        settings.playMusic = !settings.playMusic;
        if(!settings.playMusic) {
            music.pause();
        }
        else {
            music.play();
            if(settings.gamePaused) {
                music.pause();
                if(settings.star) {
                    playMusic(sounds.music.star.sound, 0.1, settings, music);
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
            }
        }
        this.classList.toggle("musicButtonOn");
        this.classList.toggle("musicButtonOff");
    };
    document.getElementById("soundButtonPause").onclick = function() {
        document.getElementById("soundButton").click();
        document.getElementById("soundButtonGameOver").click();
        settings.playSound = !settings.playSound;
        if(!settings.playSound) {
            if(!(models.mario.isSliding||models.mario.isJumping||models.luigi.isSliding||models.luigi.isJumping)) {
                sound1.pause();
            }
            sound1.stop();
            sound2.stop();
        }
        else {
            // do nothing
        }
        this.classList.toggle("soundButtonOn");
        this.classList.toggle("soundButtonOff");
    };

    document.getElementById("exitButtonPause").onclick = function() {

        document.getElementById("page-transition-static").id = "page-transition-dynamic";
        settings.inGame = false;

        setTimeout(function() {
            document.getElementById("menu").hidden = false;
            document.getElementById("settingsButton").hidden = false;
            document.getElementById("menuSettings-wrapper").hidden = false;

            document.getElementById("menuPause-screen-wrapper").hidden = true;
            document.getElementById("menuPause-wrapper").hidden = true;
            document.getElementById("gameScore").hidden = true;

            settings.gamePaused = false;
            music.stop();
            init();

            setTimeout(function() {
                document.getElementById("page-transition-dynamic").id = "page-transition-static";

            }, 1500)

        }, 500)

    };

    document.getElementById("continueButtonPause").onclick = function() {
        pauseCharacterGame();
    };

    /* ----- ----- ----- */


    /* ----- GAME OVER MENU ----- */

    document.getElementById("musicButtonGameOver").onclick = function() {
        document.getElementById("musicButton").classList.toggle("musicButtonOn");
        document.getElementById("musicButton").classList.toggle("musicButtonOff");
        document.getElementById("musicButtonPause").classList.toggle("musicButtonOn");
        document.getElementById("musicButtonPause").classList.toggle("musicButtonOff");

        settings.playMusic = !settings.playMusic;
        if(!settings.playMusic) {
            music.pause();
        }
        else {
            music.play();
            playMusic(sounds.music.game_over.sound, 1, settings, music);
            if(settings.gamePaused) {
                music.pause();
                if(settings.star) {
                    playMusic(sounds.music.star.sound, 0.1, settings, music);
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
            }
        }
        this.classList.toggle("musicButtonOn");
        this.classList.toggle("musicButtonOff");
    };
    document.getElementById("soundButtonGameOver").onclick = function() {
        document.getElementById("soundButton").click();
        document.getElementById("soundButtonPause").click();
        settings.playSound = !settings.playSound;
        if(!settings.playSound) {
            if(!(models.mario.isSliding||models.mario.isJumping||models.luigi.isSliding||models.luigi.isJumping)) {
                sound1.pause();
            }
            sound1.stop();
            sound2.stop();
        }
        else {
            // do nothing
        }
        this.classList.toggle("soundButtonOn");
        this.classList.toggle("soundButtonOff");
    };


    document.getElementById("exitButtonGameOver").onclick = function() {

        document.getElementById("page-transition-static").id = "page-transition-dynamic";
        settings.inGame = false;

        setTimeout(function() {
            document.getElementById("menu").hidden = false;
            document.getElementById("settingsButton").hidden = false;
            document.getElementById("menuSettings-wrapper").hidden = false;

            document.getElementById("menuPause-screen-wrapper").hidden = true;
            document.getElementById("menuGameOver-wrapper").hidden = true;
            document.getElementById("gameScore").hidden = true;

            settings.gamePaused = false;
            music.stop();
            init();

            setTimeout(function() {
                document.getElementById("page-transition-dynamic").id = "page-transition-static";

            }, 1500)

        }, 500)

    };

    document.getElementById("restartButtonGameOver").onclick = function() {

        document.getElementById("page-transition-static").id = "page-transition-dynamic";

        setTimeout(function() {
            document.getElementById("menuPause-screen-wrapper").hidden = true;
            document.getElementById("menuGameOver-wrapper").hidden = true;

            startGame();

            setTimeout(function() {
                document.getElementById("page-transition-dynamic").id = "page-transition-static";

            }, 1500)

        }, 500)

    };

    /* ----- ----- ----- */
    
}




function initWindowEventListeners() {

    // make the canvas responsive
    window.addEventListener("resize", function() {
        camera.aspect = window.innerWidth*rendererSize.x / window.innerHeight*rendererSize.y;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth*rendererSize.x, window.innerHeight*rendererSize.y);
    });
}

