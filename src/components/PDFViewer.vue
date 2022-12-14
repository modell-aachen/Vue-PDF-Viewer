<template>
  <div>
    <div class = "toolbar rotation">
        <button @click=rotation(-90) class="rotate-left"><img src="../assets/icons/rotationLeft.svg"></button>
        <button @click=rotation(90) class=""><img src="../assets/icons/rotationRight.svg"></button>
    </div>
    <div ref="viewerContainer" id="viewerContainer" class="viewerContainer">
      <div ref="viewer" id="viewer" class="pdfViewer"></div>
    </div>
  </div>
</template>

<script>
import * as pdf from "pdfjs-dist/legacy/build/pdf.js";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.js";
import * as pdfjsViewer from "pdfjs-dist/legacy/web/pdf_viewer.js";
import SANDBOX_BUNDLE_SRC from "pdfjs-dist/legacy/build/pdf.sandbox.js";

pdf.GlobalWorkerOptions.workerPort = new PdfWorker();

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      currentRotation: 0,
      document: null,
      pdfViewer: null,
      eventBus: null,
    };
  },
  async mounted() {
    await this.loadDocument();
    this.renderPDF();
  },
  methods: {
    rotation(degree) {
      this.currentRotation += degree;
      const FULL_ROTATION = 360;
      if (this.currentRotation >= FULL_ROTATION){
        this.currentRotation -= FULL_ROTATION;
      }
      if (this.currentRotation < 0){
        this.currentRotation += FULL_ROTATION;
      }
      this.pdfViewer.pagesRotation = this.currentRotation;
    },
    async loadDocument() {
      try {
        this.document = await pdf.getDocument({
          url: this.url,
          enableXfa: true,
        }).promise;
      } catch (e) {
        console.warn("Failed to load document");
      }
    },
    renderPDF() {
      const container = this.$refs.viewerContainer;
      const eventBus = new pdfjsViewer.EventBus();
      const pdfLinkService = new pdfjsViewer.PDFLinkService({
        eventBus,
      });

      // (Optionally) enable find controller.
      const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus,
        linkService: pdfLinkService,
      });

      // (Optionally) enable scripting support.
      const pdfScriptingManager = new pdfjsViewer.PDFScriptingManager({
        eventBus,
        sandboxBundleSrc: SANDBOX_BUNDLE_SRC,
      });
      this.pdfViewer = new pdfjsViewer.PDFViewer({
        container,
        eventBus,
        linkService: pdfLinkService,
        findController: pdfFindController,
        scriptingManager: pdfScriptingManager,
      });
      pdfLinkService.setViewer(this.pdfViewer);
      pdfScriptingManager.setViewer(this.pdfViewer);
      eventBus.on("pagesinit", () => {
        this.pdfViewer.currentScaleValue = "page-width";
      });
      this.pdfViewer.setDocument(this.document);
      pdfLinkService.setDocument(this.document, null);
      this.eventBus = eventBus;
    },
  },
};
</script>

<style scoped>
@import "../../node_modules/pdfjs-dist/legacy/web/pdf_viewer.css";

.toolbar {
  display: flex;
  justify-content: space-between;
  align-content: center;
  margin: 4px;
  position: relative;
  text-align: center;
  background-color: grey;
}

.rotation{
  justify-content: center;
  background-color: #2c3e50;
}

.rotate-left{
  margin-right: 20px;
}

.viewerContainer {
  overflow: auto;
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>