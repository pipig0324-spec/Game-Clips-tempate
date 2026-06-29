const bindings = [
  ["eyebrowInput", "eyebrowOutput"],
  ["titleInput", "titleOutput"],
  ["subtitleInput", "subtitleOutput"],
  ["segmentInput", "segmentOutput"],
  ["displayNameInput", "displayNameOutput"],
  ["usernameInput", "usernameOutput"],
];

for (const [inputId, outputId] of bindings) {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  input.addEventListener("input", () => {
    output.textContent = input.value;
    if (inputId === "usernameInput") {
      const cleanName = input.value.replace("@", "").trim();
      const avatarInitial = document.getElementById("avatarInitial");
      if (avatarInitial) {
        avatarInitial.textContent = cleanName.charAt(0).toUpperCase() || "W";
      }
    }
  });
}

const video = document.getElementById("clipVideo");
const placeholder = document.getElementById("screenPlaceholder");
const playButton = document.getElementById("playButton");
const stage = document.getElementById("stage");
const screen = document.querySelector(".screen");
const calibrationDefaults = {
  clipX: 32.32,
  clipY: 37.9,
  clipWidth: 33.17,
  clipHeight: 31.95,
};
const styleDefaults = {
  logoSize: ["--logo-size", 24.6, "%"],
  eyebrowSize: ["--eyebrow-size", 1.15, "vw"],
  eyebrowColor: ["--eyebrow-color", "#44d62c", ""],
  titleSize: ["--title-size", 2.65, "vw"],
  titleColor: ["--title-color", "#ffffff", ""],
  subtitleSize: ["--subtitle-size", 1.05, "vw"],
  subtitleColor: ["--subtitle-color", "#d8dcde", ""],
  segmentSize: ["--segment-size", 0.62, "vw"],
  segmentColor: ["--segment-color", "#44d62c", ""],
  displayNameSize: ["--display-name-size", 1.05, "vw"],
  displayNameColor: ["--display-name-color", "#ffffff", ""],
  discordSize: ["--discord-size", 0.78, "vw"],
  discordColor: ["--discord-color", "#aeb5b8", ""],
};

function applyStyleControl(id) {
  const [property, , unit] = styleDefaults[id];
  const value = document.getElementById(id).value;
  stage.style.setProperty(property, `${value}${unit}`);
}

for (const id of Object.keys(styleDefaults)) {
  document.getElementById(id).addEventListener("input", () => applyStyleControl(id));
}

document.getElementById("resetStyle").addEventListener("click", () => {
  for (const [id, [property, value, unit]] of Object.entries(styleDefaults)) {
    document.getElementById(id).value = value;
    stage.style.setProperty(property, `${value}${unit}`);
  }
});

function applyCalibration() {
  screen.style.left = `${document.getElementById("clipX").value}%`;
  screen.style.top = `${document.getElementById("clipY").value}%`;
  screen.style.width = `${document.getElementById("clipWidth").value}%`;
  screen.style.height = `${document.getElementById("clipHeight").value}%`;
}

for (const id of Object.keys(calibrationDefaults)) {
  document.getElementById(id).addEventListener("input", applyCalibration);
}

document.getElementById("resetCalibration").addEventListener("click", () => {
  for (const [id, value] of Object.entries(calibrationDefaults)) {
    document.getElementById(id).value = value;
  }
  applyCalibration();
});

document.getElementById("dragToggle").addEventListener("change", (event) => {
  stage.classList.toggle("drag-enabled", event.target.checked);
  video.controls = !event.target.checked;
});

let dragStart = null;

screen.addEventListener("pointerdown", (event) => {
  if (!stage.classList.contains("drag-enabled")) return;
  const stageRect = stage.getBoundingClientRect();
  dragStart = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    left: parseFloat(document.getElementById("clipX").value),
    top: parseFloat(document.getElementById("clipY").value),
    stageWidth: stageRect.width,
    stageHeight: stageRect.height,
  };
  screen.setPointerCapture(event.pointerId);
});

screen.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  const nextX = dragStart.left + ((event.clientX - dragStart.pointerX) / dragStart.stageWidth) * 100;
  const nextY = dragStart.top + ((event.clientY - dragStart.pointerY) / dragStart.stageHeight) * 100;
  document.getElementById("clipX").value = nextX;
  document.getElementById("clipY").value = nextY;
  applyCalibration();
});

screen.addEventListener("pointerup", () => {
  dragStart = null;
});

document.getElementById("clipInput").addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  video.src = URL.createObjectURL(file);
  placeholder.hidden = true;
  video.play();
  playButton.textContent = "Pause preview";
});

document.getElementById("avatarInput").addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;
  const avatar = document.getElementById("avatarPreview");
  avatar.replaceChildren();
  const image = document.createElement("img");
  image.src = URL.createObjectURL(file);
  image.alt = "";
  avatar.appendChild(image);
});

document.getElementById("fitInput").addEventListener("change", (event) => {
  video.style.objectFit = event.target.value;
});

