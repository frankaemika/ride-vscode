import mermaid from "mermaid";
import panzoom from "panzoom";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
});

window.addEventListener("message", async (event: MessageEvent) => {
  if (event.data.command === "update") {
    await updateDiagram(event.data.content);
    setupDiagramInteractions();
  }
});

async function updateDiagram(content: string): Promise<void> {
  const element = document.getElementById("mermaidDiagram") as HTMLElement;
  const { svg } = await mermaid.render("stateMachineSvg", content);
  element.innerHTML = svg;
}

function setupDiagramInteractions(): void {
  const svgElement = document.getElementById("stateMachineSvg");

  if (svgElement instanceof SVGElement) {
    const panzoomInstance = panzoom(svgElement, {
      minZoom: 0.5,
    });
    setupResetButton(panzoomInstance);
    setupDownloadButton(svgElement);
  }
}

function setupResetButton(panzoomInstance) {
  document.getElementById("resetButton").addEventListener("click", () => {
    panzoomInstance.moveTo(0, 0);
    panzoomInstance.zoomAbs(0, 0, 1);
  });
}

function setupDownloadButton(svgElement) {
  document.getElementById("downloadButton").addEventListener("click", () => {
    const svgData = svgElement.outerHTML;
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "state_machine_diagram.svg";
    downloadLink.click();
  });
}
