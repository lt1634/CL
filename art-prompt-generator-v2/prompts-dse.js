/**
 * DSE 視藝：練拆奪星王 · VA Star-Getter: Gen & Crack — 題目庫
 * 每條含：命題、Concept 諗法、視覺元素建議、構圖提示、技法建議、扣題引導；部分含 starTips、partALink（甲部評賞聯繫）、colourTone（色彩調性）
 * 甲部聯繫：融入 2014–2022 歷屆評賞作品風格（媒材、構圖、光源、符號），供乙部創作對應
 * 來源：歷年試題；構圖透視與光源設計等應試要點
 */
const DSE_PROMPTS = {
  zh: [
    {
      theme: "《在裂縫中綻放的瞬間》",
      concepts: ["衝突中的生機", "逆境與突破的特定情境", "裂縫與綻放的對比"],
      visualElements: "線條：裂縫的銳利與花瓣的柔軟對比；色彩：冷灰裂縫與暖色花朵；質感：粗糙裂面與細膩花瓣",
      composition: "對比：裂縫分割與生命溢出；焦點：綻放交匯處；可運用強烈明暗突出「瞬間」",
      techniques: "水彩渲染（層次）、拼貼（裂縫與花瓣）、針筆線條（裂痕軌跡）",
      themeLink: "觀眾要讀到「衝突感」與「在不利處綻放」的張力；可透過光源突出裂縫與花朵的對比。",
      starTips: "光源設計：單一光源從裂縫或花心射入，強化戲劇感與「瞬間」的定格。",
      colourTone: "冷暖對比：裂縫冷灰（藍紫）、花朵暖色（橙紅）；高對比明度",
      difficultyLevel: "中高"
    },
    {
      theme: "《當冰川遇上熔岩：無聲的對峙》",
      concepts: ["冰川與熔岩的具象對比", "冷與熱、靜與動的無聲對峙", "自然力量的並置"],
      visualElements: "線條：冰川的銳利稜線與熔岩的流動曲線；色彩：冷藍白與暖橙紅的強烈對比；質感：冰的透明與岩漿的黏稠",
      composition: "對比：強烈明暗或色塊分割；動勢：兩股力量交匯處；焦點：對峙的邊界線",
      techniques: "拼貼（撕裂與重組）、油彩厚塗、炭筆與橡皮的對比；媒材選擇可強化冰與火的質感",
      themeLink: "畫面要有「冰川」與「熔岩」兩方可辨識，觀眾能感受無聲的張力；方便考生選擇具體視覺元素。",
      partALink: "參考 2015 年畢加索《鏡前的女人》：運用強烈原色對比或互補色表現心理與衝突感。",
      colourTone: "互補色或冷暖對比、高飽和度",
      difficultyLevel: "中高"
    },
    {
      theme: "《起點與終點重疊的圓》",
      concepts: ["四季、日夜、生死", "重複的日常與儀式", "起點與終點的重疊"],
      visualElements: "形狀：圓、螺旋、迴圈；線條：封閉或迴旋；色彩：可選同一色系不同明度形成循環感",
      composition: "節奏：重複單元；平衡：放射或環形構圖；引導線：視線回到起點",
      techniques: "版畫（重複印痕）、數碼圖層循環、水墨暈染的層次",
      themeLink: "觀眾要能讀到「周而復始」或「無始無終」，符號或構圖本身形成循環",
      colourTone: "同色系不同明度；冷暖漸變形成循環感；可選藍綠或棕褐系"
    },
    {
      theme: "《指尖下的千里之外》",
      concepts: ["觸感與距離的矛盾", "指尖所觸 vs 心理上的千里", "近在眼前與遠在天邊"],
      visualElements: "透視：指尖特寫與遠景的強烈比例對比；色彩：遠處冷/灰、近處暖/鮮；質感：指尖的清晰與遠方的模糊",
      composition: "構圖透視與比例：近大遠小強化「指尖」與「千里」的對比；留白表現距離感",
      techniques: "大氣透視、水彩漸層、攝影拼貼（不同焦距）；可強調觸覺與視覺的轉譯",
      themeLink: "畫面要傳達「觸感」與「距離」的矛盾，觀眾能感受指尖下的遠近與心理隔閡。",
      colourTone: "遠近對比：遠處冷灰/低飽和，近處暖/高飽和；觸碰點高對比",
      difficultyLevel: "中"
    },
    {
      theme: "《門縫間窺見的另一個世界》",
      concepts: ["視點限制：透過門縫的框架", "內與外的窺見與被窺見", "框架效果下的另一個世界"],
      visualElements: "線條：門縫的狹長邊界與框內空間的對比；形狀：框架構圖（frame within frame）；色彩：門內外可冷暖或明暗對比",
      composition: "構圖透視與視點：門縫作為強制框架，引導觀眾視線；分割與平衡在框內外",
      techniques: "膠帶留白、撕邊拼貼、數碼裁切與並置；突出「窺見」的視角限制",
      themeLink: "觀眾要能辨識「門縫」的框架與「另一個世界」的對比，以及視點如何限制與揭示。",
      colourTone: "界線兩側可採用冷暖對比或明暗對比",
      difficultyLevel: "中高"
    },
    {
      theme: "《祖父留下的工具箱》",
      concepts: ["上一代與下一代的交接", "技藝與記憶的延續", "消失與保留的選擇"],
      visualElements: "符號：手、工具、舊物；質感：陳舊與嶄新的對比；色彩：懷舊色調與新色並置",
      composition: "並置：兩代或前後對比；引導：從一方向另一方的視線流動",
      techniques: "拓印、舊照片拼貼、水墨與書法線條",
      themeLink: "觀眾要讀到「傳下去」或「接過來」的關係，而非單一人物或物件",
      partALink: "參考 2014 年甲部傳統與當代並置（蛋彩金箔與達利油畫）：可採用混合媒材或仿古質感，突出歷史與傳承的層次。",
      colourTone: "懷舊色調、鄰近色、低飽和暖色"
    },
    {
      theme: "《正在褪色的舊照片》",
      concepts: ["正在消失的風景或記憶", "褪色與遺忘", "存在與缺席的對比"],
      visualElements: "色彩：褪色、淡出、單色化；線條：斷續、擦除的痕跡；質感：剝落、模糊",
      composition: "留白：消失後的空缺；漸層：由實到虛的過渡",
      techniques: "橡皮擦減法、水彩洗淡、數碼透明度、舊紙拼貼",
      themeLink: "觀眾要感受到「曾經在、現在不在」或「正在失去」，而非單純空白",
      partALink: "參考 2018 年社會議題類評賞作品：可利用敘事性的畫面排列（如序列、並置）增加作品深度，避免單一靜態符號。",
      colourTone: "褪色、低飽和、單色或灰階"
    },
    {
      theme: "《每天同一班列車》",
      concepts: ["日常的重複與差異", "規律中的意外", "複製與變異"],
      visualElements: "形狀：重複單元；線條：規律的排列；色彩：同一色系或漸變的重複",
      composition: "節奏：規律排列；對比：一處打破規律形成焦點",
      techniques: "版畫、印章、數碼複製圖層、網格繪圖",
      themeLink: "觀眾要讀到「重複」的規律，以及你選擇突出的一點變化或例外",
      colourTone: "統一色系或鄰近色；對比色突出例外；低對比或單色系強化重複感"
    },
    {
      theme: "《繁華與寂靜之間》",
      concepts: ["光與暗、大與小、多與少", "繁華與寂靜", "過去與現在"],
      visualElements: "明暗：強烈對比；色彩：互補色或冷暖對比；質感：粗糙與細膩並置",
      composition: "分割：畫面二分或多區對比；焦點：對比交匯處",
      techniques: "木炭與白粉、剪影、拼貼不同質感",
      themeLink: "觀眾要清楚看到「兩極」的並置，並感受你強調的對比關係",
      partALink: "參考 2015 年畢加索《鏡前的女人》幾何與色彩對比：可運用強烈原色或互補色分割畫面，營造對比感。",
      colourTone: "冷暖對比、互補色、高對比明度"
    },
    {
      theme: "《時鐘停擺的那一秒》",
      concepts: ["瞬間與永恆", "快與慢的並存", "過去現在未來的疊加"],
      visualElements: "線條：流動感或凝固感；色彩：褪色與鮮明；質感：新舊並置",
      composition: "層次：疊加或並置不同時態的意象；引導：時間流動的方向",
      techniques: "多重曝光感、拼貼不同時期影像、水墨暈染的層次",
      themeLink: "觀眾要讀到「時間」的存在（流逝、停頓、重疊），而非單一瞬間",
      colourTone: "凝固與流動對比：冷色（凝固）vs 暖色（流動）；褪色與鮮明共存",
      difficultyLevel: "中高"
    },
    {
      theme: "《抽屜深處的一疊舊信》",
      concepts: ["模糊與清晰的交織", "選擇性記住與遺忘", "個人與集體記憶"],
      visualElements: "虛實：部分清晰部分模糊；色彩：泛黃、褪色、不飽和；質感：刮擦、疊印",
      composition: "層疊：多層意象重疊；焦點：最清晰的一塊",
      techniques: "拼貼舊照、刮畫、水彩疊色、數碼透明度",
      themeLink: "觀眾要感受「回憶」的質感——不完整、可變、帶情緒",
      colourTone: "泛黃、鄰近色、不飽和、局部高飽和"
    },
    {
      theme: "《鏡中的另一個我》",
      concepts: ["多重身份的並存", "自我與他人眼中的我", "尋找與迷失"],
      visualElements: "鏡像、碎片、面具；色彩：對比或融合；形狀：完整與破碎",
      composition: "並置或疊加：不同面向的「我」；焦點：核心符號",
      techniques: "自畫像變奏、拼貼、鏡像構圖、數碼圖層",
      themeLink: "觀眾要讀到「我是誰」或「身份」的提問，符號可多元但主題明確",
      partALink: "參考 2015 年馬格利特（Magritte）超現實風格：可將人體局部與符號（如鳥籠、物件）結合，表現身份的多重與轉換。",
      colourTone: "對比或融合、可選強烈原色"
    },
    {
      theme: "《被遺忘的角落》",
      concepts: ["中心與邊緣的關係", "被忽略的角落", "臨界與越界"],
      visualElements: "構圖：主體靠邊或留白偏一側；線條：指向邊緣或從邊緣溢出；色彩：邊緣與中心的差異",
      composition: "不平衡的構圖；負空間作為主角；邊界模糊或銳利",
      techniques: "裁切構圖、留白、邊緣暈染或銳化",
      themeLink: "觀眾要意識到「邊緣」被強調，以及邊緣與中心的關係",
      colourTone: "低飽和、啞色、灰褐或棕黃；對比色可加強「被遺忘」的寂寞感",
      difficultyLevel: "中"
    },
    {
      theme: "《斷線後重新接上的那一刻》",
      concepts: ["人與人、人與物、物與物", "斷裂後的重新連結", "可見與不可見的連線"],
      visualElements: "線條：連接、網絡、繩索；形狀：分散單元被線或面連起；色彩：統一或漸變拉近距離",
      composition: "引導線連結多個焦點；疏密：連結處的密度",
      techniques: "線條繪畫、網格、拼貼加繪畫連接",
      themeLink: "觀眾要讀到「關係」或「連結」，而非只是多個獨立物件",
      colourTone: "連接處暖色/主動（新生）；斷裂處冷色/被動（過去）；統一色系拉近心理距離"
    },
    {
      theme: "《喧囂中的一片靜默》",
      concepts: ["無聲的張力", "留白與未說", "喧囂中的靜止"],
      visualElements: "大量留白；低飽和或單色；線條簡約、少筆觸",
      composition: "留白為主；單一焦點或極少元素；平衡而安靜",
      techniques: "水墨留白、鉛筆輕描、單色渲染",
      themeLink: "觀眾要感受「靜」與「無聲」，畫面節制而有力",
      colourTone: "低飽和、鄰近色或單色、大量留白"
    },
    {
      theme: "《光與影分割的房間》",
      concepts: ["光作為主體", "陰影的形狀與意義", "曝光與隱藏"],
      visualElements: "明暗對比強烈；光的形狀（窗格、燈、自然光）；陰影的邊界",
      composition: "光影分割畫面；焦點在光或影的交接",
      techniques: "林布蘭光、剪影、色粉或炭筆的明暗",
      themeLink: "觀眾要讀到「光」或「影」的敘事，而非只是技術練習",
      partALink: "參考 2014 年拉圖爾（de La Tour）《聖母在祈禱》：利用單一光源營造強烈明暗對比（Chiaroscuro），創造劇場感與氣氛。",
      colourTone: "明暗對比強、暖色單一光源、暗部冷灰"
    },
    {
      theme: "《驟雨中的鬧市》",
      concepts: ["水、時間、人潮的流動", "固體與流體的轉換", "阻滯與暢通"],
      visualElements: "線條：曲線、波浪、傾斜；色彩：漸層、混色；質感：平滑流暢或凝滯",
      composition: "動勢：方向一致或交匯；節奏：流動的緩急",
      techniques: "水墨流動、水彩濕畫、數碼動感模糊",
      themeLink: "觀眾要感受「流動」的動態與方向，以及流動中的阻礙或變化",
      colourTone: "藍灰、綠灰色調；濕潤感；雨滴可局部高光點綴；整體低對比"
    },
    {
      theme: "《牆上被塗改的痕跡》",
      concepts: ["人為與自然的痕跡", "留下與抹去", "痕跡作為證據或記憶"],
      visualElements: "筆觸、刮擦、污漬、摺痕；質感豐富；新舊痕跡疊加",
      composition: "痕跡的分佈與密度；重點痕跡與背景",
      techniques: "拓印、拼貼舊物料、刻意保留筆觸與擦痕",
      themeLink: "觀眾要讀到「誰留下、留下甚麼」，痕跡有意義而非隨機",
      colourTone: "混合色調突出新舊層次；啞色與高飽和並置；可用互補色對比新舊"
    },
    {
      theme: "《空無一人的月台》",
      concepts: ["靜止中的期待", "延遲與懸念", "空無與即將填滿"],
      visualElements: "空曠、單一主體、靜止的構圖；色彩可壓抑或帶希望",
      composition: "留白；主體偏置或居中；時間感凝結",
      techniques: "單色或低飽和、簡約構圖、光影暗示時間",
      themeLink: "觀眾要感受「在等」的狀態，畫面有懸而未決的張力",
      partALink: "參考 2014 年拉圖爾單一光源與深夜氛圍：可運用強烈明暗對比營造孤獨、等待的劇場感。",
      colourTone: "冷色調、低飽和、局部暖光"
    },
    {
      theme: "《岔路口的指示牌》",
      concepts: ["岔路與取捨", "多個可能並存", "選了與未選的"],
      visualElements: "分岔、並置多個選項；符號：路、門、手勢；對比不同選擇的視覺重量",
      composition: "分割或分支構圖；焦點在選擇點或已選的一邊",
      techniques: "拼貼多個意象、蒙太奇、並置構圖",
      themeLink: "觀眾要讀到「選擇」的存在與重量，而非只是多個物件",
      colourTone: "分割對比：已選與未選的兩側可用冷暖或明暗對比；統一色系減少視覺衝突"
    },
    {
      theme: "《2040年的香港公共房屋》",
      concepts: ["垂直森林化的公屋，表現環境永續", "狹窄居住空間與極致科技設備的矛盾", "公共走廊中鄰里關係的數位化轉變"],
      visualElements: "線條：冷峻的幾何直線；色彩：冷調的科技藍對比溫暖的家居燈光；質感：金屬與透明質地的重疊",
      composition: "俯視視角表現城市的壓抑感；運用消失點引導觀眾視線進入幽深的走廊",
      techniques: "數碼繪畫（光效處理）、針筆與水彩（精確細節）、混合媒材拼貼",
      themeLink: "必須體現「未來感」與「香港特色」的結合，避免畫成一般的科幻城市",
      starTips: "注意光源設計，可使用強烈的螢光效果來強調2040年的氛圍",
      partALink: "參考 2018 年大衛·霍克尼（David Hockney）多視點／匯聚線構圖：城市空間可採用多視點或透視線匯聚，營造壓縮與縱深。",
      colourTone: "冷調科技藍、局部暖色家居光、螢光點綴",
      commonMistakes: ["犯錯：畫面上缺乏與甲部評賞作品（如徐道獲的絲網房屋或 Whiteread 的石膏負空間）的關聯。", "注意：應採用「仰視」或「俯視」透視法，以強化城市空間的壓迫感或規模感。", "注意：50 字的創作自白必須清楚說明作品如何回應甲部作品對「空間」或「家」的探討。"]
    },
    {
      theme: "《透明的壓力》",
      concepts: ["身體被困在不斷收縮的透明玻璃盒中，表現社交恐懼或心理壓抑", "看不見的重力將城市建築壓扁成平面，將物理屬性加諸於建築物", "空氣變成液態，人在水中呼吸感到無形的窒息感"],
      visualElements: "線條：扭曲與受壓的輪廓；色彩：冷調的淺藍與灰白，對比受壓處的瘀紫色；質感：光滑的透明表面對比粗糙的皮膚肌理",
      composition: "運用「壓迫感」構圖，物體佔據畫面邊緣，中心留白但充滿張力，參考俯視視角創造空間感",
      techniques: "水彩渲染（表現透明度）、細針筆勾勒裂痕、噴繪法表現流體質感",
      themeLink: "重點在於如何將「看不見」的壓力轉化為「看得到」的視覺符號，觀眾應能讀出物體形狀的改變",
      starTips: "注意光源設計，利用強烈的折射光與陰影表現玻璃或液體的物質感，強化畫面氣氛",
      partALink: "參考 2016 年金昌烈（Kim Tschang-yeul）水珠系列：極端寫實的質感表達可加強「透明」「壓力」的感官轉譯，突出媒材與技法。",
      colourTone: "冷調淺藍與灰白、受壓處瘀紫對比"
    },
    {
      theme: "《被螢幕隔絕的聚餐》",
      concepts: ["飯桌上每個人都被手中的冷色光屏包裹，象徵現代人的疏離", "螢幕的光將人物臉部異化，現實世界與數位世界的邊界模糊", "背景是灰暗的現實，螢幕內是色彩斑斕的虛擬世界"],
      visualElements: "色彩：螢幕發出的冷色螢光與環境的暖色調形成強烈對比；形狀：方正的電子屏對比圓形的飯碗",
      composition: "採用俯視視角 (Bird's Eye View)，強調飯桌的圓與螢幕方的對峙",
      techniques: "數碼繪畫（光效處理）、拼貼螢光紙、混合媒材表現人物異化感",
      themeLink: "必須表現出「隔絕」的感覺，參考 2024 題目「鏡頭內外」的邏輯，利用畫面邊界劃分空間",
      starTips: "光源應以螢幕光為主，處理強烈的明暗對比以營造孤寂且科技感的聚餐氣氛",
      partALink: "畫面對比：必須明確表現「現實 vs 數位」「內與外」的對比，可參考 2024「鏡頭內外」的視點劃分。",
      colourTone: "螢幕冷光與環境暖色對比、高飽和與灰形成對比"
    },
    {
      theme: "《當山澗流出時間》",
      concepts: ["瀑布流下的不是水，而是無數的小時鐘或齒輪，將動態與時間結合", "山石由腐朽的書籍堆疊而成，象徵歷史或知識的累積", "遠方的太陽是一個巨大的沙漏，主宰著自然界的循環"],
      visualElements: "線條：流動的瀑布曲線與靜止的齒輪直線對比；色彩：大地色系（如土黃、赭石）與金屬色的碰撞",
      composition: "運用透視線匯聚於消失點（沙漏太陽），引導觀眾視線進入深遠的山澗，參考「近大遠小」原理",
      techniques: "國畫白描結合油畫棒（表現傳統與現代對比）、混合媒材表現岩石質感",
      themeLink: "將「自然景觀」與「時間符號」有機結合，觀眾應能感受到時間在自然中流逝的意境",
      starTips: "光源設計可參考「耶穌光」效果，從山頂射入的光束能增加畫面的神秘感與層次感",
      colourTone: "大地色系（土黃、赭石、棕色）與金屬色（銀灰、銅）碰撞；對比色加強張力"
    },
    {
      theme: "《假如我是一個融化的冰雕》",
      concepts: ["在繁華鬧市中逐漸融化，水滴映照出城市的倒影，表現角色代入感", "為了保持形狀而拼命抓取冰塊，展現求存的焦慮感", "融化的水匯聚成海洋，淹沒腳下的街道，將個體消亡轉化為環境改變"],
      visualElements: "質感：晶瑩剔透與液態流動的轉化；形狀：由尖銳的棱角變為圓滑的流體",
      composition: "採用平視視角 (Eye Level)，拉近觀眾與「我」的距離，增加情感共鳴",
      techniques: "透明膠片拼貼、蠟筆排水法（表現水與冰的關係）、水彩漸變",
      themeLink: "需體現「第一人稱」的感受，參考歷年「假如我是一對筷子」的擬人化邏輯",
      starTips: "著重色彩構成，使用鄰近色（藍、綠、紫）並配合局部高亮點，營造寒冷且透明的質感",
      partALink: "參考 2015 年馬格利特與 2023「假如我是一對筷子」：將人體或自我轉化為主題物件的一部分，可結合超現實的符號並置。",
      colourTone: "鄰近色（藍、綠、紫）、局部高亮、透明與流體質感"
    },
    {
      theme: "《2080年的霓虹森林》",
      concepts: ["香港經典霓虹招牌演化為發光的有機植物，結合城市文化與幻想", "廢棄的無人機成為鳥類築巢的場所，表現科技與自然的共生", "懸浮的人造島嶼與海底城市相連，拓展空間表現層次"],
      visualElements: "色彩：極高飽和度的洋紅、翠綠與靛藍；線條：繁複的電路板紋理與有機植物線條交織",
      composition: "仰視構圖 (Worm's Eye View)，展現未來城市建築的宏偉與壓抑感",
      techniques: "數碼疊層、噴漆藝術、混合媒材（如鋁箔紙）表現金屬質感",
      themeLink: "必須保留「香港元素」（如特有字體、招牌形狀）以扣連地方特色，避免流於一般的科幻想像",
      starTips: "處理環境光源對物體色彩的影響，招牌的光暈應映射在人物或建築表面，展現複雜的光影效果",
      colourTone: "極高飽和度：洋紅、翠綠、靛藍；霓虹光暈與深暗背景對比；金屬質感反光"
    },
    {
      theme: "《鏡頭內外的運動會》",
      concepts: ["鏡頭內：運動員與觀眾的互動、比賽瞬間", "鏡頭外：攝影師、器材、旁觀者的視角", "內與外的界線作為構圖分割"],
      visualElements: "形狀：方框（鏡頭／螢幕）與開放空間的對比；色彩：鏡頭內飽和、鏡頭外可灰或冷",
      composition: "明確劃分「內」「外」區域；可採用框架構圖（frame within frame）",
      techniques: "拼貼、數碼裁切並置、混合媒材區分內外",
      themeLink: "觀眾必須一眼辨識何謂「鏡頭內」的畫面；內與外的對比要明確。",
      colourTone: "內外分割對比：鏡頭內高飽和/鮮豔，鏡頭外灰/冷/低飽和",
      commonMistakes: ["犯錯：畫面中「內」與「外」的分界線模糊，未能明確表現視覺對比。", "犯錯：忽略甲部評賞作品（如村上隆或陳洪綬）的符號化或空間布局特點，導致乙部與甲部聯繫薄弱。", "注意：必須捕捉鏡頭與運動員的互動，並確保觀眾能一眼辨識出何謂「鏡頭內」的畫面。"]
    },
    {
      theme: "《假如我是一對筷子》",
      concepts: ["第一人稱代入：以筷子的視角看世界", "筷子的質感轉化（木、金屬、超現實材質）", "人與物、使用與被使用的關係"],
      visualElements: "質感：可參考 Oppenheim 毛皮茶杯的轉化；線條：筷子的延伸與空間的「近大遠小」",
      composition: "構圖透視「近大遠小」：筷子作為主體在空間中的延伸感；可俯視或特寫",
      techniques: "混合媒材、超現實質感轉換、細膩寫實與象徵並置",
      themeLink: "必須體現「假如我」的第一人稱與角色代入，而非只畫一對靜止的筷子。",
      colourTone: "視乎質感轉換：木色溫暖（棕、米色），金屬冷調（銀、灰），超現實可用互補色對比",
      commonMistakes: ["犯錯：僅將筷子視為靜止物件繪畫，忽略了題目要求的「假如我」第一人稱角色代入感。", "注意：應參考甲部評賞中關於物件質感轉化的技巧（如 Oppenheim 的毛皮茶杯），賦予筷子超現實的特質。", "注意：運用「近大遠小」原理，強調筷子作為主體在空間中的延伸感。"]
    },
    {
      theme: "《森林的呼喚》",
      concepts: ["森林的層次與深度", "自然中的神秘感與生機", "「呼喚」的聽覺轉化為視覺"],
      visualElements: "線條：樹幹的重疊與遠近；色彩：綠的層次、光斑；質感：樹皮、葉、霧氣",
      composition: "重疊與大氣透視創造深度；避免樹木排列過於單一",
      techniques: "水彩層次、水墨暈染、細膩的自然質感（可參考吳冠中、龔賢）",
      themeLink: "觀眾要讀到「森林」的深度與「呼喚」的氣氛，而非平面裝飾。",
      starTips: "光源設計：「耶穌光」或自然光源，營造森林中神秘且充滿生機的氣氛。",
      commonMistakes: ["犯錯：樹木排列過於單一，未能運用重疊或遠近效果創造「森林」的深度。", "注意：應運用「耶穌光」或自然光源，營造出森林中神秘且充滿生機的氣氛。", "注意：技法上可參考吳冠中或龔賢對自然質感的細膩處理，加強視覺元素的運用。"]
    },
    {
      theme: "《深夜裏被音樂聲喚醒》",
      concepts: ["深夜的明暗對比", "「音樂聲」的聽覺轉化為視覺（線條、流動、節奏）", "被喚醒的瞬間—從睡到醒的狀態"],
      visualElements: "強烈明暗：單一主光源（室內燈或月光）；線條或色彩可代表聲音（扭曲、流動、重複）",
      composition: "單一光源引導視線焦點；畫面中須具體化「聲音」",
      techniques: "炭筆或色粉的明暗、拼貼或流動筆觸表現音樂",
      themeLink: "必須在畫面中具體化「聲音」這一抽象感官，例如運用扭曲的線條或流動的色彩來代表音樂。",
      partALink: "參考 2014 年拉圖爾單一光源：利用室內光或月光營造深夜劇場感。",
      colourTone: "深色主調、單一暖或冷光源、局部高對比",
      commonMistakes: ["犯錯：畫面光源過於平均，未能展現「深夜」的強烈明暗對比，導致氛圍不足。", "注意：應設定單一主光源（如室內燈光或月光），以室內光引導觀眾視線焦點。", "注意：必須在畫面中具體化「聲音」這一抽象感官，例如運用扭曲的線條或流動的色彩來代表音樂。"]
    },
    {
      theme: "《被人工智能取代後的畫室》",
      concepts: ["科技與藝術的衝突", "空虛感與工具的遺棄", "人的痕跡 vs 機器的精準"],
      visualElements: "線條：人手筆觸與數位精準的對比；質感：畫具、顏料、空椅與螢幕或機械臂；色彩：褪色的人為痕跡與冷色科技光",
      composition: "並置：畫室殘留物與 AI/機械的入侵；留白或凌亂表現「取代」後的空虛",
      techniques: "混合媒材（實物拼貼與數碼）、留白與減法、對比性筆觸與平整面",
      themeLink: "引導思考「人的痕跡」與「機器的精準」如何對比；觀眾要讀到取代後的張力或荒涼。",
      partALink: "參考 2022 年數位藝術與傳統繪畫相關評賞：可對比傳統媒材與數位/機械的視覺語言。",
      difficultyLevel: "高"
    },
    {
      theme: "《深海中的霓虹森林》",
      concepts: ["超現實並置：深海與霓虹", "光影對比與生態隱喻", "壓抑與跳脫的並存"],
      visualElements: "色彩：互補色表現深海的壓抑與霓虹的跳脫；線條：水波、生物與霓虹光管的交織；質感：水的透明與光管的發光",
      composition: "層次：深海的縱深與霓虹森林的前景/中景；焦點：光在深暗中的擴散",
      techniques: "水彩或壓克力的透明疊層、螢光色、混合媒材表現發光體",
      themeLink: "運用互補色強化「深海」與「霓虹」的對比；觀眾要感受超現實並置的張力。",
      starTips: "光源設計：自發光物體的光源擴散效果，霓虹在深海中形成光暈與反射，營造神秘與生機。",
      colourTone: "深藍綠與霓虹橙紅互補、局部高飽和發光",
      difficultyLevel: "中高"
    },
    {
      theme: "《茶樓裏的一盅兩件》",
      concepts: ["香港傳統飲食文化", "儀式感與日常", "新旧代際的連結"],
      visualElements: "線條：點心籠的編織紋理；色彩：暖色調（蒸籠黃、普洱茶色）；質感：蒸氣的朦朧與瓷器光滑",
      composition: "俯視或45度視角；点心笼置中；留白表現蒸氣",
      techniques: "水彩渲染（表現蒸氣）、拼貼（舊報紙/茶單）、國畫白描線條",
      themeLink: "觀眾要感受香港「茶樓文化」的儀式感，以及日常中的温情",
      colourTone: "暖棕、橙黃、淺褐；對比綠茶或普洱的深色點綴",
      difficultyLevel: "中"
    },
    {
      theme: "《香港街市的聲音》",
      concepts: ["聽覺的視覺化", "嘈雜中的節奏", "市井生命力"],
      visualElements: "線條：擁擠的攤檔、懸掛的食材；色彩：鮮魚的藍紅、蔬果的綠橙；質感：潮濕地面、膠袋閃光",
      composition: "魚眼透視或低視角；聲音的視覺化線條從畫面延伸",
      techniques: "拼貼混合素材、噴漆、炭筆線條",
      themeLink: "觀眾要感受到街市的生命力，而非只是風景描繪",
      colourTone: "鮮豔對比：藍、紅、橙、綠；高飽和市井色調",
      difficultyLevel: "中"
    },
    {
      theme: "《被困在點贊裏的手》",
      concepts: ["社交媒體的符號化", "被點贊定義的自我", "真實觸感vs屏幕接觸"],
      visualElements: "線條：手指滑動手機的軌跡；色彩：屏幕藍光與皮膚暖色；質感：玻璃屏幕vs肌理",
      composition: "特寫手指與屏幕的接觸點；其餘模糊",
      techniques: "數碼繪畫（光效）、拼貼、指紋拓印",
      themeLink: "觀眾要思考「被看見」與「真實自我」的距離",
      colourTone: "冷色屏幕光 vs 暖色皮膚；藍白背景高對比",
      difficultyLevel: "中"
    },
    {
      theme: "《祖父的日光時間》",
      concepts: ["長者的孤獨", "陽光作伴", "日常的重複"],
      visualElements: "光線：窗框投射的日光；色彩：長者衣服的素色；質感：皺紋、布料紋理",
      composition: "日光光柱為視覺焦點；長者身影為主體；留白表現寂靜",
      techniques: "明暗對比（林布蘭光）、炭筆素描、水彩渲染光線",
      themeLink: "觀眾要感受到「等待」與「日光」的寂寥溫暖",
      partALink: "參考 2014 年拉圖爾（de La Tour）《聖母在祈禱》：單一光源營造劇場感與寂靜氛圍。",
      colourTone: "暖黃日光、冷灰室內；對比光影區域",
      difficultyLevel: "中"
    },
    {
      theme: "《香港的颱風假》",
      concepts: ["停頓與等待", "自然力量的威壓", "平常心的對應"],
      visualElements: "線條：被風吹扭曲的樹、招牌；色彩：灰藍風暴色調；質感：雨水的動感綫條",
      composition: "從室內望出窗外的視角；風雨為主、長者/學童為副",
      techniques: "水墨暈染（風雨動感）、噴水技法、數碼合成",
      themeLink: "觀眾要感受到「風雨中的平常心」或「對自然力量的敬畏」",
      colourTone: "灰藍、銀白、局部暖黃（室內燈光）"
    },
    {
      theme: "《翻譯時遺失的那一行》",
      concepts: ["語言的邊界", "無法傳達的情感", "溝通的缺口"],
      visualElements: "線條：文字/字符的斷裂；色彩：原文與譯文的色差；質感：紙張、刪改痕跡",
      composition: "雙語文字的對照與斷裂；留白或模糊表現「遺失」",
      techniques: "混合媒材（書法與印刷字）、拓印、拼貼",
      themeLink: "觀眾要感受到「說不清」的無力感",
      colourTone: "原文暖色（紅褐）vs 譯文冷色（藍灰）；對比鮮明"
    },
    {
      theme: "《邻居的晾衣架》",
      concepts: ["香港居住的親密", "晾曬的衣物作為符號", "看不見的鄰里關係"],
      visualElements: "線條：交錯的晾衣繩；色彩：鮮豔的衣物（紅、黃、藍）；質感：布料飄動",
      composition: "仰視穿過晾衣架的天空；衣物作為綫條節奏",
      techniques: "炭筆線條、水彩、拼貼不同布料",
      themeLink: "觀眾要感受到「香港居住的親密」與「隐私的模糊界線」",
      colourTone: "鮮豔衣物 vs 灰白天空；對比色調"
    },
    {
      theme: "《功課太多的夜晚》",
      concepts: ["壓力與疲憊", "學習的意義", "兒童視角"],
      visualElements: "線條：散落的課本、試卷；色彩：pens 的藍黑、灯光的暖黃；質感：紙張皺紋",
      composition: "俯視書桌；一個小時鐘表現時間的壓迫",
      techniques: "水彩暈染、拼貼、試卷紙碎片",
      themeLink: "觀眾要感受到「做不完」的壓迫感，以及當事人的情緒",
      colourTone: "冷色（焦慮）vs 暖黃（家的安慰）"
    },
    {
      theme: "《香港的山徑》",
      concepts: ["城市與自然的邊界", "行山的儀式", "眺望的回程"],
      visualElements: "線條：山徑的彎曲、樹蔭；色彩：翠綠、泥土褐、石屎灰；質感：樹皮、岩石、泥土",
      composition: "引導線沿山徑引向遠處香港天際線；視角可仰視或俯視",
      techniques: "水彩寫生、國畫構圖、泥塑質感",
      themeLink: "觀眾要感受到「逃離城市」與「回望香港」的對比",
      partALink: "參考 2019 年山水作品：可運用國畫散點透視，表現香港山徑的獨特景觀。",
      colourTone: "翠綠、泥土褐、灰藍天；自然大地色系"
    },
    {
      theme: "《垃圾站旁的波斯菊》",
      concepts: ["頑強的生命力", "骯髒與美麗的並存", "被忽視的美"],
      visualElements: "線條：波斯菊的纖細莖葉；色彩：粉紅、紫、白色花瓣；質感：塑膠垃圾 vs 柔軟花瓣",
      composition: "特寫：花朵從垃圾縫隙中生長；背景骯髒、前景美麗",
      techniques: "水彩（花瓣柔軟）、拼貼（垃圾素材）、微距視角",
      themeLink: "觀眾要感受到「在逆境中綻放」的美，而非環保說教",
      colourTone: "嬌嫩粉彩色（花瓣）vs 灰褐骯髒（背景）；高對比"
    },
    {
      theme: "《月餅盒裏的記憶》",
      concepts: ["節日的情感負載", "記憶的容器", "儀式與商業化"],
      visualElements: "線條：月餅盒的裝飾花紋；色彩：金色、紅色傳統色；質感：鐵盒、絲綢內襯",
      composition: "打開的月餅盒視角；裏面是舊照片/小玩具而非月餅",
      techniques: "拼貼舊物、水彩渲染、國畫符號",
      themeLink: "觀眾要感受到「節日的情感」比月餅本身更值得保存",
      partALink: "參考 2017 年評賞作品：運用傳統器物的精細質感，表达對過去的情感連結。",
      colourTone: "金、紅、紫色傳統節慶色；啞光金屬质感"
    },
    {
      theme: "《維港的泳客》",
      concepts: ["歷史記憶vs現代休閒", "海的符號", "人与海的關係"],
      visualElements: "線條：海浪的曲線、泳客身影；色彩：海水藍、夕陽橙；質感：海水、火炬燈",
      composition: "維港夜色；泳客身影為剪影；遠處城市燈光",
      techniques: "油畫厚塗（海浪）、剪影、水面上的光線",
      themeLink: "觀眾要感受到香港獨特的「海的情意結」",
      colourTone: "深藍夜色、暖橙夕陽、泳客灰黑剪影"
    },
    {
      theme: "《看不見的背包》",
      concepts: ["看不見的負擔", "看不見的傷痛", "隐藏的情感"],
      visualElements: "線條：背部的曲線；色彩：衣物顏色；質感：布料皺紋",
      composition: "背後視角；背包的佔據感；主體向前望不看觀眾",
      techniques: "炭筆素描、拼貼（看不見的「背包」用半透明物料）",
      themeLink: "觀眾要感受「看不見的重量」的心理狀態",
      colourTone: "低沉灰色、單一色系；情緒压抑色調"
    },
    {
      theme: "《刷牙的十分鐘》",
      concepts: ["日常的重複儀式", "獨處的片刻", "時間的空白"],
      visualElements: "線條：衛浴設備的幾何；色彩：瓷白、藍/綠瓷磚；質感：瓷器的光滑、水滴",
      composition: "浴室特寫； 時間被拉長的感覺；蒸汽/霧氣朦朧",
      techniques: "水彩渲染（蒸汽/霧氣）、拼貼、極簡構圖",
      themeLink: "觀眾要感受到「日常儀式」中的空白與自我對話",
      colourTone: "瓷白、冷灰藍瓷磚、暖黃浴室燈；簡潔色調"
    }
  ],
  en: [
    { theme: "The Moment It Blooms in the Crack", concepts: ["Life in conflict", "Adversity and breakthrough in a specific situation", "Contrast of crack and bloom"], visualElements: "Lines: sharp crack vs soft petals; colour: cool grey crack vs warm flowers; texture: rough fracture vs delicate bloom", composition: "Contrast: crack dividing vs life overflowing; focus at point of bloom; strong value for 'moment'", techniques: "Watercolour wash, collage (crack and petals), fineliner (crack traces)", themeLink: "Viewer reads tension of 'conflict' and 'blooming in adversity'; light can highlight crack vs flower.", starTips: "Light: single source from crack or flower centre to strengthen drama and frozen 'moment'.", difficultyLevel: "medium-high" },
    { theme: "When Glacier Meets Lava: A Silent Standoff", concepts: ["Concrete contrast of glacier and lava", "Cold and hot, still and flowing in silence", "Natural forces juxtaposed"], visualElements: "Lines: sharp ice edges vs flowing lava curves; colour: cold blue-white vs warm orange-red; texture: transparent ice vs viscous magma", composition: "Strong value or colour division; tension at meeting point; focus at boundary", techniques: "Collage (tear and reassemble), impasto, charcoal vs eraser; media can reinforce ice/fire texture", themeLink: "Glacier and lava must be identifiable; viewer feels silent tension; clear visual elements for candidates.", partALink: "Reference 2015 Picasso Woman before a Mirror: use strong primary or complementary colour for conflict.", colourTone: "Complementary or warm/cool contrast; high saturation", difficultyLevel: "medium-high" },
    { theme: "The Circle Where Start and End Overlap", concepts: ["Seasons, day/night, life/death", "Repetition and ritual", "Start and end meeting"], visualElements: "Circles, spirals; closed or recurring lines; colour in a loop", composition: "Rhythm, radial or circular layout; eye returns to start", techniques: "Printmaking, digital layers, ink wash layers", themeLink: "Viewer reads 'cycle' or 'no beginning or end'" },
    { theme: "A Thousand Miles Beneath the Fingertip", concepts: ["Contradiction of touch and distance", "What the finger touches vs psychological distance", "Near at hand and far away"], visualElements: "Perspective: strong scale contrast between fingertip close-up and distant view; colour: distant cool/grey, near warm/saturated; texture: sharp finger vs blurred far", composition: "Composition and scale: near big, far small to stress fingertip vs 'thousand miles'; negative space for distance", techniques: "Atmospheric perspective, watercolour gradation, photo collage (different focus); emphasise touch-to-vision", themeLink: "Viewer feels contradiction of touch and distance, and psychological gap.", difficultyLevel: "medium" },
    { theme: "The Other World Seen Through the Door Crack", concepts: ["Viewpoint limit: framing through the crack", "Peeking and being seen; inside and outside", "Another world within the frame"], visualElements: "Lines: narrow door-crack boundary vs framed space; shape: frame within frame; colour: warm/cool or value contrast across crack", composition: "Composition and viewpoint: door crack as forced frame guiding the eye; division and balance in/out of frame", techniques: "Tape resist, torn-edge collage, digital crop and juxtapose; emphasise 'peeking' perspective", themeLink: "Viewer identifies the door-crack frame and 'other world' contrast, and how viewpoint limits and reveals.", colourTone: "Warm/cool or value contrast across the line", difficultyLevel: "medium-high" },
    { theme: "The Toolbox Grandfather Left Behind", concepts: ["Handing down between generations", "Skill and memory continuing", "What is kept or lost"], visualElements: "Hands, tools, old objects; old vs new texture; nostalgic vs fresh colour", composition: "Juxtaposition; flow from one to the other", techniques: "Rubbing, old photo collage, ink and calligraphy", themeLink: "Viewer reads 'passing on' or 'receiving'", partALink: "Reference 2014 Part A traditional vs contemporary (egg tempera/gold vs Dali oil): use mixed media or antique texture for inheritance.", colourTone: "Nostalgic, analogous, low-saturation warm" },
    { theme: "The Old Photo That Is Fading", concepts: ["What is vanishing", "Fading and forgetting", "Presence and absence"], visualElements: "Faded colour, broken lines, erasure; peeling, blur", composition: "Negative space; transition from solid to void", techniques: "Eraser, washed watercolour, transparency, old paper", themeLink: "Viewer feels 'was here, now not' or 'losing'", partALink: "Reference 2018 narrative/historical works: use narrative arrangement (sequence, juxtaposition) for depth.", colourTone: "Faded, low saturation, monochrome or grey" },
    { theme: "The Same Train Every Day", concepts: ["Daily repeat and variation", "Pattern and exception", "Copy and mutation"], visualElements: "Repeated units; regular lines; same hue or gradient repeat", composition: "Rhythm; one break in pattern as focus", techniques: "Print, stamp, digital duplicate layers", themeLink: "Viewer reads repetition and the one change" },
    { theme: "Between Bustle and Silence", concepts: ["Light and dark, big and small", "Bustle and silence", "Past and present"], visualElements: "Strong value contrast; complementary or warm/cool; rough vs smooth", composition: "Split or zoned contrast; focus at meeting point", techniques: "Charcoal and white, silhouette, collage", themeLink: "Viewer sees two poles and the relation", partALink: "Reference 2015 Picasso geometric and colour contrast: use strong primary or complementary colour to divide the picture.", colourTone: "Warm/cool contrast, complementary, high value contrast" },
    { theme: "The Second the Clock Stopped", concepts: ["Moment and eternity", "Fast and slow", "Past present future layered"], visualElements: "Flowing or frozen lines; faded vs vivid colour; old and new texture", composition: "Layers of different times; direction of flow", techniques: "Multiple exposure feel, collage of eras, ink layers", themeLink: "Viewer reads time—passing, pausing, overlapping" },
    { theme: "A Pile of Old Letters at the Back of the Drawer", concepts: ["Blur and clarity", "Selective remembering", "Personal and collective"], visualElements: "Sharp and soft; yellowed, faded; scrape, overprint", composition: "Layers; one clear focal area", techniques: "Old photo collage, scratch, watercolour layers", themeLink: "Viewer feels the texture of memory—incomplete, shifting", colourTone: "Yellowed, analogous, desaturated with local saturation" },
    { theme: "The Other Me in the Mirror", concepts: ["Multiple selves", "Self vs others' view", "Searching and losing"], visualElements: "Mirror, fragments, masks; contrast or merge; whole and broken", composition: "Juxtapose or overlay 'selves'; core symbol", techniques: "Self-portrait variation, collage, mirror", themeLink: "Viewer reads 'who am I' or 'identity'", partALink: "Reference 2015 Magritte surrealism: combine body parts with symbols (e.g. birdcage) for identity and transformation.", colourTone: "Contrast or merge; optional strong primaries" },
    { theme: "The Forgotten Corner", concepts: ["Centre and margin", "Neglected corners", "Limit and crossing"], visualElements: "Subject at edge; lines to or from edge; centre vs edge colour", composition: "Unbalanced; negative space; soft or hard edge", techniques: "Cropping, leave white, edge blur or sharpen", themeLink: "Viewer notices the edge and its relation to centre" },
    { theme: "The Moment the Line Was Reconnected", concepts: ["Between people, people and things", "Reconnecting after break", "Visible and invisible links"], visualElements: "Lines linking, networks; scattered units joined; colour unifying", composition: "Guiding lines; density at links", techniques: "Line drawing, grid, collage with drawn links", themeLink: "Viewer reads 'relation' or 'connection'" },
    { theme: "A Patch of Silence in the Noise", concepts: ["Tension without sound", "What is unsaid", "Stillness in noise"], visualElements: "Lots of white; low saturation or monochrome; minimal line", composition: "White dominant; one or few elements; calm balance", techniques: "Ink leave-white, light pencil, single hue", themeLink: "Viewer feels quiet and restraint", colourTone: "Low saturation, analogous or monochrome, ample white" },
    { theme: "The Room Divided by Light and Shadow", concepts: ["Light as subject", "Shape of shadow", "Reveal and hide"], visualElements: "Strong value; shape of light; edge of shadow", composition: "Light and shadow divide; focus at meeting", techniques: "Rembrandt light, silhouette, charcoal/chiaroscuro", themeLink: "Viewer reads a story of light or shadow", partALink: "Reference 2014 La Tour Virgin in Prayer: single light source, strong chiaroscuro for theatrical mood.", colourTone: "Strong value contrast; warm single source; cool grey in shadow" },
    { theme: "The Busy Street in a Sudden Downpour", concepts: ["Water, time, crowd", "Solid to fluid", "Block and release"], visualElements: "Curves, waves; gradation, blend; smooth or sticky", composition: "Direction of flow; rhythm", techniques: "Ink flow, wet watercolour, motion blur", themeLink: "Viewer feels movement and direction" },
    { theme: "The Marks Someone Erased on the Wall", concepts: ["Human and natural traces", "Leave and erase", "Trace as evidence"], visualElements: "Stroke, scrape, stain, fold; rich texture; layers of trace", composition: "Distribution of traces; key vs background", techniques: "Rubbing, old material collage, visible strokes", themeLink: "Viewer reads who left what" },
    { theme: "The Empty Platform", concepts: ["Stillness and expectation", "Delay and suspense", "Empty and about to fill"], visualElements: "Empty, single subject, still; subdued or hopeful colour", composition: "White space; subject off-centre or central", techniques: "Monochrome, simple composition, light for time", themeLink: "Viewer feels 'waiting' and unresolved tension", partALink: "Reference 2014 La Tour single light and night mood: use strong value contrast for loneliness and waiting.", colourTone: "Cool, low saturation, local warm light" },
    { theme: "The Signpost at the Fork in the Road", concepts: ["Fork in the road", "Alternatives present", "Chosen and unchosen"], visualElements: "Branching, juxtaposed options; road, door, gesture; weight of choices", composition: "Split or branch; focus at point of choice", techniques: "Collage of options, montage", themeLink: "Viewer reads the presence and weight of choice" },
    { theme: "Hong Kong Public Housing 2040", concepts: ["Vertical forest housing; sustainability", "Cramped space vs high-tech gear", "Digitalised neighbourhood in corridors"], visualElements: "Cold geometric lines; tech blue vs warm interior light; metal and transparent texture", composition: "Bird's eye for urban pressure; vanishing point into deep corridor", techniques: "Digital (light), fineliner + watercolour, mixed-media collage", themeLink: "Must show 'future' + 'Hong Kong identity', not generic sci-fi", starTips: "Use strong fluorescent light to emphasise 2040 atmosphere", partALink: "Reference 2018 David Hockney multi-viewpoint/converging lines: use multi-view or perspective for urban space and depth.", colourTone: "Cool tech blue, local warm interior, fluorescent accent", commonMistakes: ["Mistake: No link to Part A works (e.g. Do Ho Suh net house, Whiteread negative space).", "Note: Use 'worm's eye' or 'bird's eye' perspective to strengthen urban pressure or scale.", "Note: 50-word statement must explain how the work responds to Part A on 'space' or 'home'."] },
    { theme: "Transparent Pressure", concepts: ["Body trapped in shrinking glass box; social anxiety", "Invisible gravity flattening buildings", "Air as liquid; suffocation"], visualElements: "Twisted, compressed contours; cool blue/grey vs bruised purple; smooth transparent vs rough skin", composition: "Claustrophobic layout; objects at edges, tense centre", techniques: "Watercolour (transparency), fineliner (cracks), spray", themeLink: "Make 'invisible' pressure visible; viewer reads shape change", starTips: "Refraction and shadow for glass/liquid; strengthen mood", partALink: "Reference 2016 Kim Tschang-yeul water droplets: extreme realist texture to strengthen sensory translation of 'pressure'.", colourTone: "Cool blue/grey; bruised purple at pressure points" },
    { theme: "Dinner Isolated by Screens", concepts: ["Table lit by cold screens; modern alienation", "Screen light distorting faces; real vs digital", "Grey reality vs vivid virtual world"], visualElements: "Cold screen glow vs warm room; square screens vs round bowls", composition: "Bird's eye; circle of table vs square screens", techniques: "Digital light, fluorescent paper collage, mixed media", themeLink: "Show 'isolation'; reference 'inside/outside lens' logic", starTips: "Screen as main light; strong contrast for lonely tech mood", partALink: "Contrast method: clearly show 'reality vs digital' or 'inside vs outside' as in 2024 'inside/outside lens'.", colourTone: "Screen cold glow vs room warm; high sat vs grey" },
    { theme: "When the Mountain Stream Flows Time", concepts: ["Waterfall of clocks/gears; motion and time", "Rocks as stacked decaying books; history", "Sun as giant hourglass"], visualElements: "Flowing curves vs static gear lines; earth tones vs metal", composition: "Vanishing point at hourglass sun; deep stream; scale perspective", techniques: "Ink line + oil pastel, mixed media for rock", themeLink: "Landscape + time symbols; viewer feels time passing", starTips: "God rays from summit for mystery and depth" },
    { theme: "If I Were a Melting Ice Sculpture", concepts: ["Melting in the city; reflection in droplets", "Clutching ice to survive; anxiety", "Melt becoming ocean; individual to environment"], visualElements: "Crystalline to fluid; sharp edges to smooth flow", composition: "Eye level; close to 'me' for empathy", techniques: "Transparent collage, wax resist, watercolour gradient", themeLink: "First-person feel; reference 'if I were chopsticks' logic", starTips: "Analogous colours (blue, green, purple) + highlights for cold transparency", partALink: "Reference 2015 Magritte and 2023 'if I were chopsticks': transform body/self into the object; surreal symbol juxtaposition.", colourTone: "Analogous blue, green, purple; local highlight; transparent/fluid" },
    { theme: "Neon Forest 2080", concepts: ["HK neon signs as glowing organic plants", "Abandoned drones as nests; tech and nature", "Floating islands and underwater city"], visualElements: "High saturation magenta, green, indigo; circuit and organic lines", composition: "Worm's eye view; monumental future architecture", techniques: "Digital layers, spray, foil etc. for metal", themeLink: "Keep HK elements (type, sign shapes); avoid generic sci-fi", starTips: "Environmental light on surfaces; neon halo on figures and buildings" },
    { theme: "Inside and Outside the Lens: The Sports Day", concepts: ["Inside lens: athletes and crowd", "Outside: photographer, gear, bystander view", "Clear boundary between inside/outside"], visualElements: "Frame (lens/screen) vs open space; colour: saturated inside, grey/cool outside", composition: "Clearly divide 'inside' and 'outside'; frame within frame", techniques: "Collage, digital crop and juxtapose", themeLink: "Viewer must instantly recognise what is 'inside the lens'.", commonMistakes: ["Mistake: Boundary between 'inside' and 'outside' is blurred.", "Mistake: Ignoring Part A (e.g. Murakami, Chen) symbol or layout weakens Part B link.", "Note: Capture lens–athlete interaction; viewer must identify 'inside' at a glance."] },
    { theme: "If I Were a Pair of Chopsticks", concepts: ["First person as chopsticks", "Texture transformation (wood, metal, surreal)", "User and used relationship"], visualElements: "Texture: reference Oppenheim fur teacup; line: chopsticks extending, scale perspective", composition: "Composition and scale: chopsticks as main subject in space; overhead or close-up", techniques: "Mixed media, surreal texture shift, realist and symbolic", themeLink: "Must show 'if I' first-person role play, not just static chopsticks.", commonMistakes: ["Mistake: Drawing chopsticks as still object, ignoring 'if I' first-person.", "Note: Reference Part A object transformation (e.g. Oppenheim fur teacup) for surreal quality.", "Note: Use scale (near big, far small) for chopsticks in space."] },
    { theme: "The Call of the Forest", concepts: ["Layers and depth of forest", "Mystery and life in nature", "Translating 'call' from sound to image"], visualElements: "Overlapping trunks, distance; green gradation, light patches; bark, leaf, mist texture", composition: "Overlap and atmospheric perspective for depth; avoid flat row of trees", techniques: "Watercolour layers, ink wash; fine natural texture (e.g. Wu Guanzhong, Gong Xian)", themeLink: "Viewer reads forest depth and 'call' atmosphere.", starTips: "Light: 'god rays' or natural light for mystery and life.", commonMistakes: ["Mistake: Trees in a single row; no overlap or depth.", "Note: Use 'god rays' or natural light for forest mood.", "Note: Reference Wu Guanzhong or Gong Xian for natural texture."] },
    { theme: "Woken by Music in the Deep Night", concepts: ["Strong night light/shadow", "Sound as visual (lines, flow, rhythm)", "Moment of waking"], visualElements: "Single main light (lamp or moon); lines or colour for sound (twisted, flowing)", composition: "Single source guides focus; make 'sound' visible in the image", techniques: "Charcoal or pastel value; collage or flowing strokes for music", themeLink: "Make 'sound' visible—e.g. twisted lines or flowing colour for music.", partALink: "Reference 2014 La Tour single light for night theatrical mood.", colourTone: "Dark base, single warm or cool source, local contrast", commonMistakes: ["Mistake: Light too even; no strong value contrast for 'deep night'.", "Note: Set one main light (lamp or moon) to guide focus.", "Note: Make sound visible—e.g. twisted lines or flowing colour."] },
    { theme: "The Studio After AI Replaced It", concepts: ["Conflict of tech and art", "Emptiness and abandoned tools", "Human trace vs machine precision"], visualElements: "Lines: hand stroke vs digital precision; texture: brushes, paint, empty chair vs screen or robot arm; colour: faded human trace vs cold tech light", composition: "Juxtapose studio remains with AI/machine intrusion; emptiness or clutter for 'replaced'", techniques: "Mixed media (object collage and digital), subtraction and white space, contrasting stroke vs flat surface", themeLink: "Guide reflection on 'human trace' vs 'machine precision'; viewer reads tension or desolation after replacement.", partALink: "Reference 2022 digital art and traditional painting: contrast traditional media with digital/mechanical visual language.", difficultyLevel: "high" },
    { theme: "Neon Forest in the Deep Sea", concepts: ["Surreal juxtaposition: deep sea and neon", "Light-shadow contrast and ecological metaphor", "Oppression and escape coexisting"], visualElements: "Colour: complementary for deep-sea pressure vs neon escape; lines: waves, creatures and neon tubes; texture: transparent water vs glowing tubes", composition: "Layers: depth of sea and neon forest in foreground/mid; focus on light spreading in darkness", techniques: "Watercolour or acrylic transparent layers, fluorescent colour, mixed media for luminous bodies", themeLink: "Use complementary colour to stress deep sea vs neon; viewer feels tension of surreal juxtaposition.", starTips: "Light: self-luminous diffusion—neon creates halo and reflection in deep sea for mystery and life.", colourTone: "Deep blue-green and neon orange-red complementary; local high-saturation glow", difficultyLevel: "medium-high" },
    { theme: "Dim Sum Morning in the Tea House", concepts: ["Hong Kong traditional food culture", "Ritual and daily routine", "Intergenerational connection"], visualElements: "Lines: bamboo steamer weave pattern; colour: warm basket yellow, pu-erh tea brown; texture: steam haze, porcelain smoothness", composition: "Overhead or 45-degree view; steamer at centre; white space for steam", techniques: "Watercolour wash (steam), collage (old newspaper/menu), ink outline", themeLink: "Viewer feels Hong Kong 'tea house' culture and warmth in daily routine.", colourTone: "Warm brown, orange-yellow, light beige; contrast dark tea accent", difficultyLevel: "medium" },
    { theme: "The Sounds of the Wet Market", concepts: ["Visualizing sound", "Rhythm in chaos", "Vitality of street life"], visualElements: "Lines: crowded stalls, hanging ingredients; colour: fresh fish blue-red, vegetable green-orange; texture: wet floor, plastic bag sheen", composition: "Fish-eye or low angle; visual sound lines extending from scene", techniques: "Mixed media collage, spray paint, charcoal lines", themeLink: "Viewer feels the raw energy of street life, not just scenic depiction.", colourTone: "Vivid contrast: blue, red, orange, green; high saturation street colours", difficultyLevel: "medium" },
    { theme: "Hands Trapped in Likes", concepts: ["Social media symbolism", "Self defined by likes", "Real touch vs screen contact"], visualElements: "Lines: finger swiping phone轨迹; colour: screen blue light vs skin warmth; texture: glass screen vs skin texture", composition: "Close-up finger-screen contact; rest blurred", techniques: "Digital painting (light effects), collage, fingerprint rubbing", themeLink: "Viewer ponders distance between 'being seen' and 'authentic self'", colourTone: "Cold screen light vs warm skin; blue-white background high contrast", difficultyLevel: "medium" },
    { theme: "Grandfather's Hour in the Sunlight", concepts: ["Elderly loneliness", "Company of sunlight", "Repetition of daily routine"], visualElements: "Light: window frame sunlight; colour: elderly clothing in plain colours; texture: wrinkles, fabric texture", composition: "Sun beam as focal point; elderly figure as subject; white space for stillness", techniques: "Chiaroscuro (Rembrandt light), charcoal sketch, watercolour light wash", themeLink: "Viewer feels 'waiting' and quiet warmth of sunlight companionship.", partALink: "Reference 2014 La Tour Virgin in Prayer: single light source creates theatrical mood and stillness.", colourTone: "Warm yellow sunlight, cool grey interior; contrast light/shadow zones", difficultyLevel: "medium" },
    { theme: "Typhoon Holiday in Hong Kong", concepts: ["Pause and waiting", "Nature's overwhelming force", "Response to calm"], visualElements: "Lines: wind-twisted trees, signs; colour: grey-blue storm palette; texture: rain movement lines", composition: "Indoor view through window; storm as main, elder/child as secondary", techniques: "Ink wash (storm movement), spray technique, digital compositing", themeLink: "Viewer feels 'calm in the storm' or 'reverence for nature's power'", colourTone: "Grey-blue, silver-white, local warm yellow (indoor light)" },
    { theme: "The Line Lost in Translation", concepts: ["Boundaries of language", "Emotion that cannot be conveyed", "Gap in communication"], visualElements: "Lines: broken text/characters; colour: original vs translated colour difference; texture: paper, crossing-out marks", composition: "Bilingual text对照 with breaks; white space or blur for 'loss'", techniques: "Mixed media (calligraphy and print), rubbing, collage", themeLink: "Viewer feels powerlessness of 'cannot express'", colourTone: "Original warm (red-brown) vs translated cool (blue-grey); sharp contrast" },
    { theme: "The Next-Door Drying Rack", concepts: ["Hong Kong living intimacy", "Clothes as symbol", "Invisible neighbour relationship"], visualElements: "Lines: crossing drying lines; colour: bright clothes (red, yellow, blue); texture: fabric fluttering", composition: "Looking up through drying rack to sky; clothes as rhythmic lines", techniques: "Charcoal lines, watercolour, fabric collage", themeLink: "Viewer feels Hong Kong living intimacy and blurred privacy boundary", colourTone: "Bright clothes vs grey-white sky; contrasting tones" },
    { theme: "The Night of Too Much Homework", concepts: ["Pressure and exhaustion", "Meaning of learning", "Child's perspective"], visualElements: "Lines: scattered textbooks, exam papers; colour: pen blue-black, lamp warm yellow; texture: paper crumpling", composition: "Overhead desk view; a small clock showing time pressure", techniques: "Watercolour wash, collage, exam paper fragments", themeLink: "Viewer feels 'cannot finish' pressure and the subject's emotion", colourTone: "Cold (anxiety) vs warm yellow (home comfort)" },
    { theme: "The Hong Kong Trail", concepts: ["City-nature boundary", "Hiking ritual", "Return via looking back"], visualElements: "Lines: winding trail, tree shade; colour: green, mud brown, concrete grey; texture: bark, rock, soil", composition: "Guide lines along trail toward distant HK skyline; upward or downward perspective", techniques: "Watercolour sketch, Chinese painting composition, clay texture", themeLink: "Viewer feels 'escaping city' vs 'looking back at Hong Kong' contrast.", partALink: "Reference 2019 landscape works: use Chinese painting scroll perspective for HK trail's unique scenery.", colourTone: "Jade green, mud brown, grey-blue sky; natural earth tones" },
    { theme: "Cosmos by the Trash Station", concepts: ["Resilient life force", "Coexistence of dirty and beautiful", "Beauty in neglect"], visualElements: "Lines: cosmos stem delicate; colour: pink, purple, white petals; texture: plastic trash vs soft petals", composition: "Close-up: flowers growing from trash crack; dirty background, beautiful foreground", techniques: "Watercolour (petal softness), trash material collage, macro view", themeLink: "Viewer feels 'blooming in adversity' beauty, not environmental lecture", colourTone: "Delicate pastel (petals) vs grey-brown dirty (background); high contrast" },
    { theme: "Memories in the Mooncake Tin", concepts: ["Emotional load of festivals", "Container of memories", "Ritual vs commercialisation"], visualElements: "Lines: mooncake tin decorative pattern; colour: gold, red traditional; texture: metal tin, silk lining", composition: "View of open tin; inside filled with old photos/small toys not mooncakes", techniques: "Old object collage, watercolour wash, traditional symbols", themeLink: "Viewer feels 'festival emotion' worth preserving more than mooncakes themselves", partALink: "Reference 2017 Part A works: use traditional object's fine texture for emotional connection to the past.", colourTone: "Gold, red, purple festive colours; matte metal texture" },
    { theme: "The Swimmer in Victoria Harbour", concepts: ["Historical memory vs modern leisure", "Symbol of sea", "Human-sea relationship"], visualElements: "Lines: harbour wave curves, swimmer silhouette; colour: sea blue, sunset orange; texture: water, torch lights", composition: "Victoria Harbour night scene; swimmer as silhouette; distant city lights", techniques: "Oil impasto (waves), silhouette, light on water", themeLink: "Viewer feels Hong Kong unique 'sea complex'", colourTone: "Deep blue night, warm orange sunset, swimmer grey-black silhouette" },
    { theme: "The Invisible Backpack", concepts: ["Invisible burden", "Invisible pain", "Hidden emotion"], visualElements: "Lines: back curve; colour: clothing colour; texture: fabric wrinkles", composition: "Back view; backpack's presence feeling; subject looking forward not at viewer", techniques: "Charcoal sketch, collage (invisible 'backpack' semi-transparent material)", themeLink: "Viewer feels psychological state of 'invisible weight'", colourTone: "Subdued grey, single colour palette;压抑 emotional tone" },
    { theme: "Ten Minutes of Tooth Brushing", concepts: ["Daily repetitive ritual", "Moment of solitude", "Empty time"], visualElements: "Lines: bathroom fixture geometry; colour: porcelain white, blue/green tiles; texture: porcelain smoothness, water droplets", composition: "Bathroom close-up; time stretched feeling; steam/haze blur", techniques: "Watercolour wash (steam/haze), collage, minimal composition", themeLink: "Viewer feels 'white space' and self-dialogue in daily ritual", colourTone: "Porcelain white, cool grey-blue tiles, warm yellow bathroom light; clean tones" }
  ]
};
