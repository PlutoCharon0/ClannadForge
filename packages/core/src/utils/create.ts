/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import fs from "fs";
import prompts from "prompts";
import { colors } from "./constant";
import { getPrompts } from ".";
import PackageJsonManager from "../models/PkgManager";
import { handleFnMap } from "./handleFn";
import {
	emptyDir,
	formatPackageName,
	formatTargetDir,
	isDirOrFileEmpty,
	isValidPackageName,
} from "@clannadforage/utils";
import { BaseResponse, SpecificResponse, UsageMode } from "../types";
const { brighten } = colors;

// 记录存储当前工作目录的绝对路径 即命令执行的对应目录路径
const cwd = process.cwd();

const defaultTargetDir = "clannad-project";
export async function create(
	argTargetDir: string,
	options: Record<string, any>,
) {
	const { template: argTemplate, force } = options;

	// 获取用户指定的目标目录
	let targetDir = argTargetDir || defaultTargetDir;
	// 获取项目名称 若当前项目目录参数为 .则将项目创建在当前命令执行目录下
	const getProjectName = () =>
		targetDir === "." ? path.basename(path.resolve()) : targetDir;

	// TODO 配置默认配置
	let basePrompts_result: BaseResponse;
	let specificPrompts_result: SpecificResponse;

	// basePrompts
	try {
		basePrompts_result = await prompts(
			[
				{
					type: argTargetDir ? null : "text",
					name: "projectName",
					message: brighten("Project name"),
					initial: defaultTargetDir, // 用户未指定选项参数时 targetDir指向默认值
					onState: (state) => {
						targetDir = formatTargetDir(state.value) || defaultTargetDir;
					},
				},
				{
					type: () => (isDirOrFileEmpty(targetDir) || force ? null : "select"),
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
							title: "Easy to use universal templates",
							value: UsageMode.UNIVERSALMODE,
						},
						{
							title: "Manually select features",
							value: UsageMode.CUSTOMMODE,
						},
						{
							title: "use other Cli to start your project",
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
		process.exit(1);
	}

	async function handleSpecificPrompts(mode: UsageMode) {
		let result: SpecificResponse;
		try {
			(result as prompts.Answers<string>) = await prompts(
				[...getPrompts(mode)],
				{
					onCancel(prompt, answers) {
						throw new Error(colors.error("✖" + " Operation cancelled"));
					},
				},
			);
		} catch (cancelled: any) {
			console.log(colors.error(cancelled.message));
			process.exit(1);
		}
		return result;
	}

	// 根据用户选择的模式展开推进后续操作 specificPrompts
	switch (basePrompts_result.usageMode) {
		//  通用模式 选择项目模板 开箱即用
		case UsageMode.UNIVERSALMODE:
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.UNIVERSALMODE,
			);
			break;
		//  自定义模式 手动配置模板
		case UsageMode.CUSTOMMODE:
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.CUSTOMMODE,
			);
			break;
		// 外链接模式 使用其他脚手架 开展项目
		case UsageMode.EXTERNALLINKSMODE:
			specificPrompts_result = await handleSpecificPrompts(
				UsageMode.EXTERNALLINKSMODE,
			);
			break;
	}

	/* 	console.log(basePrompts_result, "Base");
	console.log(specificPrompts_result, "Specific"); */

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
		`✨  Creating project in ${colors.success(path.resolve(cwd, targetDir))}.`,
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

	handleFnMap.get(basePrompts_result.usageMode)(specificPrompts_result, {
		root,
		cwd,
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
		TODO  对文件的读写操作进行封装 （思路： 封装成类 统一处理 / 模块化）
		TODO  设计构建Generator类 ✔
		TODO  template模板存储在本地 还是放在github远程仓库 通过网络请求的方式获取
		TODO  构建插件机制
		TODO  统一优化模板的构建方式 ✔
		TODO  构建工程化配置的交互提示
		TODO  交互提示 配置文件的存放位置设计处理  单独放置 统一放置在package.json
		TODO  项目构建完毕的结束提示设计，抽离构建
		TODO  构建自定义模式的预设本地存储  （拓展: 提供用户自定义模板的功能 ———— 利用插件机制）
		TODO  用户全局安装脚手架后 使用时 检测脚手架版本更新情况 提示更新 ?
	*/
	/*
	通用性 广泛性 灵活性 可插拔 可定制
	*/
}

// TODO! 设计构建渐进式构建模式的展开逻辑  完善package.json操作类的设计构建
