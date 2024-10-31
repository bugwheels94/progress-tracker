const list = [
  "https://cdn.pixabay.com/audio/2023/11/28/audio_099368f6e5.mp3",
  "https://cdn.pixabay.com/audio/2021/08/08/audio_6e054b59f6.mp3",
  "https://cdn.pixabay.com/audio/2024/03/21/audio_b18202d16d.mp3",
  "https://cdn.pixabay.com/audio/2022/08/05/audio_730f9afb32.mp3",
  "https://cdn.pixabay.com/audio/2021/08/09/audio_64d78fadfe.mp3",
  "https://cdn.pixabay.com/audio/2022/03/10/audio_b195486a22.mp3",
  "https://cdn.pixabay.com/audio/2022/11/21/audio_c7ec895cce.mp3",
];
export class Music {
  current: number = 0;
  audio: HTMLAudioElement;
  constructor() {
    this.audio = this.initialize();
  }
  initialize() {
    this.audio = new Audio(list[this.current]);
    this.audio.addEventListener("ended", () => {
      this.current++;
      this.initialize();
    });
    return this.audio;
  }

  play() {
    console.log("play");
    this.audio.play();
  }
  pause() {
    this.audio.pause();
  }
}
