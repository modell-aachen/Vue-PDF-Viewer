<template>
  <!-- Container for the whole toolbar and viewer -->
  <div class="container">
    <div class="toolbar" :style="{ backgroundColor: toolbarColor }">
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
          <div
            v-if="isOpenSearchbar"
            class="search-bar"
            :style="{ background: searchbarColor }"
          >
            <input
              v-model="searchWord"
              type="text"
              placeholder="Suche..."
              class="search-input"
            />
            <button @click="search">
              <font-awesome-icon
                icon="fa-solid fa-magnifying-glass"
                size="xl"
                style="color: white"
              />
            </button>
            <button @click="prevSearch">
              <font-awesome-icon
                icon="fa-solid fa-angles-left"
                size="xl"
                style="color: white"
              />
            </button>
            <button @click="nextSearch">
              <font-awesome-icon
                icon="fa-solid fa-angles-right"
                size="xl"
                style="color: white"
              />
            </button>
          </div>
        </div>
        <div class="zoom-rotate">
          <button @click="rotation(-90)">
            <font-awesome-icon
              icon="fa-solid fa-rotate-left"
              size="xl"
              style="color: white"
            />
          </button>
          <button @click="decreaseScale()">
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
          <button @click="increaseScale()">
            <font-awesome-icon
              icon="fa-solid fa-magnifying-glass-plus"
              size="xl"
              style="color: white"
            />
          </button>
          <button @click="rotation(90)">
            <font-awesome-icon
              icon="fa-solid fa-rotate-right"
              size="xl"
              style="color: white"
            />
          </button>
          <button @click="resize('page-fit')">
            <font-awesome-icon
              icon="fa-solid fa-up-right-and-down-left-from-center"
              size="xl"
              style="color: white"
            />
          </button>
          <button @click="resize('page-width')">
            <font-awesome-icon
              icon="fa-solid fa-left-right"
              size="xl"
              style="color: white"
            />
          </button>
        </div>
        <div class="pages">
          <button @click="changePage(-1)">
            <font-awesome-icon
              icon="fa-solid fa-arrow-left"
              size="xl"
              style="color: white"
            />
          </button>
          <input
            v-model.number="currentPage"
            @change="jump_to_page()"
            for="new-page"
            placeholder="Seite..."
            class="page-input"
          />
          <button @click="changePage(1)">
            <font-awesome-icon
              icon="fa-solid fa-arrow-right"
              size="xl"
              style="color: white"
            />
          </button>
          <div class="scroll-mode">
            <button @click="changePageView" class="page-mode">
              <font-awesome-icon
                v-if="isScrollMode"
                icon="fa-solid fa-file"
                size="xl"
                style="color: white"
              />
              <font-awesome-icon
                v-else
                icon="fa-solid fa-scroll"
                size="xl"
                style="color: white"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="pdfContainer">
      <div ref="viewerContainer" id="viewerContainer" class="viewerContainer">
        <div ref="viewer" id="viewer" class="pdfViewer"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faMagnifyingGlass,
  faAnglesLeft,
  faAnglesRight,
  faRotateLeft,
  faRotateRight,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faArrowLeft,
  faArrowRight,
  faLeftRight,
  faUpRightAndDownLeftFromCenter,
  faFile,
  faScroll,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faMagnifyingGlass,
  faAnglesLeft,
  faAnglesRight,
  faRotateLeft,
  faRotateRight,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faArrowLeft,
  faArrowRight,
  faLeftRight,
  faUpRightAndDownLeftFromCenter,
  faFile,
  faScroll
);
import * as pdf from "pdfjs-dist/legacy/build/pdf.js";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.js";
import * as pdfjsViewer from "pdfjs-dist/legacy/web/pdf_viewer.js";
import SANDBOX_BUNDLE_SRC from "pdfjs-dist/legacy/build/pdf.sandbox.js";

pdf.GlobalWorkerOptions.workerPort = new PdfWorker();

