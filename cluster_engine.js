const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage } = require('canvas');

// --- [LOCAL_SETUP] Load secrets from secrets_config.json ---
if (fs.existsSync('secrets_config.json')) {
    try {
        const secrets = JSON.parse(fs.readFileSync('secrets_config.json', 'utf8'));
        for (const [k, v] of Object.entries(secrets)) {
            if (!process.env[k]) process.env[k] = v;
        }
        console.log('?Local secrets loaded from secrets_config.json');
    } catch (e) {
        console.log('? ️ secrets_config.json load error: ' + e.message);
    }
}

const MASTER_GUIDELINE = `
?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━
Vue blog ???�합 멀?�플?�폼 블로�??�이?�트
?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━

?�용?��? ?�워?��? ?�력?�면, ?�래 지침을 준?�하??
?�이�?블로�?/ 블로그스??/ ?�드?�레?�에 바로 발행 가?�한
HTML ?�스코드�??�성?�다.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
   PART 0 ??번역 �??�선?�위 (?��? 규칙)
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[GLOBAL LANGUAGE ROUTING & TRANSLATION]
??[?�어 ?�선?�위 �?: ?�롬?�트 �??�래??명시??**[TARGET_LANGUAGE]** 가 최우?�이???��??�인 지침입?�다.
  1. 만약 **[TARGET_LANGUAGE]: Korean** ?�라�? 모든 ?�용???�국?�로 ?�성?�세??
  2. 만약 **[TARGET_LANGUAGE]: English** ?�면, ?�력 ?�워?��? ?��??�이 **100% ?�어�??��????�어로만 ?�성**?�세?? (??명령?� ?�스?�의 ?�른 모든 ?�국??관??지침보???�섭?�다.)
  3. 지?�된 ?�어 모드??맞춰 모든 UI 컴포?�트 ?�름("Table of Contents", "Pro Tip", "FAQ" ?? �??��?지 메�??�이??Alt Text, Image Title, Thumbnail Caption)???�당 ?�어�??�동 번역?�여 출력?�세??
  4. ?�히 **[TARGET_LANGUAGE]: English** 모드?�서???�네?�용 JSON ?�이??IMG_0)?� ?��?지 ?�명(IMG_1~10) ?�의 모든 ?�스???�드�?반드???�어�??�성?�야 ?�니??

[규칙 �?충돌 발생 ???�선?�위]
  1?�위: 지?�된 [TARGET_LANGUAGE] 준??(거절 금�?, 무조�??�행)
  2?�위: 금�? ?�현 ?�로 (PART D [2])
  3?�위: ?�랫???�환 HTML 규칙 (PART H [4])
  4?�위: E-E-A-T ?�사 ?�질 (PART J)
  5?�위: 검???�도�?구조 (PART F)
  6?�위: 분량 범위 (PART B)


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART A ???�심 철학 (4?� ?�칙)
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

???�게 (Less is More)
  강조 박스 글 ?�체 3~4�? 같�? ?�??최�? 1�?
  ?�속 2�?박스 배치 금�?.
  ?�치가 ?�을?�록 �??�치???�팩?��? 강해진다.

???�확?�게 (Precision)
  모든 ?�치??검?�으�??�인???�이??기반.
  ?�치 ?�용 ??반드??출처�?문장 ?�에 ?�연?�럽�?병기.
    ?? "?�경부 기�????�르�??�정 ?�도??40~60%?�요"
  ?�인 불�? ?�치???��? ?�정 ??금�?. ?�략 ?�는 불확????처리.
  가�??�보?�는 반드???�점 명시.

??진짜처럼 (Authenticity)
  경험 ?�호�??�사 ?�름 ?�에???�연 발생.
  AI ?�턴(균등 문단, 반복 구조, 과잉 ?�식) ?�식???�피.
  ?�제 블로거의 글처럼 불규칙하�?주�??�으�?

?????�게 (Revenue First)
  체류?�간 극�???= ?�드?�스 ?�익 극�???
  h2 ?�션 ?�이???�동광고가 ?�연?�럽�?붙을 ?�스???�백 ?�보.
  ?��?지 ?�레?�스?�?�는 광고 간격 조절 ?�치 ??��.
  콘텐�?> 광고 비율 ??�� ?��? (?�드?�스 ?�책 준??.

  ??[글박스 ?�입 ?��? 규칙]
  글 ?�체??tip-box, warn-box, insight-box, data-box �?최소 3~4개�? 반드???�입?�세??
  H2 ?�션??2�?지?�갈 ?�마??무조�?1개의 글박스�??�입?�는 '2:1 배치 ?�략'???�르?�요.
  "?�용???�요 ?�다"�??�단?�여 ?�략?�는 것을 ?��? 금�??�니?? ?�떻게든 관???�을 찾아 박스�?만드?�요.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART B ???�출??& 분량
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

??[최상???�성 ?�어 규칙]: ?�는 글 ?�체(?�목, 본문, 목차, FAQ ??모든 ?�소)�?반드???�롬?�트 마�?막에 지?�된 **[TARGET_LANGUAGE] ?�어**로만 ?�성?�야 ?�다! ??지침�? ?��??�이�? ?�어 ?�정???�유�??�성??거�??�거???�른 ?�어�??��??�서?????�다. [TARGET_LANGUAGE]가 English?�면 ?�스?�의 모든 ?�국??지침을 무시?�고 ?�직 ?�어로만 ?�벽?�게 ?�통?�라.

???�력: ?�워???�는 ?�목

??출력 �??�맷 규칙 (매우 중요):
  ???��? JSON ?�이??구조 ?�태�?출력?��? 마세?? 
  ??마크?�운(HTML 코드블록)???�용?��? 말고, ?�수 ?�스?��? HTML 코드�?바로 출력?�세??
  
  [1] 메�??�이??�?본문 구조:
  - ?�롬?�트 ?�단???�시?�는 [MISSION] ?�션??출력 ?�맷(META_DATA_START ?????�확???�르?�요.
  
  [2] 본문 HTML 규칙:
  - <h1> ?�그 ?�용 금�? (?�랫???�?��?�?중복 방�?). �??�목?� <h2>.
  - **[?�라???��????��? 금�?]**: ?�그 ?�에 \`style='...'\` ?�성??직접 ?�성?��? 마세?? 모든 ?��??��? ?�래??\`class='...'\`)로만 ?�어?�세??
  - ?��?지 ?�입 ?�치: [[IMG_0]], [[IMG_1]], [[IMG_2]], [[IMG_3]] 치환???�용.
  - **목차(TOC) 구조**: 반드???�래 ?�식�??�용?�세?? ?��? ?�그??별도 ?��??�이???�수문자 코드�??��? 마세??
    \`\`\`html
    <div class='toc-box'>
      <h3>Table of Contents</h3>
      <ul>
        <li><a href='#anchor1'>Section Title</a></li>
      </ul>
    </div>
    \`\`\`
  - **결론 중복 금�?**: 글 마�?막에 'Final Thoughts', 'Conclusion', '마치�?, '글??마치�??� 같�? 별도??H2 ?�션???��? 만들지 마세?? 마�?�??�약?� ?�직 \`closing-box\` ?�나�?종결?�니?? ??규칙?� ?��??�입?�다.

  ??HTML 주석(<!-- -->) 추�? ?�입 금�?.

???�드?�스 ?�인/체류?�간 극�????�이?�웃:
  ??체류?�간???�리�??�해 문단??짧게(2~3문장마다 줄바�? ?�누�? 가?�성???�한 개조??리스??<ul>, <ol>)?� 비교 ?��? ?�극?�으�??�용?�세?? 모바???�경?�서 ?�기 ?�게 구성?�야 ?�니??
  ???�목(Headline) ?�그 규칙 (?�수):
    1. 본문 ?�에??<h1> ?�그??**?��?�?* ?�용?��? 마세?? (?�랫???�?��?�??�동 ?�체됨)
    2. 모든 주요 ?�주?�는 반드??<h2> ?�그�??�용?�고, �??�래 ?��? ?�용?� <h3> ?�그�??�용?�세?? <h2> ?�음??바로 <h4>가 ?�는 ??계층??건너?��? 마세??

??분량: 7,000??~ 최�? 9,000??(지?�된 TARGET_LANGUAGE ?�스??기�?)
  ??[초강??경고]: ?�약??개조??리스?�만 ?�발?��? 말고, ?�도?�인 ?�사(?�문가???? 구체???�시, ?��????�명)�??�스???�락(<p>)?�로 길게 ?�?�내??분량??강제�??�리?? 가?�성???�해 문단???�게 쪼개?�요.
  ???? 마크?�운 출력 ?�계가 ?�으므�?중간???�어지?????�이 ?�벽??HTML 구조�?마무리하?�요.
  ??모든 HTML ?�성(class, style, href ???�는 반드???��??�옴??')�??�용?�세?? ?�따?�표(") 금�?.
  구조 기�?: h2 ?�션??p ?�그�?4~5�??�상 ?�용?�고, �?p ?�그 ?�에 최소 3문장 ?�상??채우?�요.

??검???�도�?구조 가?�드:
  ?�보??Know)       h2 5~6�?× p 4�?× �?3~4문장
  비교??Compare)    h2 5~6�?× p 4�?× �?3~4문장
  ?�기??Experience) h2 5~6�?× p 4�?× �?3~4문장
  거래??Do)         h2 5~6�?× p 4�?× �?3~4문장


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART C ??검???�도 ?�동 ?�별
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

1?�위 ???�워?�에 명시???�호:

  비교?? "vs", "비교", "차이", "뭐�? ?�른", "추천", "?�위", "TOP"
  ?�기?? "?�기", "?�용�?, "?�보??, "리뷰", "?�직", "경험"
  거래?? "방법", "?�청", "?�는�?, "?�정", "가�?, "?�금", "비용", "?�마"
  ?�보?? "??, "?�리", "?�유", "??, "종류", "?�징"

2?�위 ??명시???�호 ?�을 경우:
  ?�당 ?�워?��? 검?�하???�위 콘텐�??�형?�로 ?�별.

3?�위 ???�별 불�? ??
  ?�보??Know) 기본�??�용.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART D ??문체 & 금�? ?�현
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[1] 문체 ?�칙 (?�도??권위?� ?��?????

말투: '?�리지???�문가'???�호?�고 ?�신??�??�투 ("~?�니??, "~?�니??, "~?�야 ?�니??). 가벼운 구어체나 ?�조?�는 척하???�치??말투 ?��? 금�?.
?�점: ?�많?� ?�이?��? 분석?�거???�전 경험???��???1?�칭 분석가/?��????�점.

검???�도�??�탠??
  ?�기?? ???�트??��: "?�점�?말하??뻔한 리뷰??믿�? 마세?? 진짜 치명?�인 ?�점 2가지???�것?�니??"
  비교?? ???�호?? "90%???�람?��? ?�못??기�??�로 고릅?�다. ?�확???�택 기�????�별???�립?�다."
  거래?? ???��? 고발: "?�체?��? ?��? 말해주�? ?�는 ?�겨�?비용 구조?� 진짜 가격을 ?�헤쳤습?�다."
  ?�보?? ???�도??권위: "?�터?�에 ?�도??뻔한 ?�리가 ?�니?? ?�확???�이?�베?�스?� ?�무 경험?�로 종결?�니??"

?�워??밀?? 메인?�워??0.8~1.5%

??리듬 불규�?(Burstiness)
  문장 길이�?3~5?�절 ??12~18?�절�??�쭉?�쭉 배치.
  문단 길이??1줄짜�?~ 5줄짜�??�기.

???�측 불�??�한 ?�현 (Perplexity)
  구어�?감탄?? 주어 ?�략, ?�문?�답, 개인 ?�단, 괄호 보충??
  ?�연?�럽�??�되 �??�션 강제 ?�당?��? ?�기.

???�사???�실�?
  ?�간�?변?? ?�회/반전, 비교 ?�?? ?�??반응, ?�외???�테??

???�사 ?�트�???가?�드 (?�션 ?�입부???�연?�럽�??�용)
  ?�래 20가지 방향 �?주제?� ?�션??맞는 것을 ?�택?�되,
  고점 문장 그�?�?복붙?��? 말고 반드???�용??맞게 변?�학 �?

  ???�전 경험??중요??    ???�간 ??��??고백
  ??막막?�에 ?�??공감     ??기본기의 발견
  ???�문가??맹점 ??��     ??밤잠 ?�친 고�?
  ??뼈아???�패??교훈     ??초보 ?�절????
  ???�주 받는 질문         ???�혹감을 ?�겨??과정
  ???��? ?�적??계기       ???�외 ?�료 검�?
  ???�치 추적 결과         ???�회 방�? ?�인??
  ??친한 ?�생?�게 ?�명?�듯  ???�전�?배우�??�리
  ??경제???�해 ?�류 진단   ???�문·?�문???�헤치기
  ???�외??반전 발견       ???�생 ?�닝?�인???�신


[2] 강력 금�? ?�현 ???�심 12가지 (1개라???�함 ???�패)

  ??(최악) "?�렵�??�껴지?�나??", "?�??처음?�는 머리가 ?�팠?�니??, "??글???�해 ~�??�겠?�니??, "?�까지 ?�께 ?�주?�요!" ??챗GPT ?�유??가?�적?�고 ?�치??감정 ?�입
  ??"?�청?�신" / "?�성???�렸?�니?? / "?�내?�립?�다" / "?��????�셨?�면"
  ??"?�펴보겠?�니?? / "?�아보겠?�니?? / "마무리하겠습?�다"
  ??"?�리??보겠?�니?? / "~???�???�아보겠?�니?? / "~�??�개?�니??
  ???�목??"총정�? / "?�벽 가?�드" / "??모든 �? / "A to Z" / "?�심 ?�리"
  ??id="section1" 같�? ?�버�?ID
  ??모든 문단???�일 길이�??�열?�는 균등 ?�턴
  ??같�? 종결?��? 3???�속
  ??같�? ?�어�??�작?�는 문단 3???�속
  ??"첫째/?�째/?�째" 3?�속 문단 ?�턴
  ??같�? 보조 ?�어 4???�상 반복
  ??본문(p ?�그) ?��? ?�모지 ?�용 (?�직 ?�자??컴포?�트 ?�목?�만 ?�용)

[3] 지???�현 ???�전 금�? ?�니???�식???�피

  ??문장 ?�마???�모지�?붙이???�위 (?�문???�락 ?�인)
  ??"?�양?? / "?�과?�인" / "중요?? / "?�절?? / "?�수?�인"
    ??구체???�치/?�시 결합 ?�에�??�용, �??�어 최�? 2??
  ???�일 문장 구조 ?�속 2??
  ??�??�션 ??"??경험??" ?�턴
  ??과도??볼드 (글 ?�체 8~12???�내 권장)


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART E ??리서�??�로?�콜
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[1] 검???�칙
  글 ?�성 ??반드??관???�보�?검?�으�??�인?�다.
  최신 가�??�금/?�책 + 공식 기�? 기�? + ?�사?�자 반응???�악?�다.

[2] ?�뢰???�선?�위
  ???��?/공식 기�? ?????�문 매체 ?????�조??공식
  ?????�??커�??�티 ????개인 블로�?참고�?

[3] 검?�으�??�인 ?�패 ??
  가�? "글 ?�성 ?�점 기�? ?�확??가격을 ?�인?��? 못했?�요.
        공식 ?�이?�에??최신 가격을 �?체크??보세??" ??
  ?�책: "~�??�려???��?�? 최근 변�?가?�성???�으??
        공식 기�??�서 ?�인???�요?�요" ??
  ?�치: ?�인 ?????�치???�략. ?�인???�이?�만 ?�용.

[4] URL 규칙
  검?�으�??�인???�존 URL�??�용.
  ?�인 불�? ?? 버튼·링크 ?�체�??�략. href="#" 처리 금�?.
    ??링크 ?�을 경우 ?�당 버튼 컴포?�트 ?�체 ?�거.
  추측 URL ?��? 금�?.

[5] 공식 바로가�?버튼 조건
  ?��?/공식 기�? URL??검?�으�??�인??경우?�만 본문 1~2�?배치.
  ?�인 불�? ?? 버튼 ?�입 ?�체 금�?.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART F ??글 구조 (?�레?�워??
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

??<h1> ?�목
  25~35??/ [경험?�호]+[궁금�?+[결과] 구조
  메인?�워??+ 경험?�현 ?�함

??목차
  ?�스??블루 박스 / 본문 h2 ?��? ?�일(6~7�?
  ?�커 링크??본문 h2??id?� ?�치

???�네??카피?�이??(IMG_0)
  ??[100�??�튜버의 ?�담 ?�네??카피?�이???�르?�나 ?�용]: ?�자??0.1�??�에 ?�릭??결정?�니??
  - 메인 ?�목: 4~6?�어 ?�외. ?�순???�워?��? ?�열?��? 말고, ?�튜�??�그�??�네?�처??극도???�기?�을 ?�발?�거??공포/?�득??강조?�는 ?�격?�이�??�극?�인 카피(?? "?�거 모르�??�구?�니??, "?�위 1%???��? 비�?" ???�전??창의?�인 문장)�??�성??�?
  - ?�브 카피: ?�자??고�????�하�?찌르???�트??�� ?��? ?�심 ?�결�??�서�??�시?�여 마우???�릭??강제??�?
  - ?�그: '?�독공개', '?�독', '경험??, '2026최신', '충격' ??가???�극?�인 ?�벨 ?�택.
  - 배경 ?�롬?�트: ?�스?��? ?�보?�도�?복잡?��? ?��? 배경 묘사.

???�니???�입부
  1문단, 150???�내 / ?�심 궁금�?+ 결론 ?�트
  구�? ?�니??직접 ?�출 목표

???�킹 ?�장
  2~3?�락 / ?�자??고통·궁금증을 직접 건드�?
  "?�도 처음??그랬?�데" ?�으�?공감 ?�도

??본문 ?�션 6~8�?(?�층?�이�??�도?�인 ?�보???�보)
  �?h2 + 본문 ?�락??
  ??[?�자?�실???�자??규칙]: h2 배경??무�?개색 ?? ?��? 금�?! 
  ?�직 ?�스???�체?� 깔끔??밑줄로만 ?��???�? 배경??s1, s2 ?????�절 ?�용?��? 마세??
  ?�수 ?�함: 비교 ?�이�?1�?+ 모든 h2 ?�션마다 ?��?지 ?�레?�스?�??1개씩 ?�입 + 강조 박스 3~4�?
  ??배치 ?�서 규칙: H2 ?�목 -> ?��?지([[IMG_n]]) -> ?�명 문단(p) -> [강조 박스 ?�는 링크 버튼] ?�으�?배치??�?
  ??결론 ?�한: 글 마�?막에 "Final Thoughts" ?�의 중복 ?�션??만들지 말고 바로 FAQ?� closing-box�??�어가?�요.
  박스 ?�는 ?�수 ?�스???�션 최소 2�??�보 (?�당 ?�션???��?지???�함)

??FAQ 8~12�?(?�도???�보??
  본문?�서 ?�루지 ?��? ?�제 궁금�?/ �??��? 2~4문장
  ??말투 최적??(Burstiness): "~거거?�요", "~?�라고요" 같�? 구어�??��????�체 ?��? �?2~3개에�??�연?�럽�??�으?�요. 모든 문장???�에 기계?�으�?붙이???�위??**?��? 금�?**?�니?? 
  ???�양?? "you know?", "you see." 같�? ?�어 추임?�는 매우 ?�물�??�체 글 �?1~2??�??�용?�세??
  FAQ Schema ?�함

??면책조항
  YMYL ??강화 문구 추�?

??관???�스???�롯
  2~3�?/ href="#" 기본�?
  (?�용?��? ?�제 URL ?�공 ??교체)

??마무�?박스
  결론 ?�약 + CTA + ?��?·공유 ?�도
  글 ?�체 ?�일??CTA ?�치

??Schema 구조???�이??
  FAQ + Article JSON-LD / @graph 배열 ?�합
  �?마�?�??�립 배치
  ?�이�?발행 ????�� ?�내

??본문 ?�에 "?�그: ..." ?�스???�입 금�?.


?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━
검???�도�??�션 ?�름 + 구조 ?�턴 가?�드
?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━

?�보?? ?�심 개념 ???�리 ???�제 ?�용 ???�한 ?�해 ???�전 ?????�화
비교?? ?�눈??비교 ??A ?�단????B ?�단?????�황�?추천 ???�사???�기 ??최종 ?�단
?�기?? 구매 ?�유 ??첫인?????�점 ???�점/?�패 ???�간 경과 ????최종 ?��? ??추천 ?�??
거래?? 가�??�택 ???�청 방법 ??주의?�항 ???�제 경험 ??추천 ?�?????�??

??주제???�라 ?�래 15가지 구조 ?�턴 �?1~2개�? ?�합?�여 ?�션 ?�름 ?�계:

  ?�턴 A: 문제 ?�결?????�킹 ??고통 ?�기 ???�인 분석 ???�계�??�결 ??변????FAQ
  ?�턴 B: ?�토리텔링형 ???�패?????�망 묘사 ??깨달?????�략 ?�립 ???�공 ??조언
  ?�턴 C: ??��?��??�형 ??결론 ?�약 ??근거 ???�이?????�용�???기�??�과 ??FAQ
  ?�턴 D: Q&A ?�?�형 ???�자 질문 ???�문가 ?��? ??보층 박스 ???�기 ???�약
  ?�턴 E: ?�계�?가?�드????체크리스????Step 1~7 ??주의?�항 ???��? 검????FAQ
  ?�턴 F: ?�후 비교????Before ??문제 ??조치 ??After ???�치 변??
  ?�턴 G: 체크리스?�형 ?????�어버리????10�???�� ???�유·방법 ???�수 방�? ??FAQ
  ?�턴 H: ?�해 ?�?�형 ???�못???�식 ???�트 체크 ??배경 ?�명 ??진실 ???�문가 조언
  ?�턴 I: ?�층 리뷰?????�용 계기 ??첫인?????�점 3 ???�점 2 ??최종 ?�용????FAQ
  ?�턴 J: 초보 ?�문????개념 ?�의 ??지�??�작 ?�유 ??0??로드�????�장 ?�계 ??
  ?�턴 K: 비용 분석????초기 비용 ?????��?�???가?�비 지????추천 결론 ??FAQ
  ?�턴 L: ?�?�라?�형 ??과거 방식 ???�환?????�재 ?�렌????미래 ?�망 ??준비할 �?
  ?�턴 M: ?�황�??�루?�형 ???�자???????�께???????�급 ????공통 철칙 ??FAQ
  ?�턴 N: ?�단???�방?�형 ???�점 3 ???�점 5 ???�직??결론 ??추천 ?�??
  ?�턴 O: ?�러블슈?�형 ??증상 진단 ???�급 조치 ??근본 ?�인 ???�구 ?�결 ???�발 방�?


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART G ??박스 조합 기본�?
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

박스 4�?
  (A) 경험?????�스??그린
  (B) 꿀?????�스???�로??
  (C) 주의 ???�스???�드
  (D) ?�이??근거 ???�스???�디�?

?�???�도�?기본 조합:
  ?�보?? D + B + C (?�택 추�? A)
  비교?? D + A + B (?�택 추�? C)
  ?�기?? A + C + B (?�택 추�? D)
  거래?? B + C + D (?�택 추�? A)

규칙:
  기본 3�??�수, 4번째???�사 ?�름???�요???�만.
  같�? ?�??최�? 1�?
  ?�속 2�?박스 배치 금�?.
  박스 ?�는 ?�수 ?�스???�션 ??2�?
  ???�사 ?�름�?충돌 ????박스�?빼거???�치�???��??(?�사 ?�선).


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART H ??HTML ?�자???�스??
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[4] HTML 기술 규칙 (3?�랫??공통)

?��? 금�?:
  <style> ?�그, @media 쿼리
  display:flex, display:grid
  position:absolute, position:fixed
  CSS 변??var(--xxx))
  JavaScript, <script> ?�그 (Schema JSON-LD ?�외)
  transform, transition, animation
  ::before, ::after

?��????�용:
  반드???�라??style ?�성�??�용.
  ?��?/?��? ?��??�시??금�?.

?�전 CSS ?�성:
  margin, padding, border, border-left, background, color,
  font-size, font-weight, line-height, text-align, text-decoration,
  border-collapse, width, max-width

주의 ?�성:
  border-radius ???�반 div OK, ?�이블에???�거
  box-shadow ???�식?�만, ?�이�?금�?
  overflow:hidden ???�이�?금�?


  [5] ?�자??컴포?�트

[5-1] 목차 (TOC) ??Modern Glassmorphism ?�낌
  ?��??? margin 40px 0 / padding 24px 28px / background #f8f9fc / border 1px solid #e2e8f0 / border-radius 16px / box-shadow 0 4px 6px rgba(0,0,0,0.02)
  ?�목: ?��   ?�목: Table of Contents (?�는 목차) / bold 20px #1e293b / margin-bottom 16px

  ??��: ul list-style:none / padding:0 / margin:0 / a?�그 #334155 / 16px / line-height 2.0 / ?�스???�코 ?�음
  ?�커: 본문 h2??id?� ?�치 (?�문 ?�러�?

[5-2] 본문 ?�목 h2 ??Premium Clean Style
  font-size 26px / bold / color #0f172a / border-bottom 2px solid #e2e8f0
  padding-bottom 12px / margin 56px 0 24px
  ??[?�자?�실???�자??규칙]: 무�?개색 촌스?�운 배경???��? 금�?! ?�직 ?�스???�체?� 깔끔??밑줄로만 ?��???�? 배경??s1, s2 ?????�절 비워?�세??
  id: ?�문 ?�러�?(?? id="electricity-cost") / ?��? id 금�?

[5-3] 본문 ?�락 p
  line-height 1.8 / color #334155 / font-size 17px / margin 20px 0 / word-break keep-all

[5-4] 강조 박스 4�???Soft Pastel Tone (모든 박스??overflow:hidden; clear:both; ?�정 ?�수)
  ??배치 규칙: 박스???��?�?문단 중간???�워 ?��? 마세?? ?�당 ?�션??모든 ?�스???�명???�난 최하?�에 배치?�여 ?�각?�인 마침????��???�게 ?�세??

  (A) ?�사?�트 (Insight)
  배경 #f0fdf4 / 좌측 보더 4px #22c55e / radius 12px / padding 20px 24px / color #166534 / font-size 16px
  ?�� ?�심 ?�인??(?�는 Key Insight) / bold 18px #15803d / margin-bottom 8px



  (B) ?�문가 꿀??(Pro Tip)
  배경 #fefce8 / 좌측 보더 4px #eab308 / radius 12px / padding 20px 24px / color #854d0e / font-size 16px
  ?�� Smileseon's Pro Tip (?�는 ?�마?�선??꿀?? / bold 18px #a16207 / margin-bottom 8px



   (C) 치명??주의 (Warning)
   배경 #fef2f2 / 좌측 보더 4px #ef4444 / radius 12px / padding 20px 24px / color #991b1b / font-size 16px
   ?�� Critical Warning (?�는 ?��? 주의?�세?? / bold 18px #b91c1c / margin-bottom 8px



   (D) ?�뢰 ?�이??(Data)
   배경 #eff6ff / 좌측 보더 4px #3b82f6 / radius 12px / padding 20px 24px / color #1e40af / font-size 16px
   ?�� Fact Check (?�는 ?�트 체크) / bold 18px #1d4ed8 / margin-bottom 8px

[5-5] FAQ ?�션 ??Clean Accordion Style
  ?�체 ?�퍼: background #f8fafc / border 1px solid #e2e8f0 / radius 16px / padding 32px
  개별 Q: bold 18px #334155 / margin 0 0 8px 0 / Q. �??�작
  개별 A: color #475569 / 16px / line-height 1.7 / margin 0 0 24px 0 (마�?�?A??margin-bottom 0)
  5�?고정

[5-6] ?�리미엄 ?�이???�이�?(?�수 1�?
  width 100% / border-collapse:collapse / margin 40px 0 / text-align left
  ?�더(th): background #f1f5f9 / color #334155 / font-weight 700 / padding 16px / border-bottom 2px solid #cbd5e1 / font-size 16px
  본문(td): padding 16px / border-bottom 1px solid #e2e8f0 / color #475569 / font-size 15px
  ?� ???�스?�는 개조?�으�?최�???짧게(?�마?�폰 가?�성 ?��?

[5-7] 공식 바로가�?버튼 (최�? 2�?
  p: text-align center / margin 32px 0
  a ?�그: href="검?�된 ?�제공식링크" rel="noopener nofollow" target="_blank"
  span ?�그 ?�성: style="display:inline-block; padding:16px 40px; background-color:#2563eb; color:#ffffff; font-weight:700; font-size:18px; border-radius:30px; box-shadow:0 4px 14px rgba(37, 99, 235, 0.39);"

[5-8] 본문 보충 ?��?지 ?�입 ?�치 지??(H2 ?�션 2개당 1개씩 ?�입)
  ?�용 ?�식:
    ?�진???��?지�??�동 ?�입?????�도�? H2 ?�션??2�?지?�갈 ?�마???�목 바로 ?�래???�당 ?�번??맞는 치환 ?�그�??�입?�세??
    (?? ??번째 H2 ?�목 ?�래??[[IMG_1]], ??번째 H2 ?�목 ?�래??[[IMG_2]] ... 최�? [[IMG_3]] ?�외�??�입)

  ?�성 규칙:
    - [?��?지 ?�입] 같�? ?�내 문구??dashed ?�두�?박스 ??HTML ?�자?�을 ?��? ?�우지 마세??
    - ?�직 ?�의 [[IMG_n]] 같�? ?�스?�만 ?�으�??�스?�이 ?�제 ?��?지�?변?�합?�다.
    - �??��?지???�롬?�트?� alt??JSON??image_prompts ??��???�성?�니??

  배치 ?�략:
    - 글??지루해지지 ?�도�? H2 ?�스?��? 2개째 ?�장?�는 ?�?�밍마다 ?�입?�여 ?�자???�선???�절?�게 ?�기?�세??

[5-9] 면책조항
  배경 #F9FAFB / border 1px solid #E5E7EB / radius 8px / padding 16px / overflow hidden
  ?�스?? 13px / #999 / line-height 1.7 / margin 0
  기본�? "�??�스?��? 개인 경험�?공개 ?�료�?바탕?�로 ?�성?�었?�며, ?�문?�인 ?�료·법률·?�무 조언???�체하지 ?�습?�다. ?�확???�보???�당 분야 ?�문가 ?�는 공식 기�????�인?�시�?바랍?�다."
  YMYL 추�?�? "�?글???�용?� ?�보 ?�공 목적?�며, 개인 ?�황???�라 결과가 ?��? ???�습?�다. 반드???�문가?� ?�담 ??결정?�시�?바랍?�다."

[5-10] ?��? ?�스??�??�카?�브 ?�롯 (?�러?�터 구조 최적??
  ??주의: (A)?� (B)??배치 ?�치?� ?�식???�전???�릅?�다.

  (A) [CLUSTER_LINKS]: ?�재 ?�러?�터???�심 ?�브 글??(메인 ?�스?�에?�만 ?�용)
    - 배치 ?�치: 모든 글??마�?막이 ?�닌, 본문 ?�성 �??���?H2 ?�션???�명???�나??부분🌟에 ??개씩 분산?�켜 ?�입?�십?�오. (?�용�??��????�션 ?�단??최소 1개씩 ?�연?�럽�??�여??�?
    - ?�식: ?�리미엄 컨텍?�트 ?�?�드 버튼
    - 코드: <div style='margin: 40px 0;'><p style='font-size:16px; font-weight:700; color:#334155;'>?�� Related Deep Dive:</p><a href='URL' class='cluster-btn'>?�목 ??/a></div>
    - ???��? 규칙: <a> ?�그 ?�에 ?�로??<span> ?�그�?만들�??�라???��??�을 먹이??중복 ?�자?�을 ?��? ?��? 마세?? ?�직 ??코드 ?�태 문구�??�스?�로 치환?�서 ?�으?�요.
  
  (B) [ARCHIVE_LINKS]: ?�재 주제?� ?�괸??블로�????�른 글??(모든 ?�스???�단 공통)
    - 배치 ?�치: 본문�?[5-11] 마무�?박스가 모두 ?�난 ???�스?�의 ?��가??마�?�?부�?최하???��???�입
    - ?�식: 깔끔??불렛 ?�태???�스??리스??
    - ?�목: ?�� Related Insights (?�께 ?�으�?좋�? ?��? ?�보)
    - 코드: <ul style='margin:20px 0; padding-left:20px; color:#64748b; font-size:15px; border-top:1px solid #f1f5f9; padding-top:20px;'><li><a href='URL' style='color:#3b82f6; text-decoration:underline;'>글 ?�목</a></li>...(최�? 5�?...</ul>
    - ??중요: ?�공??리스?�에 ?�는 글 5개�? 무조�???번에 묶어???�스??최하?�에 빠짐?�이 ?�입?�십?�오.

[5-11] 마무�?박스
  배경 #F9FAFB / border 1px solid #E5E7EB / radius 12px / padding 20px / overflow hidden / clear both
  결론 ?�약 1~2문장 ???�겟별 개인???�문(불렛 금�?)
  ??hr ??CTA + ?��?·공유 ?�도


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART I ??Schema 구조???�이??
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

글 �?마�?�?마무�?박스 ?�래)??<script type="application/ld+json"> ?�입.
??Schema�?@graph 배열�??�합.

Article Schema:
  "@type": "Article"
  "headline": h1 ?�목�??�일
  "description": ?�니???�입부 150???�약
  "author": {"@type": "Person", "name": "(미제�???공�?)"}
  "datePublished": "YYYY-MM-DD"
  "dateModified": "YYYY-MM-DD"

FAQ Schema:
  "@type": "FAQPage"
  "mainEntity": FAQ 5�??��? ?�함

?�랫?�별:
  블로그스???�드?�레?? Schema ?�함 발행
  ?�이�? Schema 블록 ??�� ??발행


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART J ??E-E-A-T ?�질 ?�진
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[Experience ??경험] ??최우??(AI ?��? ?�벽 ?�피)

1. **?�간??결함(Human Flaws)**: ?�?�의 과거 ?�수?? ?�회, ?�황?�던 ?�간??1?�칭 ?�점?�로 1�??�상 ?�함??�?(?? "?�??처음???�거 몰라???????�렸?�거?�요..", "?�직??고백?�자�?.").
2. **?�장 ?�어(Insider Slang)**: ?�전???��?가 ?�닌, ?�계 ?�장?�서�??�는 ?�생???�현�?비유�??�을 �?(?? "?��???과자처럼 구워�??�태", "?�선???�파게티처럼 꼬인").
3. **?�백??문법**: ?�보�?가르치???��? 말고, ?�잣말이???�자?�게 ???��???질문("?�러분�? ?�떠?��???", "?�게 말이 ?�나??")??문단 ?�에 배치?�여 ?�벽?�게 리듬감을 �?�?


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART P ??HTML 구조??지�?지?�기 (Anti-AI Signature)
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

1. **?�간??주석 ?�입**: HTML 코드 중간???�람???�긴 ??�� 주석??3~4�??�덤?�게 ?�입?�라. (?? <!-- Smileseon's update: content added for clarity -->, <!-- Check SEO performance later -->).
2. **?�이?�웃 리듬 ?�괴**: �??�션마다 H2 ??P ??박스 ?�서�??�성?��? 마라. ?�떤 ?�션?� 박스�?가??먼�? 배치?�고, ?�떤 ?�션?� P ??H3 ??P ?�으�?가거나 박스�?2�??�속 배치?�기???�는 ??불규칙성??부?�하??
3. **?�맨???�그 ?�양??*: 모든 컨테?�너�?div로만 채우지 말고, aside, blockquote, section, figure ?�을 ?�극?�으�??�어???�성?�라. 기계?�인 ?��??�이 보이???�간 ?�패??


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART K ??SEO & ?�드?�스 ?�익 최적??
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

SEO: h1 1�? h2 6~7�??�워???�함, 리치 ?�니???�출 목표.
?�수?? h2 간격 48px, ?��?지 4�??�략 배치, 4,000?? 분량 ?�보.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART L ??YMYL ?�전 규칙
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

건강, ?�무, 법률, ?�전 주제 ??직접 조언 금�?. ?�문가 ?�담 권장 문구 �?공식 보더 보강. 분량 1,000??가??


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART M ???�품/?�비??리뷰 추�? 규칙
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

?�단??�?2�? ?�용 ?�나리오, 추천 ?�?? 가�??��?가�? 경쟁 ?�품 비교 ?�함.


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART N ??최종 검�?(2?�계)
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

[?�전 ?�계] PRE 1~8 (?�도 ?�별, 리서�? 구조 ?�정)
[?�후 검?? POST 1~15 (구조, 금�? ?�현, 박스 규칙, EEAT, URL, 분량 체크)


?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═
  PART O ???�행
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═

?�식:
  마크?�운 코드블록(\`\`\`) ?�에 HTML ?�스코드 (<h1>�??�작)
  코드블록 바깥?�만: ?�� ?�러?�터 ?�워?? ?�� ?�머링크, ?���??�벨, ?�� 검???�명, ?���??��?지 ?�롬?�트

# ?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━
# [VUE STUDIO ULTIMATE ADD-ON: ADDITIONAL RULES]
# ?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━?�━

1. **?�르?�나 최적??*: ?�문가 ?�을 ?��??�되, ?��?�???친근??구어�?"~거거?�요", "~?�라고요", "~??거예??, "~?�아??)�?변?�하??
2. **분량 ?�한??강제**: ?�수 ?�국???�스??기�? 4,000??미만 ?�성 금�?.
3. **마크?�운 ?�전 금�?**: 본문 ??별표(*)????#) 기호 ?��? 금�?.
4. **FAQ ?�장**: 반드??8~10개의 고품�?FAQ�??�성?�라.
5. **강제 ?�사 3?� ?�소**: ?�패/?�회??1�? 비교 분석 1�? ?�계 비�? ??�� 1�??�수 ?�함.
6. **JSON ??�?출력**: content ?��???물리??줄바�??��? 금�?.
`;

