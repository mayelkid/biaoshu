"""企业资料完善度评估服务"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.knowledge_schema import (
    CompanyEvaluationResult,
    CompanyEvaluationResponse,
    EvaluationCategory,
    EvaluationItem,
    EvaluationStatus,
)
from app.services.knowledge_service import KnowledgeService
from app.services.document_parser_service import document_parser_service
from app.utils.openai_util import OpenAIUtil
from app.utils.errors import AppError


# 投标文件常规需要的企业资料评估维度
EVALUATION_DIMENSIONS = [
    {
        "name": "企业基本信息",
        "items": [
            "营业执照",
            "统一社会信用代码/组织机构代码",
            "企业注册信息（名称、地址、注册资本）",
            "经营期限/营业期限",
            "企业类型/经营范围",
        ],
    },
    {
        "name": "法定代表人信息",
        "items": [
            "法人身份证",
            "法人授权委托书",
            "法人联系方式",
        ],
    },
    {
        "name": "资质与认证",
        "items": [
            "行业资质证书",
            "ISO 质量管理体系认证（ISO9001）",
            "ISO 环境管理体系认证（ISO14001）",
            "ISO 信息安全管理体系认证（ISO27001）",
            "高新技术企业认定",
            "专利证书",
            "软件著作权",
            "其他专业认证",
        ],
    },
    {
        "name": "财务状况",
        "items": [
            "近三年审计报告",
            "资产负债表",
            "利润表/损益表",
            "现金流量表",
            "纳税证明",
            "银行资信证明/银行开户许可证",
            "财务情况说明",
        ],
    },
    {
        "name": "业绩与项目经验",
        "items": [
            "类似项目业绩清单",
            "项目合同",
            "客户验收报告/完工证明",
            "用户满意度证明",
            "项目案例介绍",
        ],
    },
    {
        "name": "技术能力与团队",
        "items": [
            "技术人员资质证书",
            "研发团队介绍",
            "技术方案/产品说明书",
            "核心技术说明",
            "研发设备/实验室证明",
        ],
    },
    {
        "name": "信用与合规",
        "items": [
            "企业信用报告",
            "无违法违规记录证明",
            "无重大诉讼证明",
            "社保缴纳证明",
            "人员社保清单",
            "信用中国查询截图",
            "政府采购严重违法失信记录查询",
        ],
    },
]


class EvaluationService:
    """企业资料完善度评估服务"""

    def __init__(self, data_dir: str = "app/data/knowledge"):
        self.data_dir = data_dir
        self.knowledge_service = KnowledgeService(data_dir)

    def _get_evaluations_dir(self, user_id: str) -> str:
        """获取用户评估结果存储目录"""
        eval_dir = os.path.join(self.data_dir, user_id, "evaluations")
        os.makedirs(eval_dir, exist_ok=True)
        return eval_dir

    def _get_evaluation_file(self, user_id: str, company_id: str) -> str:
        """获取企业评估结果文件路径"""
        return os.path.join(self._get_evaluations_dir(user_id), f"{company_id}.json")

    def load_evaluation(self, user_id: str, company_id: str) -> Optional[CompanyEvaluationResult]:
        """加载已有的评估结果"""
        file_path = self._get_evaluation_file(user_id, company_id)
        if not os.path.exists(file_path):
            return None
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return CompanyEvaluationResult(**data)
        except Exception as e:
            print(f"加载评估结果失败: {e}")
            return None

    def save_evaluation(self, user_id: str, result: CompanyEvaluationResult) -> None:
        """保存评估结果"""
        file_path = self._get_evaluation_file(user_id, result.company_id)
        try:
            # 将 datetime 转为 ISO 字符串以便 JSON 序列化
            data = result.model_dump(mode="json")
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存评估结果失败: {e}")

    @staticmethod
    def _validate_evaluation_response(payload: Dict[str, Any]) -> None:
        """轻量校验 AI 返回的评估结果。"""
        categories = payload.get("categories")
        if not isinstance(categories, list):
            raise ValueError("categories 必须是列表")
        for cat in categories:
            if not isinstance(cat.get("items"), list):
                raise ValueError("category 缺少 items 字段")

    def _build_evaluation_prompt(
        self,
        company_name: str,
        documents_summary: List[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        """构建评估 Prompt"""
        # 构建文档信息文本
        doc_lines = []
        for i, doc in enumerate(documents_summary, 1):
            doc_lines.append(f"【文档{i}】{doc.get('title', '未命名')}")
            doc_lines.append(f"  分类: {doc.get('category', '未知')}")
            doc_lines.append(f"  摘要: {doc.get('summary', '无摘要')}")
            if doc.get('keywords'):
                doc_lines.append(f"  关键词: {', '.join(doc.get('keywords', []))}")
            if doc.get('key_points'):
                doc_lines.append(f"  关键要点: {', '.join(doc.get('key_points', []))}")
            doc_lines.append("")

        docs_text = "\n".join(doc_lines) if doc_lines else "该企业暂无上传文档。"

        # 构建评估维度文本
        dim_lines = []
        for cat in EVALUATION_DIMENSIONS:
            dim_lines.append(f"### {cat['name']}")
            for item in cat['items']:
                dim_lines.append(f"- {item}")
            dim_lines.append("")
        dims_text = "\n".join(dim_lines)

        system_prompt = f"""你是一个专业的投标文件资料审核专家。你的任务是根据企业上传的文档资料，评估该企业投标文件所需资料的完善度。