export default {
  components: {
    FontAwesomeIcon,
  },
  props: {
    url: {
      type: String,
      required: true,
    },
    toolbarColor: {
      type: String,
      required: false,
      default: "rgb(0, 55, 99)",
    },
    searchbarColor: {
      type: String,
      required: false,
      default: "#708090",
    },
  },
  data() {
    return {
      currentZoom: 100,
      currentRotation: 0,
      document: null,
      pdfViewer: null,
      eventBus: null,
      pdfFindController: null,
      isOpenSearchbar: false,
      searchWord: "",
      currentPage: 1,
      isScrollMode: true,
    };
  },
  async mounted() {
    await this.loadDocument();
    this.renderPDF();
  },
  methods: {
    changePageView() {
      if (this.isScrollMode) {
        this.pdfViewer.scrollMode = 3;
        this.isScrollMode = false;
      } else {
        this.pdfViewer.scrollMode = 0;
        this.isScrollMode = true;
      }
    },
    resize(size) {
      this.pdfViewer.currentScaleValue = size;
      this.currentZoom = this.pdfViewer.currentScaleValue;
    },
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
    increaseScale() {
      this.pdfViewer.increaseScale();
      this.currentZoom = Math.floor(this.pdfViewer.currentScaleValue * 100);
    },
    decreaseScale() {
      this.pdfViewer.decreaseScale();
      this.currentZoom = Math.floor(this.pdfViewer.currentScaleValue * 100);
    },
    changeZoom(value) {
      if (isNaN(this.currentZoom)) this.currentZoom = 100;
      const tempZoomValue = this.currentZoom + value;
      if (tempZoomValue > 1000) {
        this.currentZoom = 1000;
      } else if (tempZoomValue < 10) {
        this.currentZoom = 10;
      } else {
        this.currentZoom = tempZoomValue;
      }

      // Updates the current scale value of the PDF viewer.
      this.pdfViewer.currentScaleValue = this.currentZoom / 100;
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

      // (Optionally) enable find controller.
      this.pdfFindController = new pdfjsViewer.PDFFindController({
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
        findController: this.pdfFindController,
        scriptingManager: pdfScriptingManager,
      });

      // Set the viewer for the link service
      pdfLinkService.setViewer(this.pdfViewer);
      // Set the viewer for the scripting manager
      pdfScriptingManager.setViewer(this.pdfViewer);

      // Set the current zoom level of the viewer on pagesinit event
      eventBus.on("pagesinit", () => {
        this.pdfViewer.currentScaleValue = "page-width";
        this.currentZoom = "page-width";
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
      container.addEventListener("scroll", () => {
        this.currentPage = this.pdfViewer.currentPageNumber;
      });
    },
    search() {
      this.eventBus.dispatch("find", {
        type: "",
        query: this.searchWord,
        highlightAll: true,
      });
      this.currentPage = this.pdfViewer.currentPageNumber;
    },
    nextSearch() {
      this.eventBus.dispatch("find", {
        type: "again",
        query: this.searchWord,
        highlightAll: true,
      });
      this.currentPage = this.pdfViewer.currentPageNumber;
      console.log(this.pdfFindController);
    },
    prevSearch() {
      this.eventBus.dispatch("find", {
        type: "again",
        query: this.searchWord,
        highlightAll: true,
        findPrevious: true,
      });
      this.currentPage = this.pdfViewer.currentPageNumber;
    },
    jump_to_page() {
      if (this.currentPage < 1) {
        this.currentPage = 1;
      }
      if (this.currentPage > this.document.numPages) {
        this.currentPage = this.document.numPages;
      }
      this.pdfViewer.currentPageNumber = this.currentPage;
    },
    changePage(number) {
      this.currentPage += number;
      if (this.currentPage < 1) {
        this.currentPage = 1;
      }
      if (this.currentPage > this.document.numPages) {
        this.currentPage = this.document.numPages;
      }
      this.pdfViewer.currentPageNumber = this.currentPage;
    },
  },
};
</script>

<style scoped>
@import "../assets/css/pdf_viewer.css";

button {
  background: none;
  border: none;
  padding: 0;
}

.container {
  padding: 30px;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-items: center;
  z-index: 100;
  scrollbar-width: none;
  box-sizing: border-box;
}

.toolbar {
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;

  height: 30px;
  z-index: 10000;
  border-radius: 7px;

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
  justify-content: space-between;
  align-content: center;
  position: relative;
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
}

.search-input {
  border-radius: 4px;
  padding: 4px;
  box-shadow: none;
  border: none;
}

.zoom-rotate {
  display: flex;
  align-items: center;
  gap: 1rem;
  align-self: center;
}

.zoom-input {
  border-radius: 4px;
  width: 80px;
  padding: 4px;
  text-align: center;
  box-shadow: none;
  border: none;
}

.pages {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: end;
}

.page-input {
  border-radius: 4px;
  width: 25px;
  padding: 4px;
  text-align: center;
  box-shadow: none;
  border: none;
}

.page-mode {
  width: 40px;
}

.viewerContainer {
  overflow-x: scroll;
  overflow-y: scroll;
  position: absolute;
  width: 90%;
  height: 100%;
  box-sizing: border-box;
}

.pdfContainer {
  display: flex;
  position: relative;
  height: 100%;
  justify-content: center;
}
</style>
