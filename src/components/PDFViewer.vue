<template>
  <div>
    <div class="toolbar">
      <div id="rotation" class="rotation">
        <button @click=rotation(-90) class="rotate-left"><img src="../assets/icons/rotationLeft.svg"></button>
        <button @click=rotation(90) class="rotate-right"><img src="../assets/icons/rotationRight.svg"></button>
      </div>
      <div id="zoom" class="zoom">
        <button @click="changeZoom(getZoomValue(-1))" class="zoom-out">-</button>
        <input v-model.number="currentZoom" @change="changeZoom(0)" type="number" for="zoom-factor" placeholder="100%"/>
        <button @click="changeZoom(getZoomValue(1))" class="zoom-in">+</button>
      </div>
    <div class="container">
      <div class = "toolbar">
        <div class="search">
          <button @click="isOpenSearchbar = !isOpenSearchbar">Search</button>
          <div v-if="isOpenSearchbar" class="searchBar">
            <input v-model="searchWord" type="text" placeholder="Suche..." />
            <button @click="search">Suche</button>
            <button @click="prev">Prev</button>
            <button @click="next">Next</button>
          </div>
        </div>
        <div id="rotation" class="rotation">
          <button @click=rotation(-90) class="rotate-left"><img src="../assets/icons/rotationLeft.svg"></button>
          <button @click=rotation(90) class="rotate-right"><img src="../assets/icons/rotationRight.svg"></button>
        </div>

      </div>
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
      currentZoom: 100,
      currentRotation: 0,
      document: null,
      pdfViewer: null,
      eventBus: null,
      isOpenSearchbar: false,
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
      if (this.currentRotation >= FULL_ROTATION) {
        this.currentRotation -= FULL_ROTATION;
      }
      if (this.currentRotation < 0) {
        this.currentRotation += FULL_ROTATION;
      }
      this.pdfViewer.pagesRotation = this.currentRotation;
    },
    changeZoom(value) {
      const tempZoomValue = this.currentZoom + value;
      if (tempZoomValue > 400) {
        this.currentZoom = 400;
      } else if (tempZoomValue < 10) {
        this.currentZoom = 10;
      } else {
        this.currentZoom = tempZoomValue;
      }
      this.pdfViewer.currentScaleValue = this.currentZoom / 100;
    },
    getZoomValue(key){
      if (this.currentZoom < 60 && key < 0){
        return -10;
      } else if (this.currentZoom < 50){
        return 10;
      }
      return 25 * key;
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
        this.pdfViewer.currentScaleValue = this.currentZoom / 100;
      });
      this.pdfViewer.setDocument(this.document);
      pdfLinkService.setDocument(this.document, null);
      this.eventBus = eventBus;
      this.eventBus.on("resize", () => {
        const currentScaleValue = this.pdfViewer.currentScaleValue;
        if (
          currentScaleValue === "auto" ||
          currentScaleValue === "page-fit" ||
          currentScaleValue === "page-width"
        ) {
          // Note: the scale is constant for 'page-actual'.
          this.pdfViewer.currentScaleValue = currentScaleValue;
        }
        this.pdfViewer.update();
      });
      window.addEventListener("resize", () => {
        this.eventBus.dispatch("resize", { source: window });
      });
    },
    search() {
      this.eventBus.dispatch("find", {
        type: "",
        query: this.searchWord,
        highlightAll: true,
      });
    },
    next() {
      this.eventBus.dispatch("find", {
        type: "again",
        query: this.searchWord,
        highlightAll: true,
      });
    },
    prev() {
      this.eventBus.dispatch("find", {
        type: "again",
        query: this.searchWord,
        highlightAll: true,
        findPrevious: true,
      });
    },
  },
};
</script>

<style scoped>
@import "../../node_modules/pdfjs-dist/legacy/web/pdf_viewer.css";

button {
  margin: 0;
}

.container {
  padding: 30px;
  position: relative;
  height: 100%;
  display: grid;
  justify-items: center;
}

.toolbar {
  position: sticky;
  top: 0;
  left: 0;
  padding: 5px;
  border-radius: 2px;
  background: rgb(191, 190, 190);
  border-width: 2px;
  border-color: gray;
  width: 100%;
  height: fit-content;
  z-index: 10000;
  display: flex;
  align-items: center;
}

.search {
  justify-content: center;
  align-content: center;
  margin: 4px;
  position: relative;
  display: flex;
  align-items: center;
}

.searchBar {
  z-index: 10000;
  position: absolute;
  top: 2rem;
  left: 0;
  padding: 6px;

  display: flex;
  gap: 0.5rem;
  align-items: center;

  border-radius: 5px;
  background-color: grey;
  background-color: #2c3e50;
  gap: 1.2rem;
}

.rotation {
  justify-content: center;
  gap: 1.2rem;
}

.zoom {
  display: flex;
  gap: 1.2rem;
  align-content: center;
  gap: 1.2rem;
}

.rotate-left {
  margin-right: 20px;
}

.rotate-right {
  margin: 0;
  position: relative;

}

.viewerContainer {
  overflow: auto;
  position: absolute;
  width: 90%;
  top: 50px;
  height: 100%;
}
</style>
