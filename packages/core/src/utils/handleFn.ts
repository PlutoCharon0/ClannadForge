import path from "path";
import fs from "fs";
import { ProjectType, UsageMode } from "../types";
import { handleCustomCommand } from ".";
import { getFramework } from "./constant";
import Generator from "../models/Generator";
function getTemplateDir(projectType: ProjectType, template: string, cwd) {
	// 定义项目类型与对应模板目录的映射关系
	const templateDirMap = {
		[ProjectType.WEB]: "web",
		[ProjectType.UI_LIBRARY]: "ui-library",
		[ProjectType.STATIC_SITE]: "static-site",
	};
	// 根据项目类型从映射中获取模板目录，结合当前工作目录和模板名称，计算出绝对路径
	return path.resolve(
		cwd,
		`apps/${templateDirMap[projectType]}`,
		`template-${template}`,
	);
}
function renderTemplate(src, dest, pkg) {
	const stats = fs.statSync(src); // fs.statSync() 用于检查文件/目录的详细状态信息 例如文件大小、修改时间、是否为目录等）
	if (stats.isDirectory()) {
		fs.mkdirSync(dest, { recursive: true });
		for (const file of fs.readdirSync(src)) {
			renderTemplate(path.resolve(src, file), path.resolve(dest, file), pkg);
		}
		return;
	}
	const filename = path.basename(src);

	if (filename === "package.json") {
		const basePkg = pkg.readPKG_Content_path(src);
		Object.assign(basePkg, { name: pkg.content.name });
		return;
	}

	fs.copyFileSync(src, dest);
}
function handle_universalModel(promptsResults, options) {
	const { framework, variant, projectType } = promptsResults;
	const { root, cwd, argTemplate, targetDir, Pkg } = options;
	// 根据参数优先级 确定最终选择的模板
	const template: string = variant || framework?.name || argTemplate;
	// 获取自定义模板安装指令
	const { customCommand } =
		getFramework(projectType)
			.flatMap((f) => f.variants)
			.find((v) => v.name === template) ?? {};
	/* // 判断是否开启SWC  TODO SWC的配置待完善 在vite的实现基础下 完善
  let isReactSwc = false;
  if (universalMode && template.includes("-swc")) {
    isReactSwc = true;
    template = template.replace("-swc", "");
  } */

	// 判断是否存在自定义模板安装指令 根据用户的包管理工具来判断用于安装模板的包类型 并展开安装
	handleCustomCommand(customCommand, targetDir);

	// 获取模板存储地址
	const templateDir = getTemplateDir(projectType, template, cwd);
	renderTemplate(templateDir, root, Pkg);

	/* // 对SWC进行额外处理 TODO 待完善
  if (isReactSwc) {
    setupReactSwc(root, template.endsWith("-ts"));
  } */
}

function handle_customMode(promptsResults, options) {
	const { root, Pkg } = options;
	const generator = new Generator(root, Pkg, promptsResults);
	generator.generate();
}
function handle_externalLinksMode(promptsResults, options) {
	const { cliType } = promptsResults;
	const { targetDir } = options;
	handleCustomCommand(cliType, targetDir);
}
export const handleFnMap = new Map([
	[UsageMode.UNIVERSALMODE, handle_universalModel],
	[UsageMode.CUSTOMMODE, handle_customMode],
	[UsageMode.EXTERNALLINKSMODE, handle_externalLinksMode],
]);

/* function setupReactSwc(root: string, isTs: boolean) {
	editFile(path.resolve(root, "package.json"), (content) => {
		return content.replace(
			/"@vitejs\/plugin-react": ".+?"/,
			`"@vitejs/plugin-react-swc": "^3.5.0"`,
		);
	});
	editFile(
		path.resolve(root, `vite.config.${isTs ? "ts" : "js"}`),
		(content) => {
			return content.replace(
				"@vitejs/plugin-react",
				"@vitejs/plugin-react-swc",
			);
		},
	);
}
function editFile(file: string, callback: (content: string) => string) {
	const content = fs.readFileSync(file, "utf-8");
	fs.writeFileSync(file, callback(content), "utf-8");
}
 */
