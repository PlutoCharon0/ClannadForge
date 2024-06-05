import path from "path";
import fs from "fs";
import prompts from "prompts";
import minimist from "minimist";
import { Framework, colors, getFramework, getTemplate } from "./constant";
import { handleCustomCommand } from "./utils";
import {
	emptyDir,
	formatPackageName,
	formatTargetDir,
	isDirOrFileEmpty,
	isValidPackageName,
	write,
} from "@clannadforage/utils";

const { brighten, info, success } = colors;
/*
    获取命令行参数
    argv为一个参数对象
    argv._属性中包含执行脚手架命令时，没有选项参数关联的 无关参数
    { string: ["_"] }  配置定义 _ 的参数类型
    例： pnpm create vite demo  ————>  { _: [ 'demo' ] }
    剩余参数为 存在选项关联的参数
    例：pnpm create vite demo -t react  ————> { _: [ 'demo' ], t: 'react' }
    例：pnpm create vite demo --template react  ————> { _: [ 'demo' ], template: 'react' }
*/
const argv = minimist<{
	t?: string;
	template?: string;
}>(process.argv.slice(2), { string: ["_"] });

// 记录存储当前工作目录的绝对路径 即命令执行的对应目录路径
const cwd = process.cwd();

const defaultTargetDir = "clannad-project";
async function init() {
	// TODO 类型声明抽离
	enum ProjectType {
		//TODO 待研究  枚举赋值相应目录字符串 配合获取模板地址使用 prompts————projectType的交互产生报错
		WEB,
		UI_LIBRARY,
		STATIC_SITE,
	}

	enum UsageMode {
		UNIVERSALMODE,
		CUSTOMMODE,
		EXTERNALLINKSMODE,
	}

	type BaseResponse = prompts.Answers<
		"projectName" | "overwrite" | "packageName" | "usageMode"
	>;
	type SpecificResponse = prompts.Answers<
		| "universalMode"
		| "externalLinksMode"
		| "customMode"
		| "projectType"
		| "framework"
		| "variant"
		| "cliType"
	>;

	// 获取命令行参数中的目标目录
	const argTargetDir = formatTargetDir(argv._[0]);
	// 获取命令行模板选择
	const argTemplate = argv.template || argv.t;

	// 获取用户指定的目标目录
	const targetDir = argTargetDir || defaultTargetDir;
	// 获取项目名称 若当前项目目录参数为 .则将项目创建在当前命令执行目录下
	const getProjectName = () =>
		targetDir === "." ? path.basename(path.resolve()) : targetDir;
	console.log(cwd, getProjectName(), argTemplate, targetDir);

	// TODO 配置默认配置
	let basePrompts_result: BaseResponse;
	let specificPrompts_result: SpecificResponse;
	// 使用映射来存储对应的模式下的相应交互内容
	const usageModeMap = new Map<UsageMode, prompts.PromptObject[]>([
		[
			UsageMode.UNIVERSALMODE,
			[
				{
					type: "confirm",
					name: "universalMode",
					message: brighten("Confirm to use universalMode"),
					initial: true,
				},
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
			],
		],
		[UsageMode.CUSTOMMODE, []],
		[
			UsageMode.EXTERNALLINKSMODE,
			[
				{
					type: "confirm",
					name: "externalLinksMode",
					message: brighten("Confirm to use externalLinksMode"),
					initial: true,
				},
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
			],
		],
	]);

	// basePrompts
	try {
		basePrompts_result = await prompts(
			[
				{
					type: argTargetDir ? null : "text",
					name: "projectName",
					message: brighten("Project name"),
					initial: targetDir, // 用户未指定选项参数时 targetDir指向默认值
				},
				{
					type: isDirOrFileEmpty(targetDir) ? null : "select",
					name: "overwrite",
					message: () =>
						(targetDir === "."
							? brighten("Current directory")
							: `Target directory "${brighten(targetDir)}"`) +
						` is not empty. Please choose how to proceed:`,
					choices: [
						{
							title: "Overwrite targetDir and continue",
							value: "yes",
						},
						{
							title: "Cancel operation",
							value: "no",
						},
						{
							title: "Ignore files and continue",
							value: "ignore",
						},
					],
				},
				{
					type: isValidPackageName(getProjectName()) ? null : "text",
					name: "packageName",
					message: brighten("Modify your packageName"),
					initial: formatPackageName(getProjectName()),
					validate: (value) => {
						return isValidPackageName(value) || "\n Invalid package.json.name";
					},
				},
				{
					type: "select",
					name: "usageMode",
					message: brighten("Select the usage mode you expect"),
					choices: [
						{
							title: info("Easy to use universal templates"),
							value: UsageMode.UNIVERSALMODE,
						},
						{
							title: info("Manually select features"),
							value: UsageMode.CUSTOMMODE,
						},
						{
							title: info("use other Cli to start your project"),
							value: UsageMode.EXTERNALLINKSMODE,
						},
					],
				},
			],
			{
				onCancel: () => {
					throw new Error(colors.error("✖" + " Operation cancelled"));
				},
			},
		);
	} catch (cancelled: any) {
		console.log(colors.error(cancelled.message));
		return;
	}

	async function handleSpecificPrompts(mode: UsageMode) {
		let result: SpecificResponse;
		try {
			result = await prompts([...usageModeMap.get(mode)], {
				onCancel(prompt, answers) {
					console.log(prompt, answers);
					console.log(colors.error("✖" + " Operation cancelled"));
				},
			});
		} catch (cancelled: any) {
			console.log(colors.error(cancelled.message));
			return;
		}
		return result;
	}

	// 根据用户选择的模式展开推进后续操作 specificPrompts
	switch (basePrompts_result.usageMode) {
		//  通用模式 选择项目模板 开箱即用
		case UsageMode.UNIVERSALMODE:
			console.log(" UsageMode.universalMode");
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.UNIVERSALMODE,
			);
			break;
		//  自定义模式 手动配置模板
		case UsageMode.CUSTOMMODE:
			console.log(" UsageMode.customMode");
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.CUSTOMMODE,
			);
			break;
		// 外链接模式 使用其他脚手架 开展项目
		case UsageMode.EXTERNALLINKSMODE:
			console.log(" UsageMode.externalLinksMode");
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.EXTERNALLINKSMODE,
			);
			break;
	}

	console.log(basePrompts_result, "Base");
	console.log(specificPrompts_result, "Specific");
	// TODO 交互结果 解构 const { ... } = basePrompts_result

	const { overwrite, packageName } = basePrompts_result;
	const { framework, variant, projectType } = specificPrompts_result;

	// 创建目标目录
	const root = path.join(cwd, targetDir); // 获取待创建项目的目录
	if (overwrite === "yes") {
		emptyDir(root);
	} else if (!fs.existsSync(root)) {
		// 清空完目录后 创建目录，包括所有必需的父目录，
		fs.mkdirSync(root, { recursive: true });
	}

	//  universalMode —————————————————————————————————————————————————————————————————————————————————
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
	const { pkgManager } = handleCustomCommand(customCommand, targetDir);

	console.log(`\nScaffolding project in ${success(root)}...`);

	/**
	 * 获取模板目录的路径
	 * @param projectType 项目类型，决定了模板的目录位置。
	 * @param template 模板名称，用于进一步指定模板的详细类型。
	 * @returns 返回模板目录的绝对路径。
	 */
	const getTemplateDir = (projectType: ProjectType, template: string) => {
		// 定义项目类型与对应模板目录的映射关系
		const templateDirMap = {
			[ProjectType.WEB]: "web",
			[ProjectType.UI_LIBRARY]: "ui-library",
			[ProjectType.STATIC_SITE]: "static-site",
		};
		// 根据项目类型从映射中获取模板目录，结合当前工作目录和模板名称，计算出绝对路径
		return path.resolve(
			cwd,
			`../../apps/${templateDirMap[projectType]}`,
			`template-${template}`,
		);
	};

	// 获取模板存储地址
	const templateDir = getTemplateDir(projectType, template);
	console.log(templateDir);
	// 读取模板文件 进行遍历模板文件，并写入目标目录（除了package.json文件）
	const templateFiles = fs.readdirSync(templateDir);

	for (const file of templateFiles.filter((f) => f !== "package.json")) {
		write(root, templateDir, file);
	}
	// 单独处理package.json文件的写入 更改其name属性
	const pkg = JSON.parse(
		fs.readFileSync(path.join(templateDir, `package.json`), "utf-8"),
	);
	pkg.name = packageName || getProjectName();
	write(root, templateDir, "package.json", JSON.stringify(pkg, null, 2) + "\n");

	/* // 对SWC进行额外处理 TODO 待完善
	if (isReactSwc) {
		setupReactSwc(root, template.endsWith("-ts"));
	} */

	// 项目创建完毕 后续提示 TODO 待完善
	const cdProjectName = path.relative(cwd, root);
	console.log(success(`\nDone. Now run:\n`));
	if (root !== cwd) {
		console.log(
			`  cd ${
				cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
			} \n`,
		);
	}
	switch (pkgManager) {
		case "yarn":
			console.log("  yarn \n");
			console.log("  yarn dev \n");
			break;
		default:
			console.log(`  ${pkgManager} install \n`);
			console.log(`  ${pkgManager} run dev \n`);
			break;
	}
	console.log();
}

init();

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
} */
