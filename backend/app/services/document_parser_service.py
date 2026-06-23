import os
import re
from typing import Optional, List, Dict, Any
from app.models.document_summary import DocumentSummaryCreate, DocumentSummaryUpdate
from app.utils.openai_util import OpenAIUtil


class DocumentParserService:
    """文档解析服务 - AI 提取文档摘要和关键信息，支持文字和图片理解"""

    def __init__(self):
        self.max_preview_length = 2000
        self.max_images = 5

    async def parse_document(
        self,
        document_id: str,
        company_id: str,
        file_path: str,
        file_type: str,
        title: str
    ) -> Dict[str, Any]:
        """解析文档并提取摘要信息"""
        try:
            # 1. 读取文件内容
            content = await self._read_file_content(file_path, file_type)
            if not content:
                return {
                    "status": "failed",
                    "error_message": "无法读取文件内容"
                }

            # 2. 提取图片并理解（支持 PDF 和 Word）
            images_content = await self._extract_and_understand_images(file_path, file_type)

            # 3. 提取内容摘要（包含文字和图片内容）
            summary_result = await self._extract_summary(content, images_content, file_type, title)

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
                for page in reader.pages[:20]:
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

    async def _extract_and_understand_images(self, file_path: str, file_type: str) -> str:
        """提取文档中的图片并使用 AI 理解图片内容"""
        try:
            from app.services.file_service import FileService
            file_service = FileService()
            
            # 提取图片
            images = file_service.extract_images_from_file(file_path, file_type)
            
            if not images:
                return ""
            
            # 限制图片数量
            images = images[:self.max_images]
            
            # 使用 AI 理解每张图片
            image_descriptions = []
            for i, img_data in enumerate(images):
                try:
                    # img_data 可能是图片数据或 URL
                    if isinstance(img_data, dict):
                        # 如果是字典格式，尝试获取描述或 base64
                        if 'base64' in img_data:
                            base64_data = img_data['base64']
                        elif 'url' in img_data:
                            # 如果是 URL，下载并转为 base64
                            import requests
                            response = requests.get(img_data['url'])
                            if response.status_code == 200:
                                base64_data = base64.b64encode(response.content).decode('utf-8')
                            else:
                                continue
                        else:
                            continue
                    elif isinstance(img_data, bytes):
                        base64_data = base64.b64encode(img_data).decode('utf-8')
                    elif isinstance(img_data, str):
                        # 如果是 URL，下载并转为 base64
                        import requests
                        response = requests.get(img_data)
                        if response.status_code == 200:
                            base64_data = base64.b64encode(response.content).decode('utf-8')
                        else:
                            continue
                    else:
                        continue
                    
                    # 使用 AI 理解图片
                    description = await self._understand_image(base64_data, i + 1)
                    if description:
                        image_descriptions.append(f"[图片{i + 1}]：{description}")
                        
                except Exception as e:
                    print(f"Image {i + 1} processing error: {e}")
                    continue
            
            if image_descriptions:
                return "\n\n--- 文档中的图片内容 ---\n" + "\n".join(image_descriptions)
            return ""
            
        except Exception as e:
            print(f"Image extraction error: {e}")
            return ""

    async def _understand_image(self, base64_data: str, image_num: int) -> str:
        """使用 AI 理解单张图片内容"""
        try:
            prompt = f"""请详细描述这张图片的内容，包括：
1. 图片中的主要文字内容
2. 图片展示的图表、数据或流程
3. 图片传达的关键信息
4. 如果是表格或截图，请完整提取其中的信息

只返回图片内容的描述，不要有其他内容，尽量详细但简洁："""

            # 构建多模态消息
            messages = [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_data}"
                        }
                    }
                ]
            }]

            # 调用 LLM
            response = await OpenAIUtil().collect_chat_completion(messages)
            return response.strip() if response else ""
            
        except Exception as e:
            print(f"Image understanding error: {e}")
            return ""

    async def _extract_summary(
        self,
        content: str,
        images_content: str,
        file_type: str,
        title: str
    ) -> Dict[str, Any]:
        """调用 AI 提取摘要信息"""
        try:
            # 构建提示词
            doc_type = 'PDF' if file_type == 'pdf' else 'Word' if file_type in ['docx', 'doc'] else '文档'
            
            # 组合文字和图片内容
            full_content = content
            if images_content:
                full_content += "\n\n" + images_content
            
            prompt = f"""请分析以下{doc_type}文档，提取关键信息。

文档标题：{title}
文档内容：
{full_content[:10000]}

请以 JSON 格式返回以下信息：
{{
    "summary": "文档摘要，100字以内，概括文档主要内容",
    "key_points": ["要点1", "要点2", "要点3", "要点4", "要点5"],
    "category_hint": "建议的分类标签，如：技术方案、商务报价、资质证明等",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
}}

只返回 JSON，不要有其他内容："""

            messages = [{"role": "user", "content": prompt}]
            response = await OpenAIUtil().collect_chat_completion(messages)

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