playButton.addEventListener("click", () => {
  if (!video.src) {
    document.getElementById("clipInput").click();
    return;
  }
  if (video.paused) {
    video.play();
    playButton.textContent = "Pause preview";
  } else {
    video.pause();
    playButton.textContent = "Play preview";
  }
});

document.getElementById("fullscreenButton").addEventListener("click", () => {
  document.getElementById("stage").requestFullscreen();
});

document.getElementById("hidePanel").addEventListener("click", () => {
  document.body.classList.add("panel-hidden");
});

document.getElementById("showPanel").addEventListener("click", () => {
  document.body.classList.remove("panel-hidden");
});

const persistentControlIds = [
  ...bindings.map(([inputId]) => inputId),
  "fitInput",
  ...Object.keys(styleDefaults),
  ...Object.keys(calibrationDefaults),
];

for (const id of persistentControlIds) {
  const control = document.getElementById(id);
  const savedValue = localStorage.getItem(`winner-template:${id}`);
  if (savedValue !== null) {
    control.value = savedValue;
  }
  control.dispatchEvent(new Event("input"));
  control.addEventListener("input", () => {
    localStorage.setItem(`winner-template:${id}`, control.value);
  });
  control.addEventListener("change", () => {
    localStorage.setItem(`winner-template:${id}`, control.value);
  });
}

function elementRectOnCanvas(element, stageRect, scaleX, scaleY) {
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left - stageRect.left) * scaleX,
    y: (rect.top - stageRect.top) * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
}

function drawCover(context, image, x, y, width, height, fit = "cover") {
  const sourceWidth = image.videoWidth || image.naturalWidth;
  const sourceHeight = image.videoHeight || image.naturalHeight;
  if (!sourceWidth || !sourceHeight) return;

  const scale = fit === "contain"
    ? Math.min(width / sourceWidth, height / sourceHeight)
    : Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function drawTextElement(context, element, stageRect, scaleX, scaleY, align = "center") {
  const rect = elementRectOnCanvas(element, stageRect, scaleX, scaleY);
  const style = getComputedStyle(element);
  const fontSize = parseFloat(style.fontSize) * scaleY;
  context.save();
  context.font = `${style.fontWeight} ${fontSize}px "Razer F5", Arial, sans-serif`;
  context.fillStyle = style.color;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.85)";
  context.shadowBlur = Math.max(2, 7 * scaleY);
  context.shadowOffsetY = Math.max(1, 2 * scaleY);
  const x = align === "left" ? rect.x : rect.x + rect.width / 2;
  context.fillText(element.textContent, x, rect.y + rect.height / 2);
  context.restore();
}

function renderExportFrame(context, canvas) {
  const stageRect = stage.getBoundingClientRect();
  const scaleX = canvas.width / stageRect.width;
  const scaleY = canvas.height / stageRect.height;
  const scene = document.querySelector(".scene");
  const logoContainer = document.querySelector(".brand-crop");
  const logo = logoContainer.querySelector("img");

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawCover(context, scene, 0, 0, canvas.width, canvas.height);

  const topShade = context.createLinearGradient(0, 0, 0, canvas.height * 0.4);
  topShade.addColorStop(0, "rgba(0,0,0,0.5)");
  topShade.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = topShade;
  context.fillRect(0, 0, canvas.width, canvas.height * 0.4);

  const screenRect = elementRectOnCanvas(screen, stageRect, scaleX, scaleY);
  context.save();
  context.beginPath();
  context.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
  context.clip();
  context.fillStyle = "#000";
  context.fillRect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
  if (video.readyState >= 2) {
    drawCover(
      context,
      video,
      screenRect.x,
      screenRect.y,
      screenRect.width,
      screenRect.height,
      document.getElementById("fitInput").value,
    );
  }
  context.restore();

  const logoRect = elementRectOnCanvas(logoContainer, stageRect, scaleX, scaleY);
  const logoSourceWidth = logoRect.width / (logoRect.height / logo.naturalHeight);
  context.drawImage(
    logo,
    0,
    0,
    Math.min(logoSourceWidth, logo.naturalWidth),
    logo.naturalHeight,
    logoRect.x,
    logoRect.y,
    logoRect.width,
    logoRect.height,
  );

  drawTextElement(context, document.getElementById("eyebrowOutput"), stageRect, scaleX, scaleY);
  drawTextElement(context, document.getElementById("titleOutput"), stageRect, scaleX, scaleY);
  drawTextElement(context, document.getElementById("subtitleOutput"), stageRect, scaleX, scaleY);

  const avatar = document.getElementById("avatarPreview");
  const avatarRect = elementRectOnCanvas(avatar, stageRect, scaleX, scaleY);
  context.save();
  context.beginPath();
  context.arc(
    avatarRect.x + avatarRect.width / 2,
    avatarRect.y + avatarRect.height / 2,
    avatarRect.width / 2,
    0,
    Math.PI * 2,
  );
  context.clip();
  const avatarImage = avatar.querySelector("img");
  if (avatarImage) {
    drawCover(context, avatarImage, avatarRect.x, avatarRect.y, avatarRect.width, avatarRect.height);
  } else {
    context.fillStyle = "#171b1d";
    context.fillRect(avatarRect.x, avatarRect.y, avatarRect.width, avatarRect.height);
  }
  context.restore();
  context.strokeStyle = "#44d62c";
  context.lineWidth = Math.max(2, 2 * scaleX);
  context.beginPath();
  context.arc(
    avatarRect.x + avatarRect.width / 2,
    avatarRect.y + avatarRect.height / 2,
    avatarRect.width / 2 - context.lineWidth / 2,
    0,
    Math.PI * 2,
  );
  context.stroke();

  drawTextElement(context, document.getElementById("segmentOutput"), stageRect, scaleX, scaleY, "left");
  drawTextElement(context, document.getElementById("displayNameOutput"), stageRect, scaleX, scaleY, "left");
  drawTextElement(context, document.getElementById("usernameOutput"), stageRect, scaleX, scaleY, "left");
}

