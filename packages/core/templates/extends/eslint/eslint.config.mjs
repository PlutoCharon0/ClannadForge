// https://eslint.org/
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
// https://eslint.org/play/ 在线配置调试———Eslint
// https://typescript-eslint.io/play 在线配置调试————typescript-eslint
export default [
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } }, // 声明可访问的全局变量 避免错误标记未定义
	pluginJs.configs.recommended, // ESLint推荐的JavaScript配置
	...tseslint.configs.recommended, // TypeScript ESLint推荐的配置
	// 自定义的ESLint规则
	{
		rules: {
			// 避免在循环中使用`await`
			"no-await-in-loop": "warn",
			// 提示避免使用`console`语句
			"no-console": "warn",
			// 强制使用let或const而非var
			"no-var": "error",
			// 建议使用剩余参数而非arguments对象
			"prefer-rest-params": "error",
		},
		// 忽略的文件或目录列表，可以根据项目需求进行配置
		ignores: [],
	},
	eslintConfigPrettier, // 关闭所有不必要或可能与 Prettier 冲突的规则
];
