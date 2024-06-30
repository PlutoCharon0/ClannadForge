export default function getData(promptsResults) {
	return {
		"src\\App.vue": {
			needTypescript: promptsResults.needTypescript,
		},
		"index.html": {
			needTypescript: promptsResults.needTypescript,
		},
		"src\\main.js": {
			usePinia: promptsResults.configs
				.map((item) => item.name)
				.includes("pinia"),
			useVueRouter: promptsResults.configs
				.map((item) => item.name)
				.includes("vue-router"),
			plugins: [
				{
					id: "pinia",
					importer: "import { createPinia } from 'pinia'",
					install: "app.use(createPinia())",
				},
				{
					id: "vue-router",
					importer: "import router from './router'",
					install: "app.use(router)",
				},
			],
		},
		"vite.config.js": {
			plugins: [
				{
					id: "vue",
					importer: "import vue from '@vitejs/plugin-vue'",
					initializer: "vue()",
				},
			],
		},
	};
}
