// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";

  // Print button on the DVIR checklist.
  document.querySelectorAll("[data-print]").forEach(function (button) {
    button.hidden = false;
    button.addEventListener("click", function () { window.print(); });
  });

  // Tread depth converter (tread-depth-chart.html).
  var form = document.getElementById("converter");
  if (!form) return;

  var MM_PER_32 = 25.4 / 32; // 0.79375 mm, exact
  var input = form.querySelector("#depth-value");
  var unit = form.querySelector("#depth-unit");
  var out32 = document.getElementById("out-32");
  var outMM = document.getElementById("out-mm");
  var outIn = document.getElementById("out-in");
  var error = document.getElementById("converter-error");
  var bandCells = form.querySelectorAll("[data-guideline]");

  // Same presets as the app (brief §8): Replace soon at or below the guideline,
  // Watch up to the early warning, Good above it.
  var BANDS = {
    good: { word: "Good", icon: "#i-good" },
    watch: { word: "Watch", icon: "#i-watch" },
    replace: { word: "Replace soon", icon: "#i-replace" }
  };

  // Half-up rounding that survives binary floating point (8/32 = 6.35 mm shows as 6.4, like the table).
  function round(n, digits) {
    var p = Math.pow(10, digits);
    return Math.round(Number((n * p).toPrecision(12))) / p;
  }

  function chip(kind) {
    var span = document.createElement("span");
    span.className = "chip " + kind;
    var swatch = document.createElement("span");
    swatch.className = "swatch";
    span.appendChild(swatch);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", BANDS[kind].icon);
    svg.appendChild(use);
    span.appendChild(svg);
    span.appendChild(document.createTextNode(BANDS[kind].word));
    return span;
  }

  function update() {
    var raw = input.value.trim().replace(",", ".");
    var value = Number(raw);
    var n32;
    if (raw === "" || !isFinite(value) || value < 0) {
      n32 = NaN;
    } else if (unit.value === "mm") {
      n32 = value / MM_PER_32;
    } else if (unit.value === "in") {
      n32 = value * 32;
    } else {
      n32 = value;
    }

    if (isNaN(n32) || n32 > 40) {
      error.hidden = false;
      out32.textContent = "–";
      outMM.textContent = "–";
      outIn.textContent = "–";
      bandCells.forEach(function (cell) { cell.textContent = "–"; });
      return;
    }
    error.hidden = true;
    // Bands use the same rounded value the reader sees.
    var shown = round(n32, 1);
    out32.textContent = shown + "/32";
    outMM.textContent = round(n32 * MM_PER_32, 1) + " mm";
    outIn.textContent = round(n32 / 32, 3) + " in";

    bandCells.forEach(function (cell) {
      var guideline = Number(cell.getAttribute("data-guideline"));
      var early = Number(cell.getAttribute("data-early"));
      var kind = shown <= guideline ? "replace" : (shown <= early ? "watch" : "good");
      cell.textContent = "";
      cell.appendChild(chip(kind));
    });
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); update(); });
  input.addEventListener("input", update);
  unit.addEventListener("change", update);
  form.hidden = false;
  update();
})();
