<template>
  <canvas ref="pdf" class="c-qwiki-pdf" />
</template>

<script>
import * as pdf from "pdfjs-dist/legacy/build/pdf.js";
import PdfWorker from "pdfjs-dist/legacy/build/pdf.worker.js";

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      document: null,
    };
  },
  mounted() {
    pdf.GlobalWorkerOptions.workerPort = new PdfWorker();
  },
  async created() {
    await this.loadDocument();
    if (this.document) {
      await this.renderPage(1);
    }
  },
  methods: {
    async loadDocument() {
      try {
        this.document = await pdf.getDocument(this.url).promise;
      } catch (e) {
        console.warn("Failed to load document");
      }
    },
    async renderPage(number) {
      try {
        const page = await this.document.getPage(number);
        const canvas = this.$refs.pdf;
        const viewport = page.getViewport({ scale: 1 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport,
        }).promise;
      } catch (e) {
        console.warn(`Rendering of page failed`, e);
      }
    },
  },
};
</script>

<style>
</style>