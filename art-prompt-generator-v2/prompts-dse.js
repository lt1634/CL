/**
 * DSE 視藝卷一 Part B 模擬題目庫
 * 每條含：命題、Concept 諗法、視覺元素建議、構圖提示、技法建議、扣題引導
 * 對應評分四範疇：媒材及技法、視覺元素及設計原理、創意與想像力、主題傳意
 */
const DSE_PROMPTS = {
  zh: [
    {
      theme: "成長",
      concepts: ["由種子到開花的階段變化", "個人與環境的互相塑造", "傷疤與癒合作為成長的痕跡"],
      visualElements: "線條：由幼到粗、由斷續到連續；色彩：由冷到暖或單色漸層；質感：由平滑到粗糙的對比",
      composition: "平衡：不對稱平衡表現成長的不穩定；對比：大小、疏密；節奏：重複的單元逐漸變化",
      techniques: "水彩渲染（層次）、拼貼（碎片重組）、針筆線條（軌跡）",
      themeLink: "觀眾要能從畫面讀到「轉變」或「過程」，而非單一靜態符號；可透過序列、對比、符號重複出現來扣題"
    },
    {
      theme: "衝突",
      concepts: ["內在與外在的拉扯", "新舊並置的張力", "人與自然的對立與共存"],
      visualElements: "線條：交錯、斷裂、對抗的走向；色彩：對比色或冷暖撞擊；質感：粗糙與光滑的並置",
      composition: "對比：強烈明暗或色塊分割；動勢：對角線或放射線製造緊張；焦點：衝突交匯處",
      techniques: "拼貼（撕裂與重組）、油彩厚塗、炭筆與橡皮的對比",
      themeLink: "畫面要有「兩方」或「兩種力量」可辨識，觀眾能感受張力而非只看到混亂"
    },
    {
      theme: "循環",
      concepts: ["四季、日夜、生死", "重複的日常與儀式", "起點與終點的重疊"],
      visualElements: "形狀：圓、螺旋、迴圈；線條：封閉或迴旋；色彩：可選同一色系不同明度形成循環感",
      composition: "節奏：重複單元；平衡：放射或環形構圖；引導線：視線回到起點",
      techniques: "版畫（重複印痕）、數碼圖層循環、水墨暈染的層次",
      themeLink: "觀眾要能讀到「周而復始」或「無始無終」，符號或構圖本身形成循環"
    },
    {
      theme: "距離",
      concepts: ["地理與心理的距離", "觸不到的渴望", "靠近與疏離的對比"],
      visualElements: "透視：遠近、虛實；色彩：遠處冷/灰、近處暖/鮮；質感：清晰與模糊的對比",
      composition: "空間：前景中景遠景的層次；留白：大量空白表現距離感",
      techniques: "大氣透視、水彩漸層、攝影拼貼（不同焦距）",
      themeLink: "畫面要傳達「之間」的距離感，觀眾能感受遠近或心理上的隔閡"
    },
    {
      theme: "界限",
      concepts: ["有形與無形的界線", "跨越與固守", "內與外的分界"],
      visualElements: "線條：明確的邊界或模糊的過渡；形狀：被分割的畫面；色彩：界線兩側的對比",
      composition: "分割：垂直/水平/斜線切分畫面；平衡：界線兩側的輕重",
      techniques: "膠帶留白、撕邊拼貼、數碼裁切與並置",
      themeLink: "觀眾要能辨識「界線」的存在，以及你對界限的態度（跨越、尊重、打破）"
    },
    {
      theme: "傳承",
      concepts: ["上一代與下一代的交接", "技藝與記憶的延續", "消失與保留的選擇"],
      visualElements: "符號：手、工具、舊物；質感：陳舊與嶄新的對比；色彩：懷舊色調與新色並置",
      composition: "並置：兩代或前後對比；引導：從一方向另一方的視線流動",
      techniques: "拓印、舊照片拼貼、水墨與書法線條",
      themeLink: "觀眾要讀到「傳下去」或「接過來」的關係，而非單一人物或物件"
    },
    {
      theme: "消失",
      concepts: ["正在消失的風景或記憶", "褪色與遺忘", "存在與缺席的對比"],
      visualElements: "色彩：褪色、淡出、單色化；線條：斷續、擦除的痕跡；質感：剝落、模糊",
      composition: "留白：消失後的空缺；漸層：由實到虛的過渡",
      techniques: "橡皮擦減法、水彩洗淡、數碼透明度、舊紙拼貼",
      themeLink: "觀眾要感受到「曾經在、現在不在」或「正在失去」，而非單純空白"
    },
    {
      theme: "重複",
      concepts: ["日常的重複與差異", "規律中的意外", "複製與變異"],
      visualElements: "形狀：重複單元；線條：規律的排列；色彩：同一色系或漸變的重複",
      composition: "節奏：規律排列；對比：一處打破規律形成焦點",
      techniques: "版畫、印章、數碼複製圖層、網格繪圖",
      themeLink: "觀眾要讀到「重複」的規律，以及你選擇突出的一點變化或例外"
    },
    {
      theme: "對比",
      concepts: ["光與暗、大與小、多與少", "繁華與寂靜", "過去與現在"],
      visualElements: "明暗：強烈對比；色彩：互補色或冷暖對比；質感：粗糙與細膩並置",
      composition: "分割：畫面二分或多區對比；焦點：對比交匯處",
      techniques: "木炭與白粉、剪影、拼貼不同質感",
      themeLink: "觀眾要清楚看到「兩極」的並置，並感受你強調的對比關係"
    },
    {
      theme: "時間",
      concepts: ["瞬間與永恆", "快與慢的並存", "過去現在未來的疊加"],
      visualElements: "線條：流動感或凝固感；色彩：褪色與鮮明；質感：新舊並置",
      composition: "層次：疊加或並置不同時態的意象；引導：時間流動的方向",
      techniques: "多重曝光感、拼貼不同時期影像、水墨暈染的層次",
      themeLink: "觀眾要讀到「時間」的存在（流逝、停頓、重疊），而非單一瞬間"
    },
    {
      theme: "記憶",
      concepts: ["模糊與清晰的交織", "選擇性記住與遺忘", "個人與集體記憶"],
      visualElements: "虛實：部分清晰部分模糊；色彩：泛黃、褪色、不飽和；質感：刮擦、疊印",
      composition: "層疊：多層意象重疊；焦點：最清晰的一塊",
      techniques: "拼貼舊照、刮畫、水彩疊色、數碼透明度",
      themeLink: "觀眾要感受「回憶」的質感——不完整、可變、帶情緒"
    },
    {
      theme: "身份",
      concepts: ["多重身份的並存", "自我與他人眼中的我", "尋找與迷失"],
      visualElements: "鏡像、碎片、面具；色彩：對比或融合；形狀：完整與破碎",
      composition: "並置或疊加：不同面向的「我」；焦點：核心符號",
      techniques: "自畫像變奏、拼貼、鏡像構圖、數碼圖層",
      themeLink: "觀眾要讀到「我是誰」或「身份」的提問，符號可多元但主題明確"
    },
    {
      theme: "邊緣",
      concepts: ["中心與邊緣的關係", "被忽略的角落", "臨界與越界"],
      visualElements: "構圖：主體靠邊或留白偏一側；線條：指向邊緣或從邊緣溢出；色彩：邊緣與中心的差異",
      composition: "不平衡的構圖；負空間作為主角；邊界模糊或銳利",
      techniques: "裁切構圖、留白、邊緣暈染或銳化",
      themeLink: "觀眾要意識到「邊緣」被強調，以及邊緣與中心的關係"
    },
    {
      theme: "連結",
      concepts: ["人與人、人與物、物與物", "斷裂後的重新連結", "可見與不可見的連線"],
      visualElements: "線條：連接、網絡、繩索；形狀：分散單元被線或面連起；色彩：統一或漸變拉近距離",
      composition: "引導線連結多個焦點；疏密：連結處的密度",
      techniques: "線條繪畫、網格、拼貼加繪畫連接",
      themeLink: "觀眾要讀到「關係」或「連結」，而非只是多個獨立物件"
    },
    {
      theme: "沉默",
      concepts: ["無聲的張力", "留白與未說", "喧囂中的靜止"],
      visualElements: "大量留白；低飽和或單色；線條簡約、少筆觸",
      composition: "留白為主；單一焦點或極少元素；平衡而安靜",
      techniques: "水墨留白、鉛筆輕描、單色渲染",
      themeLink: "觀眾要感受「靜」與「無聲」，畫面節制而有力"
    },
    {
      theme: "光與影",
      concepts: ["光作為主體", "陰影的形狀與意義", "曝光與隱藏"],
      visualElements: "明暗對比強烈；光的形狀（窗格、燈、自然光）；陰影的邊界",
      composition: "光影分割畫面；焦點在光或影的交接",
      techniques: "林布蘭光、剪影、色粉或炭筆的明暗",
      themeLink: "觀眾要讀到「光」或「影」的敘事，而非只是技術練習"
    },
    {
      theme: "流動",
      concepts: ["水、時間、人潮的流動", "固體與流體的轉換", "阻滯與暢通"],
      visualElements: "線條：曲線、波浪、傾斜；色彩：漸層、混色；質感：平滑流暢或凝滯",
      composition: "動勢：方向一致或交匯；節奏：流動的緩急",
      techniques: "水墨流動、水彩濕畫、數碼動感模糊",
      themeLink: "觀眾要感受「流動」的動態與方向，以及流動中的阻礙或變化"
    },
    {
      theme: "痕跡",
      concepts: ["人為與自然的痕跡", "留下與抹去", "痕跡作為證據或記憶"],
      visualElements: "筆觸、刮擦、污漬、摺痕；質感豐富；新舊痕跡疊加",
      composition: "痕跡的分佈與密度；重點痕跡與背景",
      techniques: "拓印、拼貼舊物料、刻意保留筆觸與擦痕",
      themeLink: "觀眾要讀到「誰留下、留下甚麼」，痕跡有意義而非隨機"
    },
    {
      theme: "等待",
      concepts: ["靜止中的期待", "延遲與懸念", "空無與即將填滿"],
      visualElements: "空曠、單一主體、靜止的構圖；色彩可壓抑或帶希望",
      composition: "留白；主體偏置或居中；時間感凝結",
      techniques: "單色或低飽和、簡約構圖、光影暗示時間",
      themeLink: "觀眾要感受「在等」的狀態，畫面有懸而未決的張力"
    },
    {
      theme: "選擇",
      concepts: ["岔路與取捨", "多個可能並存", "選了與未選的"],
      visualElements: "分岔、並置多個選項；符號：路、門、手勢；對比不同選擇的視覺重量",
      composition: "分割或分支構圖；焦點在選擇點或已選的一邊",
      techniques: "拼貼多個意象、蒙太奇、並置構圖",
      themeLink: "觀眾要讀到「選擇」的存在與重量，而非只是多個物件"
    }
  ],
  en: [
    { theme: "Growth", concepts: ["From seed to bloom", "Self and environment shaping each other", "Scars and healing as growth"], visualElements: "Lines: thin to thick, broken to continuous; colour: cool to warm or tonal gradation; texture: smooth vs rough contrast", composition: "Balance: asymmetrical for instability; contrast: size, density; rhythm: repeated units evolving", techniques: "Watercolour wash, collage (fragments), fineliner (traces)", themeLink: "Viewer should read 'change' or 'process', not a single static symbol; use sequence, contrast, recurring symbols" },
    { theme: "Conflict", concepts: ["Inner vs outer pull", "Old and new in tension", "Human vs nature"], visualElements: "Lines: crossing, breaking; colour: complementary or warm/cool clash; texture: rough vs smooth", composition: "Strong contrast, diagonal tension; focus at point of conflict", techniques: "Collage (tear and reassemble), impasto, charcoal vs eraser", themeLink: "Two sides or forces should be readable; viewer feels tension, not chaos" },
    { theme: "Cycle", concepts: ["Seasons, day/night, life/death", "Repetition and ritual", "Start and end meeting"], visualElements: "Circles, spirals; closed or recurring lines; colour in a loop", composition: "Rhythm, radial or circular layout; eye returns to start", techniques: "Printmaking, digital layers, ink wash layers", themeLink: "Viewer reads 'cycle' or 'no beginning or end'" },
    { theme: "Distance", concepts: ["Physical and emotional distance", "Longing out of reach", "Near and far"], visualElements: "Perspective, clarity vs blur; colour: distant cool/grey, near warm/saturated", composition: "Foreground / mid / back; ample negative space", techniques: "Atmospheric perspective, watercolour gradation", themeLink: "Viewer feels the 'in-between' and distance" },
    { theme: "Boundary", concepts: ["Visible and invisible limits", "Crossing or holding the line", "Inside and outside"], visualElements: "Clear or blurred edges; divided picture plane; contrast across the line", composition: "Division; balance on either side", techniques: "Tape resist, torn-edge collage", themeLink: "Viewer identifies the boundary and your stance toward it" },
    { theme: "Inheritance", concepts: ["Handing down between generations", "Skill and memory continuing", "What is kept or lost"], visualElements: "Hands, tools, old objects; old vs new texture; nostalgic vs fresh colour", composition: "Juxtaposition; flow from one to the other", techniques: "Rubbing, old photo collage, ink and calligraphy", themeLink: "Viewer reads 'passing on' or 'receiving'" },
    { theme: "Disappearance", concepts: ["What is vanishing", "Fading and forgetting", "Presence and absence"], visualElements: "Faded colour, broken lines, erasure; peeling, blur", composition: "Negative space; transition from solid to void", techniques: "Eraser, washed watercolour, transparency, old paper", themeLink: "Viewer feels 'was here, now not' or 'losing'" },
    { theme: "Repetition", concepts: ["Daily repeat and variation", "Pattern and exception", "Copy and mutation"], visualElements: "Repeated units; regular lines; same hue or gradient repeat", composition: "Rhythm; one break in pattern as focus", techniques: "Print, stamp, digital duplicate layers", themeLink: "Viewer reads repetition and the one change" },
    { theme: "Contrast", concepts: ["Light and dark, big and small", "Bustle and silence", "Past and present"], visualElements: "Strong value contrast; complementary or warm/cool; rough vs smooth", composition: "Split or zoned contrast; focus at meeting point", techniques: "Charcoal and white, silhouette, collage", themeLink: "Viewer sees two poles and the relation" },
    { theme: "Time", concepts: ["Moment and eternity", "Fast and slow", "Past present future layered"], visualElements: "Flowing or frozen lines; faded vs vivid colour; old and new texture", composition: "Layers of different times; direction of flow", techniques: "Multiple exposure feel, collage of eras, ink layers", themeLink: "Viewer reads time—passing, pausing, overlapping" },
    { theme: "Memory", concepts: ["Blur and clarity", "Selective remembering", "Personal and collective"], visualElements: "Sharp and soft; yellowed, faded; scrape, overprint", composition: "Layers; one clear focal area", techniques: "Old photo collage, scratch, watercolour layers", themeLink: "Viewer feels the texture of memory—incomplete, shifting" },
    { theme: "Identity", concepts: ["Multiple selves", "Self vs others' view", "Searching and losing"], visualElements: "Mirror, fragments, masks; contrast or merge; whole and broken", composition: "Juxtapose or overlay 'selves'; core symbol", techniques: "Self-portrait variation, collage, mirror", themeLink: "Viewer reads 'who am I' or 'identity'" },
    { theme: "Edge", concepts: ["Centre and margin", "Neglected corners", "Limit and crossing"], visualElements: "Subject at edge; lines to or from edge; centre vs edge colour", composition: "Unbalanced; negative space; soft or hard edge", techniques: "Cropping, leave white, edge blur or sharpen", themeLink: "Viewer notices the edge and its relation to centre" },
    { theme: "Connection", concepts: ["Between people, people and things", "Reconnecting after break", "Visible and invisible links"], visualElements: "Lines linking, networks; scattered units joined; colour unifying", composition: "Guiding lines; density at links", techniques: "Line drawing, grid, collage with drawn links", themeLink: "Viewer reads 'relation' or 'connection'" },
    { theme: "Silence", concepts: ["Tension without sound", "What is unsaid", "Stillness in noise"], visualElements: "Lots of white; low saturation or monochrome; minimal line", composition: "White dominant; one or few elements; calm balance", techniques: "Ink leave-white, light pencil, single hue", themeLink: "Viewer feels quiet and restraint" },
    { theme: "Light and shadow", concepts: ["Light as subject", "Shape of shadow", "Reveal and hide"], visualElements: "Strong value; shape of light; edge of shadow", composition: "Light and shadow divide; focus at meeting", techniques: "Rembrandt light, silhouette, charcoal/chiaroscuro", themeLink: "Viewer reads a story of light or shadow" },
    { theme: "Flow", concepts: ["Water, time, crowd", "Solid to fluid", "Block and release"], visualElements: "Curves, waves; gradation, blend; smooth or sticky", composition: "Direction of flow; rhythm", techniques: "Ink flow, wet watercolour, motion blur", themeLink: "Viewer feels movement and direction" },
    { theme: "Trace", concepts: ["Human and natural traces", "Leave and erase", "Trace as evidence"], visualElements: "Stroke, scrape, stain, fold; rich texture; layers of trace", composition: "Distribution of traces; key vs background", techniques: "Rubbing, old material collage, visible strokes", themeLink: "Viewer reads who left what" },
    { theme: "Waiting", concepts: ["Stillness and expectation", "Delay and suspense", "Empty and about to fill"], visualElements: "Empty, single subject, still; subdued or hopeful colour", composition: "White space; subject off-centre or central", techniques: "Monochrome, simple composition, light for time", themeLink: "Viewer feels 'waiting' and unresolved tension" },
    { theme: "Choice", concepts: ["Fork in the road", "Alternatives present", "Chosen and unchosen"], visualElements: "Branching, juxtaposed options; road, door, gesture; weight of choices", composition: "Split or branch; focus at point of choice", techniques: "Collage of options, montage", themeLink: "Viewer reads the presence and weight of choice" }
  ]
};
