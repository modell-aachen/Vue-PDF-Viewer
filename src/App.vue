<template>
  <div class="outer-box">
    <PDFViewerVue :url="url" />
  </div>
</template>

<script>
import PDFViewerVue from "./components/PDFViewer.vue";

export default {
  name: "PDFViewer",
  components: {
    PDFViewerVue,
  },
  data() {
    return {
      url: "http://127.0.0.1:9000/sample1.pdf",
    };
  },
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.outer-box {
  height: 100vh;
}
</style>