function chooseRecordingType() {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function recordExport(canvas, context, videoBitrate, audioBitrate, attempt, exportStatus) {
  const canvasStream = canvas.captureStream(30);
  const videoStream = typeof video.captureStream === "function" ? video.captureStream() : null;
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...(videoStream ? videoStream.getAudioTracks() : []),
  ]);
  const mimeType = chooseRecordingType();
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: videoBitrate,
    audioBitsPerSecond: audioBitrate,
  });
  const chunks = [];
  let animationFrame;

  const draw = () => {
    renderExportFrame(context, canvas);
    const progress = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
    const prefix = attempt === 1 ? "Exporting" : `Compressing (pass ${attempt})`;
    exportStatus.textContent = `${prefix} ${progress}%`;
    animationFrame = requestAnimationFrame(draw);
  };

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });

  const completed = new Promise((resolve, reject) => {
    recorder.addEventListener("stop", resolve, { once: true });
    recorder.addEventListener("error", reject, { once: true });
  });

  video.pause();
  if (video.currentTime !== 0) {
    const seeked = new Promise((resolve) => video.addEventListener("seeked", resolve, { once: true }));
    video.currentTime = 0;
    await seeked;
  }

  renderExportFrame(context, canvas);
  recorder.start(1000);
  draw();

  const ended = new Promise((resolve) => video.addEventListener("ended", resolve, { once: true }));
  await video.play();
  await ended;
  cancelAnimationFrame(animationFrame);
  renderExportFrame(context, canvas);
  recorder.stop();
  await completed;
  combinedStream.getTracks().forEach((track) => track.stop());

  const outputType = recorder.mimeType || mimeType || "video/webm";
  return {
    blob: new Blob(chunks, { type: outputType }),
    outputType,
  };
}

document.getElementById("exportButton").addEventListener("click", async () => {
  const exportButton = document.getElementById("exportButton");
  const exportStatus = document.getElementById("exportStatus");

  if (!video.currentSrc || !Number.isFinite(video.duration)) {
    exportStatus.textContent = "Choose a clip before exporting.";
    document.getElementById("clipInput").click();
    return;
  }

  exportButton.disabled = true;
  exportButton.textContent = "Exporting...";
  exportStatus.textContent = "Preparing 1920 x 1080 WebM video...";

  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;
  const context = canvas.getContext("2d", { alpha: false });
  const previousLoop = video.loop;
  const maxBytes = 10000000;
  const targetBytes = 9200000;
  const totalBitrate = Math.floor((targetBytes * 8) / video.duration);
  let audioBitrate = Math.max(32000, Math.min(96000, Math.floor(totalBitrate * 0.08)));
  let videoBitrate = Math.max(80000, Math.min(8000000, totalBitrate - audioBitrate - 24000));

  try {
    await document.fonts.ready;
    video.loop = false;
    let result;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      result = await recordExport(
        canvas,
        context,
        videoBitrate,
        audioBitrate,
        attempt,
        exportStatus,
      );
      if (result.blob.size <= maxBytes) break;

      const reduction = Math.min(0.9, (targetBytes / result.blob.size) * 0.88);
      videoBitrate = Math.max(80000, Math.floor(videoBitrate * reduction));
      audioBitrate = Math.max(32000, Math.min(audioBitrate, Math.floor(audioBitrate * reduction)));
      exportStatus.textContent = `File is ${(result.blob.size / 1000000).toFixed(2)} MB. Recompressing...`;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!result || result.blob.size > maxBytes) {
      throw new Error("Could not reach the 10 MB limit after three passes.");
    }

    const { blob, outputType } = result;
    const extension = outputType.startsWith("video/mp4") ? "mp4" : "webm";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `game-clips-${document.getElementById("segmentInput").value.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "export"}.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
    exportStatus.textContent = `Export complete: ${(blob.size / 1000000).toFixed(2)} MB ${extension.toUpperCase()}`;
  } catch (error) {
    console.error(error);
    exportStatus.textContent = `Export failed: ${error.message}`;
  } finally {
    video.loop = previousLoop;
    exportButton.disabled = false;
    exportButton.textContent = "Export WebM";
  }
});
