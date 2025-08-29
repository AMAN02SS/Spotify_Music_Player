console.log('javascript is running');
let currentSong = new Audio()
let songs = [];
let currfolder;
let isReplay = false;
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "Invalid input";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currfolder = folder;
    let res = await fetch(`./Asset/${folder}/info.json`);

    if (!res.ok) {
        console.error("Playlist not found for", folder);
        return [];
    }

    let data = await res.json();
    songs = data.songs;

    let songUL = document.querySelector(".Trendingcards");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<div class="Trendingcard">
                                <img src="./Asset/${folder}/${data.cover}" alt="">
                                <div class="title">${song.replaceAll("%20", " ")}</div>
                                <div class="author">Unknown</div>
                                <div class="playbtn"><img src="./Asset/play.svg" alt=""></div>
                            </div>`;

    }
    //Attach eventlistener to each song
    Array.from(document.querySelector(".Trendingcards").getElementsByClassName("Trendingcard")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".title").innerHTML.trim())
        });
    });

    // Auto play next when current song ends
    currentSong.addEventListener("ended", () => {
        if (isReplay) {
            currentSong.currentTime = 0;
            currentSong.play();
            play.src = "./Asset/paused.svg"; // reset play button
        } else {
            if (!songs || !songs.length) return;

            let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));

            if ((index + 1) < songs.length) {
                // Play next song
                playMusic(songs[index + 1]);
            } else {
                // End of playlist -> stop
                // console.log("Playlist finished.");
                play.src = "./Asset/play.svg"; // reset play button
            }
        }


    });

    return songs;

}

const playMusic = (track, paused = false) => {
    // let audio = new Audio("/Asset/songs/"+track);
    currentSong.src = (`./Asset/${currfolder}/` + track);
    currentSong.load();
    currentSong.onloadedmetadata = () => {
        document.querySelector(".songtime").innerHTML =
            `00:00 / ${secondsToMinutesSeconds(currentSong.duration)}`;
    };
    if (!paused) {
        currentSong.play().catch(err => {
            if (err.name !== "AbortError") console.error(err);
        });
        play.src = "./Asset/paused.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {

    let albums = ["TrendingSongs", "PunjabiSongs", "ReligiousSongs"];
    let authorcards = document.querySelector(".authorcards");
    authorcards.innerHTML = "";

    for (const folder of albums) {
        let res = await fetch(`./Asset/songs/${folder}/info.json`);
        if (!res.ok) continue;
        let data = await res.json();
        authorcards.innerHTML = authorcards.innerHTML + ` <div data-folder="${folder}" class="authorcard">
                                <img src="./Asset/songs/${folder}/${data.cover}" alt="">
                                <div class="title">${data.title}</div>
                                <div class="author">${data.description}</div>
                                <div class="playbtn"><img src="./Asset/play.svg" alt=""></div>
                            </div>`;

    }

    //load the playlist when card is clicked
    Array.from(document.getElementsByClassName("authorcard")).forEach(e => {
        e.addEventListener("click", async item => {
            await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) playMusic(songs[0], true)

        });
    });
}

async function main() {

    await getSongs("songs/TrendingSongs");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    //display all the albums on the page
    displayAlbums()

    //Attach event play song;
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "./Asset/paused.svg"
        }
        else {
            currentSong.pause();
            play.src = "./Asset/play.svg"
        }
    })


    //listen for time update event

    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //Add event listener on seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    })

    //Add event listener for hamburger

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    //Add event listener for close hamburger

    document.querySelector(".hamburger-close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })


    // Add event for close and open of menu/

    const menuBtn = document.getElementById("menuBtn");
    menuBtn.addEventListener("click", () => {
        menuBtn.classList.toggle("active");
    });

    //Add event to mute volume

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("audio.svg")) {
            e.target.src = e.target.src.replace("audio.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "audio.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10
        }
    })

    //Add event to volume

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "audio.svg");
        }
    })


    //Add reolay the audio feature
    document.querySelector(".replay").addEventListener("ended", () => {
        replayBtn.disabled = false; // show replay option
    });

    // Replay button click
    document.querySelector(".replay").addEventListener("click", () => {
        isReplay = !isReplay;
        document.querySelector(".replay").classList.toggle("active", isReplay);
    });

    //Add event listener for next and previous
    document.getElementById("next").addEventListener("click", () => {
        if (!songs || !songs.length) return;
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        console.log(index);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }

    })

    document.getElementById("previous").addEventListener("click", () => {
        if (!songs || !songs.length) return;
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

}




main();
