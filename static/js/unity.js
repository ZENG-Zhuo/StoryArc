var canvas, config;

function initUnity() {
  canvas = document.querySelector("#unity-canvas");

  function unityShowBanner(msg, type) {
    var warningBanner = document.querySelector("#unity-warning");
    function updateBannerVisibility() {
      warningBanner.style.display = warningBanner.children.length
        ? "block"
        : "none";
    }
    var div = document.createElement("div");
    div.innerHTML = msg;
    warningBanner.appendChild(div);
    if (type === "error") {
      div.style = "background: red; padding: 10px;";
    } else {
      if (type === "warning") div.style = "background: yellow; padding: 10px;";
      setTimeout(() => {
        warningBanner.removeChild(div);
        updateBannerVisibility();
      }, 5000);
    }
    updateBannerVisibility();
  }

  var buildUrl = "static/Unity/Build";
  var loaderUrl = buildUrl + "/Unity.loader.js";
  config = {
    arguments: [],
    dataUrl: buildUrl + "/Unity.data",
    frameworkUrl: buildUrl + "/Unity.framework.js",
    codeUrl: buildUrl + "/Unity.wasm",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "DefaultCompany",
    productName: "LittleRedDemo",
    productVersion: "1.0",
    showBanner: unityShowBanner,
  };

  // Optional config flags:
  // config.devicePixelRatio = 1; // Uncomment to lower canvas resolution on mobile
  // config.autoSyncPersistentDataPath = true; // Uncomment to enable persistent data syncing

  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    var meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes";
    document.getElementsByTagName("head")[0].appendChild(meta);
    document.querySelector("#unity-container").className = "unity-mobile";
    canvas.className = "unity-mobile";
  } else {
    canvas.style.width = "960px";
    canvas.style.height = "600px";
  }

  document.querySelector("#unity-loading-bar").style.display = "block";

  var script = document.createElement("script");
  script.src = loaderUrl;
  document.body.appendChild(script);
}

function LoadUnityGame() {
  createUnityInstance(canvas, config, (progress) => {
    document.querySelector("#unity-progress-bar-full").style.width =
      100 * progress + "%";
  })
    .then((unityInstance) => {
      document.querySelector("#unity-loading-bar").style.display = "none";
      document.querySelector("#unity-fullscreen-button").onclick = () => {
        unityInstance.SetFullscreen(1);
      };
    })
    .catch((message) => {
      document.getElementById("errorModalLabel").innerText = "Unity Load Error";
      document.getElementById("errorModalMessage").innerText = message;
      $("#errorModal").modal("show");
    });
}
