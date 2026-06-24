// 静态图片映射 - 为每篇文章提供经过验证的相关图片
// 使用 Wikimedia Commons 的高质量图片
// 优先使用真正相关的图片，找不到相关图片的条目使用分类级别的通用图片

export const STATIC_IMAGE_MAP: Record<string, string> = {
  // 节气 - 使用真实相关的自然图片
  "立春：东风解冻": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cherry_blossom_buds_1.jpg/400px-Cherry_blossom_buds_1.jpg",
  "雨水：润物细无声": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Peach_flowers.jpg/400px-Peach_flowers.jpg",
  "惊蛰：春雷初响": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Storm-over-Sofia.jpg/400px-Storm-over-Sofia.jpg",
  "春分：昼夜平分": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Earth-lighting-equinox_EN.png/400px-Earth-lighting-equinox_EN.png",
  "清明：踏青扫墓": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Along_the_River_During_the_Qingming_Festival_%28Qing_Court_Version%29_04a.jpg/400px-Along_the_River_During_the_Qingming_Festival_%28Qing_Court_Version%29_04a.jpg",
  "谷雨：雨生百谷": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/450px-Epcot_rainbow.jpg/400px-450px-Epcot_rainbow.jpg",
  "立夏": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Lotus_flower_%28978659%29.jpg/400px-Lotus_flower_%28978659%29.jpg",
  "小满": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Golden_Wheat_Field_-_geograph.org.uk_-_1955915.jpg/400px-Golden_Wheat_Field_-_geograph.org.uk_-_1955915.jpg",
  "芒种": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Field_of_golden_wheat_-_geograph.org.uk_-_463944.jpg/400px-Field_of_golden_wheat_-_geograph.org.uk_-_463944.jpg",
  "夏至": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sun_at_moment_of_spring_equinox_2019.jpg/400px-Sun_at_moment_of_spring_equinox_2019.jpg",
  "小暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lotus_flower_in_Beijing.jpg/400px-Lotus_flower_in_Beijing.jpg",
  "大暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Lotus_flower_%28978659%29.jpg/400px-Lotus_flower_%28978659%29.jpg",
  "立秋": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Red_Maple_Leaves_in_Yahiko.JPG/400px-Red_Maple_Leaves_in_Yahiko.JPG",
  "处暑": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/The_Growth_of_Chinese_Maple-red_Leaves_in_Deep_Autumn_Impression_%282%29.jpg/400px-The_Growth_of_Chinese_Maple-red_Leaves_in_Deep_Autumn_Impression_%282%29.jpg",
  "白露": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Waxing_half_moon_over_Brofjorden_1.jpg/400px-Waxing_half_moon_over_Brofjorden_1.jpg",
  "寒露": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Red_Maple_Leaves_in_Yahiko.JPG/400px-Red_Maple_Leaves_in_Yahiko.JPG",
  "霜降": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Red_maple_leaf_on_paper_birch.jpg/400px-Red_maple_leaf_on_paper_birch.jpg",
  "立冬": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Winter_in_Tatry_Mountains_-_Poland.jpg/400px-Winter_in_Tatry_Mountains_-_Poland.jpg",
  "小雪": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Snow_Scene_at_Shipka_Pass_1.JPG/400px-Snow_Scene_at_Shipka_Pass_1.JPG",
  "大雪": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Winter_in_Tatras%2C_Poland_%2855156292085%29.jpg/400px-Winter_in_Tatras%2C_Poland_%2855156292085%29.jpg",
  "冬至": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Winter_in_Tatry_Mountains_-_Poland.jpg/400px-Winter_in_Tatry_Mountains_-_Poland.jpg",
  "小寒": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Snow_Scene_at_Shipka_Pass_1.JPG/400px-Snow_Scene_at_Shipka_Pass_1.JPG",
  "大寒": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Winter_in_Tatras%2C_Poland_%2855156292085%29.jpg/400px-Winter_in_Tatras%2C_Poland_%2855156292085%29.jpg",
  
  // 节日 - 使用分类级别的通用图片
  "端午：汨罗江畔的千年追思": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/VM_3852_Singapore_-_Qu_Yuan_in_a_dragon_boat.jpg/400px-VM_3852_Singapore_-_Qu_Yuan_in_a_dragon_boat.jpg",
  "中秋：月圆人团圆": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/The_moon_at_night_in_the_sky_of_Hyderabad.jpg/400px-The_moon_at_night_in_the_sky_of_Hyderabad.jpg",
  "重阳：登高望远": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Red_Maple_Leaves_in_Yahiko.JPG/400px-Red_Maple_Leaves_in_Yahiko.JPG",
  "清明：慎终追远": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Along_the_River_During_the_Qingming_Festival_%28Qing_Court_Version%29_04a.jpg/400px-Along_the_River_During_the_Qingming_Festival_%28Qing_Court_Version%29_04a.jpg",
  
  // 诗词 - 使用分类级别的通用图片
  "静夜思·李白": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/The_moon_at_night_in_the_sky_of_Hyderabad.jpg/400px-The_moon_at_night_in_the_sky_of_Hyderabad.jpg",
  "水调歌头·明月几时有": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/The_moon_at_night_in_the_sky_of_Hyderabad.jpg/400px-The_moon_at_night_in_the_sky_of_Hyderabad.jpg",
  "将进酒·李白": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/LiBai.jpg/400px-LiBai.jpg",
  
  // 典籍 - 使用分类级别的通用图片
  "《论语》：半部治天下": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Commentaries_of_the_Analects_of_Confucius.jpg/400px-Commentaries_of_the_Analects_of_Confucius.jpg",
  
  // 非遗 - 使用分类级别的通用图片
  "昆曲：百戏之祖": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Pekinguniversitykunqu5.jpg/400px-Pekinguniversitykunqu5.jpg",
  
  // 人物 - 使用分类级别的通用图片
  "李白：诗仙醉月": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/LiBai.jpg/400px-LiBai.jpg",
};

// 分类级别的通用图片（用于没有专门图片的条目）
export const CATEGORY_IMAGES: Record<string, string> = {
  "节气": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cherry_blossom_buds_1.jpg/400px-Cherry_blossom_buds_1.jpg",
  "节日": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/VM_3852_Singapore_-_Qu_Yuan_in_a_dragon_boat.jpg/400px-VM_3852_Singapore_-_Qu_Yuan_in_a_dragon_boat.jpg",
  "诗词": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/The_moon_at_night_in_the_sky_of_Hyderabad.jpg/400px-The_moon_at_night_in_the_sky_of_Hyderabad.jpg",
  "典籍": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Commentaries_of_the_Analects_of_Confucius.jpg/400px-Commentaries_of_the_Analects_of_Confucius.jpg",
  "非遗": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Pekinguniversitykunqu5.jpg/400px-Pekinguniversitykunqu5.jpg",
  "民俗": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Commentaries_of_the_Analects_of_Confucius.jpg/400px-Commentaries_of_the_Analects_of_Confucius.jpg",
  "人物": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/LiBai.jpg/400px-LiBai.jpg",
};
