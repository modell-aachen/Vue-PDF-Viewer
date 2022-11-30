<template>
  <div>
    <PDFViewerVue :url="url" />
  </div>
</template>

<script>
import PDFViewerVue from './components/PDFViewer.vue';

export default {
  name: 'PDFViewer',
  components: {
    PDFViewerVue
  },
  data() {
    return {
      url:"http://127.0.0.1:8080/sample.pdf"
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
