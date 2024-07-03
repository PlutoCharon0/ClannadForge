import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import ejs from "ejs";
import { SpecificResponse } from "../types";
import { PackageJsonManager } from "./PkgManager";
// TODO 完善类型提示 完事过渡效果提示
export class Generator {
	private root: string;
	public Pkg: PackageJsonManager;
	private promptsResults: SpecificResponse;
	private templateDir: string;
	private ejsTemplates: Map<string, string>;
	private ejsDatas: Map<string, any>;
	private buildConfigFilePath: string;
	private callbacks: any[];
	constructor(
		root: string,
		Pkg: PackageJsonManager,
		promptsResults: SpecificResponse,
	) {
		this.root = root;
		this.Pkg = Pkg;
		this.promptsResults = promptsResults;
		this.templateDir = path.resolve(
			__dirname,
			`../../core/templates/base/${promptsResults.framework}`,
		);
		this.ejsTemplates = new Map();
		this.ejsDatas = new Map();
		this.callbacks = [];
	}

	async generate() {
		this.renderTemplate(this.templateDir, this.root, this.promptsResults);
		// 初始化ejsData
		await Promise.all(this.callbacks.map((cb) => cb(this.ejsDatas)));
		this.handleConfig(this.promptsResults.configs);
		this.handleEjsTemplate(this.root);
		if (this.promptsResults.needTypescript) {
			this.generateTS_DEV(this.Pkg);
			this.convertJsToTs(this.root);
		}
		delete this.Pkg.content.extendWithTs;
		this.Pkg.createPKG_File();
	}

	renderTemplate(
		src: string,
		dest: string,
		specificPrompts_result: SpecificResponse,
	) {
		const stats = fs.statSync(src); // fs.statSync() 用于检查文件/目录的详细状态信息 例如文件大小、修改时间、是否为目录等）
		if (stats.isDirectory()) {
			// 创建目标目录，并递归处理子目录中的文件
			fs.mkdirSync(dest, { recursive: true });
			for (const file of fs.readdirSync(src)) {
				this.renderTemplate(
					path.resolve(src, file),
					path.resolve(dest, file),
					specificPrompts_result,
				);
			}
			return;
		}

		const filename = path.basename(src); // 提取路径 src 中的文件名部分

		if (filename === "package.json") {
			const basePkg = this.Pkg.readPKG_Content_path(src);
			Object.assign(this.Pkg.content, basePkg, { name: this.Pkg.content.name });
			return;
		}

		if (filename.includes("ts")) {
			if (!specificPrompts_result.needTypescript) {
				return;
			}
		}

		if (filename.endsWith(".ejs")) {
			const key = dest
				.substring(
					dest.indexOf("clannad-project") + "clannad-project".length + 1,
				)
				.replace(/\.ejs$/, "");
			if (key === "vite.config.js") this.buildConfigFilePath = key;
			// 存储ejs模板内容 以相对根路径的文件路径为键 值为相应模板内容
			this.ejsTemplates.set(key, fs.readFileSync(src, "utf-8"));
		}
		if (filename.endsWith(".mjs")) {
			this.callbacks.push(async (dataStore) => {
				const getData = (await import(pathToFileURL(src).toString())).default;
				const data = await getData(this.promptsResults);
				for (const key in data) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						// 确保我们只处理对象自身的属性
						dataStore.set(key, data[key]);
					}
				}
			});
			return;
		}
		fs.copyFileSync(src, dest);
	}
	// 依据handleConfig属性项 决定如何处理 (构建配置文件/构建package.json文件)
	handleConfig(configs) {
		for (const config of configs) {
			if (config.handleConfig) {
				const buildConfigFile = path.basename(this.buildConfigFilePath);
				const oldData = this.ejsDatas.get(buildConfigFile);
				this.ejsDatas.set(buildConfigFile, {
					...oldData,
					plugins: oldData.plugins.flatMap((plugin) =>
						plugin.id === "vue" ? [plugin, config.ejsData] : plugin,
					),
				});
			}
			if (config.isDev) {
				this.Pkg.updatePKG_SingleField("devDependencies", {
					[config.name]: config.version,
				});
			} else {
				this.Pkg.updatePKG_SingleField("dependencies", {
					[config.name]: config.version,
				});
			}
		}
	}
	handleEjsTemplate(dest) {
		for (const [key, template] of this.ejsTemplates) {
			const filePath = path.resolve(dest, key);
			const content = ejs.render(template, this.ejsDatas.get(key));
			fs.writeFileSync(filePath, content);
			fs.unlinkSync(filePath + ".ejs");
		}
	}
	generateTS_DEV(pkg) {
		const pkgContentWithTs = this.Pkg.content.extendWithTs;
		console.log(this.Pkg.content, pkgContentWithTs, "pkgContentWithTs");
		pkg.updatePKG_Content_filed("scripts", {
			...pkgContentWithTs.scripts,
		});
		pkg.updatePKG_Content_filed("devDependencies", {
			...pkgContentWithTs.devDependencies,
		});
	}
	convertJsToTs(dir: string) {
		function traverse(directory: string) {
			const files = fs.readdirSync(directory);
			for (const filename of files) {
				if (filename === ".git") continue;
				const filePath = path.resolve(directory, filename);
				const isDirectory = fs.lstatSync(filePath).isDirectory();
				if (isDirectory) {
					traverse(filePath);
				} else {
					let newExt = "";
					if (filePath.endsWith(".js")) {
						newExt = ".ts";
					} else if (filePath.endsWith(".jsx")) {
						newExt = ".tsx"; // 修改这里，将 .jsx 改为 .tsx
					}

					if (newExt) {
						const tsxFilePath = filePath.replace(/\.js(x)?$/, `${newExt}`); // 使用正则表达式匹配并替换
						fs.renameSync(filePath, tsxFilePath);
					}
				}
			}
		}
		traverse(dir);
	}
}
