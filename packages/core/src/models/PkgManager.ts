import fs from "fs";
// TODO content 类型完善  考虑方案使用泛型
export default class PackageJsonManager {
	private path: string;
	public content: any;

	constructor(filePath: string, fileContent?: object) {
		this.path = filePath;
		this.content = fileContent;
	}

	createPKG_File(fileContent?: object | undefined) {
		this.content = fileContent || this.content;
		fs.writeFileSync(this.path, JSON.stringify(this.content, null, 2) + "\n");
	}

	readPKG_Content_path(path) {
		return JSON.parse(fs.readFileSync(path, "utf8"));
	}
	updatePKG_Content_filed(filed, value) {
		this.content[filed] = {
			...this.content[filed],
			...value,
		};
	}
}