你需要评估以下维度（共7个大类，{sum(len(c['items']) for c in EVALUATION_DIMENSIONS)}个评估项）：

{dims_text}

对每个评估项，判断状态：
- "completed"：资料完善、内容齐全
- "incomplete"：有相关资料但内容不完整或不够详细
- "missing"：完全缺失该资料
- "unable_to_determine"：无法从现有资料中判断

同时请为每个评估项写一段简短的说明（detail），说明判断理由。

如果某个文档与评估项相关，请记录该文档的ID。

最后计算整体完善度百分比：已完成项数 / 总评估项数 * 100（只保留一位小数）。

请以 JSON 格式返回结果，不要输出任何其他内容。"""

        user_prompt = f"""企业名称：{company_name}

企业文档资料：
{docs_text}

请根据以上文档资料，评估该企业投标文件所需资料的完善度。"""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    async def evaluate_company(
        self,
        user_id: str,
        company_id: str,
    ) -> CompanyEvaluationResult:
        """评估企业资料完善度"""
        # 获取企业信息
        company = self.knowledge_service.get_company_by_id(user_id, company_id)
        if not company:
            raise AppError("企业不存在", status_code=404)

        # 获取企业下所有文档
        documents = self.knowledge_service.get_documents_by_company(user_id, company_id)
        if not documents:
            # 没有文档，返回空评估
            return self._create_empty_evaluation(user_id, company_id)

        # 收集所有文档的摘要信息
        documents_summary = []
        for doc in documents:
            summary_data = document_parser_service.get_summary(user_id, company_id, doc.id)
            if summary_data:
                documents_summary.append({
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "summary": summary_data.get("summary", ""),
                    "keywords": summary_data.get("keywords", []),
                    "key_points": summary_data.get("key_points", []),
                })
            else:
                # 没有摘要的文档，只提供标题和分类
                documents_summary.append({
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "summary": "",
                    "keywords": [],
                    "key_points": [],
                })

        # 调用 AI 进行评估
        ai = OpenAIUtil()
        messages = self._build_evaluation_prompt(company.name, documents_summary)

        try:
            response_data = await ai.collect_json_response(
                messages=messages,
                temperature=0.3,
                schema=None,  # 不强制校验 schema，避免 AI 不返回 evaluation_time 等字段导致失败
                validator=self._validate_evaluation_response,
                progress_label="企业资料评估",
                failure_message="评估结果格式无效",
            )
        except AppError as exc:
            # AI 评估失败，降级为基于规则的简单评估
            return self._create_fallback_evaluation(user_id, company_id, documents_summary)

        # 补充计算 completed_count 和 total_count
        categories = response_data.get("categories", [])
        total_items = 0
        completed_items = 0
        for cat_data in categories:
            items = cat_data.get("items", [])
            cat_data["total_count"] = len(items)
            cat_data["completed_count"] = sum(
                1 for item in items if item.get("status") == "completed"
            )
            total_items += cat_data["total_count"]
            completed_items += cat_data["completed_count"]

        # 重新计算百分比（确保准确）
        percentage = round((completed_items / total_items * 100), 1) if total_items > 0 else 0.0

        # 构建结果
        result = CompanyEvaluationResult(
            company_id=company_id,
            user_id=user_id,
            completeness_percentage=percentage,
            evaluation_time=datetime.now(),
            categories=[
                EvaluationCategory(
                    name=cat.get("name", ""),
                    items=[
                        EvaluationItem(
                            name=item.get("name", ""),
                            status=EvaluationStatus(item.get("status", "unable_to_determine")),
                            detail=item.get("detail"),
                            document_ids=item.get("document_ids", []),
                        )
                        for item in cat.get("items", [])
                    ],
                    completed_count=cat.get("completed_count", 0),
                    total_count=cat.get("total_count", 0),
                )
                for cat in categories
            ],
        )

        # 保存评估结果
        self.save_evaluation(user_id, result)
        return result

    def _create_empty_evaluation(self, user_id: str, company_id: str) -> CompanyEvaluationResult:
        """创建空评估（无文档时）"""
        categories = []
        total_items = 0
        for cat_data in EVALUATION_DIMENSIONS:
            items = [
                EvaluationItem(
                    name=item,
                    status=EvaluationStatus.MISSING,
                    detail="该企业尚未上传相关文档",
                    document_ids=[],
                )
                for item in cat_data["items"]
            ]
            categories.append(
                EvaluationCategory(
                    name=cat_data["name"],
                    items=items,
                    completed_count=0,
                    total_count=len(items),
                )
            )
            total_items += len(items)

        return CompanyEvaluationResult(
            company_id=company_id,
            user_id=user_id,
            completeness_percentage=0.0,
            evaluation_time=datetime.now(),
            categories=categories,
        )

    def _create_fallback_evaluation(
        self,
        user_id: str,
        company_id: str,
        documents_summary: List[Dict[str, Any]],
    ) -> CompanyEvaluationResult:
        """基于规则的降级评估（AI 失败时）"""
        # 收集所有关键词和摘要文本用于匹配
        all_texts = []
        for doc in documents_summary:
            all_texts.append(doc.get("title", ""))
            all_texts.append(doc.get("summary", ""))
            all_texts.extend(doc.get("keywords", []))
            all_texts.extend(doc.get("key_points", []))
        all_text = " ".join(all_texts).lower()

        categories = []
        total_completed = 0
        total_items = 0

        for cat_data in EVALUATION_DIMENSIONS:
            items = []
            for item_name in cat_data["items"]:
                # 简单的关键词匹配
                status, detail = self._match_item_status(item_name, all_text, documents_summary)
                items.append(
                    EvaluationItem(
                        name=item_name,
                        status=status,
                        detail=detail,
                        document_ids=[],
                    )
                )
                if status == EvaluationStatus.COMPLETED:
                    total_completed += 1
                total_items += 1

            categories.append(
                EvaluationCategory(
                    name=cat_data["name"],
                    items=items,
                    completed_count=sum(1 for i in items if i.status == EvaluationStatus.COMPLETED),
                    total_count=len(items),
                )
            )

        percentage = round((total_completed / total_items * 100), 1) if total_items > 0 else 0.0

        return CompanyEvaluationResult(
            company_id=company_id,
            user_id=user_id,
            completeness_percentage=percentage,
            evaluation_time=datetime.now(),
            categories=categories,
        )

    def _match_item_status(
        self,
        item_name: str,
        all_text: str,
        documents_summary: List[Dict[str, Any]],
    ) -> tuple:
        """基于关键词匹配评估项状态"""
        # 定义每个评估项的关键词
        keyword_map = {
            "营业执照": ["营业执照", "business license"],
            "统一社会信用代码": ["统一社会信用代码", "组织机构代码", "信用代码"],
            "企业注册信息": ["注册信息", "注册资本", "注册地址", "企业名称"],
            "经营期限": ["经营期限", "营业期限", "有效期"],
            "企业类型": ["企业类型", "经营范围", "有限责任公司", "股份有限公司"],
            "法人身份证": ["法人身份证", "法定代表人身份证", "身份证"],
            "法人授权委托书": ["授权委托书", "法人授权", "授权书"],
            "法人联系方式": ["法人联系方式", "法人电话", "法人邮箱"],
            "行业资质证书": ["资质证书", "资质证明", "资格证书"],
            "ISO 质量管理体系": ["iso9001", "质量管理", "iso 9001"],
            "ISO 环境管理体系": ["iso14001", "环境管理", "iso 14001"],
            "ISO 信息安全管理体系": ["iso27001", "信息安全", "iso 27001"],
            "高新技术企业": ["高新技术企业", "高新企业"],
            "专利证书": ["专利", "发明专利", "实用新型"],
            "软件著作权": ["软件著作权", "软著", "软件版权"],
            "其他专业认证": ["认证", "certificate", "certification"],
            "近三年审计报告": ["审计报告", "审计"],
            "资产负债表": ["资产负债表", "资产"],
            "利润表": ["利润表", "损益表", "利润"],
            "现金流量表": ["现金流量表", "现金流"],
            "纳税证明": ["纳税证明", "完税证明", "纳税"],
            "银行资信证明": ["银行资信", "资信证明", "开户许可证"],
            "财务情况说明": ["财务情况", "财务状况"],
            "类似项目业绩": ["业绩", "项目业绩", "类似项目"],
            "项目合同": ["合同", "项目合同"],
            "客户验收报告": ["验收", "验收报告", "完工证明"],
            "用户满意度证明": ["满意度", "用户评价"],
            "项目案例介绍": ["项目案例", "案例介绍"],
            "技术人员资质": ["技术人员", "技术资质", "工程师"],
            "研发团队介绍": ["研发团队", "研发人员", "技术团队"],
            "技术方案": ["技术方案", "产品说明书", "技术文档"],
            "核心技术说明": ["核心技术", "关键技术"],
            "研发设备": ["研发设备", "实验室", "检测设备"],
            "企业信用报告": ["信用报告", "企业信用"],
            "无违法违规记录": ["无违法违规", "无违法记录", "合规证明"],
            "无重大诉讼证明": ["无诉讼", "无重大诉讼", "诉讼"],
            "社保缴纳证明": ["社保", "社保证明", "缴纳证明"],
            "人员社保清单": ["社保清单", "人员社保"],
            "信用中国查询": ["信用中国", "信用查询"],
            "政府采购严重违法失信": ["政府采购", "违法失信"],
        }

        keywords = keyword_map.get(item_name, [item_name])
        for kw in keywords:
            if kw.lower() in all_text:
                return EvaluationStatus.COMPLETED, f"从文档中发现相关关键词：{kw}"

        return EvaluationStatus.MISSING, "未在文档中发现相关资料"


# 全局服务实例
_evaluation_service = None


def get_evaluation_service() -> EvaluationService:
    """获取评估服务实例"""
    global _evaluation_service
    if _evaluation_service is None:
        _evaluation_service = EvaluationService()
    return _evaluation_service
