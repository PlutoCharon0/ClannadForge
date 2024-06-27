import * as esbuild from "esbuild";

// 定义构建配置
const buildConfig = {
	entryPoints: ["src/index.ts"], // 入口文件路径
	bundle: true, // 打包成单个文件
	sourcemap: true, // 生成源码映射
	format: "esm", // 默认为ES模块格式，将在后面覆盖以生成不同格式
	platform: "node",
};

// 构建ES模块版本
esbuild
	.build({
		...buildConfig,
		outfile: "dist/index.mjs",
		format: "esm",
	})
	.catch(() => process.exit(1));

// 构建CommonJS版本
esbuild
	.build({
		...buildConfig,
		outfile: "dist/index.cjs",
		format: "cjs",
	})
	.catch(() => process.exit(1));
