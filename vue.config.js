const {
    defineConfig
} = require("@vue/cli-service");
module.exports = defineConfig({
    css: {
        extract: false
    },
    transpileDependencies: true,
    configureWebpack: {
        module: {
            rules: [{
                test: /\.worker\.js$/,
                loader: "worker-loader",
                options: {
                    inline: "no-fallback",
                },
            }, ],
        },
    },
});