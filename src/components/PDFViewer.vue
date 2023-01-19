<template>
  <div class="container">
    <div class="toolbar">
      <div class="grid-container">
        <div class="search">
          <button @click="isOpenSearchbar = !isOpenSearchbar">
            <img src="../assets/icons/search.svg" class="search-icon" />
          </button>
          <div v-if="isOpenSearchbar" class="search-bar">
            <input
              v-model="searchWord"
              type="text"
              placeholder="Suche..."
              class="search-input"
            />
            <button @click="search">
              <img src="../assets/icons/search.svg" class="search-icon" />
            </button>
            <button @click="prev">
              <img
                src="../assets/icons/double-arrow-left-icon.svg"
                class="back-icon"
              />
            </button>
            <button @click="next">
              <img
                src="../assets/icons/double-arrow-right-icon.svg"
                class="next-icon"
              />
            </button>
          </div>
        </div>
        <div id="jump_to_page" class="jump_to_page">
          <button
            @click="changePage(-1)"
            class="zoom-out zoom-button"
          >
            <img src="../assets/icons/line-angle-left-icon.svg" class="zoom-icon" />
          </button>
          <input
              v-model.number="currentPage"
              @change="jump_to_page()"
              for="new-page"
              placeholder="Seite..."
              class="page-input"
            />
          <button
            @click="changePage(1)"
            class="zoom-in zoom-button"
          >
            <img src="../assets/icons/line-angle-right-icon.svg" class="zoom-icon" />
          </button>
        </div>
        <div id="zoom" class="zoom">
          <button
            @click="changeZoom(getZoomValue(-1))"
            class="zoom-out zoom-button"
          >
            <img src="../assets/icons/zoom-out-line-icon.svg" class="zoom-icon" />
          </button>
          <input
            v-model.number="currentZoom"
            @change="changeZoom(0)"
            for="zoom-factor"
            placeholder="100%"
            class="zoom-input"
          />
          <button
            @click="changeZoom(getZoomValue(1))"
            class="zoom-in zoom-button"
          >
            <img src="../assets/icons/zoom-in-line-icon.svg" class="zoom-icon" />
          </button>
        </div>
        <div id="rotation" class="rotation">
          <button @click="rotation(-90)" class="rotate-left">
            <img src="../assets/icons/rotationLeft.svg" />
          </button>
          <button @click="rotation(90)" class="rotate-right">
            <img src="../assets/icons/rotationRight.svg" />
          </button>
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
      currentPage: 1,
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
    getZoomValue(key) {
      if (this.currentZoom < 60 && key < 0) {
        return -10;
      } else if (this.currentZoom < 50) {
        return 10;
      }
      return 25 * key;
    },
    jump_to_page() {
      if (this.currentPage < 1) { this.currentPage = 1; }
      if (this.currentPage > this.document.numPages) { this.currentPage = this.document.numPages; }
      this.pdfViewer.currentPageNumber= this.currentPage;
    },
    changePage(number) {
      this.currentPage += number;
      if (this.currentPage < 1) { this.currentPage = 1; }
      if (this.currentPage > this.document.numPages) { this.currentPage = this.document.numPages; }
      this.pdfViewer.currentPageNumber= this.currentPage;
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
  background: none;
  border: none;
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

  padding-top: 3px;
  padding-bottom: 3px;
  padding-left: 10px;
  padding-right: 10px;

  width: 100%;
  height: fit-content;
  z-index: 10000;
  border-radius: 7px;
  background: rgb(0, 55, 99);

  display: flex;
  align-items: center;
}

.grid-container {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  align-items: center;
  justify-items: center;
}

.search {
  justify-self: start;
}

.search-icon {
  height: 15px;
  width: 15px;
}

.search-bar {
  z-index: 10000;
  position: absolute;
  top: 160%;
  left: 0;
  padding: 6px;

  display: flex;
  align-items: center;

  border-radius: 5px;
  background-color: #51c1e0;
}

.search-input {
  border-radius: 4px;
  padding: 4px;
  box-shadow: none;
  border: none;
}

.back-icon {
  height: 15px;
  width: 15px;
}

.next-icon {
  height: 15px;
  width: 15px;
}
.zoom {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: stretch;
}

.zoom-button {
  box-shadow: none;
  display: flex;
  align-items: center;
}

.zoom-icon {
  height: 15px;
  width: 15px;
}

.zoom-input {
  border-radius: 4px;
  width: 40px;
  padding: 4px;
  text-align: center;
  box-shadow: none;
  border: none;
}

.jump_to_page {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: stretch;
}

.page-input {
  border-radius: 4px;
  width: 40px;
  padding: 4px;
  text-align: center;
  box-shadow: none;
  border: none;
}

.search {
  justify-content: space-between;
  align-content: center;
  position: relative;
  display: flex;
  align-items: center;
}

.rotation {
  justify-content: center;
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
