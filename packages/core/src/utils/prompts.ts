import prompts from "prompts";
import { UsageMode, ProjectType } from "../types";
import {
	Framework,
	colors,
	getFramework,
	getTemplate,
	getCustomConfig,
} from "./constant";
const { brighten, info } = colors;
// () => [] 的设计 是为了方便声明交互提示对象时可以与外界值进行联动
type ModeSpecificPromptGenerator = (
	argTemplate?: string,
) => prompts.PromptObject[];
const universalMode_Prompts: ModeSpecificPromptGenerator = (
	argTemplate: string,
) => [
	{
		type: "select",
		name: "projectType",
		message: brighten("Select a project type:"),
		initial: ProjectType.WEB,
		choices: [
			{
				title: "web",
				value: ProjectType.WEB,
			},
			{
				title: "ui-library",
				value: ProjectType.UI_LIBRARY,
			},
			{
				title: "static-site",
				value: ProjectType.STATIC_SITE,
			},
		],
	},
	{
		type: (projectType: ProjectType) =>
			argTemplate && getTemplate(projectType).includes(argTemplate)
				? null
				: "select",
		name: "framework",
		message:
			typeof argTemplate === "string"
				? brighten(
						`"${argTemplate}" isn't a valid template. Please choose from below: `,
					)
				: brighten("Select a framework:"),
		initial: 0,
		choices: (projectType: ProjectType) =>
			getFramework(projectType).map((framework) => {
				const frameworkColor = framework.color;
				return {
					title: frameworkColor(framework.display || framework.name),
					value: framework,
				};
			}),
	},
	{
		type: (framework: Framework) =>
			framework && framework.variants ? "select" : null,
		name: "variant",
		message: brighten("Select a variant:"),
		choices: (framework: Framework) =>
			framework.variants.map((variant) => {
				const variantColor = variant.color;
				return {
					title: variantColor(variant.display || variant.name),
					value: variant.name,
				};
			}),
	},
];

const customMode_Prompts: ModeSpecificPromptGenerator = () => [
	{
		type: "select",
		name: "framework",
		message: brighten("Select a framework:"),
		choices: [
			// TODO 抽离
			{
				title: "Vue",
				value: "vue",
			},
			{
				title: "React",
				value: "react",
			},
		],
	},
	// 根据选择的框架类型 获取对应的配置展开选择交互
	// 当用户选择了 default-preset选项后 忽略其他选择的配置
	{
		type: "multiselect",
		name: "configs",
		message: brighten("Customize configurations for your project"),
		hint: "- Space to select. Return to submit",
		choices: (framework: string) => {
			return getCustomConfig(framework).configs.map((config) => {
				const configColor = config.color;
				return {
					title: configColor(config.display || config.name),
					value: {
						name: config.name,
						version: config.version,
						isDev: config.isDev || false,
						handleConfig: config.handleConfig || false,
						ejsData: config.ejsData || null,
					},
					selected: !!config.default,
				};
			});
		},
	},
	{
		type: "confirm",
		name: "needTypescript",
		message: brighten("Confirm whether to use TS in the project"),
		initial: false,
	},
	// TODO 考虑提供配置工具的选择交互 目前默认使用Vite
	// TODO 考虑提供css预处理器的选择交互 目前默认不配置
	// TODO 考虑提供组件库使用选择交互 目前默认不配置
];
const externalLinksMode_Prompts: ModeSpecificPromptGenerator = () => [
	{
		type: "select",
		name: "cliType",
		message: brighten("Select the Cli you expect to use"),
		choices: [
			{
				title: info("Vite"),
				value: "npx create-vite TARGET_DIR",
			},
			{
				title: info("create-neat"),
				value: "npx create-neat TARGET_DIR",
			},
		],
	},
];
// 使用映射来存储对应的模式下的相应交互内容
const usageModeMap = new Map<UsageMode, ModeSpecificPromptGenerator>([
	[UsageMode.UNIVERSALMODE, universalMode_Prompts],
	[UsageMode.CUSTOMMODE, customMode_Prompts],
	[UsageMode.EXTERNALLINKSMODE, externalLinksMode_Prompts],
]);

export function getPrompts(usageMode: UsageMode) {
	return usageModeMap.get(usageMode)();
}
