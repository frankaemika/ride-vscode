import mermaid from 'mermaid';
import panzoom, { PanZoom } from 'panzoom';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
});

window.addEventListener('message', async (event: MessageEvent) => {
  if (event.data.command === 'update') {
    await updateDiagram(event.data.content);
    setupDiagramInteractions();
  }
});

async function updateDiagram(content: string): Promise<void> {
  const element = document.getElementById('mermaidDiagram') as HTMLElement;
  const { svg } = await mermaid.render('stateMachineSvg', content);
  element.innerHTML = svg;
}

function setupDiagramInteractions(): void {
  const svgElement = document.getElementById('stateMachineSvg');

  if (svgElement instanceof SVGElement) {
    const panzoomInstance = panzoom(svgElement, { minZoom: 0.5 });
    setupButtonEvent('resetButton', () => resetPanzoom(panzoomInstance));
    setupButtonEvent('downloadButton', () => downloadSVG(svgElement));
  }
}

function setupButtonEvent(buttonId: string, eventHandler: () => void): void {
  const button = document.getElementById(buttonId);
  if (button) {
    const newButton = button.cloneNode(true);
    button.parentNode?.replaceChild(newButton, button);
    newButton.addEventListener('click', eventHandler);
  }
}

function resetPanzoom(panzoomInstance: PanZoom): void {
  panzoomInstance.moveTo(0, 0);
  panzoomInstance.zoomAbs(0, 0, 1);
}

function downloadSVG(svgElement: SVGElement): void {
  if (svgElement) {
    const svgData = svgElement.outerHTML;
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'state_machine_diagram.svg';
    downloadLink.click();
    downloadLink.remove();
  }
}
