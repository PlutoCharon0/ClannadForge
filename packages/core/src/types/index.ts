import prompts from "prompts";

export enum ProjectType {
	//TODO 待研究  枚举赋值相应目录字符串 配合获取模板地址使用 prompts————projectType的交互产生报错
	WEB,
	UI_LIBRARY,
	STATIC_SITE,
}

export enum UsageMode {
	UNIVERSALMODE,
	CUSTOMMODE,
	EXTERNALLINKSMODE,
}

export type BaseResponse = prompts.Answers<
	"projectName" | "overwrite" | "packageName" | "usageMode"
>;

export type SpecificResponse = prompts.Answers<
	| "universalMode"
	| "externalLinksMode"
	| "customMode"
	| "projectType"
	| "framework"
	| "variant"
	| "cliType"
	| "configs"
	| "needTypescript"
>;

export type EngineeringResponse = prompts.Answers<
	"isUseEngineeringConfiguration" | "engineeringConfigs"
>;
