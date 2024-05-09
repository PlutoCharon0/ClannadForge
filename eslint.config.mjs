import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended, // ESLint推荐的JavaScript配置
	...tseslint.configs.recommended, // TypeScript ESLint推荐的配置
	// 自定义的ESLint规则
	{
		rules: {
			// 确保数组方法回调函数有返回值
			"array-callback-return": "warn",
			// 避免在循环中使用`await`
			"no-await-in-loop": "warn",
			// 提示避免使用`console`语句
			"no-console": "warn",
			// 强制使用let或const而非var
			"no-var": "error",
			// 建议使用剩余参数而非arguments对象
			"prefer-rest-params": "error",
			// 要求导入排序符合特定顺序
			"sort-imports": [
				"error",
				{
					memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
					// 允许分组后的导入保持分离
					allowSeparatedGroups: true,
				},
			],
			// 要求使用===和!==而非==和!=，但允许使用NaN比较
			eqeqeq: ["error", "smart"],
		},
		// 忽略的文件或目录列表，可以根据项目需求进行配置
		ignores: ["/node_modules", "/dist", "**/dist", "packages/*/dist/", "apps/"],
	},
	eslintConfigPrettier,
];
