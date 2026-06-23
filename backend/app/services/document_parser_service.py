import os
import re
from typing import Optional, List, Dict, Any
from app.models.document_summary import DocumentSummaryCreate, DocumentSummaryUpdate
from app.utils.openai_util import OpenAIUtil


class DocumentParserService:
    """文档解析服务 - AI 提取文档摘要和关键信息"""

    def __init__(self):
        self.max_preview_length = 2000  # 内容预览最大长度

    async def parse_document(
        self,
        document_id: str,
        company_id: str,
        file_path: str,
        file_type: str,
        title: str
    ) -> Dict[str, Any]:
        """
        解析文档并提取摘要信息

        Args:
            document_id: 文档 ID
            company_id: 企业 ID
            file_path: 文件路径
            file_type: 文件类型 (pdf, docx, txt, etc.)
            title: 文档标题

        Returns:
            解析结果字典
        """
        try:
            # 1. 读取文件内容
            content = await self._read_file_content(file_path, file_type)
            if not content:
                return {
                    "status": "failed",
                    "error_message": "无法读取文件内容"
                }

            # 2. 提取内容摘要
            summary_result = await self._extract_summary(content, file_type, title)

            # 3. 构建结果
            return {
                "status": "completed",
                "summary": summary_result.get("summary", ""),
                "key_points": summary_result.get("key_points", []),
                "category_hint": summary_result.get("category_hint"),
                "keywords": summary_result.get("keywords", []),
                "content_preview": content[:self.max_preview_length] if content else None
            }

        except Exception as e:
            return {
                "status": "failed",
                "error_message": str(e)
            }

    async def _read_file_content(self, file_path: str, file_type: str) -> Optional[str]:
        """根据文件类型读取内容"""
        try:
            if not os.path.exists(file_path):
                return None

            content = ""
            file_type = file_type.lower()

            if file_type == "pdf":
                content = self._read_pdf(file_path)
            elif file_type in ["docx", "doc"]:
                content = self._read_docx(file_path)
            elif file_type in ["txt", "text"]:
                content = self._read_txt(file_path)
            else:
                # 尝试作为文本读取
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except:
                    return None

            return content.strip()

        except Exception as e:
            print(f"Error reading file: {e}")
            return None

    def _read_pdf(self, file_path: str) -> str:
        """读取 PDF 文件"""
        try:
            import PyPDF2
            content = []
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages[:20]:  # 限制页数
                    text = page.extract_text()
                    if text:
                        content.append(text)
            return "\n".join(content)
        except Exception as e:
            print(f"PDF read error: {e}")
            return ""

    def _read_docx(self, file_path: str) -> str:
        """读取 Word 文件"""
        try:
            from docx import Document
            doc = Document(file_path)
            content = []
            for para in doc.paragraphs:
                if para.text.strip():
                    content.append(para.text)
            return "\n".join(content)
        except Exception as e:
            print(f"DOCX read error: {e}")
            return ""

    def _read_txt(self, file_path: str) -> str:
        """读取文本文件"""
        try:
            encodings = ['utf-8', 'gbk', 'gb2312', 'latin-1']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        return f.read()
                except:
                    continue
            return ""
        except Exception as e:
            print(f"TXT read error: {e}")
            return ""

    async def _extract_summary(
        self,
        content: str,
        file_type: str,
        title: str
    ) -> Dict[str, Any]:
        """调用 AI 提取摘要信息"""
        try:
            # 构建提示词
            prompt = f"""请分析以下{'PDF' if file_type == 'pdf' else 'Word'}文档，提取关键信息。

文档标题：{title}
文档内容：
{content[:8000]}

请以 JSON 格式返回以下信息：
{{
    "summary": "文档摘要，100字以内，概括文档主要内容",
    "key_points": ["要点1", "要点2", "要点3", "要点4", "要点5"],
    "category_hint": "建议的分类标签，如：技术方案、商务报价、资质证明等",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
}}

只返回 JSON，不要有其他内容："""

            # 调用 LLM 服务
            messages = [{"role": "user", "content": prompt}]
            response = await OpenAIUtil().collect_chat_completion(messages)

            # 解析 JSON 响应
            result = self._parse_json_response(response)
            return result

        except Exception as e:
            print(f"LLM extraction error: {e}")
            return {
                "summary": f"文档：{title}",
                "key_points": [],
                "category_hint": None,
                "keywords": []
            }

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """解析 LLM 返回的 JSON"""
        try:
            import json
            # 尝试提取 JSON
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            print(f"JSON parse error: {e}")

        return {
            "summary": "",
            "key_points": [],
            "category_hint": None,
            "keywords": []
        }


# 全局实例
document_parser_service = DocumentParserService()


def get_document_parser_service() -> DocumentParserService:
    """获取文档解析服务实例"""
    return document_parser_service
