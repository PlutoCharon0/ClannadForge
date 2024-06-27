import chalk from "chalk";

type ColorFunc = (text: string) => string;

type Framework = {
	name: string;
	display: string;
	color: ColorFunc;
	variants?: FrameworkVariant[];
};

type FrameworkVariant = {
	name: string;
	display: string;
	color: ColorFunc;
	customCommand?: string;
};

enum ProjectType {
	WEB,
	UI_LIBRARY,
	STATIC_SITE,
}

const createColorFunc = (color: string, type: "hex" | "rgb" = "hex") => {
	if (type === "hex") {
		return (text: string) => {
			return `${chalk.hex(color)(text)}`;
		};
	} else if (type === "rgb") {
		return (text: string) => {
			const randomR = Math.floor(Math.random() * 256);
			const randomG = Math.floor(Math.random() * 256);
			const randomB = Math.floor(Math.random() * 256);
			return `${chalk.rgb(randomR, randomG, randomB)(text)}`;
		};
	}
};
// 配置命令行颜色交互展示
const colors = {
	brighten: createColorFunc("#57afef"),
	info: createColorFunc("#909399"),
	warning: createColorFunc("#e6a23c"),
	error: createColorFunc("#f56c6c"),
	success: createColorFunc("#b5fefb"),
	random: createColorFunc("", "rgb"),
};

// Web-模板集合
const WEB_FRAMEWORKS: Framework[] = [
	{
		name: "vue",
		display: "Vue",
		color: colors.random,
		variants: [
			{
				name: "vue-ts",
				display: "TypeScript",
				color: colors.random,
			},
			{
				name: "vue",
				display: "JavaScript",
				color: colors.random,
			},
			{
				name: "custom-create-vue",
				display: "Customize with create-vue ↗",
				color: colors.random,
				customCommand: "npm create vue@latest TARGET_DIR",
			},
			{
				name: "custom-nuxt",
				display: "Nuxt ↗",
				color: colors.random,
				customCommand: "npm exec nuxi init TARGET_DIR",
			},
		],
	},
	{
		name: "react",
		display: "React",
		color: colors.random,
		variants: [
			{
				name: "react-ts",
				display: "TypeScript",
				color: colors.random,
			},
			{
				name: "react-swc-ts",
				display: "TypeScript + SWC",
				color: colors.random,
			},
			{
				name: "react",
				display: "JavaScript",
				color: colors.random,
			},
			{
				name: "react-swc",
				display: "JavaScript + SWC",
				color: colors.random,
			},
			{
				name: "custom-remix",
				display: "Remix ↗",
				color: colors.random,
				customCommand: "npm create remix@latest TARGET_DIR",
			},
		],
	},
];

// ui-library-组件库模板集合
const UI_LIBRARY_FRAMEWORKS: Framework[] = [
	{
		name: "vue-library",
		display: "Vue-library",
		color: colors.random,
	},
	{
		name: "react-library",
		display: "React-library",
		color: colors.random,
	},
	{
		name: "webComponent-library",
		display: "WebComponent-library",
		color: colors.random,
	},
];

// static-site-静态网站模板集合
const STATIC_SITE_FRAMEWORKS: Framework[] = [
	{
		name: "Astro",
		display: "Astro",
		color: colors.random,
	},
	{
		name: "VitePress",
		display: "VitePress",
		color: colors.random,
	},
];

const projectTypeMap = new Map<ProjectType, Framework[]>([
	[ProjectType.WEB, WEB_FRAMEWORKS],
	[ProjectType.UI_LIBRARY, UI_LIBRARY_FRAMEWORKS],
	[ProjectType.STATIC_SITE, STATIC_SITE_FRAMEWORKS],
]);

// 存储所有框架及其变体的名称集合
const WEB_TEMPLATES = WEB_FRAMEWORKS.map(
	(f) => (f.variants && f.variants.map((v) => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

function getFramework(projectType: ProjectType) {
	return projectTypeMap.get(projectType);
}

function getTemplate(projectType: ProjectType) {
	const frameworks = projectTypeMap.get(projectType);
	return frameworks
		.map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
		.reduce((a, b) => a.concat(b), []);
}

// TODO 完善类型声明
const CUSTOM_GENERATE_CONFIGS = [
	{
		framework: "vue",
		configs: [
			{
				name: "@vitejs/plugin-vue-jsx",
				display: "Jsx",
				color: colors.random,
				default: true,
				handleConfig: true,
				version: "^4.0.0",
				isDev: true,
				ejsData: {
					name: "vueJsx",
					importer: "import vueJsx from '@vitejs/plugin-vue-jsx'",
					initializer: "vueJsx()",
				},
			},
			{
				name: "vue-router",
				display: "Router",
				color: colors.random,
				version: "^4.3.3",
			},
			{
				name: "pinia",
				display: "Pinia",
				color: colors.random,
				version: "^2.1.7",
			},
		],
	},
	{
		framework: "react",
		configs: [
			{
				name: "ts",
				display: "Typescript",
				color: colors.random,
			},
			{
				name: "js",
				display: "Javascript",
				color: colors.random,
			},
			{
				name: "router",
				display: "Router",
				color: colors.random,
			},
		],
	},
];

function getCustomConfig(framework: string) {
	return CUSTOM_GENERATE_CONFIGS.find((item) => item.framework === framework);
}

export {
	colors,
	WEB_FRAMEWORKS,
	WEB_TEMPLATES,
	Framework,
	projectTypeMap,
	getTemplate,
	getFramework,
	getCustomConfig,
};
