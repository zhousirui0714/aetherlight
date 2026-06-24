"""
种子脚本：向 knowledge_articles 表插入初始知识条目。
数据来源于前端设计参考 (knowledge-data.ts)，适配后端数据库 schema。

运行方式：
  cd backend && python scripts/seed_knowledge_articles.py
"""
import os
import sys
import uuid
from datetime import datetime, timezone

# 确保能找到 backend 目录下的模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import supabase
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 必须设置")
    sys.exit(1)


# ---------- 数据 ----------
# 使用 uuid5 确定性 ID，确保多次运行得到相同的 ID
# namespace 统一用 uuid.NAMESPACE_DNS

def stable_id(name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"suguang-{name}"))


ARTICLES = [
    {
        "id": stable_id("guyu"),
        "title": "谷雨：雨生百谷",
        "category": "节气",
        "excerpt": "春季最后一个节气，源自\u201c雨生百谷\u201d之说，是播种移苗的关键时令。",
        "body": (
            "谷雨是二十四节气中的第六个节气，也是春季的最后一个节气。"
            "《月令七十二候集解》中说：\u201c三月中，自雨水后，土膏脉动，今又雨其谷于水也。\u201d"
            "谷雨节气的到来意味着寒潮天气基本结束，气温回升加快，大大有利于谷类农作物的生长。"
            "古人有\u2018走谷雨\u2019、\u2018喝谷雨茶\u2019、\u2018赏牡丹\u2019等习俗。"
        ),
        "cover": "🌧",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["节气", "谷雨", "春季"],
        "favorites": 1284,
    },
    {
        "id": stable_id("duanwu"),
        "title": "端午：汨罗江畔的千年追思",
        "category": "节日",
        "excerpt": "纪念屈原的传统节日，赛龙舟、食粽子、佩香囊。",
        "body": (
            "端午节，为每年农历五月初五。据《史记·屈原贾生列传》记载，"
            "屈原忠贞不渝却遭谗去职，流放至沅、湘流域。在写下绝笔《怀沙》后，"
            "抱石投汨罗江身死。后人为纪念这位伟大的爱国诗人，便有了赛龙舟、"
            "吃粽子、悬艾草等习俗，流传至今。"
        ),
        "cover": "🐉",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["节日", "端午", "屈原", "龙舟"],
        "favorites": 2391,
    },
    {
        "id": stable_id("jingye"),
        "title": "静夜思·李白",
        "category": "诗词",
        "excerpt": "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
        "body": (
            "《静夜思》是唐代诗人李白所作的一首五言古诗。"
            "此诗描写了秋日夜晚，诗人于屋内抬头望月的所感。"
            "诗中运用比喻、衬托等手法，表达客居思乡之情，"
            "语言清新朴素而韵味含蓄无穷，历来广为传诵。"
        ),
        "cover": "🌙",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["诗词", "李白", "唐诗", "思乡"],
        "favorites": 5612,
    },
    {
        "id": stable_id("lunyu"),
        "title": "《论语》：半部治天下",
        "category": "典籍",
        "excerpt": "孔门弟子记述孔子言行的语录体散文集，儒家思想的核心经典。",
        "body": (
            "《论语》是儒家学派的经典著作之一，由孔子的弟子及其再传弟子编撰而成。"
            "它以语录体和对话文体为主，记录了孔子及其弟子的言行，"
            "集中体现了孔子的政治主张、伦理思想、道德观念及教育原则等。"
        ),
        "cover": "📜",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["典籍", "论语", "孔子", "儒家"],
        "favorites": 1893,
    },
    {
        "id": stable_id("kunqu"),
        "title": "昆曲：百戏之祖",
        "category": "非遗",
        "excerpt": "中国汉族传统戏曲中最古老的剧种之一，2001年列入人类非物质文化遗产。",
        "body": (
            "昆曲发源于14世纪苏州昆山，糅合了唱念做表、舞蹈及武术的表演艺术。"
            "昆曲以鼓、板控制演唱节奏，以曲笛、三弦等为主要伴奏乐器，"
            "唱念语音为\u2018中州韵\u2019。被誉为\u2018百戏之祖\u2019。"
        ),
        "cover": "🎭",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["非遗", "昆曲", "戏曲"],
        "favorites": 842,
    },
    {
        "id": stable_id("chayi"),
        "title": "茶事：一盏清欢",
        "category": "民俗",
        "excerpt": "从神农尝百草到陆羽《茶经》，茶已成为东方生活美学的代名词。",
        "body": (
            "中国是茶的故乡。饮茶之风始于汉，盛于唐，普及于宋。"
            "唐代陆羽撰《茶经》，开创茶道。"
            "文人雅士品茶论道，演化出\u2018茶道\u2019文化，"
            "讲究\u2018和、静、怡、真\u2019四谛。"
        ),
        "cover": "🍵",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["民俗", "茶", "茶道", "陆羽"],
        "favorites": 1567,
    },
    {
        "id": stable_id("subai"),
        "title": "苏东坡：也无风雨也无晴",
        "category": "人物",
        "excerpt": "宋代文豪，诗书画俱绝，一蓑烟雨任平生。",
        "body": (
            "苏轼（1037-1101），字子瞻，号东坡居士。"
            "北宋著名文学家、书法家、画家。"
            "一生宦海沉浮，屡遭贬谪，却始终保持豁达乐观，"
            "留下《赤壁赋》《水调歌头》等不朽名篇。"
        ),
        "cover": "🖌",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["人物", "苏轼", "苏东坡", "宋词"],
        "favorites": 3211,
    },
    {
        "id": stable_id("chongyang"),
        "title": "重阳：登高望远",
        "category": "节日",
        "excerpt": "九月初九，登高、赏菊、插茱萸，现为敬老节。",
        "body": (
            "重阳节，农历九月初九。《易经》中将\u2018九\u2019定为阳数，"
            "九九两阳数相重，故名\u2018重阳\u2019。"
            "古人在这一天有登高赏秋、感恩敬老的习俗。"
            "王维\u2018遥知兄弟登高处，遍插茱萸少一人\u2019即写此节。"
        ),
        "cover": "🍂",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["节日", "重阳", "登高", "敬老"],
        "favorites": 1102,
    },
    {
        "id": stable_id("shijing"),
        "title": "《诗经》：风雅颂的源头",
        "category": "典籍",
        "excerpt": "中国最早的诗歌总集，收录西周至春秋时期诗歌305篇。",
        "body": (
            "《诗经》是中国古代诗歌的开端，最早的一部诗歌总集，"
            "收集了西周初年至春秋中叶（前11世纪至前6世纪）的诗歌，共311篇。"
            "分为《风》《雅》《颂》三部分。"
            "\u2018关关雎鸠，在河之洲\u2019已成为千古绝唱。"
        ),
        "cover": "🪶",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["典籍", "诗经", "诗歌"],
        "favorites": 2780,
    },
    {
        "id": stable_id("lichun"),
        "title": "立春：东风解冻",
        "category": "节气",
        "excerpt": "二十四节气之首，春天的开始，有\u2018咬春\u2019、\u2018打春牛\u2019等习俗。",
        "body": (
            "立春，是二十四节气中的第一个节气。"
            "\u2018立\u2019是\u2018开始\u2019之意，\u2018春\u2019代表着温暖、生长。"
            "古时人们在立春这天有\u2018迎春\u2019、\u2018咬春\u2019（吃春饼春卷）、"
            "\u2018鞭春牛\u2019（劝农耕作）等仪式。"
        ),
        "cover": "🌱",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["节气", "立春", "春季"],
        "favorites": 956,
    },
    {
        "id": stable_id("ciqi"),
        "title": "青花瓷：景德镇的蓝白韵律",
        "category": "非遗",
        "excerpt": "以含氧化钴矿物为色料，在白胎上绘画后烧制而成。",
        "body": (
            "青花瓷起源于唐宋，成熟于元代景德镇。"
            "它用钴料在素胎上绘制纹饰，再罩以透明釉，经高温还原焰一次烧成。"
            "其色泽幽靓苍翠，纹饰清新明丽，是中国陶瓷艺术的代表。"
        ),
        "cover": "🏺",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["非遗", "瓷器", "青花瓷", "景德镇"],
        "favorites": 1432,
    },
    {
        "id": stable_id("shuidiao"),
        "title": "水调歌头·明月几时有",
        "category": "诗词",
        "excerpt": "明月几时有？把酒问青天。不知天上宫阙，今夕是何年。",
        "body": (
            "苏轼于宋神宗熙宁九年（1076年）中秋在密州所作。"
            "词以月起兴，围绕中秋明月展开想象和思考，"
            "把人世间的悲欢离合之情纳入对宇宙人生的哲理性追寻中，"
            "反映了作者复杂而又矛盾的思想感情。"
        ),
        "cover": "🌕",
        "source": "",
        "author": "溯光编辑部",
        "tags": ["诗词", "苏轼", "水调歌头", "中秋"],
        "favorites": 4123,
    },
]


