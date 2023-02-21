import PDFViewer from "./components/PDFViewer.vue";

function install(Vue) {
    if (install.installed) return;
    install.installed = true;
    Vue.component("vue-pdf-viewer", PDFViewer);
}

const plugin = {
    install,
};

let GlobalVue = null;
if (typeof window !== "undefined") {
    GlobalVue = window.Vue;
} else if (typeof global !== "undefined") {
    GlobalVue = global.vue;
}
if (GlobalVue) {
    GlobalVue.use(plugin);
}

PDFViewer.install = install;

export default PDFViewer;