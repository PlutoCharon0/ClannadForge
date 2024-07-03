/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import fs from "fs";
import { colors } from "./constant";
import { handlePrompts, base_Prompts, engineering_Prompts } from "./prompts";
import { PackageJsonManager } from "../models";
import { handleFnMap } from "./handleFn";
import { emptyDir } from "@clannadforage/utils";
import { BaseResponse, EngineeringResponse, SpecificResponse } from "../types";

const { success } = colors;
// 记录存储当前工作目录的绝对路径 即命令执行的对应目录路径
const cwd = process.cwd();
// Engineering
const defaultTargetDir = "clannad-project";
export async function create(
	argTargetDir: string,
	options: Record<string, any>,
) {
	const { template: argTemplate, force, mode } = options;
	// 获取用户指定的目标目录
	const targetDir = argTargetDir || defaultTargetDir;
	// 获取项目名称 若当前项目目录参数为 .则将项目创建在当前命令执行目录下
	const getProjectName = () =>
		targetDir === "." ? path.basename(path.resolve()) : targetDir;

	// basePrompts
	const basePrompts_result: BaseResponse = await handlePrompts(
		base_Prompts({
			targetDir,
			argTargetDir,
			defaultTargetDir,
			getProjectName,
			force,
			mode,
		}),
	);

	const usageMode =
		typeof basePrompts_result.usageMode !== "undefined"
			? basePrompts_result.usageMode
			: Number(mode);

	// 根据用户选择的模式展开推进后续操作 specificPrompts
	const specificPrompts_result: SpecificResponse = await handlePrompts(
		[],
		true,
		usageMode,
	);

	const overwrite = force || basePrompts_result.overwrite;
	const { packageName } = basePrompts_result;

	// 创建目标目录
	const root = path.join(cwd, targetDir); // 获取待创建项目的目录
	if (overwrite || overwrite === "yes") {
		emptyDir(root);
	} else if (!fs.existsSync(root)) {
		// 清空完目录后 创建目录，包括所有必需的父目录，
		fs.mkdirSync(root, { recursive: true });
	}

	console.log(
		`✨  Creating project in ${success(path.resolve(cwd, targetDir))}.`,
	);

	const Pkg = new PackageJsonManager(path.resolve(root, "package.json"), {
		name: (packageName as string) || getProjectName(),
		version: "0.0.0",
		private: true,
		type: "",
		scripts: {},
		dependencies: {},
		devDependencies: {},
	});

	await handleFnMap.get(usageMode)(specificPrompts_result, {
		root,
		argTemplate,
		Pkg,
		targetDir,
	});

	/* 核心逻辑 构建Generator类  搭配插件机制 借此展开渐进式的项目创建 */
	function notifyProjectCreationTips(pkgManager, root, cwd) {
		const cdProjectName = path.relative(cwd, root);
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
	console.log("\n🚀  Invoking generators...");

	console.log("\n📦️  Installing additional dependencies...");

	console.log("\n🔨  Generate Engineering configuration");
	console.log("\n👉  Get Started with the following commands:");

	// 执行时机在项目创建完毕后执行
	const engineeringPromptsResult: EngineeringResponse =
		await handlePrompts(engineering_Prompts);

	function renderTemplate(src, dest, pkg) {
		const stats = fs.statSync(src);
		if (stats.isDirectory()) {
			fs.mkdirSync(dest, { recursive: true });
			for (const file of fs.readdirSync(src)) {
				renderTemplate(path.resolve(src, file), path.resolve(dest, file), pkg);
			}
			return;
		}
		const filename = path.basename(src);
		if (filename === "package.json") {
			const pkgContent = pkg.readPKG_Content_path(src);
			pkg
				.updatePKG_Content_fields(
					Object.keys(pkgContent),
					pkgContent["lint-staged"]
						? [
								{
									...pkgContent.scripts,
								},
								{
									...pkgContent.devDependencies,
								},
								{
									...pkgContent["lint-staged"],
								},
								{
									...pkgContent.config,
								},
							]
						: [
								{
									...pkgContent.scripts,
								},
								{
									...pkgContent.devDependencies,
								},
							],
				)
				.createPKG_File();
			return;
		}
		fs.copyFileSync(src, dest);
	}
	function generateEngineering(
		promptsResults: EngineeringResponse,
		pkg: PackageJsonManager,
	) {
		const configs: string[] = promptsResults.engineeringConfigs;
		if (configs.length !== 0) {
			for (const config of configs) {
				const templateDir = path.resolve(
					__dirname,
					`../../core/templates/extends/${config}`,
				);
				renderTemplate(templateDir, root, pkg);
			}
		}
		// 查找路径
		// 构建配置文件
		// 更新package.json
	}
	engineeringPromptsResult.isUseEngineeringConfiguration &&
		generateEngineering(engineeringPromptsResult, Pkg);
	// Q: 通用模板的拉取 使用的是相对路径 用户在本地使用时 无法找到模板存储 拉取失败
	// 依赖的安装是否默认自动安装 待考虑
	// 模板仅提供文件架构 不提供demo文件 设计构建readme.md 提供使用提示
	/* 通用模式下的项目模板拉取设计：
			1. 通用模板存储在GitHub远程仓库 通过请求的方式拉取
				 同时为用户提供远程仓库地址的自定义 让用户能够使用自定义的模板 方便后续项目快速开发
	*/
	/*
		TODO 构建脚手架指令 便捷构建
	  TODO 拼接模式处理逻辑 ✔
	  TODO 项目(基本)结构创建完毕后 工程化的构建配置

		TODO  初步设计自定义模式的交互流程  ✔
		TODO  对package.json的文件操作 抽离成类  ✔
		TODO  设计构建Generator类 ✔
		TODO  template模板存储在本地 还是放在github远程仓库 通过网络请求的方式获取 ✔
		TODO  构建插件机制
		TODO  统一优化模板的构建方式 ✔
		TODO  构建工程化配置的交互提示
		TODO  交互提示 配置文件的存放位置设计处理  单独放置 统一放置在package.json 待考虑
		TODO  项目构建完毕的结束提示设计，抽离构建
		TODO  构建自定义模式的预设本地存储  （拓展: 提供用户自定义模板的功能 ———— 利用插件机制）
		TODO  用户全局安装脚手架后 使用时 检测脚手架版本更新情况 提示更新 ?
	*/
	/*
	通用性 广泛性 灵活性 可插拔 可定制
	*/
}

/* Q
		1. 通用模式的模板内容不完善 （考虑使用场景： 贴近对应的开发场景展开构建 / 针对通用性去展开构建）
		2. 通用模式的模板存储/拉取方式待完善 (目前仅支持同存储目录下运行，一旦换个地址执行脚手架找不到模板获取。考虑多模板的情况)
		3. 渐进式构建的基础模板存储设计待完善 (考虑多模板的情况)
		4. 目前渐进式构建的方式是通过ejs模板引擎展开的 在基础模板中需要涉及数据驱动的则构建相应的ejs模板
		   需要的相关数据则存储在.mjs文件中 对外暴露一个getData函数 在generator执行时，渲染基础模板的过程中，读取.mjs文件获取函数。
			 把函数放入到一个Cb中（文件读取异步展开）
			 当基础模板内容渲染完毕后，展开ejs模板的渲染。在此之前,调用Cb中存储的函数，获取相应的ejs模板数据。而后正式展开ejs的相关渲染
		（考虑：后续进行其他项目的渐进式构建时，基础模板的设计是否都按照这个方式）
		5. （通用模式）针对模板的存储方式 考虑是否需要将模板存储在远程仓库中？ 通过down-git-repo去拉取模板
		存在问题：该库不支持直接读取指定仓库的指定文件目录内容
		设计：创建一个仓库Clannad_templates 单独存储所有的模板文件 以分支的形式去区分不同的模板
		构建测试项目测试
*/