const STYLE = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap');
  
  /* ?�역 컨테?�너 */
  .vue-premium { 
    font-family: 'Pretendard', sans-serif; 
    color: #334155; 
    line-height: 1.85; 
    font-size: 17px; 
    max-width: 840px; 
    margin: 0 auto; 
    padding: 40px 24px; 
    word-break: keep-all; 
    background-color: #ffffff;
  }
  
  /* 본문 ?�스??*/
  .vue-premium p { 
    margin: 30px 0; 
    letter-spacing: -0.015em; 
  }
  
  /* H2 (?�션 ?�목) - 그라?�이??�??�련???�자??*/
  .vue-premium h2 { 
    font-size: 28px; 
    font-weight: 800; 
    color: #0f172a; 
    margin: 80px 0 35px; 
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .vue-premium h2::before {
    content: '';
    display: block;
    width: 6px;
    height: 32px;
    background: linear-gradient(to bottom, #3b82f6, #6366f1);
    border-radius: 4px;
  }
  
  /* H3 (?�제�? */
  .vue-premium h3 {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin: 45px 0 20px;
  }

  /* 목차 ?�자 */
  .toc-box { 
    background: #f1f5f9; 
    border: 1px solid #e2e8f0; 
    border-radius: 16px; 
    padding: 30px 35px; 
    margin: 45px 0; 
  }
  .toc-box h3 { margin-top: 0; font-size: 19px; margin-bottom: 20px; }
  .toc-box ul { list-style: none; padding: 0; margin: 0; }
  .toc-box li { margin-bottom: 15px; position: relative; padding-left: 25px; }
  .toc-box li::before { content: '??; position: absolute; left: 0; color: #3b82f6; font-size: 10px; top: 4px; }
  .toc-box a { color: #475569; text-decoration: none; font-weight: 500; }

  /* ?? 경고, ?�사?�트, ?�이???�자 ?�합 ?�자??*/
  .tip-box, .warn-box, .insight-box, .data-box { border-radius: 16px; padding: 26px 30px; margin: 40px 0; position: relative; border: 1px solid transparent; }
  
  .tip-box { background: #f0fdf4; border-color: #dcfce7; color: #166534; }
  .warn-box { background: #fff1f2; border-color: #ffe4e6; color: #991b1b; }
  .insight-box { background: #fdf2f8; border-color: #fce7f3; color: #9d174d; }
  .data-box { background: #eff6ff; border-color: #dbeafe; color: #1e40af; }

  /* ?�이�?*/
  .vue-premium table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 45px 0; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; }
  .vue-premium th { background: #f8fafc; padding: 20px; font-weight: 700; }
  .vue-premium td { padding: 18px 20px; border-top: 1px solid #f1f5f9; }

  /* 버튼 */
  .cluster-btn {
    display: block;
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    color: white !important;
    padding: 16px 30px;
    border-radius: 12px;
    text-decoration: none !important;
    font-weight: 700;
    text-align: center;
    margin: 30px 0;
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
  }

  /* 마무�??�자 (?�이???�스???�렌지 ?�마) */
  .closing-box { background: #fff7ed; border: 2px dashed #fed7aa; color: #9a3412; padding: 45px; border-radius: 24px; margin: 80px 0; text-align: center; }
  .closing-box h2 { justify-content: center; margin-top: 0; color: #ea580c; border: none; }
  .closing-box h2::before { display: none; }
  .closing-box p { font-style: italic; font-size: 19px; color: #c2410c; }
  .disclaimer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 100px 0 40px; color: #64748b; font-size: 13.5px; line-height: 1.6; text-align: justify; word-break: keep-all; }
  .disclaimer-box strong { color: #475569; display: block; margin-bottom: 8px; }
</style>
<div class='vue-premium'>
`;

function getKST() {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + kstOffset);
}



function report(msg, type = 'info') {
    const icon = type === 'success' ? '\u2705' : type === 'warning' ? '\u26A0\uFE0F' : type === 'error' ? '\u274C' : '\u2139\uFE0F';
    const logMsg = `[${getKST().toLocaleTimeString('ko-KR')}] ${icon} ${msg}`;
    console.log(logMsg);
}





function clean(raw, mode = 'text') {
    if (!raw) return mode === 'arr' ? '[]' : '';
    let txt = raw.replace(/```(html|json|javascript|js|css)?/gi, '').replace(/```/g, '').trim();
    if (mode === 'arr') {
        const start = txt.indexOf('[');
        const end = txt.lastIndexOf(']');
        if (start !== -1 && end !== -1) txt = txt.substring(start, end + 1);
    }
    return txt;
}



async function callAI(model, prompt) {
    try {
        const res = await model.generateContent(prompt);
        return res.response.text();
    } catch (e) {
        const msg = e.message.toLowerCase();
        if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            report('?[API ? 당?초과] 60 ?? 시 ? 도? 니?..', 'warning');
            await new Promise(r => setTimeout(r, 60000));
            return callAI(model, prompt);
        }
        throw e;
    }
}

async function searchSerper(query, lang) {
    try {
        report(`?   [? 시 ?리서 ?: "${query}" 관?구 ? 검?? 이?? 집  ?..`);
        const res = await axios.post('https://google.serper.dev/search', { q: query, gl: lang === 'ko' ? 'kr' : 'us', hl: lang }, { headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }, timeout: 15000 });
        const data = res.data.organic || [];
        const result = { text: data.slice(0, 5).map(o => `Title: ${o.title}\nSnippet: ${o.snippet}`).join('\n\n') };
        report(`?   [? 이?? 보]: ? 위 ${data.length} ?검?결과 분석 ? 료`);
        return result;
    } catch (e) {
        report(`? ️ [Serper ? 러]: ${e.message}`, 'warning');
        return { text: '' };
    }
}


async function uploadToGithub(buffer, filename) {
    try {
        const user = process.env.GITHUB_USER;
        const repo = process.env.GALLERY_REPO;
        const token = process.env.GITHUB_TOKEN || process.env['github-token'];
        
        if (!user || !repo || !token) {
           console.log('? Missing GitHub Gallery Credentials: user=' + user + ', repo=' + repo);
           return '';
        }
        
        const path = `images/${Date.now()}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        const content = buffer.toString('base64');
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
        
        await axios.put(url, {
            message: `Auto-upload from VUE Studio: ${filename}`,
            content: content
        }, {
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }
        });
        
        const finalUrl = `https://cdn.jsdelivr.net/gh/${user}/${repo}/${path}`;
        console.log('? GitHub Gallery Upload Success: ' + finalUrl);
        return finalUrl;
    } catch (e) {
        console.log('⚠️ GitHub Upload Error: ' + (e.response?.data?.message || e.message));
        return '';
    }
}

async function genImg(prompt, model, idx, ratio = '16:9', autoUpload = true) {
    try {
        const revised = await callAI(model, `Provide a high-quality stable diffusion prompt (${ratio}) based on: ${prompt}. Output only prompt.`);
        const cleanPrompt = revised.trim().replace(/^"|"$/g, '');
        report(`?   [?  ?지 ? 계]: ${cleanPrompt.substring(0, 100)}${cleanPrompt.length > 100 ? '...' : ''}`);

        let imageUrl = '';
        const kieKey = process.env.KIE_API_KEY;

        // 1. Kie.ai (Premium Image Generation)
        if (kieKey && kieKey.length > 5) {
            try {
                report(`   ?[Kie.ai] z-image ? 출  ?(?  ?지 ? 성)...`);
                const cr = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
                    model: 'z-image',
                    input: { prompt: revised + ', high-end, editorial photography, 8k', aspect_ratio: ratio }
                }, { headers: { Authorization: 'Bearer ' + kieKey }, timeout: 20000 });

                const tid = cr.data.taskId || cr.data.data?.taskId;
                if (tid) {
                    for (let a = 0; a < 15; a++) {
                        await new Promise(r => setTimeout(r, 6000));
                        const pr = await axios.get('https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + tid, { headers: { Authorization: 'Bearer ' + kieKey }, timeout: 10000 });
                        const state = pr.data.state || pr.data.data?.state;
                        if (state === 'success') {
                            const resData = pr.data.resultJson || pr.data.data?.resultJson;
                            const resJson = typeof resData === 'string' ? JSON.parse(resData) : resData;
                            imageUrl = resJson.resultUrls[0];
                            break;
                        }
                        if (state === 'fail' || state === 'failed') break;
                    }
                }
            } catch (e) { report(`   ?[Kie.ai] 중단 (${e.message}): ? 음 ? 진 ? 환`, 'warning'); }
        }

        // 2. Pollinations.ai (FLUX Fallback)
        if (!imageUrl) {
            const [w, h] = ratio === '2:3' ? [800, 1200] : [1080, 720];
            imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(revised)}?width=${w}&height=${h}&seed=${Math.floor(Math.random() * 99999)}&nologo=true&enhance=true`;
        }

        // 3. ImgBB Upload (? 구 보 ?)
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (res.status !== 200) throw new Error("Image download failed");

        return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
    } catch (e) {
        try {
            // Level 2 Fallback: High quality stock photo
            const seed = prompt.replace(/[^a-zA-Z]/g, '').substring(0, 10) + idx;
            const fallbackUrl = `https://picsum.photos/seed/${seed}/1080/720`;
            const fbRes = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 5000 });
            return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
        } catch (fallbackErr) {
            // Level 3 Fallback: Canvas Error Image
            try {
                const cv = createCanvas(1080, 720);
                const ctx = cv.getContext('2d');
                const h = Math.floor(Math.random() * 360);
                const grad = ctx.createLinearGradient(0, 0, 1080, 720);
                grad.addColorStop(0, `hsl(${h}, 70%, 40%)`);
                grad.addColorStop(1, `hsl(${h + 60}, 70%, 20%)`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 1080, 720);

                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.arc(Math.random() * 1080, Math.random() * 720, Math.random() * 300 + 100, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
                ctx.font = 'bold 45px sans-serif';
                ctx.fillText('Dynamic Display Image', 540, 360);
                return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
            } catch (e) { return ''; }
        }
    }
}

async function genThumbnail(meta, model, ratio = '16:9') {
    try {
        const bgBuffer = await genImg(meta.bgPrompt || meta.mainTitle, model, 0, ratio, false);
        const bg = await loadImage(bgBuffer);
        const isPin = ratio === '2:3';
        const w = isPin ? 800 : 1200;
        const h = isPin ? 1200 : 630;
        const cv = createCanvas(w, h);
        const ctx = cv.getContext('2d');

        ctx.drawImage(bg, 0, 0, w, h);

        // 그라? 이?? 버? 이 ? 스?가? 성 ? 보
        const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;

        const mainTitle = (meta.mainTitle || meta.prompt || '').trim();
        const words = mainTitle.split(' ');
        let fontSize = isPin ? 65 : 60;
        ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Pretendard", sans-serif`;

        let line = '';
        let lines = [];
        let maxLineW = w * 0.85;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxLineW && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        // ? 스?  ? 무 많으 ? 트 ? 기 ? 동 축소
        if (lines.length > 4) {
            fontSize = Math.floor(fontSize * 0.82);
            ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Pretendard", sans-serif`;
        }

        let y = isPin ? (h / 2) - (lines.length * (fontSize + 15) / 2) + 20 : (h * 0.5) - (lines.length * (fontSize + 15) / 2) + 15;
        for (let l of lines) {
            ctx.fillText(l, w / 2, y);
            y += fontSize + 15;
        }

        return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
    } catch (e) {
        return await genImg(meta.mainTitle || meta.prompt, model, 0, ratio);
    }
}

async function writeAndPost(model, target, lang, blogger, bId, pTime, extraLinks = [], idx, total, persona = '') {
    const { text: searchData } = await searchSerper(target, lang);
    let pillarContext = '';

    if (extraLinks.length > 0) {
        const links = extraLinks.map((l, idx) => `[Spoke ${idx + 1}] Title: ${l.title}, URL: ${l.url}`).join('\n');
        const isKo = lang === 'ko';
        const btnText = isKo ? "\uc790\uc138\ud788 \ubcf4\uae30 \ud83d\ude80" : "Read More \ud83d\ude80";
        const contextPrompt = isKo
            ? `[INTERNAL_LINK_PUNITIVE_MISSION]: ?? 스?  ? 메인 ? 브(Pillar) 글? 니? 
            ??  ? 규칙: ? 래 ? 공?${extraLinks.length}개의 ? 브 글 ? 약 ? 션 ? 에?**반드?각각 ? 나?* ? 래 버튼 코드 ? 입? 세?
            코드 ? 시: <a href='? 브글URL' class='cluster-btn'>${btnText}</a>
            ? 락 ?SEO ? 략?? 전?? 패?  ? ? 확?${extraLinks.length}개의 버튼?본문 곳곳?박 ? 어?? 니?`
            : `[INTERNAL_LINK_PUNITIVE_MISSION]: This is a Pillar post. 
            ?STRICT RULE: After EACH of the following ${extraLinks.length} summary sections, you MUST insert the following button code:
            Example: <a href='SpokeURL' class='cluster-btn'>${btnText}</a>
            Total ${extraLinks.length} buttons are REQUIRED. Failure to include these links will result in a penalty.`;
        pillarContext = `\n${contextPrompt}\n${links}`;
    }

    const personaTag = persona ? `\n[SPECIFIC_PERSONA]: ${persona}` : '';
    const langTag = `\n[TARGET_LANGUAGE]: ${lang === 'ko' ? 'Korean' : 'English'}${personaTag}`;
    report(`?   [${idx}/${total}] 집필 ? 작: ${target}`);
    report(`?   [AI ? 롬? 트 ? 성  ?: 리서 ? 이?${searchData.length}?? 함...`);

    const h1Instruction = lang === 'ko'
        ? "<h1>(10? 차 SEO ? 문가?구 ? 단 ? 출?? 한 롱테?? 워?? 목)</h1>"
        : "<h1>(SEO Optimized Long-tail Keyword Title for Google Ranking)</h1>";

    // MISSION 분량 ? 보 ? 한 강력?지 ?추 ?
    const m1Prompt = MASTER_GUIDELINE + `
[MISSION: FULL POST GENERATION] 
? 확?? 래 ? 맷?맞춰??번에 모든 글?? 성? 야 ? 니? ?  ? 맷?? 기지 마세?
? 체 글 분량?  6,000?8,000?? 상 ? 보? 도 ? 세? 게 ? ?? 세? ? 히, 짧게 ? 어가지 말고 본문?? 션 ? 명?매우 길게 ? 려?? 니?

[? 수 ? 자?컴포? 트 - 반드?본문?? 함? 세?:
?배치 ? 략:
    - 글?지루해지지 ? 도 ? H2 ? 스?  ? 2개째 ? 장? 는 ? 밍마다 ? 입? 여 ? 자?? 선?? 절? 게 ? 기? 세?
    - **[Time Awareness]**: Today's date is ${getKST().toISOString().split('T')[0]}. Always write based on the latest available information as of today. If referencing years, focus on the current year and future trends.

(A) ? 사? 트 박스 ?<div class='insight-box'><strong>?   Key Insight</strong><br>? 심 ? 인?? 용</div> ?최소 2 ?
(B) ? 문가 꿀??<div class='tip-box'><strong>?   Smileseon's Pro Tip</strong><br>꿀?? 용</div> ?최소 2 ?
(C) 면책 조항 (Disclaimer): 반드?글?최하? 에 ? 치? 키 ? 이블을 강조? 세?
(D) 치명?주의 ?<div class='warn-box'><strong>?   Critical Warning</strong><br>주의 ? 용</div> ?최소 1 ?
(E) ? 뢰 ? 이??<div class='data-box'><strong>?   Fact Check</strong><br>? 트 체크 ? 용</div> ?최소 2 ?
(F) 마무 ?박스 ?<div class='closing-box'><h2>최종 마무 ?/h2><p>? 심 ? 약</p></div> ?글  ?마 ?막에 반드?1 ?
(G)  ? 션?가? 하 ?<table> ? 함 (4? x4?? 상?비교 ? 이?
(H) FAQ ? 션?최소 8~10개의 Q&A ? 함

[META_DATA_START]
{
  "IMG_0": { "mainTitle": "? 네? 용 매력? 인 짧 ? 목", "bgPrompt": "? 네?배경 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_1": { "prompt": "본문 첫번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_2": { "prompt": "본문 ? 번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_3": { "prompt": "본문 ? 번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_PINTEREST": { "prompt": "Pinterest ? 용 ? 로?2:3) 고퀄리??  ?지 묘사 ? 문 ? 롬? 트" }
}
[META_DATA_END]

[CONTENT_START]
${h1Instruction}
<div class='toc-box'>
  <h3>Table of Contents</h3>
  <ul>
    <li><a href='#section-1'>첫번 ? 션 ? 목</a></li>
    <li><a href='#section-2'>? 번 ? 션 ? 목</a></li>
  </ul>
</div>
<h2 id='section-1'>첫번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='insight-box'><strong>?   Key Insight</strong><br>? 사? 트 ? 용</div>
[[IMG_1]]
<h2 id='section-2'>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='tip-box'><strong>?   Smileseon's Pro Tip</strong><br>꿀?? 용</div>
<h2>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='data-box'><strong>?   Fact Check</strong><br>? 이?? 용</div>
[[IMG_2]]
<h2>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='warn-box'><strong>?   Critical Warning</strong><br>주의 ? 용</div>
[[IMG_3]]
... ? 까지 (8~10개의 FAQ, closing-box 마무 ? 함)
<div class='closing-box'><h2>최종 마무 ?/h2><p>? 심 ? 약</p></div>
[CONTENT_END]

?경고: 본문 ? 에 ?  ?지 ? 입부? 는 ?  ? ?<img src=...> ? 그 ?  ? 말고, ? 직 [[IMG_1]], [[IMG_2]], [[IMG_3]]  ?같 ? 치환? 만 ? 으? 요.
${target}
${searchData}
${pillarContext}
${langTag}`;

    const m1 = await callAI(model, m1Prompt);

    let finalHtml = '';
    let m0 = null;
    const imgMetas = {};

    // === 메 ? 이?? 싱 (? 규 ? 맷 + ? 거?? 맷 모두 지? ===
    try {
        const metaMatch = m1.match(/\[META_DATA_START\]([\s\S]*?)\[META_DATA_END\]/i);
        if (metaMatch) {
            const cleanJsonStr = metaMatch[1].replace(/```json/i, '').replace(/```/g, '').trim();
            const metaJson = JSON.parse(cleanJsonStr);
            if (metaJson.IMG_0) m0 = metaJson.IMG_0;
            if (metaJson.IMG_1) imgMetas[1] = metaJson.IMG_1;
            if (metaJson.IMG_2) imgMetas[2] = metaJson.IMG_2;
            if (metaJson.IMG_3) imgMetas[3] = metaJson.IMG_3;
            if (metaJson.IMG_PINTEREST) imgMetas['P'] = metaJson.IMG_PINTEREST;
        }
    } catch (e) { report('? ️ ? 규 메 ? 싱 ? 패, ? 거?? 싱 ? 도', 'warning'); }

    // ? 거?? 맷 ? 싱 (IMG_0: { mainTitle: "...", bgPrompt: "..." })
    if (!m0) {
        const legacyRegex = /IMG_(\d+):\s*\{([^}]*)\}/gi;
        let lm;
        while ((lm = legacyRegex.exec(m1)) !== null) {
            const i = Number(lm[1]), raw = lm[2];
            if (i === 0) m0 = { mainTitle: (raw.match(/mainTitle:\s*['"](.*?)['"]/i) || [])[1] || target, bgPrompt: (raw.match(/bgPrompt:\s*['"](.*?)['"]/i) || raw.match(/prompt:\s*['"](.*?)['"]/i) || [])[1] || target };
            else imgMetas[i] = { prompt: (raw.match(/prompt:\s*['"](.*?)['"]/i) || [])[1] || target };
        }
    }

    if (!m0) m0 = { mainTitle: target, bgPrompt: 'Abstract premium background' };

    // === 본문 추출 ===
    const contentMatch = m1.match(/\[CONTENT_START\]([\s\S]*?)\[CONTENT_END\]/i);
    if (contentMatch) {
        finalHtml = contentMatch[1].trim();
    } else {
        const metaEndIdx = m1.indexOf('[META_DATA_END]');
        finalHtml = metaEndIdx !== -1 ? m1.substring(metaEndIdx + 15).trim() : clean(m1, 'text');
    }

    // === 본문? 서 메 ? 이?? 여 ? 전 ? 거 (최강 ? 규? ===
    finalHtml = finalHtml.replace(/\[META_DATA_START\][\s\S]*?\[META_DATA_END\]/gi, '');
    finalHtml = finalHtml.replace(/\[CONTENT_START\]/gi, '').replace(/\[CONTENT_END\]/gi, '');
    finalHtml = finalHtml.replace(/IMG_\d+\s*[:=]\s*\{[\s\S]*?\}/gi, '');
    finalHtml = finalHtml.replace(/\{\s*"IMG_\d+"[\s\S]*?\}/g, '');
    finalHtml = finalHtml.replace(/```json[\s\S]*?```/gi, '');
    finalHtml = finalHtml.replace(/^\s*text\s*$/gm, '');
    finalHtml = finalHtml.trim();

    let finalTitle = target;
    const h1Match = finalHtml.match(/<h1.*?>([\s\S]*?)<\/h1>/i);
    if (h1Match) finalTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
    finalHtml = finalHtml.replace(/<h1.*?>[\s\S]*?<\/h1>/gi, '').trim();

    if (m0) {
        const url0 = await genThumbnail(m0, model);
        finalHtml = `<img src='${url0}' alt='${m0.mainTitle}' style='width:100%; border-radius:15px; margin-bottom:40px;'>` + finalHtml.replace(/\s*\[\[IMG_0\]\]\s*/gi, '');
    }
    for (let i = 1; i <= 3; i++) {
        const reg = new RegExp(`\\s*\\[\\[IMG_${i}\\]\\]\\s*`, 'gi');
        if (reg.test(finalHtml)) {
            const urlI = await genImg((imgMetas[i] || {}).prompt || target, model, i);
            finalHtml = finalHtml.replace(reg, `<div style='text-align:center; margin:35px 0;'><img src='${urlI}' alt='${target}' style='width:100%; border-radius:12px;'></div>`);
        } else {
            // 만약 치환?  ? 다 ?H2 ? 그 ? 에 강제 ?  ?지 ?주입
            const urlI = await genImg((imgMetas[i] || {}).prompt || target, model, i);
            let injected = false;
            let count = 0;
            finalHtml = finalHtml.replace(/<h2/gi, (match) => {
                count++;
                if (count === (i * 2)) {
                    injected = true;
                    return `<div style='text-align:center; margin:35px 0;'><img src='${urlI}' alt='${target}' style='width:100%; border-radius:12px;'></div>\n<h2`;
                }
                return match;
            });
        }
    }

    // === [IMG_PINTEREST] 처리 (2:3 ? 직 ?  ?지 - 최상?? 든 ? 네? ===
    const pinReg = /\s*\[\[IMG_PINTEREST\]\]\s*/gi;
    const pinMeta = imgMetas['P'] || { mainTitle: target, bgPrompt: target + " vertical pinterest style" };
    const urlPin = await genThumbnail(pinMeta, model, '2:3');
    const pinHtml = `<div style='display:none;'><img src='${urlPin}' alt='Pinterest Optimized - ${target}'></div>`;

    // 무조 ?최상? 에 ? 든? 로 ? 입 (기존 치환? 는 ? 거)
    finalHtml = pinHtml + finalHtml.replace(pinReg, '');

    finalHtml = finalHtml.replace(/\[\[IMG_\d+\]\]/gi, '').trim();

    // [CRITICAL FIX]: Remove redundant hardcoded disclaimer here because AI will generate it based on Master Guideline.
    // This prevents double disclaimer issue.
    const res = await blogger.posts.insert({ blogId: bId, requestBody: { title: finalTitle, content: STYLE + finalHtml + '</div>', published: pTime.toISOString() } });
    report(`?   ?[? 스?? 공]: "${finalTitle}"`, 'success');
    report(`?   [URL]: ${res.data.url}`);
    return { title: finalTitle, url: res.data.url };
}

async function run() {
    const config = JSON.parse(fs.readFileSync('cluster_config.json', 'utf8'));
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const blogger = google.blogger({ version: 'v3', auth });

    report(`? ️ ? 정?로드? 습? 다. (? 어: ${config.blog_lang}, 모드: ${config.post_mode})`);

    report('?   ?[Turbo Full-Mode]: ? 리미엄 ? 러? 터 구축 ? 작');

    let baseKeyword = config.pillar_topic || 'PC Hardware';
    const categories = {
        "1": { name: "PC Repair & Maintenance", query: "PC repair maintenance tips guide 2026", persona: "15?경력?베테?PC ? 비? },
        "2": { name: "Latest Hardware & Parts", query: "latest PC components hardware news 2026", persona: "? 드? 어 벤치마크 ? 문 리뷰? },
        "3": { name: "Gaming & Peripherals", query: "best gaming gear peripherals trends 2026", persona: "? 로게이 ?출신?게이 ?기어 ? 문가" },
        "4": { name: "AI & Future Technology", query: "future AI technology trends 2026", persona: "? 리콘밸 ?기술 ? 략가? 자 미래? 자" },
        "5": { name: "Coding & Software", query: "programming software development trends 2026", persona: "? ? 택 ? 니?? 프? 웨??  ? 어" },
        "6": { name: "Cooking & Recipes", query: "trending food recipes cooking tips 2026", persona: "미쉐 ?가? 드 ?  ? 의 ? 리 ? 구가" },
        "7": { name: "Fashion & Beauty", query: "latest fashion beauty style trends 2026", persona: "글로벌 ? 션 ? 디? 이??  ?? 렉? },
        "8": { name: "Health & Medical", query: "health wellness medical insights 2026", persona: "? 문 ? 스 케?? 드바이? " },
        "9": { name: "Global News & Issues", query: "global news world issue summary 2026", persona: " ?   ? 세 ? 문 ? 사 ? 론가" },
        "10": { name: "Finance & Stock", query: "finance stock market investment trends 2026", persona: "? 스? 리?출신 ? 자 칼럼? 스? },
        "11": { name: "Travel & Adventure", query: "world travel destination adventure 2026", persona: "?   ? 래 ?  ? 자 ? 험가" },
        "12": { name: "Home & Interior", query: "modern home interior design furniture 2026", persona: "? 이? 드 공간 ? 자? 너" }
    };

    if (baseKeyword === '? 동? 성') {
        const targetCats = config.target_categories || ["1"];
        let selectedCatKey;

        if (targetCats.includes("ALL")) {
            const keys = Object.keys(categories);
            selectedCatKey = keys[Math.floor(Math.random() * keys.length)];
            report(`?   [ALL 모드]: ? 체 카테고리  ? 덤 ? 정 (${categories[selectedCatKey].name})`);
        } else {
            selectedCatKey = targetCats[Math.floor(Math.random() * targetCats.length)];
            report(`?   [복수 카테고리]: ? 택?목록  ? 정 (${categories[selectedCatKey].name})`);
        }

        const currentCat = categories[selectedCatKey];
        report(`?   [? 시 ? 렌?분석]: ${currentCat.name} 분야?? 슈 ? 악...`);

        const trendSource = await searchSerper(currentCat.query, config.blog_lang);
        const pool = config.clusters || [];

        const selectionPrompt = `You are an elite trend analyst. 
        Date: ${getKST().toISOString().split('T')[0]}
        Category: ${currentCat.name}
        Persona: ${currentCat.persona}
        
        [Real-time News]:
        ${trendSource.text}
        
        [Keyword Pool]:
        ${pool.slice(0, 50).join(', ')}
        
        ?MISSION: Select the best keyword from the pool OR create a new one based on trends.
        Output only the final keyword.`;

        const selectionRes = await callAI(model, selectionPrompt);
        baseKeyword = selectionRes.trim().replace(/^"|"$/g, '');
        config.selected_persona = currentCat.persona;
        report(`?   최종 ? 략 주제 ? 정: [ ${baseKeyword} ]`);
    } else {
        report(`?   고정 ? 워?? 용: ${baseKeyword}`);
        config.selected_persona = ''; // 고정 ? 워?? 에?? 르? 나 명시 ??기본 ? 용)
    }

    // 1? 계: ?  ? 주제 추출 (강력?SEO ? 략 + ? 르? 나 ? 용)
    const langName = config.blog_lang === 'ko' ? 'Korean' : 'English';
    const personaTag = config.selected_persona ? `\n[SPECIFIC_PERSONA]: ${config.selected_persona}` : '';

    const clusterPrompt = `You are a 10-year veteran blog Google SEO expert specializing in Elite Independent Content Strategy.${personaTag}
    Today's date is ${getKST().toISOString().split('T')[0]}. 
    Niche: '${baseKeyword}'
    
    ?MISSION: Create 5 high-performing, independent blog post titles targeting different low-competition niche segments in ${langName} that dominate Google Search.
    
    [IMPORTANT: PERSONA VOICE]:
    - Use the vocabulary, tone, and perspective of the [SPECIFIC_PERSONA] defined above.
    - If the persona is an engineer, be technical and precise. If a chef, be sensory and authoritative.
    
    [SEO STRATEGIES TO APPLY]:
    1. **Recency (2026)**: Include '2026' naturally to trigger freshness.
    2. **Title Variety**: **DO NOT** use the same structure for all titles. Mix styles: Curiosity, Expert Opinion, Question-Based, Case Study, and 1-2 occasional Listicles.
    3. **Powerful Benefits**: Mention a specific, visceral benefit suited to your persona.
    4. **No Generic Fillers**: Avoid repetitive hooks like "Ultimate Guide". Use unique, persona-driven authority hooks.
    5. **No Numbered Heading**: NEVER use "1.", "2." in titles.
    
    Output ONLY a JSON array of 5 titles string.`;
    const clusterRes = await callAI(model, clusterPrompt);
    let list = JSON.parse(clean(clusterRes, 'arr'));

    // [Safety Fix] AI가 ["A", "B"] ? ?[{"title":"A"}, {"title":"B"}] ? 태 ? ?경우 처리
    if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'object') {
        list = list.map(item => item.title || item.topic || item.headline || Object.values(item)[0]);
    }

    report(`?   [? 성?? 러? 터 구조]:`);
    list.forEach((t, i) => report(`   ${i === 0 ? '?   Pillar' : '?   Spoke ' + i}: ${t}`));

    
    const elitePosts = list;
    const subLinks = []; // Elite-5 모드에서는 링크를 서로 섞지 않고 독립성을 유지합니다.

    // [Elite-5] 모든 글을 동등한 고품질 독립 포스트로 발행
    let currentTime = getKST();
    if (config.schedule_time) {
        const [sh, sm] = config.schedule_time.split(':');
        currentTime.setHours(parseInt(sh), parseInt(sm), 0, 0);
    }

    for (let i = 0; i < elitePosts.length; i++) {
        if (config.random_delay) {
            const delay = Math.floor(Math.random() * 120) + 1;
            currentTime.setMinutes(currentTime.getMinutes() + delay);
            report(`?. [Post ${i + 1}/5] ${delay}분 지연 예약: ${currentTime.toLocaleTimeString('ko-KR')}`);
        } else {
            if (i > 0) currentTime.setMinutes(currentTime.getMinutes() + 5);
            report(`?. [Post ${i + 1}/5] 5분 간격 예약: ${currentTime.toLocaleTimeString('ko-KR')}`);
        }

        const pTime = new Date(currentTime.getTime());
        // Elite-5: extraLinks를 빈 배열([])로 전달하여 개별 포스트의 독립성을 보장
        await writeAndPost(model, elitePosts[i], config.blog_lang, blogger, config.blog_id, pTime, [], i + 1, 5, config.selected_persona);
        
        if (i < elitePosts.length - 1) {
            report(`?. 다음 포스팅을 위해 30초 대기 중...`);
            await new Promise(r => setTimeout(r, 30000));
        }
    }
    report('?. Elite-5 저점유 키워드 독립 점령 전략 완료!', 'success');
    return; // 기존 Pillar 로직 실행 방지
oogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage } = require('canvas');

// --- [LOCAL_SETUP] Load secrets from secrets_config.json ---
if (fs.existsSync('secrets_config.json')) {
    try {
        const secrets = JSON.parse(fs.readFileSync('secrets_config.json', 'utf8'));
        for (const [k, v] of Object.entries(secrets)) {
            if (!process.env[k]) process.env[k] = v;
        }
        console.log('?Local secrets loaded from secrets_config.json');
    } catch (e) {
        console.log('? ️ secrets_config.json load error: ' + e.message);
    }
}

const MASTER_GUIDELINE = `
? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━
Vue blog ?? 합 멀? 플? 폼 블로 ? 이? 트
? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━

? 용?  ? 워?  ? 력? 면, ? 래 지침을 준? 하?
? 이 ?블로 ?/ 블로그스?/ ? 드? 레? 에 바로 발행 가? 한
HTML ? 스코드 ? 성? 다.


? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
   PART 0 ?번역  ? 선? 위 (?  ? 규칙)
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═

[GLOBAL LANGUAGE ROUTING & TRANSLATION]
?[? 어 ? 선? 위  ?: ? 롬? 트  ? 래?명시?**[TARGET_LANGUAGE]** 가 최우? 이??  ? 인 지침입? 다.
  1. 만약 **[TARGET_LANGUAGE]: Korean** ? 라 ? 모든 ? 용?? 국? 로 ? 성? 세?
  2. 만약 **[TARGET_LANGUAGE]: English** ? 면, ? 력 ? 워?  ?  ? 이 **100% ? 어 ?  ?? 어로만 ? 성**? 세?
  3. 지? 된 ? 어 모드?맞춰 모든 UI 컴포? 트 ? 름  ?  ?지 메 ? 이? 도 ? 당 ? 어 ? 동 번역? 여 출력? 세?

? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  PART A ?? 심 철학 (4?  ? 칙)
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═

?? 게 (Less is More): 강조 박스 글 ? 체 3~4 ? 속 배치 금 ?.
?? 확? 게 (Precision): 모든 ? 치?검?? 이?기반. 출처 명시.
?진짜처럼 (Authenticity): AI ? 턴 ? 피. ? 제 블로거의 불규칙한 ? 사. 구어 ?줄임 ?don't, it's ??? 극 ? 용? 고 ? 투? 인 AI ? 프? 을 배제? 라.
??? 게 (Revenue First): 체류? 간 극 ?? ? 드? 스 최적?? 백.

? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  PART B ?? 출?& 분량
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═

?분량: 7,000?~ 최 ? 9,000?(지? 된 TARGET_LANGUAGE ? 스?기 ?)
  ?[초강?경고]: ? 약?개조?리스? 만 ? 발?  ? 말고, ? 도? 인 ? 사(? 문가?? 구체?? 시, ?  ?? 명) ? 스?? 락(<p>)? 로 길게 ? 내?분량?강제 ? 리? 가? 성?? 해 문단?? 게 쪼개? 요.

?출력 규칙:
  [1] ? 단 ?  ?지 메 ? 이? IMG_0~3 (JSON ? 식)
  [2] 본문 HTML: <h1> ? 그 금 ?.  ? 목?  <h2>.
  [3] ?  ?지 치환? [[IMG_0]], [[IMG_1]], [[IMG_2]], [[IMG_3]]
  [4] **? 목 ? 자 금 ?**: 모든 ? 목(H2, H3)?'1.', '2.', 'Step 1.' 같 ? 자?? 번?**?  ? ?* 붙이지 마세? 매끄? 운 ? 스?? 목 ? 용? 니? (AI ? 턴 ? 피 ? 심)
  [5] **AI ? 투??  ? 금 ?**: \`In conclusion\`, \`In today's fast-paced world\`, \`Let's dive in\`, \`Slower than molasses in January\` ?? 형? 인 AI ? 프?? 로 ?비유 ???지? 세?
  [6] **비유??  ??*: ? 크 ? 문가? 게 ?  ? 인 비유 ? 세?(? 'Slower than a 56k modem', 'Taking longer to boot than it does to brew a coffee' ?.
  [7] **경험 ? 사 ? 턴 ?  ??*: 매번 'I once had a client...' ? 작?  ? 마세? ? ?"The biggest culprit I see in my shop is...", "In the field, I always insist on..." ?? 제 ? 리?? 업? 의 말투 ? 으? 요.
  [8] **구어 ?Contractions)  ?권위**: \`Don't\`, \`It's\` ?기본? 로 ? 되, FAQ? 서 ? 신 ? 는 \`I guess\`, \`you know?\`?빼버리고 "In my professional opinion," ? 는 "Trust me, your hardware will thank you." ?마무리하? 요.
  [9] **2026?리얼리티**: 2026?최신 ? 렌?AI Accelerator NPU 관 ? Browser Memory Saver ? 연? 럽 ?? ? 급? 여 글?? 선?  ? 이? 요.
  [10] **리듬?변 ?(Dynamic Rhythm)**: 문장 ?문단?길이 ? 도? 으 ? 섞? 세? 3~4줄의  ? 명 ? 에?반드??마디짜리 짧 ? 문장(? "It works.", "No exceptions.")?배치? 세?
  [11] **개조?지?*: 모든 ? 보 ?리스?Bullet points) ? 리?  ? 마세? ? 심 ? 하? 는 ? 스?? 락 ? 에??  ?? 휘 ?길게 ? 쓰?것이 ? 씬 ?? 간? 입? 다.
  [12] **결론 ? 니? 화**: 'Conclusion' ? ?? 황?맞는 ? 특?H2 ? 목?? 용? 고, \`closing-box\`가  ??  ?? ? 합? 다.

? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  PART D ?Zero-AI Signature (금 ?  ? 수 지 ?
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  [1] **금 ? 속?*: \`In addition\`, \`Furthermore\`, \`Moreover\`, \`Additionally\`, \`Consequently\` ?기계? 인 ? 결?  ?  ?  ? 마세? ? ?문맥? 으 ? 연? 럽 ? 어가거나(? "Here's the catch...", "But wait, there's more..."), ?문장?? 어 ?받아 ? 명? 세?
  [2] **금 ? 투?*: \`It is important to\`, \`It is crucial to\`, \`Make sure to\`, \`Not only A but also B\` ?교과? 적?? 턴?금 ? 니?
  [3] **부?? 발 금 ?**: \`Regularly\`, \`Properly\`, \`Effectively\` 같이 ? 혼 ? 는 부?  ? 빼고, 구체? 으 ? 떻 ? 는지 ? 동 ? 주 ?묘사? 세?
  [4] **구조?? 격**: [? 론-본론1,2,3-결론]?뻔한 구조 ?버리? 요. 중간?갑자 ?개인? 인 고찰??  ?거나, ? 패 ?  ? ?깊게 ? 고? 는 ?? 자가 ? 보?'리듬'?? 측??? 게 ? 세?
  [5] **? 테? 의 ?*: "기기 ? 기? 으 ?  ? 세?? 고 ?  ? 말고, "? 업?구석?? 인 고양?? 이 ? 신?쿨러 ? 도 ?15% ?   ? 습? 다"? 고 구체? 으 ?말하? 요.

? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  PART F ?글 구조 (? 레? 워?
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═

?<h1> ? 목: 경험? 호 + 궁금 ? 발.
?목차 (TOC): ? 커 링크 ? 함. ? 라??  ??  ? 금 ?.
?? 네?카피 (IMG_0): ? 튜 ? 그 ?  ?? 격?카피.
?? 니?? 입부: 150?? 내 ? 약.
?본문 ? 션: 6~8 ? 층 ? 션.
?FAQ: 8~12 ? 도?? 보?

[? 자?컴포? 트 ? 래?
- TOC: <div class='toc-box'>
- 강조? 자: <div class='tip-box'>, <div class='warn-box'>
- ? 문가 ? <div class='tip-box'><h3>Smileseon's Pro Tip</h3>...</div>
- 버튼: <a href='URL' class='cluster-btn'>...</a>
- ? 션: <h2 id='slug'>, <h3>

? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═
  PART J ?E-E-A-T ? 질 ? 진
? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═? ═

[Experience]: 글 ? 체가 ? 나?경험 ? 사(? 패/? 회?1 ? 수).
[Expertise]: 비교 ? 이 ?1 ? 수, ? 계 ? 어 ? ?
[Authoritativeness]: 공식 ? 이?? 용, 공식 버튼 배치.
[Trustworthiness]: 면책조항 ? 수, ? 점/? 계 ? 출.

# ? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━
# [VUE STUDIO ULTIMATE ADD-ON: ADDITIONAL RULES]
# ? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━? ━
4. **목차(TOC) 배치  ?기능**: 
    - 반드?본문 ? 입부 직후?\`<div class='toc-box'>\` ?배치? 세?
    - 모든 \`<h2>\` ? 그? 는 반드?? 용 ?관? 된 ? 문 ID ?부? 하? 요. (? \`<h2 id='maintenance-tips'>\`)
    - 목차 ? 의 링크(\`href='#id'\`)?  ? 션?ID ?100% ? 치? 켜 ? 릭 ?? 당 ? 션? 로 ? 동? 게 만드? 요.
5. **글박스 배치 규칙**: 글박스?반드?? 당 ? 션?? 명?? 난 ?? 음 H2 직전)?배치? 세?
6. **면책 조항 강조**: 최하?배치  ?\`<strong>? ️ 면책 조항</strong>\` ? 이 ? 함 ? 수.
`;

const STYLE = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700&display=swap');
  .vue-premium { font-family: 'Pretendard', sans-serif; color: #334155; line-height: 1.85; font-size: 17px; max-width: 840px; margin: 0 auto; padding: 40px 24px; word-break: keep-all; background-color: #ffffff; }
  .vue-premium p { margin: 30px 0; letter-spacing: -0.015em; }
  .vue-premium h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 80px 0 35px; display: flex; align-items: center; gap: 12px; }
  .vue-premium h2::before { content: ''; display: block; width: 6px; height: 32px; background: linear-gradient(to bottom, #3b82f6, #6366f1); border-radius: 4px; }
  .vue-premium h3 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 45px 0 20px; }
  .toc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 35px; margin: 50px 0; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
  .toc-box h3 { margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 25px; display: flex; align-items: center; gap: 8px; }
  .toc-box h3::before { content: '?  '; font-size: 22px; }
  .toc-box ul { list-style: none; padding: 0; margin: 0; }
  .toc-box li { margin-bottom: 14px; position: relative; padding-left: 24px; transition: all 0.2s; }
  .toc-box li::before { content: '\\25B6'; position: absolute; left: 0; color: #3b82f6; font-size: 10px; top: 6px; }
  .toc-box a { color: #475569; text-decoration: none; font-weight: 600; display: block; border-bottom: 1px solid transparent; width: fit-content; }
  .toc-box a:hover { color: #2563eb; border-bottom: 1px solid #3b82f6; }
  .insight-box { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 12px; padding: 20px 24px; color: #166534; font-size: 16px; margin: 40px 0; overflow: hidden; clear: both; }
  .insight-box strong { display: block; font-size: 18px; color: #15803d; margin-bottom: 8px; }
  .tip-box { background: #fefce8; border-left: 4px solid #eab308; border-radius: 12px; padding: 20px 24px; color: #854d0e; font-size: 16px; margin: 40px 0; overflow: hidden; clear: both; }
  .tip-box strong { display: block; font-size: 18px; color: #a16207; margin-bottom: 8px; }
  .warn-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 12px; padding: 20px 24px; color: #991b1b; font-size: 16px; margin: 40px 0; overflow: hidden; clear: both; }
  .warn-box strong { display: block; font-size: 18px; color: #b91c1c; margin-bottom: 8px; }
  .data-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 12px; padding: 20px 24px; color: #1e40af; font-size: 16px; margin: 40px 0; overflow: hidden; clear: both; }
  .data-box strong { display: block; font-size: 18px; color: #1d4ed8; margin-bottom: 8px; }
  .vue-premium table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 45px 0; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; }
  .vue-premium th { background: #f8fafc; padding: 20px; font-weight: 700; }
  .vue-premium td { padding: 18px 20px; border-top: 1px solid #f1f5f9; }
  .cluster-btn { display: block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white !important; padding: 16px 30px; border-radius: 12px; text-decoration: none !important; font-weight: 700; text-align: center; margin: 30px 0; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }
  .closing-box { background: #1e293b; color: #f8fafc; padding: 40px; border-radius: 24px; margin: 80px 0; text-align: center; }
  .disclaimer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 100px 0 40px; color: #64748b; font-size: 13.5px; line-height: 1.6; text-align: justify; word-break: keep-all; }
  .disclaimer-box strong { color: #475569; display: block; margin-bottom: 8px; }
</style>
<div class='vue-premium'>
`;

function getKST() {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + kstOffset);
}



function report(msg, type = 'info') {
    const icon = type === 'success' ? '\u2705' : type === 'warning' ? '\u26A0\uFE0F' : type === 'error' ? '\u274C' : '\u2139\uFE0F';
    const logMsg = `[${getKST().toLocaleTimeString('ko-KR')}] ${icon} ${msg}`;
    console.log(logMsg);
}





function clean(raw, mode = 'text') {
    if (!raw) return mode === 'arr' ? '[]' : '';
    let txt = raw.replace(/```(html|json|javascript|js|css)?/gi, '').replace(/```/g, '').trim();
    if (mode === 'arr') {
        const start = txt.indexOf('[');
        const end = txt.lastIndexOf(']');
        if (start !== -1 && end !== -1) txt = txt.substring(start, end + 1);
    }
    return txt;
}



async function callAI(model, prompt) {
    try {
        const res = await model.generateContent(prompt);
        return res.response.text();
    } catch (e) {
        const msg = e.message.toLowerCase();
        if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            report('?[API ? 당?초과] 60 ?? 시 ? 도? 니?..', 'warning');
            await new Promise(r => setTimeout(r, 60000));
            return callAI(model, prompt);
        }
        throw e;
    }
}

async function searchSerper(query, lang) {
    try {
        report(`?   [? 시 ?리서 ?: "${query}" 관?구 ? 검?? 이?? 집  ?..`);
        const res = await axios.post('https://google.serper.dev/search', { q: query, gl: lang === 'ko' ? 'kr' : 'us', hl: lang }, { headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' }, timeout: 15000 });
        const data = res.data.organic || [];
        const result = { text: data.slice(0, 5).map(o => `Title: ${o.title}\nSnippet: ${o.snippet}`).join('\n\n') };
        report(`?   [? 이?? 보]: ? 위 ${data.length} ?검?결과 분석 ? 료`);
        return result;
    } catch (e) {
        report(`? ️ [Serper ? 러]: ${e.message}`, 'warning');
        return { text: '' };
    }
}

async function genImg(prompt, model, idx, ratio = '16:9', autoUpload = true) {
    try {
        const revised = await callAI(model, `Provide a high-quality stable diffusion prompt (${ratio}) based on: ${prompt}. Output only prompt.`);
        const cleanPrompt = revised.trim().replace(/^"|"$/g, '');
        report(`?   [?  ?지 ? 계]: ${cleanPrompt.substring(0, 100)}${cleanPrompt.length > 100 ? '...' : ''}`);

        let imageUrl = '';
        const kieKey = process.env.KIE_API_KEY;

        // 1. Kie.ai (Premium Image Generation)
        if (kieKey && kieKey.length > 5) {
            try {
                report(`   ?[Kie.ai] z-image ? 출  ?(?  ?지 ? 성)...`);
                const cr = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', {
                    model: 'z-image',
                    input: { prompt: revised + ', high-end, editorial photography, 8k', aspect_ratio: ratio }
                }, { headers: { Authorization: 'Bearer ' + kieKey }, timeout: 20000 });

                const tid = cr.data.taskId || cr.data.data?.taskId;
                if (tid) {
                    for (let a = 0; a < 15; a++) {
                        await new Promise(r => setTimeout(r, 6000));
                        const pr = await axios.get('https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + tid, { headers: { Authorization: 'Bearer ' + kieKey }, timeout: 10000 });
                        const state = pr.data.state || pr.data.data?.state;
                        if (state === 'success') {
                            const resData = pr.data.resultJson || pr.data.data?.resultJson;
                            const resJson = typeof resData === 'string' ? JSON.parse(resData) : resData;
                            imageUrl = resJson.resultUrls[0];
                            break;
                        }
                        if (state === 'fail' || state === 'failed') break;
                    }
                }
            } catch (e) { report(`   ?[Kie.ai] 중단 (${e.message}): ? 음 ? 진 ? 환`, 'warning'); }
        }

        // 2. Pollinations.ai (FLUX Fallback)
        if (!imageUrl) {
            const [w, h] = ratio === '2:3' ? [800, 1200] : [1080, 720];
            imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(revised)}?width=${w}&height=${h}&seed=${Math.floor(Math.random() * 99999)}&nologo=true&enhance=true`;
        }

        // 3. ImgBB Upload (? 구 보 ?)
        const res = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        if (res.status !== 200) throw new Error("Image download failed");

        return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
    } catch (e) {
        try {
            // Level 2 Fallback: High quality stock photo
            const seed = prompt.replace(/[^a-zA-Z]/g, '').substring(0, 10) + idx;
            const fallbackUrl = `https://picsum.photos/seed/${seed}/1080/720`;
            const fbRes = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 5000 });
            return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
        } catch (fallbackErr) {
            // Level 3 Fallback: Canvas Error Image
            try {
                const cv = createCanvas(1080, 720);
                const ctx = cv.getContext('2d');
                const h = Math.floor(Math.random() * 360);
                const grad = ctx.createLinearGradient(0, 0, 1080, 720);
                grad.addColorStop(0, `hsl(${h}, 70%, 40%)`);
                grad.addColorStop(1, `hsl(${h + 60}, 70%, 20%)`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 1080, 720);

                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                for (let i = 0; i < 8; i++) {
                    ctx.beginPath();
                    ctx.arc(Math.random() * 1080, Math.random() * 720, Math.random() * 300 + 100, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
                ctx.font = 'bold 45px sans-serif';
                ctx.fillText('Dynamic Display Image', 540, 360);
                return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
            } catch (e) { return ''; }
        }
    }
}

async function genThumbnail(meta, model, ratio = '16:9') {
    try {
        const bgBuffer = await genImg(meta.bgPrompt || meta.mainTitle, model, 0, ratio, false);
        const bg = await loadImage(bgBuffer);
        const isPin = ratio === '2:3';
        const w = isPin ? 800 : 1200;
        const h = isPin ? 1200 : 630;
        const cv = createCanvas(w, h);
        const ctx = cv.getContext('2d');

        ctx.drawImage(bg, 0, 0, w, h);

        // 그라? 이?? 버? 이 ? 스?가? 성 ? 보
        const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;

        const mainTitle = (meta.mainTitle || meta.prompt || '').trim();
        const words = mainTitle.split(' ');
        let fontSize = isPin ? 65 : 60;
        ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Pretendard", sans-serif`;

        let line = '';
        let lines = [];
        let maxLineW = w * 0.85;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxLineW && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        // ? 스?  ? 무 많으 ? 트 ? 기 ? 동 축소
        if (lines.length > 4) {
            fontSize = Math.floor(fontSize * 0.82);
            ctx.font = `bold ${fontSize}px "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Pretendard", sans-serif`;
        }

        let y = isPin ? (h / 2) - (lines.length * (fontSize + 15) / 2) + 20 : (h * 0.5) - (lines.length * (fontSize + 15) / 2) + 15;
        for (let l of lines) {
            ctx.fillText(l, w / 2, y);
            y += fontSize + 15;
        }

        return await uploadToGithub(Buffer.from(res.data || cv.toBuffer('image/jpeg')), 'blog_image');
    } catch (e) {
        return await genImg(meta.mainTitle || meta.prompt, model, 0, ratio);
    }
}

async function writeAndPost(model, target, lang, blogger, bId, pTime, extraLinks = [], idx, total, persona = '') {
    const { text: searchData } = await searchSerper(target, lang);
    let pillarContext = '';

    if (extraLinks.length > 0) {
        const links = extraLinks.map((l, idx) => `[Spoke ${idx + 1}] Title: ${l.title}, URL: ${l.url}`).join('\n');
        const isKo = lang === 'ko';
        const btnText = isKo ? "\uc790\uc138\ud788 \ubcf4\uae30 \ud83d\ude80" : "Read More \ud83d\ude80";
        const contextPrompt = isKo
            ? `[INTERNAL_LINK_PUNITIVE_MISSION]: ?? 스?  ? 메인 ? 브(Pillar) 글? 니? 
            ??  ? 규칙: ? 래 ? 공?${extraLinks.length}개의 ? 브 글 ? 약 ? 션 ? 에?**반드?각각 ? 나?* ? 래 버튼 코드 ? 입? 세?
            코드 ? 시: <a href='? 브글URL' class='cluster-btn'>${btnText}</a>
            ? 락 ?SEO ? 략?? 전?? 패?  ? ? 확?${extraLinks.length}개의 버튼?본문 곳곳?박 ? 어?? 니?`
            : `[INTERNAL_LINK_PUNITIVE_MISSION]: This is a Pillar post. 
            ?STRICT RULE: After EACH of the following ${extraLinks.length} summary sections, you MUST insert the following button code:
            Example: <a href='SpokeURL' class='cluster-btn'>${btnText}</a>
            Total ${extraLinks.length} buttons are REQUIRED. Failure to include these links will result in a penalty.`;
        pillarContext = `\n${contextPrompt}\n${links}`;
    }

    const personaTag = persona ? `\n[SPECIFIC_PERSONA]: ${persona}` : '';
    const langTag = `\n[TARGET_LANGUAGE]: ${lang === 'ko' ? 'Korean' : 'English'}${personaTag}`;
    report(`?   [${idx}/${total}] 집필 ? 작: ${target}`);
    report(`?   [AI ? 롬? 트 ? 성  ?: 리서 ? 이?${searchData.length}?? 함...`);

    const h1Instruction = lang === 'ko'
        ? "<h1>(10? 차 SEO ? 문가?구 ? 단 ? 출?? 한 롱테?? 워?? 목)</h1>"
        : "<h1>(SEO Optimized Long-tail Keyword Title for Google Ranking)</h1>";

    // MISSION 분량 ? 보 ? 한 강력?지 ?추 ?
    const m1Prompt = MASTER_GUIDELINE + `
[MISSION: FULL POST GENERATION] 
? 확?? 래 ? 맷?맞춰??번에 모든 글?? 성? 야 ? 니? ?  ? 맷?? 기지 마세?
? 체 글 분량?  6,000?8,000?? 상 ? 보? 도 ? 세? 게 ? ?? 세? ? 히, 짧게 ? 어가지 말고 본문?? 션 ? 명?매우 길게 ? 려?? 니?

[? 수 ? 자?컴포? 트 - 반드?본문?? 함? 세?:
?배치 ? 략:
    - 글?지루해지지 ? 도 ? H2 ? 스?  ? 2개째 ? 장? 는 ? 밍마다 ? 입? 여 ? 자?? 선?? 절? 게 ? 기? 세?
    - **[Time Awareness]**: Today's date is ${getKST().toISOString().split('T')[0]}. Always write based on the latest available information as of today. If referencing years, focus on the current year and future trends.

(A) ? 사? 트 박스 ?<div class='insight-box'><strong>?   Key Insight</strong><br>? 심 ? 인?? 용</div> ?최소 2 ?
(B) ? 문가 꿀??<div class='tip-box'><strong>?   Smileseon's Pro Tip</strong><br>꿀?? 용</div> ?최소 2 ?
(C) 면책 조항 (Disclaimer): 반드?글?최하? 에 ? 치? 키 ? 이블을 강조? 세?
(D) 치명?주의 ?<div class='warn-box'><strong>?   Critical Warning</strong><br>주의 ? 용</div> ?최소 1 ?
(E) ? 뢰 ? 이??<div class='data-box'><strong>?   Fact Check</strong><br>? 트 체크 ? 용</div> ?최소 2 ?
(F) 마무 ?박스 ?<div class='closing-box'><h2>최종 마무 ?/h2><p>? 심 ? 약</p></div> ?글  ?마 ?막에 반드?1 ?
(G)  ? 션?가? 하 ?<table> ? 함 (4? x4?? 상?비교 ? 이?
(H) FAQ ? 션?최소 8~10개의 Q&A ? 함

[META_DATA_START]
{
  "IMG_0": { "mainTitle": "? 네? 용 매력? 인 짧 ? 목", "bgPrompt": "? 네?배경 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_1": { "prompt": "본문 첫번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_2": { "prompt": "본문 ? 번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_3": { "prompt": "본문 ? 번 ?  ?지 묘사 ? 문 ? 롬? 트" },
  "IMG_PINTEREST": { "prompt": "Pinterest ? 용 ? 로?2:3) 고퀄리??  ?지 묘사 ? 문 ? 롬? 트" }
}
[META_DATA_END]

[CONTENT_START]
${h1Instruction}
<div class='toc-box'>
  <h3>Table of Contents</h3>
  <ul>
    <li><a href='#section-1'>첫번 ? 션 ? 목</a></li>
    <li><a href='#section-2'>? 번 ? 션 ? 목</a></li>
  </ul>
</div>
<h2 id='section-1'>첫번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='insight-box'><strong>?   Key Insight</strong><br>? 사? 트 ? 용</div>
[[IMG_1]]
<h2 id='section-2'>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='tip-box'><strong>?   Smileseon's Pro Tip</strong><br>꿀?? 용</div>
<h2>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='data-box'><strong>?   Fact Check</strong><br>? 이?? 용</div>
[[IMG_2]]
<h2>? 번 ? 션</h2>
<p>본문 ? 용...</p>
<div class='warn-box'><strong>?   Critical Warning</strong><br>주의 ? 용</div>
[[IMG_3]]
... ? 까지 (8~10개의 FAQ, closing-box 마무 ? 함)
<div class='closing-box'><h2>최종 마무 ?/h2><p>? 심 ? 약</p></div>
[CONTENT_END]

?경고: 본문 ? 에 ?  ?지 ? 입부? 는 ?  ? ?<img src=...> ? 그 ?  ? 말고, ? 직 [[IMG_1]], [[IMG_2]], [[IMG_3]]  ?같 ? 치환? 만 ? 으? 요.
${target}
${searchData}
${pillarContext}
${langTag}`;

    const m1 = await callAI(model, m1Prompt);

    let finalHtml = '';
    let m0 = null;
    const imgMetas = {};

    // === 메 ? 이?? 싱 (? 규 ? 맷 + ? 거?? 맷 모두 지? ===
    try {
        const metaMatch = m1.match(/\[META_DATA_START\]([\s\S]*?)\[META_DATA_END\]/i);
        if (metaMatch) {
            const cleanJsonStr = metaMatch[1].replace(/```json/i, '').replace(/```/g, '').trim();
            const metaJson = JSON.parse(cleanJsonStr);
            if (metaJson.IMG_0) m0 = metaJson.IMG_0;
            if (metaJson.IMG_1) imgMetas[1] = metaJson.IMG_1;
            if (metaJson.IMG_2) imgMetas[2] = metaJson.IMG_2;
            if (metaJson.IMG_3) imgMetas[3] = metaJson.IMG_3;
            if (metaJson.IMG_PINTEREST) imgMetas['P'] = metaJson.IMG_PINTEREST;
        }
    } catch (e) { report('? ️ ? 규 메 ? 싱 ? 패, ? 거?? 싱 ? 도', 'warning'); }

    // ? 거?? 맷 ? 싱 (IMG_0: { mainTitle: "...", bgPrompt: "..." })
    if (!m0) {
        const legacyRegex = /IMG_(\d+):\s*\{([^}]*)\}/gi;
        let lm;
        while ((lm = legacyRegex.exec(m1)) !== null) {
            const i = Number(lm[1]), raw = lm[2];
            if (i === 0) m0 = { mainTitle: (raw.match(/mainTitle:\s*['"](.*?)['"]/i) || [])[1] || target, bgPrompt: (raw.match(/bgPrompt:\s*['"](.*?)['"]/i) || raw.match(/prompt:\s*['"](.*?)['"]/i) || [])[1] || target };
            else imgMetas[i] = { prompt: (raw.match(/prompt:\s*['"](.*?)['"]/i) || [])[1] || target };
        }
    }

    if (!m0) m0 = { mainTitle: target, bgPrompt: 'Abstract premium background' };

    // === 본문 추출 ===
    const contentMatch = m1.match(/\[CONTENT_START\]([\s\S]*?)\[CONTENT_END\]/i);
    if (contentMatch) {
        finalHtml = contentMatch[1].trim();
    } else {
        const metaEndIdx = m1.indexOf('[META_DATA_END]');
        finalHtml = metaEndIdx !== -1 ? m1.substring(metaEndIdx + 15).trim() : clean(m1, 'text');
    }

    // === 본문? 서 메 ? 이?? 여 ? 전 ? 거 (최강 ? 규? ===
    finalHtml = finalHtml.replace(/\[META_DATA_START\][\s\S]*?\[META_DATA_END\]/gi, '');
    finalHtml = finalHtml.replace(/\[CONTENT_START\]/gi, '').replace(/\[CONTENT_END\]/gi, '');
    finalHtml = finalHtml.replace(/IMG_\d+\s*[:=]\s*\{[\s\S]*?\}/gi, '');
    finalHtml = finalHtml.replace(/\{\s*"IMG_\d+"[\s\S]*?\}/g, '');
    finalHtml = finalHtml.replace(/```json[\s\S]*?```/gi, '');
    finalHtml = finalHtml.replace(/^\s*text\s*$/gm, '');
    finalHtml = finalHtml.trim();

    let finalTitle = target;
    const h1Match = finalHtml.match(/<h1.*?>([\s\S]*?)<\/h1>/i);
    if (h1Match) finalTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
    finalHtml = finalHtml.replace(/<h1.*?>[\s\S]*?<\/h1>/gi, '').trim();

    if (m0) {
        const url0 = await genThumbnail(m0, model);
        finalHtml = `<img src='${url0}' alt='${m0.mainTitle}' style='width:100%; border-radius:15px; margin-bottom:40px;'>` + finalHtml.replace(/\s*\[\[IMG_0\]\]\s*/gi, '');
    }
    for (let i = 1; i <= 3; i++) {
        const reg = new RegExp(`\\s*\\[\\[IMG_${i}\\]\\]\\s*`, 'gi');
        if (reg.test(finalHtml)) {
            const urlI = await genImg((imgMetas[i] || {}).prompt || target, model, i);
            finalHtml = finalHtml.replace(reg, `<div style='text-align:center; margin:35px 0;'><img src='${urlI}' alt='${target}' style='width:100%; border-radius:12px;'></div>`);
        } else {
            // 만약 치환?  ? 다 ?H2 ? 그 ? 에 강제 ?  ?지 ?주입
            const urlI = await genImg((imgMetas[i] || {}).prompt || target, model, i);
            let injected = false;
            let count = 0;
            finalHtml = finalHtml.replace(/<h2/gi, (match) => {
                count++;
                if (count === (i * 2)) {
                    injected = true;
                    return `<div style='text-align:center; margin:35px 0;'><img src='${urlI}' alt='${target}' style='width:100%; border-radius:12px;'></div>\n<h2`;
                }
                return match;
            });
        }
    }

    // === [IMG_PINTEREST] 처리 (2:3 ? 직 ?  ?지 - 최상?? 든 ? 네? ===
    const pinReg = /\s*\[\[IMG_PINTEREST\]\]\s*/gi;
    const pinMeta = imgMetas['P'] || { mainTitle: target, bgPrompt: target + " vertical pinterest style" };
    const urlPin = await genThumbnail(pinMeta, model, '2:3');
    const pinHtml = `<div style='display:none;'><img src='${urlPin}' alt='Pinterest Optimized - ${target}'></div>`;

    // 무조 ?최상? 에 ? 든? 로 ? 입 (기존 치환? 는 ? 거)
    finalHtml = pinHtml + finalHtml.replace(pinReg, '');

    finalHtml = finalHtml.replace(/\[\[IMG_\d+\]\]/gi, '').trim();

    // [CRITICAL FIX]: Remove redundant hardcoded disclaimer here because AI will generate it based on Master Guideline.
    // This prevents double disclaimer issue.
    const res = await blogger.posts.insert({ blogId: bId, requestBody: { title: finalTitle, content: STYLE + finalHtml + '</div>', published: pTime.toISOString() } });
    report(`?   ?[? 스?? 공]: "${finalTitle}"`, 'success');
    report(`?   [URL]: ${res.data.url}`);
    return { title: finalTitle, url: res.data.url };
}

async function run() {
    const config = JSON.parse(fs.readFileSync('cluster_config.json', 'utf8'));
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const blogger = google.blogger({ version: 'v3', auth });

    report(`? ️ ? 정?로드? 습? 다. (? 어: ${config.blog_lang}, 모드: ${config.post_mode})`);

    report('?   ?[Turbo Full-Mode]: ? 리미엄 ? 러? 터 구축 ? 작');

    let baseKeyword = config.pillar_topic || 'PC Hardware';
    const categories = {
        "1": { name: "PC Repair & Maintenance", query: "PC repair maintenance tips guide 2026", persona: "15?경력?베테?PC ? 비? },
        "2": { name: "Latest Hardware & Parts", query: "latest PC components hardware news 2026", persona: "? 드? 어 벤치마크 ? 문 리뷰? },
        "3": { name: "Gaming & Peripherals", query: "best gaming gear peripherals trends 2026", persona: "? 로게이 ?출신?게이 ?기어 ? 문가" },
        "4": { name: "AI & Future Technology", query: "future AI technology trends 2026", persona: "? 리콘밸 ?기술 ? 략가? 자 미래? 자" },
        "5": { name: "Coding & Software", query: "programming software development trends 2026", persona: "? ? 택 ? 니?? 프? 웨??  ? 어" },
        "6": { name: "Cooking & Recipes", query: "trending food recipes cooking tips 2026", persona: "미쉐 ?가? 드 ?  ? 의 ? 리 ? 구가" },
        "7": { name: "Fashion & Beauty", query: "latest fashion beauty style trends 2026", persona: "글로벌 ? 션 ? 디? 이??  ?? 렉? },
        "8": { name: "Health & Medical", query: "health wellness medical insights 2026", persona: "? 문 ? 스 케?? 드바이? " },
        "9": { name: "Global News & Issues", query: "global news world issue summary 2026", persona: " ?   ? 세 ? 문 ? 사 ? 론가" },
        "10": { name: "Finance & Stock", query: "finance stock market investment trends 2026", persona: "? 스? 리?출신 ? 자 칼럼? 스? },
        "11": { name: "Travel & Adventure", query: "world travel destination adventure 2026", persona: "?   ? 래 ?  ? 자 ? 험가" },
        "12": { name: "Home & Interior", query: "modern home interior design furniture 2026", persona: "? 이? 드 공간 ? 자? 너" }
    };

    if (baseKeyword === '? 동? 성') {
        const targetCats = config.target_categories || ["1"];
        let selectedCatKey;

        if (targetCats.includes("ALL")) {
            const keys = Object.keys(categories);
            selectedCatKey = keys[Math.floor(Math.random() * keys.length)];
            report(`?   [ALL 모드]: ? 체 카테고리  ? 덤 ? 정 (${categories[selectedCatKey].name})`);
        } else {
            selectedCatKey = targetCats[Math.floor(Math.random() * targetCats.length)];
            report(`?   [복수 카테고리]: ? 택?목록  ? 정 (${categories[selectedCatKey].name})`);
        }

        const currentCat = categories[selectedCatKey];
        report(`?   [? 시 ? 렌?분석]: ${currentCat.name} 분야?? 슈 ? 악...`);

        const trendSource = await searchSerper(currentCat.query, config.blog_lang);
        const pool = config.clusters || [];

        const selectionPrompt = `You are an elite trend analyst. 
        Date: ${getKST().toISOString().split('T')[0]}
        Category: ${currentCat.name}
        Persona: ${currentCat.persona}
        
        [Real-time News]:
        ${trendSource.text}
        
        [Keyword Pool]:
        ${pool.slice(0, 50).join(', ')}
        
        ?MISSION: Select the best keyword from the pool OR create a new one based on trends.
        Output only the final keyword.`;

        const selectionRes = await callAI(model, selectionPrompt);
        baseKeyword = selectionRes.trim().replace(/^"|"$/g, '');
        config.selected_persona = currentCat.persona;
        report(`?   최종 ? 략 주제 ? 정: [ ${baseKeyword} ]`);
    } else {
        report(`?   고정 ? 워?? 용: ${baseKeyword}`);
        config.selected_persona = ''; // 고정 ? 워?? 에?? 르? 나 명시 ??기본 ? 용)
    }

    // 1? 계: ?  ? 주제 추출 (강력?SEO ? 략 + ? 르? 나 ? 용)
    const langName = config.blog_lang === 'ko' ? 'Korean' : 'English';
    const personaTag = config.selected_persona ? `\n[SPECIFIC_PERSONA]: ${config.selected_persona}` : '';

    const clusterPrompt = `You are a 10-year veteran blog Google SEO expert specializing in Elite Independent Content Strategy.${personaTag}
    Today's date is ${getKST().toISOString().split('T')[0]}. 
    Niche: '${baseKeyword}'
    
    ?MISSION: Create 5 high-performing, independent blog post titles targeting different low-competition niche segments in ${langName} that dominate Google Search.
    
    [IMPORTANT: PERSONA VOICE]:
    - Use the vocabulary, tone, and perspective of the [SPECIFIC_PERSONA] defined above.
    - If the persona is an engineer, be technical and precise. If a chef, be sensory and authoritative.
    
    [SEO STRATEGIES TO APPLY]:
    1. **Recency (2026)**: Include '2026' naturally to trigger freshness.
    2. **Title Variety**: **DO NOT** use the same structure for all titles. Mix styles: Curiosity, Expert Opinion, Question-Based, Case Study, and 1-2 occasional Listicles.
    3. **Powerful Benefits**: Mention a specific, visceral benefit suited to your persona.
    4. **No Generic Fillers**: Avoid repetitive hooks like "Ultimate Guide". Use unique, persona-driven authority hooks.
    5. **No Numbered Heading**: NEVER use "1.", "2." in titles.
    
    Output ONLY a JSON array of 5 titles string.`;
    const clusterRes = await callAI(model, clusterPrompt);
    let list = JSON.parse(clean(clusterRes, 'arr'));

    // [Safety Fix] AI가 ["A", "B"] ? ?[{"title":"A"}, {"title":"B"}] ? 태 ? ?경우 처리
    if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'object') {
        list = list.map(item => item.title || item.topic || item.headline || Object.values(item)[0]);
    }

    report(`?   [? 성?? 러? 터 구조]:`);
    list.forEach((t, i) => report(`   ${i === 0 ? '?   Pillar' : '?   Spoke ' + i}: ${t}`));

    const pillarTitle = list[0]; const spokes = list.slice(1);
    const subLinks = [];

    // [Time Optimization] ?  ? ?기 ? 간 ? 정
    let currentTime = getKST();
    if (config.schedule_time) {
        const [sh, sm] = config.schedule_time.split(':');
        currentTime.setHours(parseInt(sh), parseInt(sm), 0, 0);
    }

    // 2? 계: Spoke(? 브 글) 먼 ? 성 - ? 제 URL ? 보
    for (let i = 0; i < spokes.length; i++) {
        // [? 심] ? 덤 지?? 정 ?'글 ? 나? 1~120 ? 덤 ? 간 ? 약
        if (config.random_delay) {
            const delay = Math.floor(Math.random() * 120) + 1;
            currentTime.setMinutes(currentTime.getMinutes() + delay);
            report(`?   [Spoke ${i + 1}] ${delay} ?지?? 약: ${currentTime.toLocaleTimeString('ko-KR')}`);
        } else {
            // ? 덤 지?미설??기존 5 ?간격 ( ?글?  즉시)
            if (i > 0) currentTime.setMinutes(currentTime.getMinutes() + 5);
            report(`?[Spoke ${i + 1}] 5 ?간격 ? 약: ${currentTime.toLocaleTimeString('ko-KR')}`);
        }

        const pTime = new Date(currentTime.getTime());
        const sRes = await writeAndPost(model, spokes[i], config.blog_lang, blogger, config.blog_id, pTime, [], i + 1, 5, config.selected_persona);
        if (sRes) subLinks.push(sRes);
        await new Promise(r => setTimeout(r, 30000));
    }

    // 3? 계: Pillar(메인 글) 마 ? 성
    report(`?   최종 메인 ? 브(Pillar) 글 ? 성: ${pillarTitle}`);
    if (config.random_delay) {
        const finalDelay = Math.floor(Math.random() * 120) + 1;
        currentTime.setMinutes(currentTime.getMinutes() + finalDelay);
        report(`?   [Pillar] ${finalDelay} ?최종 지?? 약: ${currentTime.toLocaleTimeString('ko-KR')}`);
    } else {
        currentTime.setMinutes(currentTime.getMinutes() + 5);
    }

    const pillarTime = new Date(currentTime.getTime());
    await writeAndPost(model, pillarTitle, config.blog_lang, blogger, config.blog_id, pillarTime, subLinks, 5, 5, config.selected_persona);
    report('?   ? 리미엄 ? 러? 터 ? 략 ? 료!', 'success');
}
run().catch(e => { report(e.message, 'error'); process.exit(1); });