<template>
  <!-- Container for the whole toolbar and viewer -->
  <div class="container">
    <!-- Container for the toolbar -->
    <div class="toolbar">
      <!-- Grid container for organizing the elements in the toolbar -->
      <div class="grid-container">
        <!-- Container for the search functionality -->
        <div class="search">
          <!-- Button to toggle the visibility of the search bar -->
          <button @click="isOpenSearchbar = !isOpenSearchbar">
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass"
              size="xl"
              style="color: white"
            />
          </button>
          <!-- Search bar that is visible only if `isOpenSearchbar` is true -->
          <div v-if="isOpenSearchbar" class="search-bar">
            <!-- Input field for entering the search word -->
            <input
              v-model="searchWord"
              type="text"
              placeholder="Suche..."
              class="search-input"
            />
            <!-- Button to start the search -->
            <button @click="search" class="button-search">
              <font-awesome-icon
                icon="fa-solid fa-magnifying-glass"
                size="xl"
                style="color: white"
              />
            </button>
            <button @click="prevSearch" class="button-search">
              <font-awesome-icon
                icon="fa-solid fa-angles-left"
                size="xl"
                style="color: white"
              />
            </button>
            <button @click="nextSearch" class="button-search">
              <font-awesome-icon
                icon="fa-solid fa-angles-right"
                size="xl"
                style="color: white"
              />
            </button>
          </div>
        </div>
        <div class="zoom-rotate">
          <button @click="rotation(-90)" class="rotate-button">
            <font-awesome-icon
              icon="fa-solid fa-rotate-left"
              size="xl"
              style="color: white"
            />
          </button>
          <button
            @click="changeZoom(getZoomValue(-1))"
            class="zoom-out zoom-button"
          >
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass-minus"
              size="xl"
              style="color: white"
            />
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
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass-plus"
              size="xl"
              style="color: white"
            />
          </button>
          <button @click="rotation(90)" class="rotate-button">
            <font-awesome-icon
              icon="fa-solid fa-rotate-right"
              size="xl"
              style="color: white"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Container to render the complete pdf file -->
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
      searchWord: "",
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
    // Changes the zoom level of the PDF document.
    changeZoom(value) {
      // Calculates the temporary zoom value.
      const tempZoomValue = this.currentZoom + value;

      // Checks if the zoom value is within the range of 10-400.
      if (tempZoomValue > 400) {
        this.currentZoom = 400;
      } else if (tempZoomValue < 10) {
        this.currentZoom = 10;
      } else {
        this.currentZoom = tempZoomValue;
      }

      // Updates the current scale value of the PDF viewer.
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
    // Renders a PDF document in a container
    renderPDF() {
      // Get a reference to the viewer container
      const container = this.$refs.viewerContainer;
      // Create an event bus for PDF.js
      const eventBus = new pdfjsViewer.EventBus();
      // Create a PDF link service for the viewer
      const pdfLinkService = new pdfjsViewer.PDFLinkService({
        eventBus,
      });

      // (Optionally) enable find controller
      const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus,
        linkService: pdfLinkService,
      });

      // (Optionally) enable scripting support
      const pdfScriptingManager = new pdfjsViewer.PDFScriptingManager({
        eventBus,
        sandboxBundleSrc: SANDBOX_BUNDLE_SRC,
      });

      // Create a PDF viewer with the required components
      this.pdfViewer = new pdfjsViewer.PDFViewer({
        container,
        eventBus,
        linkService: pdfLinkService,
        findController: pdfFindController,
        scriptingManager: pdfScriptingManager,
      });

      // Set the viewer for the link service
      pdfLinkService.setViewer(this.pdfViewer);
      // Set the viewer for the scripting manager
      pdfScriptingManager.setViewer(this.pdfViewer);

      // Set the current zoom level of the viewer on pagesinit event
      eventBus.on("pagesinit", () => {
        this.pdfViewer.currentScaleValue = this.currentZoom / 100;
      });

      // Set the document to be viewed
      this.pdfViewer.setDocument(this.document);
      // Set the document for the link service
      pdfLinkService.setDocument(this.document, null);

      // Keep a reference to the event bus
      this.eventBus = eventBus;

      // Listen for the resize event and update the viewer
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

      // Listen for the window resize event and dispatch a resize event on the event bus
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
    nextSearch() {
      this.eventBus.dispatch("find", {
        type: "again",
        query: this.searchWord,
        highlightAll: true,
      });
    },
    prevSearch() {
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
  padding: 0;
}

.container {
  padding: 30px;
  position: relative;
  height: 100%;
  display: grid;
  justify-items: center;
  z-index: 100;
  scrollbar-width: none;
}

.toolbar {
  position: sticky;
  top: 0;
  left: 0;

  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;

  width: 100%;
  height: 30px;
  z-index: 10000;
  border-radius: 7px;
  background: rgb(0, 55, 99);

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grid-container {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
}

.search {
  justify-self: start;
}

.search-button {
  height: 100%;
  width: 100%;
}

.button-search {
  display: flex;
  align-items: center;
}
.search-bar {
  z-index: 10000;
  position: absolute;
  top: 35px;
  left: 0;
  padding: 5px;
  gap: 0.7rem;

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
.zoom-rotate {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: center;
}

.zoom-button {
  box-shadow: none;
  display: flex;
  align-items: center;
}

.zoom-icon {
  height: 100%;
  width: 100%;
}

.rotate-button {
  box-shadow: none;
  display: flex;
  align-items: center;
}

.rotation-icon {
  height: 100%;
  width: 100%;
}

.zoom-input {
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
.viewerContainer {
  overflow: auto;
  position: absolute;
  width: 90%;
  top: 50px;
  height: 100%;
}
</style>
