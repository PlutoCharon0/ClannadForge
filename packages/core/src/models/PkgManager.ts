import fs from "fs";
// TODO content 类型完善  考虑方案使用泛型
export class PackageJsonManager {
	public path: string;
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

	updatePKG_Content(...content) {
		Object.assign(this.content, ...content);
		return this;
	}
	updatePKG_Content_fileds(filed: string[], value: object[]) {
		// 确保value也是数组且长度相同
		if (filed.length === value.length) {
			for (let i = 0; i < filed.length; i++) {
				this.updatePKG_SingleField(filed[i], value[i]);
			}
		} else {
			throw new Error(
				"Value should be an array with the same length as filed.",
			);
		}
		return this;
	}
	updatePKG_SingleField(filed: string, value: string | object) {
		// 检查filed是否是有效的属性名
		if (!(filed in this.content)) {
			console.warn(
				`Warning: Attempted to update a non-existent field: ${filed}`,
			);
			return;
		}

		// 对于对象属性的更新，进行类型检查以确保安全赋值
		if (
			typeof this.content[filed] === "object" &&
			this.content[filed] !== null &&
			typeof value === "object" &&
			value !== null
		) {
			this.content[filed] = { ...this.content[filed], ...value };
		} else {
			this.content[filed] = value;
		}
		return this;
	}
}