# ---------- 执行 ----------

def main():
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"准备插入 {len(ARTICLES)} 条知识条目...\n")

    client = supabase.create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    now = datetime.now(timezone.utc).isoformat()

    inserted = 0
    skipped = 0

    for article in ARTICLES:
        record = {
            "id": article["id"],
            "title": article["title"],
            "category": article["category"],
            "excerpt": article["excerpt"],
            "body": article["body"],
            "cover": article["cover"],
            "source": article.get("source", ""),
            "author": article.get("author", "溯光编辑部"),
            "tags": article.get("tags", []),
            "favorites": article.get("favorites", 0),
            "created_at": now,
            "updated_at": now,
        }

        # 检查是否已存在
        existing = (
            client.table("knowledge_articles")
            .select("id")
            .eq("id", article["id"])
            .execute()
        )

        if existing.data:
            print(f"  ⏭  已存在: {article['title']}")
            skipped += 1
            continue

        result = client.table("knowledge_articles").insert(record).execute()

        if result.data:
            print(f"  ✅ 插入: {article['title']} ({article['category']})")
            inserted += 1
        else:
            print(f"  ❌ 失败: {article['title']}")

    print(f"\n完成：新增 {inserted} 条，跳过 {skipped} 条，共 {len(ARTICLES)} 条。")


if __name__ == "__main__":
    main()
