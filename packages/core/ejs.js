import ejs from "ejs";
const s = `import { createApp } from 'vue'
<%_ for (const { importer, id } of plugins) { _%>
<% if (usePinia && id === 'pinia') { %>
<%- importer %>
<% } %>
<% if (useVueRouter && id === 'vue-router') { %>
<%- importer %>
<% } %>
<%_ } _%>

import App from './App.vue'

const app = createApp(App)

<% if (usePinia) { %>
app.use(createPinia())
<% } %>

<% if (useVueRouter) { %>
app.use(router)
<% } %>

app.mount('#app')`;

const renderedRes = ejs.render(s, {
	usePinia: true,
	useVueRouter: true,
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
});

console.log(renderedRes); // 这将输出渲染后的HTML内容
