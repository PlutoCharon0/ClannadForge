import fs from "fs";
import path from "path";
// TODO: 架构抽离重整 调整工具函数的存储 依据功能性考虑
/**
 * 对目标目录路径进行格式化处理
 * @param targetDir 目标目录
 * @returns 格式化后的目标目录路径
 */
function formatTargetDir(targetDir: string) {
	// 取出参数前后的空白字符（包括空格，制表符，换行符等）
	return targetDir?.trim().replace(/\/+$/g, "");
	/* "/path/to///dir/" => "/path/to/dir"
	 "\t/path/to/dir\n"  => "/path/to/dir" */
}

/**
 * 检查指定目录是否为空。
 * @param targetDir 目标目录的路径。
 * @returns 返回一个布尔值，如果目录为空或只包含一个名为".git"的文件，则返回true；否则返回false。
 */
function isEmpty(targetDir: string) {
	// 读取目标目录中的文件
	const files = fs.readdirSync(targetDir);
	// 判断目录是否为空，或者只包含一个名为".git"的文件
	return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

/**
 * 检查指定的目标目录或文件是否不存在或者为空。
 * @param targetDir 目标目录的路径。
 * @returns 返回一个布尔值，如果目标目录或文件不存在或者为空，则返回true；否则返回false。
 */
function isDirOrFileEmpty(targetDir: string) {
	// 检查目标路径是否存在且不为空
	return !fs.existsSync(targetDir) || isEmpty(targetDir);
}

/**
 * 检查给定的项目名称是否为有效的包名称。
 * @param packageName 要检查的项目名称。这是一个字符串。
 * @returns 返回一个布尔值。如果项目名称是有效的包名称，则返回true；否则返回false。
 */
function isValidPackageName(packageName: string) {
	// https://nodejs.cn/npm/cli/v9/configuring-npm/package-json/#name 规范查看
	// 使用正则表达式检查项目名称是否符合规定的格式
	return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
		packageName,
	);
}

/**
 * 格式化项目名称，使其符合有效的包名称格式。
 * @param packageName 要格式化的项目名称。这是一个字符串。
 * @returns 返回格式化后的项目名称。如果无法格式化为有效的包名称，则返回null。
 */
function formatPackageName(packageName: string) {
	// 去除名称的空格字符 并进行小写转换
	let result = packageName.trim().replace(/\s+/g, "").toLowerCase();
	// 处理包含@的情况，如果还包含/，则移除所有/；否则移除所有@
	if (result.includes("@")) {
		if (result.includes("/")) {
			result = result.replace(/\//g, "");
		} else {
			result = result.replace(/@/g, "");
		}
	}

	return !isValidPackageName(result) ? packageName : result;
}

/**
 * 清空指定目录下的所有文件（不包括`.git`目录）。
 * @param dir 需要清空的目录路径。
 *
 * 注意：该函数会删除指定目录下的所有文件和子目录，请谨慎使用。
 */
function emptyDir(dir: string) {
	// 检查目录是否存在，如果不存在则直接返回
	if (!fs.existsSync(dir)) return;

	const files = fs.readdirSync(dir);

	for (const file of files) {
		// 跳过`.git`目录
		if (file === ".git") {
			continue;
		}
		// 删除目录中的文件或子目录
		fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
	}
}

/**
 * 从用户代理字符串中提取包信息。
 * @param userAgent 可以是字符串或未定义，表示用户代理字符串。
 * @returns 返回一个对象，包含包的名称和版本；如果输入为undefined，则返回undefined。
 */
function pkgFromUserAgent(userAgent) {
	// 当用户代理字符串不存在时，直接返回undefined
	if (!userAgent) return undefined;
	// 将用户代理字符串按空格分割，获取第一部分，预期为包的名称和版本的组合
	const pkgSpec = userAgent.split(" ")[0];
	// 将包的名称和版本组合按斜杠分割，以获取单独的名称和版本
	const pkgSpecArr = pkgSpec.split("/");
	// 返回包含包名称和版本的对象
	return {
		name: pkgSpecArr[0],
		version: pkgSpecArr[1],
	};
}

/**
 * 将模板文件或内容写入指定的根目录下。
 * @param root 根目录的路径。
 * @param templateDir 模板文件所在的目录路径。
 * @param file 需要写入或复制的文件名。
 * @param content 可选参数，如果提供，则直接将此内容写入指定文件，不使用模板文件。
 */
function write(
	root: string,
	templateDir: string,
	file: string,
	content?: string,
) {
	// 计算目标文件的完整路径
	const targetPath = path.join(root, file);
	// 判断是否提供了文件内容
	if (content) {
		// 直接将内容写入目标文件
		fs.writeFileSync(targetPath, content);
	} else {
		// 如果没有提供内容，则从模板目录复制文件到目标路径
		copy(path.join(templateDir, file), targetPath);
	}
}
/**
 * 复制文件或目录。
 * @param src 源文件或目录的路径。
 * @param dest 目标文件或目录的路径。
 *
 * 该函数首先检查源路径是否为目录，如果是目录，则调用 copyDir 函数进行目录的复制；
 * 如果不是目录，则使用 fs.copyFileSync 函数进行文件的同步复制。
 */
function copy(src: string, dest: string) {
	const stat = fs.statSync(src); // 获取源文件的状态信息，如是否是文件、目录等
	if (stat.isDirectory()) {
		// 源路径为目录，进行目录复制
		copyDir(src, dest);
	} else {
		// 源路径为文件，进行文件复制
		fs.copyFileSync(src, dest);
	}
}
/**
 * 复制整个目录的内容到另一个目录。
 * @param srcDir 源目录的路径。
 * @param destDir 目标目录的路径。
 * 此函数会递归创建目标目录及其子目录，并将源目录中的所有文件复制过去。
 * 注意：如果目标目录已存在，现有文件将被覆盖。
 * 返回值：无。
 */
function copyDir(srcDir: string, destDir: string) {
	// 创建目标目录（包括所有父目录），如果已存在则不进行操作
	fs.mkdirSync(destDir, { recursive: true });
	// 遍历源目录中的所有文件
	for (const file of fs.readdirSync(srcDir)) {
		// 计算源文件和目标文件的完整路径
		const srcFile = path.resolve(srcDir, file);
		const destFile = path.resolve(destDir, file);
		// 复制文件
		copy(srcFile, destFile);
	}
}
export {
	formatTargetDir,
	isDirOrFileEmpty,
	isValidPackageName,
	formatPackageName,
	emptyDir,
	pkgFromUserAgent,
	write,
};
