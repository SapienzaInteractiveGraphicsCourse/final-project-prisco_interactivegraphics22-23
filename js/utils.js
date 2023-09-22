
export function playMusic(audio, volume, settings, music) {
    
    if(settings.playMusic) {
        music.setBuffer(audio);
	    music.setVolume(volume);
	    music.setLoop(true);
	    music.play();
    }
}

export function playSound(audio, volume, speed, loop, settings, sound) {
    
    if(settings.playSound) {
        sound.setBuffer(audio);
	    sound.setVolume(volume);
        sound.playbackRate = speed;
	    sound.setLoop(loop);
	    sound.play();
    }
}


export function pauseAllTweens(tweens) {
    var tween;
    for(tween of tweens) {
        tween.pause();
    }
}

export function resumeAllTweens(tweens) {
    var tween;
    for(tween of tweens) {
        tween.resume();
    }
}

export function stopAllTweens(tweens) {
    var tween;
    for(tween of tweens) {
        tween.stop();
    }
}

export function degToRad(degrees) {
    return degrees*(Math.PI/180);
}

export function radToDeg(radiants) {
    return radiants*(180/Math.PI);
}

export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
  