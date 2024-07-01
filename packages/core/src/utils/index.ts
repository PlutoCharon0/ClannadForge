import spawn from "cross-spawn";
import { pkgFromUserAgent } from "@clannadforage/utils";
function getUserLocalPkgManager() {
	// 获取用户系统版本/包管理工具的版本信息 例：pnpm/9.0.2 npm/? node/v20.9.0 win32 x64
	const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
	// 获取包管理工具
	const pkgManager = pkgInfo ? pkgInfo.name : "npm";
	return {
		pkgInfo,
		pkgManager,
	};
}
function handleCustomCommand(customCommand: string, targetDir: string) {
	// 获取包管理工具
	const { pkgInfo, pkgManager } = getUserLocalPkgManager();
	// 判断Yarn的版本
	const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");
	if (customCommand) {
		// customCommand: npm create vue@latest TARGET_DIR
		const fullCustomCommand = customCommand
			.replace(/^npm create /, () => {
				// 对于 `bun` 包管理工具，使用 `bun x create-` 替换，因为它有自己的模板集
				if (pkgManager === "bun") {
					return "bun x create-";
				}
				return `${pkgManager} create `;
			})
			// 对于仅 Yarn 1.x 不支持在 `create` 命令中使用 `@version` 的情况，进行相应处理
			.replace("@latest", () => (isYarn1 ? "" : "@latest"))
			.replace(/^npm exec/, () => {
				/// 优先使用 `pnpm dlx`、`yarn dlx` 或 `bun x` 执行命令
				if (pkgManager === "pnpm") {
					return "pnpm dlx";
				}
				if (pkgManager === "yarn" && !isYarn1) {
					return "yarn dlx";
				}
				if (pkgManager === "bun") {
					return "bun x";
				}
				// 对于其他情况（包括 Yarn 1.x 和其他自定义 npm 客户端），使用 `npm exec` 执行命令
				return "npm exec";
			});

		// 分解命令行参数
		const [command, ...args] = fullCustomCommand.split(" ");
		// 示例： pnpm [ 'create', 'vue@latest', 'TARGET_DIR' ]
		// command代表 包管理器 args存储着命令项参数
		//  将 `TARGET_DIR` 占位符替换为目标目录（考虑可能包含空格的情况）
		const replacedArgs = args.map((arg) =>
			arg.replace("TARGET_DIR", targetDir),
		);
		// spawn.sync 开启一个子进程执行自定义安装命令
		const { status } = spawn.sync(command, replacedArgs, {
			stdio: "inherit",
		});
		// 退出当前进程，状态码为1执行命令的结果状态码（若未提供则默认为0）
		process.exit(status ?? 0);
	}
}

export { handleCustomCommand, getUserLocalPkgManager };
