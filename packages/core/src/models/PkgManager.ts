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
	updatePKG_Content_fields(field: string[], value: object[]) {
		// 确保value也是数组且长度相同
		if (field.length === value.length) {
			for (let i = 0; i < field.length; i++) {
				this.updatePKG_SingleField(field[i], value[i]);
			}
		} else {
			throw new Error(
				"Value should be an array with the same length as field.",
			);
		}
		return this;
	}
	updatePKG_SingleField(field: string, value: string | object) {
		// 如果field对应的属性不存在于this.content中，则添加该属性
		if (!(field in this.content)) {
			this.content[field] = value;
			return this;
		}

		// 对于对象属性的更新，进行类型检查以确保安全赋值
		if (
			typeof this.content[field] === "object" &&
			this.content[field] !== null &&
			typeof value === "object" &&
			value !== null
		) {
			this.content[field] = { ...this.content[field], ...value };
		} else {
			this.content[field] = value;
		}
		return this;
	}
}
